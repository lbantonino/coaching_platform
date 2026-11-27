import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Conversations de l'Assistant IA enregistrées (D-212, 27/11/2026) : gardées dans le compte du coach,
// retrouvées après un rechargement, rouvertes et continuées, supprimées, téléchargées en PDF ;
// prévenues dans la cloche 30 jours avant leur effacement ; lisibles même quand l'assistant est
// verrouillé. Coach B (organisation abonnée) parle au FAUX Claude des tests (« Réponse simulée. »).
// Les conversations des comptes de test sont retirées en fin de suite (scripts/clean-test-data.sql).
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const ORG_B = "0b000000-0000-4000-8000-0000000000b1";
const COACH_B = "b0000000-0000-4000-8000-00000000000b";
const COACH_C = "f0000000-0000-4000-8000-00000000000f";
const STEPS = { timeout: 30_000 };

function localSql(query: string): string {
  const result = spawnSync(
    "docker",
    ["exec", "supabase_db_coaching-platform", "psql", "-U", "postgres", "-Atc", query],
    { encoding: "utf8" },
  );
  return result.stdout.trim();
}

const quote = (text: string) => `'${text.replace(/'/g, "''")}'`;

// Une conversation écrite directement en base (pour le PDF, la cloche et le verrou).
function insertConversation(options: {
  user: string;
  org: string;
  title: string;
  lastMessageAt?: string;
}): string {
  const id = randomUUID();
  const messages = JSON.stringify([
    { id: 0, from: "coach", text: options.title },
    { id: 1, from: "assistant", text: "Réponse enregistrée." },
  ]);
  localSql(
    `insert into public.assistant_conversations (id, organization_id, user_id, title, messages, message_count, last_message_at)
     values ('${id}', '${options.org}', '${options.user}', ${quote(options.title)}, ${quote(messages)}::jsonb, 2, ${options.lastMessageAt ?? "now()"})`,
  );
  return id;
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// L'historique : la colonne de gauche (ordinateur), la feuille « Historique » (téléphone).
async function historyPanel(page: Page): Promise<Locator> {
  if (isPhone(page)) {
    await page.getByRole("button", { name: "Historique", exact: true }).click();
    return page.getByRole("dialog", { name: "Historique" });
  }
  return page.getByRole("navigation", { name: "Historique des conversations" });
}

// La ligne d'une conversation (son nom commence par le titre ; celui du « ⋯ » par « Plus d'actions »).
const row = (panel: Locator, title: string) =>
  panel.getByRole("button", {
    name: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
  });

const thread = (page: Page) => page.getByRole("list", { name: "Conversation avec l'assistant" });

async function ask(page: Page, question: string) {
  const field = page.getByLabel("Ta demande à l'assistant");
  await field.fill(question);
  await field.press("Enter");
}

const unique = (label: string) => `E2E ${label} ${test.info().project.name} ${Date.now()}`;
const count = (title: string) =>
  localSql(
    `select message_count from public.assistant_conversations where title = ${quote(title)}`,
  );

test("une conversation est gardée : rechargée, retrouvée, rouverte et continuée", async ({
  page,
}) => {
  const question = unique("gardée");
  await login(page, "coach-b@example.test");
  await page.goto("/coach/assistant");
  await ask(page, question);
  await expect(thread(page).getByText("Réponse simulée.")).toHaveCount(1, STEPS);
  await expect.poll(() => count(question), STEPS).toBe("2");

  // Rechargée : une nouvelle conversation vide ; la précédente est dans l'historique.
  await page.reload();
  await expect(thread(page)).toHaveCount(0);
  const panel = await historyPanel(page);
  await expect(panel.getByRole("heading", { name: "Aujourd'hui" })).toBeVisible();
  await row(panel, question).click();
  await expect(thread(page).getByText(question)).toBeVisible();
  await expect(thread(page).getByText("Réponse simulée.")).toHaveCount(1);

  // Continuée : les nouveaux messages s'ajoutent à la même conversation.
  await ask(page, "Et ensuite ?");
  await expect(thread(page).getByText("Réponse simulée.")).toHaveCount(2, STEPS);
  await expect.poll(() => count(question), STEPS).toBe("4");
  expect(
    localSql(
      `select count(*) from public.assistant_conversations where title = ${quote(question)}`,
    ),
  ).toBe("1");
});

test("une conversation se supprime, avec confirmation", async ({ page }) => {
  const question = unique("supprimée");
  await login(page, "coach-b@example.test");
  await page.goto("/coach/assistant");
  await ask(page, question);
  await expect(thread(page).getByText("Réponse simulée.")).toHaveCount(1, STEPS);
  await expect.poll(() => count(question), STEPS).toBe("2");

  const panel = await historyPanel(page);
  await panel
    .getByRole("button", { name: `Plus d'actions sur la conversation « ${question} »` })
    .click();
  await page
    .getByRole("menuitem", { name: "Supprimer" })
    .or(page.getByRole("button", { name: "Supprimer", exact: true }))
    .filter({ visible: true })
    .first()
    .click();
  const confirm = page.getByRole("dialog", { name: "Supprimer cette conversation ?" });
  await confirm.getByRole("button", { name: "Supprimer" }).click();
  await expect.poll(() => count(question), STEPS).toBe("");
  // La conversation affichée était celle-là : on repart d'une conversation vide.
  await expect(thread(page)).toHaveCount(0);
});

test("PDF d'une conversation : pour son coach seulement", async ({ page }) => {
  const title = unique("PDF");
  const id = insertConversation({ user: COACH_B, org: ORG_B, title });
  const pdf = `/coach/o/${ORG_B}/assistant/conversations/${id}/pdf`;
  await login(page, "coach-b@example.test");
  const response = await page.request.get(pdf);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  expect(response.headers()["content-disposition"]).toContain("Conversation - ");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  expect(
    (await page.request.get(`/coach/o/${ORG_B}/assistant/conversations/pas-un-id/pdf`)).status(),
  ).toBe(404);

  // Un autre coach (autre organisation) : jamais la conversation de B.
  await page.context().clearCookies();
  await login(page, "coach-c@example.test");
  const other = await page.request.get(`/coach/o/${ORG_A}/assistant/conversations/${id}/pdf`);
  expect(other.status()).toBe(404);
  const foreign = await page.request.get(pdf);
  expect(foreign.headers()["content-type"]).not.toBe("application/pdf");
});

test("30 jours avant l'effacement : la cloche prévient et ouvre la conversation", async ({
  page,
}) => {
  const title = unique("bientôt effacée");
  // Dernier message il y a 12 mois moins 10 jours : effacée dans 10 jours.
  const id = insertConversation({
    user: COACH_B,
    org: ORG_B,
    title,
    lastMessageAt: "now() - interval '12 months' + interval '10 days'",
  });
  await login(page, "coach-b@example.test");
  await page.goto("/coach/notifications");
  const item = page.getByRole("link", { name: new RegExp(title) }).filter({ visible: true });
  await expect(item.first()).toBeVisible();
  await expect(
    page.getByText(/Sera effacée le .* écris-y pour la garder 12 mois de plus\./).first(),
  ).toBeVisible();
  await item.first().click();
  await expect(page).toHaveURL(new RegExp(`/coach/assistant\\?conversation=${id}`));
  await expect(thread(page).getByText("Réponse enregistrée.")).toBeVisible(STEPS);
  const panel = await historyPanel(page);
  await expect(row(panel, title)).toContainText("Effacée le");
});

test("assistant verrouillé : l'historique reste, la conversation se relit sans saisie", async ({
  page,
}) => {
  const title = unique("verrouillé");
  insertConversation({ user: COACH_C, org: ORG_A, title });
  await login(page, "coach-c@example.test");
  await page.goto("/coach/assistant");
  const panel = await historyPanel(page);
  await row(panel, title).click();
  await expect(thread(page).getByText("Réponse enregistrée.")).toBeVisible();
  await expect(page.getByLabel("Ta demande à l'assistant")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Nouvelle conversation" })).toHaveCount(0);
});

// Relecture du 27/11 : la même conversation ouverte dans deux onglets (comme le Mac et l'iPhone). La
// carte validée dans le premier ne s'exécute JAMAIS une seconde fois depuis le second, resté en
// retard : il est rechargé à la place.
test("deux onglets sur la même conversation : une carte n'est jamais exécutée deux fois", async ({
  page,
}) => {
  test.skip(isPhone(page), "Deux onglets : un seul projet suffit (coach B partagé).");
  const TASK = "Tâche conversations 1700000000000";
  const tasks = () =>
    localSql(`select count(*) from public.coach_tasks where title = ${quote(TASK)}`);
  localSql(`delete from public.coach_tasks where title = ${quote(TASK)}`);
  await login(page, "coach-b@example.test");
  await page.goto("/coach/assistant");
  await ask(page, "Crée la tâche test des conversations");
  const card = (on: Page) => on.getByRole("region", { name: "Nouvelle tâche" });
  await expect(card(page)).toBeVisible(STEPS);
  const id = await expect
    .poll(() =>
      localSql(
        `select id from public.assistant_conversations where title = 'Crée la tâche test des conversations' and user_id = '${COACH_B}'`,
      ),
    )
    .not.toBe("")
    .then(() =>
      localSql(
        `select id from public.assistant_conversations where title = 'Crée la tâche test des conversations' and user_id = '${COACH_B}'`,
      ),
    );

  // Le second onglet ouvre la même conversation : la carte y est « à valider ».
  const other = await page.context().newPage();
  await other.goto(`/coach/assistant?conversation=${id}`);
  await expect(card(other).getByRole("button", { name: "Valider" })).toBeEnabled(STEPS);

  // Validée dans le premier onglet : une tâche.
  await card(page).getByRole("button", { name: "Valider" }).click();
  await expect.poll(tasks, STEPS).toBe("1");
  await expect(card(page).getByRole("button", { name: "Valider" })).toHaveCount(0, STEPS);

  // Le second onglet, en retard, valide aussi : refusé, rechargé, toujours UNE tâche.
  await card(other).getByRole("button", { name: "Valider" }).click();
  await expect(
    other.getByText("Cette conversation a changé sur un autre appareil : elle est à jour."),
  ).toBeVisible(STEPS);
  await expect(card(other).getByRole("button", { name: "Valider" })).toHaveCount(0);
  expect(tasks()).toBe("1");
  await other.close();
});
