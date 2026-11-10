import { expect, test } from "@playwright/test";

import { expectAthleteTab, isPhone, openAthleteTab } from "./helpers";

// Fiche à onglets (P2-04, étape 1 ; maquette « Sportifs » du 03/11/2026) : vue d'ensemble en lecture
// et recherche du haut.
// Lecture seule sur une sportive de démo du seed (Inès Benali) : rien n'est modifié.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const INES = "da000000-0000-4000-8000-000000000003";
const JULIEN = "da000000-0000-4000-8000-000000000006";

test("la vue d'ensemble résume la fiche et « Modifier » ouvre le bon onglet", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  await page.goto(`/coach/o/${ORG_A}/sportifs/${INES}`);
  await expect(page.getByRole("heading", { name: "Inès Benali", level: 1 })).toBeVisible();
  await expectAthleteTab(page, "Vue d'ensemble");

  // Cartes en lecture seule ; les anciens chiffres clés y sont (objectif, séances, durée).
  const goal = page.getByRole("region", { name: "Objectif actuel" });
  await expect(goal).toContainText("Hyrox Bruxelles");
  await expect(goal).toContainText("Catégorie Pro");
  const availability = page.getByRole("region", { name: "Disponibilités et contraintes" });
  await expect(availability).toContainText("90 min max");
  await expect(availability).toContainText("Épaule gauche sensible");
  await expect(availability.getByRole("textbox")).toHaveCount(0);

  // « Modifier » ouvre l'onglet qui contient le formulaire.
  await page.getByRole("link", { name: "Modifier : Disponibilités et contraintes" }).click();
  await expect(page).toHaveURL(/onglet=disponibilites/);
  await expectAthleteTab(page, "Disponibilités");
  await expect(page.getByLabel("Séances par semaine")).toHaveValue("5");
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
  // Ordinateur : « + Créer » de l'en-tête ; téléphone : le bouton flottant « + » (D-117).
  if (isPhone(page)) await page.getByRole("button", { name: "Créer pour Inès Benali" }).click();
  else await main.getByRole("button", { name: "Créer", exact: true }).click();
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
  await menu.getByRole("button", { name: "Changer le programme" }).click();
  const type = page.getByRole("dialog", { name: "Programme de Inès Benali" });
  await expect(type.getByRole("button", { name: "Hyrox" })).toHaveAttribute("aria-current", "true");
  await type.getByRole("button", { name: "Retour" }).click();
  await menu.getByRole("button", { name: "Modifier l'objectif" }).click();
  await expect(page).toHaveURL(/onglet=objectifs/);
  await expect(page.getByText("Temps visé 1:15:00")).toBeVisible();

  // Onglet Programme (maquette 07, D-157) : le programme publié d'Inès (version 1), sa semaine
  // et l'accès à l'éditeur.
  await openAthleteTab(page, "Programme");
  await expect(
    page.getByRole("heading", { name: "Prépa Hyrox Bruxelles · bloc 1" }).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText(/Publié v1/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ouvrir l'éditeur" }).filter({ visible: true }),
  ).toBeVisible();
  // Une séance de la semaine s'affiche en détail sur place (colonne de droite sur ordinateur, feuille
  // sur téléphone, demande du 10/11), avec « Modifier la séance » ; on ne quitte pas la fiche.
  const fiche = page.url();
  await page
    .getByRole("region", { name: /Semaine/ })
    .locator("button[aria-pressed]")
    .first()
    .click();
  await expect(
    page.getByRole("link", { name: "Modifier la séance" }).filter({ visible: true }),
  ).toHaveAttribute("href", /\/programmes\/.+(\/seances\/|\?semaine=)/);
  expect(page.url()).toBe(fiche);
  await page.keyboard.press("Escape");
  // Agenda d'Inès = son programme (D-46), une semaine à la fois (maquette 2c du 03/11) : 5 séances
  // numérotées sans jour. Ses 5 séances par semaine COMPRENNENT ses 2 rendez-vous avec le coach (pas
  // 5 + 2) : coaching du mardi 7 h et circuit collectif du samedi 10 h, écrits sur leur carte.
  await openAthleteTab(page, "Agenda");
  await expect(page.getByRole("heading", { name: "Prépa Hyrox Bruxelles · bloc 1" })).toBeVisible();
  await expect(
    page.getByText("12 semaines · 26 oct. → 17 janv. · 5 séances par semaine"),
  ).toBeVisible();
  // Le menu des semaines (la semaine 1, quelle que soit la date du jour).
  await page.getByRole("button", { name: /: choisir une semaine$/ }).click();
  await page
    .getByRole("navigation", { name: "Semaines du programme" })
    .getByRole("link", { name: /^Semaine 1( \(actuelle\))?$/ })
    .click();
  const firstWeek = page.getByRole("region", { name: "Semaine 1", exact: true });
  await expect(firstWeek).toContainText("26 oct. – 1 nov. · 2 avec le coach · 3 libres");
  await expect(firstWeek.getByRole("listitem").filter({ hasText: "Renfo Hyrox" })).toContainText(
    /Avec le coach · .* · 07:00/,
  );
  await expect(firstWeek.getByRole("listitem").filter({ hasText: "Circuit Hyrox" })).toContainText(
    /Avec le coach · Sam 31 · 10:00/,
  );
  await expect(
    firstWeek.getByRole("list", { name: "Séances de la semaine 1" }).getByRole("listitem"),
  ).toHaveCount(5);
  // › : la semaine suivante ; puis toutes les semaines.
  await page.getByRole("link", { name: "Semaine suivante" }).click();
  await expect(page.getByRole("region", { name: "Semaine 2", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Toutes les semaines" }).click();
  await expect(page.getByRole("region", { name: /^Semaine \d+$/ })).toHaveCount(12);

  // Une séance se déplie (maquette 2c, D-157) : étapes, bloc répété ; « Modifier la séance » ouvre
  // son éditeur (la page d'une séance a été retirée le 10/11, décision d'Antonino).
  await firstWeek
    .getByRole("button", { name: /^Déplier la séance \d+ : Endurance rapide$/ })
    .click();
  await expect(
    firstWeek.getByText("Répéter 5 fois").filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(
    firstWeek.getByRole("link", { name: "Modifier la séance" }).filter({ visible: true }),
  ).toHaveAttribute("href", /\/programmes\/.+(\/seances\/|\?semaine=)/);
  await expect(page.getByRole("link", { name: "Ouvrir la page de la séance" })).toHaveCount(0);

  // Sans programme (Julien, en pause), l'onglet Agenda montre ce qui a un jour, en trois vues.
  await page.goto(`/coach/o/${ORG_A}/sportifs/${JULIEN}?onglet=agenda&vue=mois&date=2026-12-01`);
  const agenda = page.getByRole("region", { name: "Agenda de Julien" });
  await expect(
    agenda.getByRole("navigation", { name: "Vue de l'agenda du sportif" }).getByRole("link"),
  ).toHaveText(["Aujourd'hui", "Semaine", "Mois"]);
  await agenda.getByRole("link", { name: /^Dimanche 20 décembre/ }).click();
  await expect(page).toHaveURL(/vue=jour&date=2026-12-20/);
  await expect(agenda.getByText("Rien de prévu pour Julien ce jour-là.")).toBeVisible();
});

test("l'onglet Historique montre 6 événements, puis tout l'historique, puis se réduit", async ({
  page,
}) => {
  // Maquette « Sportifs », page 2k : « Voir tout l'historique (n) » / « Réduire ». Lecture seule.
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  await page.goto(`/coach/o/${ORG_A}/sportifs/${INES}?onglet=historique`);
  const history = page.getByRole("list", { name: "Historique de la fiche" });
  await expect(history.getByRole("listitem")).toHaveCount(6);

  const more = page.getByRole("button", { name: /^Voir tout l’historique \(\d+\)$/ });
  await expect(more).toHaveAttribute("aria-expanded", "false");
  const total = Number((await more.textContent())?.match(/\((\d+)\)/)?.[1]);
  expect(total).toBeGreaterThan(6);
  await more.click();
  await expect(history.getByRole("listitem")).toHaveCount(total);

  const less = page.getByRole("button", { name: "Réduire" });
  await expect(less).toHaveAttribute("aria-expanded", "true");
  await less.click();
  await expect(history.getByRole("listitem")).toHaveCount(6);
});
