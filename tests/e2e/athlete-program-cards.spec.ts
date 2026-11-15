import { expect, test, type Page } from "@playwright/test";

// Onglet Programme de la fiche (15/11/2026, test d'Antonino sur iPhone) : plus de vue « une semaine à
// la fois », mais les cartes des programmes du sportif, les mêmes que la page Programmes ; un appui ouvre
// le programme, et son retour ramène à l'onglet. Inès (graine) : bloc 1 en cours, bloc 2 à venir.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
const FICHE = `/coach/o/${ORG}/sportifs/da000000-0000-4000-8000-000000000003`;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("onglet Programme : les cartes de ses programmes ; un appui ouvre le programme, le retour ramène à l'onglet", async ({
  page,
}) => {
  await login(page);
  await page.goto(`${FICHE}?onglet=programme`);

  // Les cartes de la page Programmes : en cours d'abord, puis à venir.
  const titles = page.getByRole("article").filter({ visible: true }).locator("h2");
  await expect(titles.nth(0)).toHaveText("Prépa Hyrox Bruxelles · bloc 1");
  await expect(titles.nth(1)).toHaveText("Prépa HYROX · bloc 2");
  await expect(
    page.getByRole("article").filter({ hasText: "Prépa HYROX · bloc 2" }).getByText("À venir"),
  ).toBeVisible();
  // Plus de semaine affichée ici : c'est le rôle de l'agenda.
  await expect(page.getByRole("link", { name: "Ouvrir l'éditeur" })).toHaveCount(0);

  // Un appui ouvre le programme ; son retour (« ← Inès Benali ») ramène à l'onglet Programme.
  await page.getByRole("link", { name: "Prépa Hyrox Bruxelles · bloc 1" }).click();
  await expect(page).toHaveURL(/\/programmes\/f1000000-0000-4000-8000-000000000001\?retour=/);
  await page
    .getByRole("link", { name: /Inès Benali/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`${FICHE}\\?onglet=programme$`));
  await expect(titles.nth(0)).toHaveText("Prépa Hyrox Bruxelles · bloc 1");
});
