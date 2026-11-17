import { expect, test, type Locator, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

// « ⋯ » sur la carte d'un programme (demande d'Antonino du 16/11/2026) : les actions du menu de
// l'éditeur sans ouvrir le programme, et Supprimer (définitif). Ici : renommer puis supprimer depuis
// l'onglet Programme de la fiche ; un brouillon créé depuis le modèle Coory « Préparation 10 km » pour
// un sportif de test (nettoyé en fin de suite).
const ORG = "0a000000-0000-4000-8000-0000000000a1";
const TEN_K = "7a000000-0000-4000-8000-000000000002";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// Le menu : sur ordinateur une liste (menuitem), sur téléphone une feuille d'actions (ses boutons).
const action = (page: Page, phone: boolean, name: string): Locator =>
  phone
    ? page.getByRole("dialog").getByRole("button", { name, exact: true }).filter({ visible: true })
    : page.getByRole("menuitem", { name }).filter({ visible: true });

// Un sportif de test et un brouillon de programme pour lui ; renvoie l'adresse de sa fiche.
async function athleteWithDraft(page: Page, suffix: string, title: string): Promise<string> {
  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, `Carte ${suffix}`);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: `Carte ${suffix}`, level: 1 })).toBeVisible();
  const fiche = new URL(page.url()).pathname;
  const athleteId = fiche.split("/").pop() ?? "";

  await page.goto(`/coach/o/${ORG}/programmes/nouveau?sportif=${athleteId}&modele=${TEN_K}`);
  await page.getByLabel("Titre du programme").fill(title);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);
  return fiche;
}

test("« ⋯ » d'une carte de programme : renommer, puis supprimer, sans ouvrir le programme", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const title = `Menu ${suffix}`;
  const fiche = await athleteWithDraft(page, suffix, title);

  // L'onglet Programme de la fiche : la carte et son « ⋯ ».
  await page.goto(`${fiche}?onglet=programme`);
  const card = page.getByRole("article").filter({ visible: true }).first();
  await expect(card.getByRole("heading", { name: title })).toBeVisible();

  // Renommer : la fenêtre de l'éditeur, sur place ; la page ne change pas.
  await card.getByRole("button", { name: `Plus d'actions sur « ${title} »` }).click();
  await action(page, phone, "Renommer").click();
  const rename = page.getByRole("dialog", { name: "Renommer le programme" });
  await rename.getByLabel("Titre").fill(`${title} bis`);
  await rename.getByRole("button", { name: "Renommer" }).click();
  await expect(card.getByRole("heading", { name: `${title} bis` })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${fiche}\\?onglet=programme$`));

  // Conflit (relecture du 16/11) : une fenêtre ouverte AVANT un changement fait ailleurs n'écrase pas
  // ce changement en silence ; elle annonce que le programme a été modifié ailleurs.
  const other = await page.context().newPage();
  await other.goto(`${fiche}?onglet=programme`);
  const otherCard = other.getByRole("article").filter({ visible: true }).first();
  await card.getByRole("button", { name: `Plus d'actions sur « ${title} bis »` }).click();
  await action(page, phone, "Renommer").click();
  await expect(rename.getByLabel("Titre")).toHaveValue(`${title} bis`);
  await otherCard.getByRole("button", { name: `Plus d'actions sur « ${title} bis »` }).click();
  await action(other, phone, "Renommer").click();
  const otherRename = other.getByRole("dialog", { name: "Renommer le programme" });
  await otherRename.getByLabel("Titre").fill(`${title} ter`);
  await otherRename.getByRole("button", { name: "Renommer" }).click();
  await expect(otherCard.getByRole("heading", { name: `${title} ter` })).toBeVisible();
  await other.close();
  await rename.getByLabel("Titre").fill(`${title} quater`);
  await rename.getByRole("button", { name: "Renommer" }).click();
  await expect(
    page
      .getByText(/modifié ailleurs/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(card.getByRole("heading", { name: `${title} ter` })).toBeVisible();
  await page.keyboard.press("Escape");

  // Supprimer : définitif, après confirmation ; la fiche n'a plus de programme.
  await card.getByRole("button", { name: `Plus d'actions sur « ${title} ter »` }).click();
  await action(page, phone, "Supprimer").click();
  const confirm = page.getByRole("dialog", { name: "Supprimer ce programme ?" });
  await expect(confirm).toContainText("définitivement");
  await confirm.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByRole("heading", { name: /^Aucun programme pour/ })).toBeVisible();
});

// Relecture du 16/11 : un programme PUBLIÉ renommé depuis sa carte garde son titre publié (ce que voit
// le sportif) ; la carte dit qu'il a des modifications non publiées, et le message invite à publier.
// Puis la suppression d'un programme publié : il disparaît de la fiche.
test("« ⋯ » d'un programme publié : le renommer le marque « Modifications non publiées », puis le supprimer", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const title = `Publié ${suffix}`;
  const fiche = await athleteWithDraft(page, suffix, title);
  if (phone) await page.getByRole("button", { name: "Publier" }).click();
  else await page.getByRole("button", { name: "Publier" }).first().click();
  await page.getByRole("button", { name: "Publier la version 1" }).click();
  await expect(page.getByText("Programme publié (version 1).")).toBeVisible();

  await page.goto(`${fiche}?onglet=programme`);
  const card = page.getByRole("article").filter({ visible: true }).first();
  await expect(card.getByText("Modifications non publiées")).toHaveCount(0);
  await card.getByRole("button", { name: `Plus d'actions sur « ${title} »` }).click();
  await action(page, phone, "Renommer").click();
  const rename = page.getByRole("dialog", { name: "Renommer le programme" });
  await rename.getByLabel("Titre").fill(`${title} bis`);
  await rename.getByRole("button", { name: "Renommer" }).click();
  await expect(
    page.getByText(/Programme renommé.*publie/i).filter({ visible: true }),
  ).toBeVisible();
  await expect(card.getByText("Modifications non publiées")).toBeVisible();
  await expect(card.getByRole("heading", { name: title, exact: true })).toBeVisible();

  await card.getByRole("button", { name: `Plus d'actions sur « ${title} »` }).click();
  await action(page, phone, "Supprimer").click();
  await page
    .getByRole("dialog", { name: "Supprimer ce programme ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByRole("heading", { name: /^Aucun programme pour/ })).toBeVisible();
});
