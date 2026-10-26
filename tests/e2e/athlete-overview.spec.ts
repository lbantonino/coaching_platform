import { expect, test } from "@playwright/test";

import { openAthleteTab } from "./helpers";

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

  // En-tête (26/10) : plus d'étiquette d'accès ; « + Créer » propose Programme et Séance, la
  // séance déjà remplie pour Inès (individuelle, Hyrox, son type de programme).
  await expect(main.getByText(/^(Compte activé|Sans compte)$/)).toHaveCount(0);
  await main.getByRole("button", { name: "Créer", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Créer pour Inès Benali" });
  await expect(create.getByRole("button", { name: "Programme" })).toBeVisible();
  await create.getByRole("button", { name: "Séance" }).click();
  const session = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(session.getByLabel("Sportif", { exact: true })).toHaveValue(INES);
  await expect(session.getByLabel("Discipline")).toHaveValue("hyrox");
  await session.getByRole("button", { name: "Fermer" }).click();
  await expect(session).toBeHidden();

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

  // Onglets Programme (état vide et création) et Agenda (8 semaines, compétitions comprises).
  await openAthleteTab(page, "Programme");
  await expect(page.getByText("Aucun programme pour Inès")).toBeVisible();
  await openAthleteTab(page, "Agenda");
  const agenda = page.getByRole("region", { name: "Agenda de Inès" });
  const views = agenda.getByRole("navigation", { name: "Vue de l'agenda du sportif" });
  // Semaine par défaut : une colonne par jour, sans grille horaire (dates fixées dans l'adresse).
  await expect(views.getByRole("link", { name: "Semaine" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.goto(`/coach/o/${ORG_A}/sportifs/${INES}?onglet=agenda&vue=semaine&date=2027-01-06`);
  await expect(agenda.getByRole("list", { name: "Jours de la semaine" })).toContainText(
    "Piste du mercredi",
  );
  // Mois : un jour se touche et ouvre sa journée ; Hyrox Gent le 12 décembre.
  await page.goto(`/coach/o/${ORG_A}/sportifs/${INES}?onglet=agenda&vue=mois&date=2026-12-01`);
  await agenda.getByRole("link", { name: /^Samedi 12 décembre/ }).click();
  await expect(page).toHaveURL(/vue=jour&date=2026-12-12/);
  await expect(agenda.getByRole("list", { name: "Séances du jour" })).toContainText("Hyrox Gent");
});
