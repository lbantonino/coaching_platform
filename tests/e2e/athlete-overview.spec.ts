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
  await page.getByLabel("Rechercher dans Coory (sportifs)").fill("mertens");
  await page.getByLabel("Rechercher dans Coory (sportifs)").press("Enter");
  await expect(page).toHaveURL(/statut=tous/);
  await expect(page.getByRole("list", { name: "Liste des sportifs" })).toContainText(
    "Kevin Mertens",
  );
});

test("la fiche propose « Créer un programme », le menu « ••• » et les prochaines séances", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto(`/coach/o/${ORG_A}/sportifs/${INES}`);
  await expect(page.getByRole("heading", { name: "Inès Benali", level: 1 })).toBeVisible();
  const main = page.getByRole("main");

  // En-tête (26/10) : plus d'étiquette d'accès ; « Créer un programme » mène aux programmes.
  await expect(main.getByText(/^(Compte activé|Sans compte)$/)).toHaveCount(0);
  await expect(main.getByRole("link", { name: "Créer un programme" })).toHaveAttribute(
    "href",
    "/coach/programmes",
  );

  // Prochaines séances : ses compétitions à venir y figurent (Hyrox Gent en décembre).
  await expect(main.getByRole("region", { name: "Prochaines séances" })).toContainText(
    "Hyrox Gent",
  );
  // Temps visé de son objectif principal.
  await expect(main.getByRole("region", { name: "Objectif actuel" })).toContainText(
    "Temps visé 1:15:00",
  );

  // « ••• » : les actions de la liste ; Inès a un compte, donc « Écrire un message ».
  await main.getByRole("button", { name: "Actions pour Inès Benali" }).click();
  const menu = page.getByRole("dialog", { name: "Inès Benali" });
  await expect(menu.getByRole("button", { name: "Écrire un message" })).toBeVisible();
  await menu.getByRole("button", { name: "Changer le type de programme" }).click();
  const type = page.getByRole("dialog", { name: "Programme de Inès Benali" });
  await expect(type.getByRole("button", { name: "Hyrox" })).toHaveAttribute("aria-current", "true");
  await type.getByRole("button", { name: "Retour" }).click();
  await menu.getByRole("button", { name: "Modifier l'objectif" }).click();
  await expect(page).toHaveURL(/onglet=objectifs/);
  await expect(page.getByText("Temps visé 1:15:00")).toBeVisible();
});
