import { expect, test, type Page } from "@playwright/test";

// Téléphone : le geste de retour (balayage depuis le bord, bouton « Précédent » du navigateur) remonte
// d'un niveau dans la pile de l'éditeur (une séance → sa semaine → les semaines), comme le retour de la
// barre du haut ; il ne quitte la page qu'au niveau des semaines. Retour du test d'Antonino et de son
// frère sur iPhone, 15/11/2026.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Modèle Coory « Préparation 10 km » (graine de développement), en lecture seule : rien n'est écrit.
const TEMPLATE = "7a000000-0000-4000-8000-000000000002";
const LIST = new RegExp(`/coach/o/${ORG}/programmes\\?onglet=modeles$`);
const EDITOR = new RegExp(`/coach/o/${ORG}/programmes/modeles/${TEMPLATE}(\\?.*)?$`);

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

const weekCard = (page: Page, index: number) =>
  page.getByRole("button", { name: new RegExp(`^Semaine ${index}\\b`) }).filter({ visible: true });
const weekHeading = (page: Page) =>
  page.getByRole("heading", { name: "Semaine 2", level: 2 }).filter({ visible: true });
const barBack = (page: Page, label: string) =>
  page.getByRole("button", { name: label, exact: true }).filter({ visible: true });

test("téléphone : le geste de retour remonte d'un niveau dans l'éditeur, sans quitter la page", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "telephone",
    "La pile de niveaux n'existe que sur téléphone.",
  );
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes?onglet=modeles`);
  await page.goto(`/coach/o/${ORG}/programmes/modeles/${TEMPLATE}`);

  // Les semaines → la semaine 2 → sa première séance.
  await weekCard(page, 2).click();
  await expect(weekHeading(page)).toBeVisible();
  await page.locator("button[aria-pressed]").filter({ visible: true }).first().click();
  await expect(barBack(page, "Semaine 2")).toBeVisible();

  // Le geste de retour : la séance → la semaine 2 → les semaines, toujours dans l'éditeur.
  await page.goBack();
  await expect(page).toHaveURL(EDITOR);
  await expect(weekHeading(page)).toBeVisible();
  await expect(barBack(page, "Semaines")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(EDITOR);
  await expect(weekCard(page, 3)).toBeVisible();

  // Le retour de la barre fait la même chose, sans laisser d'étape en trop : le geste suivant
  // quitte l'éditeur pour la liste des modèles.
  await weekCard(page, 2).click();
  await expect(weekHeading(page)).toBeVisible();
  await barBack(page, "Semaines").click();
  await expect(weekCard(page, 3)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(LIST);
});
