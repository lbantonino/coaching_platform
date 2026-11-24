import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

// « Séance choisie » modifiable dans l'éditeur de programme (demande d'Antonino du 24/11/2026,
// option A) : le nom et la durée sur place ; une carte ouvre SON réglage (le panneau de l'éditeur de
// séance) à la place du détail sur ordinateur, dans une fenêtre du bas sur téléphone. Chaque test crée
// son sportif (« Nouveau sportif » de l'assistant) et son brouillon, retirés en fin de suite.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
const TEN_K = "7a000000-0000-4000-8000-000000000002";
const STRENGTH_TEMPLATE = "7a000000-0000-4000-8000-000000000011";

async function newProgram(page: Page, testInfo: TestInfo, template: string): Promise<Locator> {
  const phone = testInfo.project.name === "telephone";
  const stamp = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto(`/coach/o/${ORG}/programmes/nouveau?modele=${template}`);
  await page.getByRole("searchbox").fill(`Inline ${stamp}`);
  await page.getByText("Nouveau sportif", { exact: true }).click();
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}(\?.*)?$/);
  // Ordinateur : la première séance est déjà dans « Séance choisie » ; téléphone : on l'ouvre.
  if (phone) {
    await page.locator("button[aria-pressed]").filter({ visible: true }).first().click();
    await expect(page.getByRole("button", { name: "Modifier la séance" })).toBeVisible();
    return page.locator("main");
  }
  return page.getByRole("complementary", { name: "Séance choisie" });
}

test("le nom, la durée et une étape de course se changent depuis la séance choisie", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const detail = await newProgram(page, testInfo, TEN_K);

  // Le nom : un clic, Entrée.
  await detail
    .getByRole("heading", { level: 2 })
    .filter({ visible: true })
    .getByRole("button")
    .click();
  await detail.getByRole("textbox", { name: "Nom de la séance" }).fill("Footing du lundi");
  await page.keyboard.press("Enter");
  await expect(
    detail.getByRole("heading", { name: "Footing du lundi", level: 2 }).filter({ visible: true }),
  ).toBeVisible();

  // La durée : écrite à la main, elle ne suit plus le contenu (« Calculer » y revient).
  await detail.getByRole("button", { name: /^Durée : / }).click();
  await detail.getByRole("textbox", { name: "Durée de la séance (min)" }).fill("50");
  await page.keyboard.press("Enter");
  await expect(
    detail.getByRole("button", { name: "Durée : 50 min. Changer la durée" }),
  ).toBeVisible();
  await expect(detail.getByRole("button", { name: "Calculer" })).toBeVisible();

  // Une étape : sa carte ouvre son réglage ; « Valider l'étape » revient au détail.
  await detail
    .getByRole("button", { name: /^Modifier « / })
    .first()
    .click();
  const panel = phone ? page.getByRole("dialog", { name: "Modifier l'étape" }) : detail;
  const stepName = panel.getByRole("textbox", { name: "Nom de l'étape" });
  await stepName.fill("Footing doux");
  await panel.getByRole("button", { name: "Valider l'étape" }).click();
  await expect(detail.getByRole("button", { name: /^Modifier « Footing doux »/ })).toBeVisible();
  // Le détail est revenu (le nom de la séance est toujours là).
  await expect(
    detail.getByRole("heading", { name: "Footing du lundi", level: 2 }).filter({ visible: true }),
  ).toBeVisible();
});

test("un exercice de musculation se règle depuis sa carte, sans ouvrir l'éditeur", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const detail = await newProgram(page, testInfo, STRENGTH_TEMPLATE);
  await detail.getByRole("button", { name: /^Modifier « Soulevé de terre barre »/ }).click();
  const panel = phone ? page.getByRole("dialog", { name: "Modifier l'étape" }) : detail;
  await panel.getByRole("textbox", { name: "Saisie rapide" }).fill("5 x 3");
  await panel.getByRole("button", { name: "Remplir" }).click();
  await panel.getByRole("button", { name: "Valider l'exercice" }).click();
  await expect(page).not.toHaveURL(/\/seances\//);
  await expect(
    detail.getByRole("listitem").filter({ hasText: "Soulevé de terre barre" }).first(),
  ).toContainText("5 séries");
});
