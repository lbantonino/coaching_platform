import { expect, test } from "@playwright/test";

// Fiche à onglets (P2-04, étape 1) : vue d'ensemble en lecture, chiffres clés et recherche du haut.
// Lecture seule sur une sportive de démo du seed (Inès Benali) : rien n'est modifié.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const INES = "da000000-0000-4000-8000-000000000003";

test("la vue d'ensemble résume la fiche et « Modifier » ouvre le bon onglet", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  await page.goto(`/coach/o/${ORG_A}/sportifs/${INES}`);
  await expect(page.getByRole("heading", { name: "Inès Benali", level: 1 })).toBeVisible();
  const tabs = page.getByRole("navigation", { name: "Sections de la fiche" });
  await expect(tabs.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Chiffres clés calculés depuis la fiche et les objectifs.
  const figures = page.getByRole("region", { name: "Chiffres clés" });
  await expect(figures).toContainText("Hyrox Bruxelles");
  await expect(figures).toContainText(/Dans \d+ jours/);
  await expect(figures).toContainText("90 min");

  // Cartes en lecture seule.
  await expect(page.getByRole("region", { name: "Objectif actuel" })).toContainText(
    "Catégorie Pro",
  );
  const availability = page.getByRole("region", { name: "Disponibilités & contraintes" });
  await expect(availability).toContainText("Épaule gauche sensible");
  await expect(availability.getByRole("textbox")).toHaveCount(0);

  // « Modifier » ouvre l'onglet qui contient le formulaire.
  await page.getByRole("link", { name: "Modifier : Disponibilités & contraintes" }).click();
  await expect(page).toHaveURL(/onglet=disponibilites/);
  await expect(tabs.getByRole("link", { name: "Disponibilités" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByLabel("Séances par semaine")).toHaveValue("5");
});

test("la recherche du haut trouve un sportif, quel que soit son statut", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "ordinateur", "Barre du haut affichée sur ordinateur");
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  // Kevin Mertens est archivé : la recherche du haut couvre tous les statuts.
  await page.getByLabel("Trouver un sportif").fill("mertens");
  await page.getByLabel("Trouver un sportif").press("Enter");
  await expect(page).toHaveURL(/statut=tous/);
  await expect(page.getByRole("list", { name: "Liste des sportifs" })).toContainText(
    "Kevin Mertens",
  );
});
