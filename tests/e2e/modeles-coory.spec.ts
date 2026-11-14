import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

// Modèles Coory (D-177, liste validée par Antonino le 14/11/2026) : les 11 modèles de programme
// s'affichent dans l'onglet Modèles dans l'ordre de la liste ; un modèle s'ouvre pour voir son
// contenu, puis « Utiliser » mène à l'assistant, où l'on choisit le sportif, jusqu'au brouillon.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
const HYBRID_3 = "7a000000-0000-4000-8000-000000000111";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("D-177 : modèles Coory dans l'ordre, ouvrir un modèle hybride, l'utiliser pour un sportif", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const athlete = `Hybride ${suffix}`;

  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();

  // L'onglet Modèles : les modèles de programme Coory d'abord, dans l'ordre de la liste validée.
  await page.goto(`/coach/o/${ORG}/programmes?onglet=modeles`);
  const titles = page.locator("main article h2");
  await expect(titles.first()).toHaveText("Réussir son 5 km");
  expect((await titles.allTextContents()).slice(0, 11)).toEqual([
    "Réussir son 5 km",
    "Préparation 10 km",
    "Préparation semi-marathon",
    "Préparation marathon",
    "Améliorer son seuil",
    "Améliorer sa vitesse (VMA)",
    "Développer sa force",
    "Renforcement musculaire et hypertrophie",
    "Préparation Hyrox (toutes catégories)",
    "Hybride : 2 running + 2 musculation",
    "Hybride : 3 running + 2 musculation",
  ]);
  await expect(
    page.locator("main article").filter({ hasText: "Hybride : 3 running + 2 musculation" }),
  ).toContainText("8 sem. · 5 séances / sem.");

  // Ouvrir le modèle : son contenu, en lecture (course et musculation la même semaine).
  await page.getByRole("link", { name: "Hybride : 3 running + 2 musculation" }).click();
  await expect(page).toHaveURL(new RegExp(`/programmes/modeles/${HYBRID_3}$`));
  await expect(
    page.getByText("Force · Full body A").filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Sortie longue").filter({ visible: true }).first()).toBeVisible();

  // « Utiliser » : l'assistant part du modèle ; on choisit le sportif, puis jusqu'au brouillon.
  await page.getByRole("link", { name: "Utiliser" }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/programmes/nouveau\\?modele=${HYBRID_3}$`));
  await page.getByPlaceholder("Rechercher un sportif").fill(athlete);
  await page.getByText(athlete, { exact: true }).click();
  await page.getByLabel("Titre du programme").fill(`Hybride ${suffix}`);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);

  // Le brouillon a les 8 semaines du modèle (téléphone : la liste des semaines ; ordinateur : la
  // colonne des semaines) et ses séances de course et de musculation.
  const weeks =
    testInfo.project.name === "telephone"
      ? page.getByRole("option", { name: /^Semaine \d+ ·/ })
      : page
          .getByRole("navigation", { name: "Semaines" })
          .getByRole("button", { name: /^Semaine \d+/ });
  await expect(weeks).toHaveCount(8);
  await expect(
    page.getByText("Force · Full body B").filter({ visible: true }).first(),
  ).toBeVisible();
});
