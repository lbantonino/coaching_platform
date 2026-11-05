import { expect, test, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Recherche globale du coach (4e, D-62) : résultats rangés par groupe, en direct ; jamais ceux d'une
// autre organisation. Données stables du seed : les sportifs et documents de démonstration.
async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("la recherche trouve sportifs, documents et tâches en direct, sans fuite", async ({
  page,
}) => {
  await loginAsCoachA(page);
  // Téléphone : depuis le menu hamburger ; ordinateur : depuis le haut de page.
  if (isPhone(page)) {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    // Le menu fermé est inerte (on ne peut rien y taper) : attendre qu'il soit vraiment ouvert,
    // sinon la saisie se perd et la recherche part vide (test instable jusqu'au 05/11).
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await expect
      .poll(() =>
        page
          .getByRole("searchbox", { name: "Rechercher dans Coory" })
          .evaluate((field) => field.closest("[inert]") === null),
      )
      .toBe(true);
    await page.getByRole("searchbox", { name: "Rechercher dans Coory" }).fill("sophie");
    await page.getByRole("searchbox", { name: "Rechercher dans Coory" }).press("Enter");
  } else {
    await page.getByRole("searchbox", { name: "Rechercher dans Coory" }).fill("sophie");
    await page.getByRole("searchbox", { name: "Rechercher dans Coory" }).press("Enter");
  }
  await expect(page).toHaveURL(/\/coach\/recherche\?q=sophie$/);
  await expect(page.getByRole("region", { name: /Sportifs/ })).toContainText("Sophie Lambert");
  await expect(page.getByRole("region", { name: /Tâches/ })).toContainText("Relancer Sophie");

  // En direct : la saisie suffit, l'adresse suit.
  const field = page.locator("#global-search");
  await field.fill("contrat de coaching");
  await expect(page.getByRole("region", { name: /Documents/ })).toContainText(
    "Contrat de coaching 2026",
  );
  await expect(page.getByRole("region", { name: /Sportifs/ })).toHaveCount(0);
  await expect(page).toHaveURL(/q=contrat%20de%20coaching$/);

  // Le document du coach B ne sort jamais pour le coach A.
  await field.fill("règlement de la salle");
  await expect(
    page.getByText("Aucun résultat. Essaie un autre filtre ou une autre recherche."),
  ).toBeVisible();

  // Une lettre ne suffit pas ; un joker SQL ne trouve pas tout.
  await field.fill("s");
  await expect(page.getByText("Tape au moins 2 lettres.")).toBeVisible();
  await field.fill("%%");
  await expect(
    page.getByText("Aucun résultat. Essaie un autre filtre ou une autre recherche."),
  ).toBeVisible();

  // Une tâche trouvée s'ouvre dans sa fenêtre.
  await field.fill("relancer sophie");
  await page
    .getByRole("region", { name: /Tâches/ })
    .getByRole("button", { name: /Relancer Sophie/ })
    .click();
  await expect(page.getByRole("dialog", { name: "Modifier la tâche" })).toBeVisible();
});
