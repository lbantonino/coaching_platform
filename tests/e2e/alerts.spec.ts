import { spawnSync } from "node:child_process";

import { expect, test, type Page } from "@playwright/test";

import { isPhone, openSettings } from "./helpers";
import { chooseAlert, submitNewSession } from "./new-session";

// Alertes des séances (D-205, phase C) : l'alerte se choisit dans la séance (comme Apple), se garde à
// la modification, s'active par appareil dans Paramètres ; la route planifiée /api/alertes est fermée
// sans son secret et ne note (donc n'envoie) jamais deux fois la même alerte.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
// Même valeur que playwright.config.ts (webServer.env.ALERTES_SECRET).
const SECRET = "e2e-alertes-0123456789abcdef";

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// SQL sur la base LOCALE des tests (conteneur Supabase).
function sql(query: string): string {
  const result = spawnSync(
    "docker",
    ["exec", "-i", "supabase_db_coaching-platform", "psql", "-U", "postgres", "-tA", "-q"],
    { input: query, encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

test("la séance garde son alerte, affichée sur sa page et reprise par « Modifier »", async ({
  page,
}, testInfo) => {
  const title = `Alerte ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const date = isPhone(page) ? "2027-07-07" : "2027-07-14";
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=semaine&date=${date}`);
  await page.getByRole("button", { name: "Nouvelle séance" }).filter({ visible: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nouvelle séance" });
  await dialog.getByRole("radio", { name: "Collective" }).click();
  await dialog.getByLabel("Titre").fill(title);
  await dialog.getByLabel("Date de début").fill(date);
  await chooseAlert(dialog, "15 min avant");
  await expect(dialog.getByRole("button", { name: "2e alerte : Aucune" })).toBeVisible();
  await expect(dialog).toContainText("L'alerte arrive en notification sur ton téléphone.");
  await submitNewSession(dialog);
  await expect(page.getByText("Séance créée.")).toBeVisible();

  await page.goto(`/coach/o/${ORG_A}/agenda?vue=jour&date=${date}`);
  await page
    .getByRole("link", { name: new RegExp(title) })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Cette séance" })).toContainText("15 min avant");
  await page.getByRole("link", { name: "Modifier", exact: true }).first().click();
  await expect(page.getByLabel(/^Alerte/)).toHaveValue("15");
});

test("Paramètres : notifications bloquées, l'explication sans bouton", async ({ page }) => {
  await loginAsCoachA(page);
  const dialog = await openSettings(page, "preferences");
  const card = dialog.getByRole("region", { name: "Alertes des séances" });
  await expect(card).toContainText("Les notifications de Coory sont bloquées sur cet appareil.");
  await expect(card.getByRole("button")).toHaveCount(0);
});

// Chromium de test (sans interface) répond toujours « denied » : on simule un navigateur à qui la
// permission n'a pas encore été demandée, l'état du téléphone d'un coach qui découvre l'option.
test("Paramètres : les alertes s'activent sur cet appareil", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "permission", { get: () => "default" });
  });
  await loginAsCoachA(page);
  const dialog = await openSettings(page, "preferences");
  const card = dialog.getByRole("region", { name: "Alertes des séances" });
  await expect(
    card.getByRole("button", { name: "Activer les alertes sur cet appareil" }),
  ).toBeVisible();
});

test("la route planifiée : fermée sans secret, et une alerte due n'est notée qu'une fois", async ({
  page,
  request,
}) => {
  test.skip(isPhone(page), "Route du serveur : un seul projet.");
  expect((await request.post("/api/alertes")).status()).toBe(401);
  expect(
    (await request.post("/api/alertes", { headers: { authorization: "Bearer faux" } })).status(),
  ).toBe(401);

  // Une séance qui commence dans 15 min (heure de Bruxelles), avec l'alerte « 15 min avant ».
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Brussels",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute) + 15;
  test.skip(minutes > 23 * 60, "Trop près de minuit pour une séance le jour même.");
  const start = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const title = `Alerte route ${Date.now()}`;
  const id = sql(`
    insert into public.coach_sessions
      (organization_id, kind, title, starts_on, start_time, duration_minutes, alerts, created_by)
    select '${ORG_A}', 'group', '${title}', '${parts.year}-${parts.month}-${parts.day}', '${start}', 30, '{15}', id
    from auth.users where email = 'coach-a@example.test'
    returning id;`);
  try {
    const auth = { authorization: `Bearer ${SECRET}` };
    const first = await request.post("/api/alertes", { headers: auth });
    expect(first.status()).toBe(200);
    expect((await first.json()).due).toBe(1);
    const again = await request.post("/api/alertes", { headers: auth });
    expect((await again.json()).due).toBe(0);
    expect(sql(`select count(*) from public.session_alerts_sent where session_id = '${id}';`)).toBe(
      "1",
    );
  } finally {
    sql(`delete from public.coach_sessions where id = '${id}';`);
  }
});
