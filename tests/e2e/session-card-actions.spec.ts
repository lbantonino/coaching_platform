import { expect, test, type Locator, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

// « ⋯ » des cartes d'une séance sur la page du programme (D-187, test sur iPhone du 15/11/2026) :
// Dupliquer un exercice (la copie apparaît juste après), puis Supprimer la copie. Brouillon créé depuis
// le modèle Coory « Développer sa force » pour un sportif de test (nettoyé en fin de suite).
const ORG = "0a000000-0000-4000-8000-0000000000a1";
const FORCE = "7a000000-0000-4000-8000-000000000108";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// Le menu : sur ordinateur une liste (menuitem), sur téléphone une feuille d'actions (ses boutons ;
// « Dupliquer » existe aussi dans la barre de la semaine, d'où la feuille visée).
const action = (page: Page, phone: boolean, name: string): Locator =>
  phone
    ? page.getByRole("dialog").getByRole("button", { name, exact: true }).filter({ visible: true })
    : page.getByRole("menuitem", { name }).filter({ visible: true });

test("« ⋯ » d'un exercice : Dupliquer, puis Supprimer la copie", async ({ page }, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, `Cartes ${suffix}`);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: `Cartes ${suffix}`, level: 1 })).toBeVisible();
  const athleteId = new URL(page.url()).pathname.split("/").pop() ?? "";

  await page.goto(`/coach/o/${ORG}/programmes/nouveau?sportif=${athleteId}&modele=${FORCE}`);
  await page.getByLabel("Titre du programme").fill(`Force ${suffix}`);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);
  // La semaine 1 ; sur téléphone, sa première séance s'ouvre depuis sa carte.
  await page.goto(`${page.url()}?semaine=1`);
  if (phone) await page.locator("button[aria-pressed]").filter({ visible: true }).first().click();

  const steps = page.getByRole("list", { name: "Étapes de la séance" }).filter({ visible: true });
  const exercise = steps
    .getByRole("listitem")
    .filter({ hasText: /\d+ séries?/ })
    .first();
  const name = (await exercise
    .getByRole("button", { name: /^Plus d'actions sur « / })
    .getAttribute("aria-label"))!.replace(/^Plus d'actions sur « (.+) »$/, "$1");
  const cardsNamed = steps.getByRole("button", { name: `Plus d'actions sur « ${name} »` });
  const before = await cardsNamed.count();
  // « Durée ≈ » suit la séance, comme dans l'éditeur de séance (relecture).
  const duration = page
    .locator("dt", { hasText: "Durée" })
    .filter({ visible: true })
    .locator("xpath=following-sibling::dd");
  const minutes = (await duration.innerText()).trim();

  await exercise.getByRole("button", { name: `Plus d'actions sur « ${name} »` }).click();
  await action(page, phone, "Dupliquer").click();
  await expect(cardsNamed).toHaveCount(before + 1);
  await expect(duration).not.toHaveText(minutes);

  await cardsNamed.nth(1).click();
  await action(page, phone, "Supprimer").click();
  await expect(cardsNamed).toHaveCount(before);
  await expect(duration).toHaveText(minutes);
});
