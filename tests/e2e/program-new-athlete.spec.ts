import { expect, test, type Page } from "@playwright/test";

import { goToCoachSection } from "./helpers";

// Nouveau sportif tapé dans la liste de « Créer un programme » (demande d'Antonino du 24/11/2026) : il
// est créé avec le programme. Règle des noms : un seul mot (traits d'union compris) = le prénom ; deux
// mots ou plus = prénom puis nom. Noms uniques « …ordinateur-<horodatage>… », retirés en fin de suite.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Modèle Coory « Préparation 10 km » (graine de développement).
const TEN_K = "7a000000-0000-4000-8000-000000000002";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// La fiche du sportif créé : son nom complet en titre.
async function openFiche(page: Page, search: string, fullName: string) {
  await goToCoachSection(page, "Sportifs");
  await page
    .getByRole("link", { name: new RegExp(search) })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: fullName, level: 1 })).toBeVisible();
}

test("assistant : un prénom seul, même avec des traits d'union, crée le sportif avec le programme", async ({
  page,
}, testInfo) => {
  // Une part aléatoire : deux tests lancés à la même milliseconde ne partagent pas leur nom.
  const stamp = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const firstName = `Jean-Baptiste-${stamp}`;
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes/nouveau?modele=${TEN_K}`);
  await page.getByRole("searchbox").fill(firstName);
  // Aucun sportif à ce nom : la ligne « Nouveau sportif » dit ce qui sera enregistré.
  const row = page.getByText("Nouveau sportif", { exact: true }).filter({ visible: true });
  await expect(page.getByText(`Prénom : ${firstName}`, { exact: true })).toBeVisible();
  await row.click();
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}(\?.*)?$/);

  // La fiche existe, avec ce seul prénom (aucun nom de famille).
  await openFiche(page, stamp, firstName);
});

test("« Utiliser ce modèle » : deux mots = un prénom et un nom", async ({ page }, testInfo) => {
  // Une part aléatoire : deux tests lancés à la même milliseconde ne partagent pas leur nom.
  const stamp = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes/modeles/${TEN_K}?utiliser=1`);
  const sheet = page.getByRole("dialog", { name: "Utiliser ce modèle" });
  await sheet.getByRole("searchbox").fill(`Antonino ${stamp}`);
  await expect(
    sheet.getByText(`Prénom : Antonino · Nom : ${stamp}`, { exact: true }),
  ).toBeVisible();
  await sheet.getByText("Nouveau sportif", { exact: true }).click();
  await sheet.getByRole("button", { name: "Créer le programme" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}(\?.*)?$/);

  await openFiche(page, stamp, `Antonino ${stamp}`);
});
