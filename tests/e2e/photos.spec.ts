import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection, openAthleteTab } from "./helpers";

// Photos de profil (D-28) : envoi et retrait sur la fiche d'un sportif, contrôle du format,
// accès refusé à un autre coach, profil du coach (Paramètres).
const PHOTO = "supabase/seed-photos/sophie.jpg";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach ajoute puis retire la photo d'un sportif ; un autre coach ne peut pas la voir", async ({
  page,
  browser,
}, testInfo) => {
  const name = `Photo ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await login(page, "coach-a@example.test");
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Ajouter un sportif" }).click();
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
  await openAthleteTab(page, "Profil");
  const photo = page.getByRole("region", { name: "Photo" });

  // Un faux fichier image est refusé (on lit ses premiers octets, pas son nom).
  await photo.getByLabel("Photo de profil").setInputFiles({
    name: "faux.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("ceci n'est pas une image"),
  });
  await photo.getByRole("button", { name: "Ajouter la photo" }).click();
  await expect(photo.getByRole("alert")).toContainText("Format non accepté");

  // Une vraie photo : enregistrée, puis servie par l'app à ce coach.
  await photo.getByLabel("Photo de profil").setInputFiles(PHOTO);
  await photo.getByRole("button", { name: "Ajouter la photo" }).click();
  await expect(photo.getByRole("status")).toContainText("Photo enregistrée.");
  const src = await photo.locator("img").first().getAttribute("src");
  expect(src).toMatch(/^\/photos\/org\//);
  expect((await page.request.get(src!)).status()).toBe(200);

  // Le coach de l'organisation B ne peut pas la télécharger, même avec l'adresse exacte.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await login(otherPage, "coach-b@example.test");
  expect((await otherPage.request.get(src!)).status()).toBe(404);
  await other.close();

  // Retrait : retour aux initiales, l'ancienne adresse ne sert plus rien.
  await photo.getByRole("button", { name: "Retirer la photo" }).click();
  await expect(photo.locator("img")).toHaveCount(0);
  expect((await page.request.get(src!)).status()).toBe(404);
});

test("le coach renseigne son identité et son entreprise dans Paramètres", async ({ page }) => {
  // Coach de démo B : le profil du coach A est celui qu'Antonino utilise pour regarder l'app.
  await login(page, "coach-b@example.test");
  await page.goto("/coach/profil");
  await expect(page.getByRole("heading", { name: "Paramètres", level: 1 })).toBeVisible();
  await page.getByLabel("Prénom").fill("Marco");
  await page.getByLabel(/^Entreprise/).fill("Bianchi Performance");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Profil enregistré.");
  await page.reload();
  await expect(page.getByLabel(/^Entreprise/)).toHaveValue("Bianchi Performance");
  await page.goto("/coach");
  await expect(page.getByRole("heading", { name: /^Bonjour Marco/, level: 1 })).toBeVisible();
});
