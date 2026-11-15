import { expect, test, type Page } from "@playwright/test";

// PDF des programmes (phase 5) : « Agenda du programme » et « Fiches et repères », tirés de la
// version publiée, servis seulement au coach de l'organisation.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Graine de développement : programme publié (v1) de Léa Vandenberghe, et un brouillon jamais publié.
const PUBLISHED = "f1000000-0000-4000-8000-000000000008";
const LEA = "da000000-0000-4000-8000-000000000015";
const NEVER_PUBLISHED = "f1000000-0000-4000-8000-000000000021";
const pdfUrl = (programId: string, kind: "agenda" | "fiches") =>
  `/coach/o/${ORG}/programmes/${programId}/pdf/${kind}`;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach télécharge les deux PDF d'un programme publié", async ({ page }) => {
  await login(page);
  for (const [kind, name] of [
    ["agenda", "Agenda du programme"],
    ["fiches", "Fiches et rep"],
  ] as const) {
    const response = await page.request.get(pdfUrl(PUBLISHED, kind));
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");
    expect(response.headers()["content-disposition"]).toContain(name);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  }
});

test("pas de PDF pour un brouillon jamais publié ni pour un programme inconnu", async ({
  page,
}) => {
  await login(page);
  expect((await page.request.get(pdfUrl(NEVER_PUBLISHED, "agenda"))).status()).toBe(404);
  expect(
    (await page.request.get(pdfUrl("f1000000-0000-4000-8000-0000000000ff", "fiches"))).status(),
  ).toBe(404);
  expect((await page.request.get(pdfUrl("pas-un-identifiant", "agenda"))).status()).toBe(404);
});

test("sans session, un PDF renvoie à la connexion", async ({ request }) => {
  const response = await request.get(pdfUrl(PUBLISHED, "agenda"));
  expect(response.url()).toContain("/login");
  expect(response.headers()["content-type"]).not.toBe("application/pdf");
});

// Onglet Agenda de la fiche (15/11/2026, D-186) : le programme tel que le sportif le reçoit, et son
// bouton PDF dans l'en-tête (il était sur la carte de l'ancienne vue de l'onglet Programme).
test("onglet Agenda : le bouton PDF du programme propose l'agenda et les fiches", async ({
  page,
}) => {
  await login(page);
  await page.goto(`/coach/o/${ORG}/sportifs/${LEA}?onglet=agenda&semaine=1`);
  await page.getByRole("button", { name: "PDF du programme" }).filter({ visible: true }).click();
  const agenda = page
    .getByRole("button", { name: "Agenda du programme" })
    .or(page.getByRole("menuitem", { name: "Agenda du programme" }));
  await expect(agenda.filter({ visible: true }).first()).toBeVisible();
  await expect(
    page
      .getByRole("menuitem", { name: "Fiches et repères" })
      .or(page.getByRole("button", { name: "Fiches et repères" }))
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  // Chromium sans interface n'affiche pas un PDF dans un onglet : on vérifie l'adresse demandée.
  await page.evaluate(() => {
    const opened: string[] = [];
    (window as unknown as { opened: string[] }).opened = opened;
    window.open = (url?: string | URL) => {
      opened.push(String(url));
      return null;
    };
  });
  await agenda.filter({ visible: true }).first().click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { opened: string[] }).opened))
    .toEqual([`/coach/o/${ORG}/programmes/${PUBLISHED}/pdf/agenda`]);
});
