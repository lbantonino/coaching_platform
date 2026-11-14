import { expect, test, type Page } from "@playwright/test";

import { goToCoachSection, openSettings } from "./helpers";

// Compte de démonstration partagé (OPEN-24, décisions d'Antonino du 14/11/2026) : les visiteurs de
// Synode entrent avec une adresse et un mot de passe publics. Un bandeau les prévient ; ils ne peuvent
// changer ni le mot de passe, ni l'adresse, ni déposer de fichier. Rien n'est écrit : les deux projets
// tournent en même temps sans se gêner.
const PHOTO = "supabase/seed-photos/sophie.jpg";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le compte de démo s'annonce et montre ses sportifs fictifs ; un compte normal, non", async ({
  page,
}) => {
  await login(page, "coach-demo@example.test");
  await expect(
    page.getByRole("note").filter({ hasText: "Compte de démonstration partagé" }),
  ).toContainText("remis à zéro chaque nuit");
  await goToCoachSection(page, "Sportifs");
  await expect(page.getByText("Sarah Vermeulen").filter({ visible: true }).first()).toBeVisible();
});

test("un compte normal n'a pas le bandeau de la démo", async ({ page }) => {
  await login(page, "coach-b@example.test");
  await expect(page.getByRole("note").filter({ hasText: "Compte de démonstration" })).toHaveCount(
    0,
  );
});

test("le compte de démo ne change ni son mot de passe, ni son adresse, ni sa photo", async ({
  page,
}) => {
  await login(page, "coach-demo@example.test");
  const security = await openSettings(page, "securite");
  const password = security.getByRole("region", { name: "Mot de passe" });
  await password.getByLabel("Mot de passe actuel", { exact: true }).fill("demo-coach-local");
  await password.getByLabel("Nouveau mot de passe").fill("nouveau-mot-de-passe-1");
  await password.getByLabel("Confirmer le nouveau").fill("nouveau-mot-de-passe-1");
  await password.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(password.getByRole("alert")).toContainText(
    "Désactivé sur le compte de démonstration.",
  );

  const email = security.getByRole("region", { name: "Adresse e-mail" });
  await email.getByLabel("Nouvelle adresse e-mail").fill("pirate@example.test");
  await email.getByRole("button", { name: "Changer d'adresse" }).click();
  await expect(email.getByRole("alert")).toContainText("Désactivé sur le compte de démonstration.");

  const profile = await openSettings(page, "profil");
  // Le champ fichier (la carte porte aussi le nom « Photo de profil »).
  await profile.locator('input[type="file"][aria-label="Photo de profil"]').setInputFiles(PHOTO);
  await expect(
    profile.getByRole("alert").filter({
      hasText: "Les fichiers et photos sont désactivés sur le compte de démonstration.",
    }),
  ).toBeVisible();
});

// Relecture du 14/11 : « Déconnecter partout » ne doit pas sortir tous les visiteurs de la démo.
test("« Déconnecter partout » ne déconnecte que ce visiteur de la démo", async ({
  page,
  browser,
}) => {
  await login(page, "coach-demo@example.test");
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await login(otherPage, "coach-demo@example.test");

  const security = await openSettings(page, "securite");
  await security.getByRole("button", { name: "Déconnecter partout" }).click();
  await page
    .getByRole("dialog", { name: "Déconnecter tous les appareils ?" })
    .getByRole("button", { name: "Déconnecter partout" })
    .click();
  await expect(page).toHaveURL(/\/login/);

  await otherPage.goto("/coach");
  await expect(otherPage).toHaveURL(/\/coach$/);
  await other.close();
});
