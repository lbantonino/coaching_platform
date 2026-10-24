import { expect, test, type Page } from "@playwright/test";

import { goToCoachSection, logoutCoach } from "./helpers";

// Comptes du seed de démonstration (supabase/seed.sql), base locale uniquement.
const DEMO_PASSWORD = "demo-coach-local";
const COACH_A = "coach-a@example.test";
const ADMIN = "admin@example.test";

async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("un visiteur non connecté est renvoyé vers la connexion", async ({ page }) => {
  await page.goto("/coach");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: /^(Bon retour\.|Connexion)$/ }).filter({ visible: true }),
  ).toBeVisible();
});

test("le coach A se connecte, voit uniquement son organisation, puis se déconnecte", async ({
  page,
}) => {
  await login(page, COACH_A);

  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByRole("heading", { name: /^Bonjour/, level: 1 })).toBeVisible();
  // Rien de l'organisation B n'apparaît : ni son nom, ni ses sportifs (Sarah Vermeulen).
  await expect(page.getByText("Organisation Démo B")).toHaveCount(0);
  await goToCoachSection(page, "Sportifs");
  const list = page.getByRole("list", { name: "Liste des sportifs" });
  await expect(list.getByText("Thomas Peeters")).toBeVisible();
  await expect(list.getByText("Sarah Vermeulen")).toHaveCount(0);
  await expect(page.getByText("Organisation Démo B")).toHaveCount(0);

  await logoutCoach(page);
  await expect(page).toHaveURL(/\/login$/);

  // Après déconnexion, l'espace coach n'est plus accessible.
  await page.goto("/coach");
  await expect(page).toHaveURL(/\/login$/);
});

test("un mauvais mot de passe affiche une erreur générique", async ({ page }) => {
  await login(page, COACH_A, "mauvais-mot-de-passe");

  // Ciblé par son texte : Next ajoute aussi un role="alert" (annonceur de route) sur chaque page.
  await expect(
    page.getByRole("alert").filter({ hasText: "E-mail ou mot de passe incorrect." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("le coach A ne peut pas entrer dans l'administration", async ({ page }) => {
  await login(page, COACH_A);
  await expect(page).toHaveURL(/\/coach$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/acces-refuse$/);
  await expect(page.getByText("Aucun outil d'administration")).toHaveCount(0);
});

test("l'admin arrive dans l'administration et ne peut pas entrer dans l'espace coach", async ({
  page,
}) => {
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Administration", exact: true })).toBeVisible();

  await page.goto("/coach");
  await expect(page).toHaveURL(/\/acces-refuse$/);
  await expect(page.getByText("Organisation Démo")).toHaveCount(0);
});
