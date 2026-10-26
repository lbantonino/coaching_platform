import { expect, test } from "@playwright/test";

import { openAthleteTab } from "./helpers";

// Fiche à onglets (P2-04, étape 1) : vue d'ensemble en lecture, chiffres clés et recherche du haut.
// Lecture seule sur une sportive de démo du seed (Inès Benali) : rien n'est modifié.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const INES = "da000000-0000-4000-8000-000000000003";
const THOMAS = "da000000-0000-4000-8000-000000000002";

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

  // Onglet Programme : le programme publié d'Inès (12 semaines, version 1).
  await openAthleteTab(page, "Programme");
  const summary = page.getByRole("region", { name: "Prépa Hyrox Bruxelles · bloc 1" });
  await expect(summary).toContainText("12 semaines");
  await expect(summary).toContainText("Publiée n° 1");
  // Agenda d'Inès = son programme (D-46) : une ligne par semaine, 5 séances numérotées sans jour.
  await openAthleteTab(page, "Agenda");
  await expect(page.getByRole("heading", { name: "Programme hebdomadaire" })).toBeVisible();
  const firstWeek = page.getByRole("region", { name: "Semaine du 26 oct. au 1 nov." });
  await expect(firstWeek).toContainText("5 séances à répartir librement sur la semaine");
  await expect(firstWeek.getByRole("listitem").filter({ hasText: /^Séance/ })).toHaveCount(5);
  await expect(page.getByRole("region", { name: /^Semaine du / })).toHaveCount(12);

  // Une séance s'ouvre : étapes, bloc répété, conseils, statut « À faire ».
  await firstWeek.getByRole("link", { name: /Endurance rapide/ }).click();
  await expect(page.getByRole("heading", { name: "Endurance rapide", level: 1 })).toBeVisible();
  const steps = page.getByRole("list", { name: "Étapes de la séance" });
  await expect(steps).toContainText("Échauffement");
  await expect(steps).toContainText("Répéter 5 fois");
  await expect(page.getByRole("heading", { name: "Conseils du coach" })).toBeVisible();
  await expect(page.getByRole("main").getByText("À faire").first()).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: "Inès Benali" }).click();
  await expect(page).toHaveURL(/onglet=agenda/);

  // Sans programme (Thomas), l'onglet Agenda montre ce qui a un jour, en trois vues.
  await page.goto(`/coach/o/${ORG_A}/sportifs/${THOMAS}?onglet=agenda&vue=mois&date=2026-12-01`);
  const agenda = page.getByRole("region", { name: "Agenda de Thomas" });
  await expect(
    agenda.getByRole("navigation", { name: "Vue de l'agenda du sportif" }).getByRole("link"),
  ).toHaveText(["Aujourd'hui", "Semaine", "Mois"]);
  await agenda.getByRole("link", { name: /^Dimanche 20 décembre/ }).click();
  await expect(page).toHaveURL(/vue=jour&date=2026-12-20/);
  await expect(agenda.getByRole("list", { name: "Séances du jour" })).toContainText("Corrida");
});
