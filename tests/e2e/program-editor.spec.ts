import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

// Éditeur de programmes (phase 3b, D-157) : l'assistant crée un brouillon depuis un modèle Coory, le
// brouillon s'ouvre dans l'éditeur, une séance Running se modifie, « Terminer » revient au programme.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Modèle Coory « Premier 10 km · 8 semaines » (graine de développement).
const TEMPLATE = "7a000000-0000-4000-8000-000000000002";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach crée un brouillon depuis un modèle et modifie une séance Running", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const athlete = `Programme ${suffix}`;
  const title = `Premier 10 km ${suffix}`;

  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();
  const athleteId = new URL(page.url()).pathname.split("/").pop() ?? "";

  // L'assistant, ouvert depuis le modèle et pour ce sportif : 4 étapes.
  await page.goto(`/coach/o/${ORG}/programmes/nouveau?sportif=${athleteId}&modele=${TEMPLATE}`);
  await page.getByLabel("Titre du programme").fill(title);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);
  await expect(page.getByText(title).first()).toBeVisible();
  const programUrl = page.url();

  // L'éditeur : semaine 1, sa première séance (« Endurance »), puis l'éditeur de séance.
  if (phone) {
    await page.getByRole("button", { name: /^Semaine 1 / }).click();
    await page.getByRole("button", { name: "Endurance", exact: true }).click();
  }
  await page.getByRole("button", { name: "Modifier la séance" }).click();
  await expect(page).toHaveURL(/\/seances\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Endurance", level: 2 })).toBeVisible();

  // La première étape (30 min) passe à 12 min ; sur téléphone, elle s'ouvre dans une feuille.
  if (phone)
    await page
      .getByRole("button", { name: /30 min$/ })
      .first()
      .click();
  await page.getByRole("textbox", { name: "Durée de l'étape" }).fill("12");
  // Téléphone (demande du 10/11) : l'allure s'écrit sans « : » au pavé numérique, il se pose seul.
  // Sur téléphone, l'étape s'édite dans la feuille « Modifier l'étape » (le choix y est un bouton
  // radio caché sous son libellé, dans une feuille qui défile : on lui envoie le clic).
  const stepPanel = phone ? page.getByRole("dialog", { name: "Modifier l'étape" }) : page;
  if (phone) await stepPanel.getByRole("radio", { name: "Allure" }).dispatchEvent("click");
  else
    await stepPanel
      .getByRole("group", { name: "Cible de l'étape" })
      .filter({ visible: true })
      .getByText("Allure", { exact: true })
      .click();
  const fastest = stepPanel
    .getByRole("textbox", { name: "Allure la plus rapide" })
    .filter({ visible: true });
  await fastest.fill("");
  await fastest.pressSequentially("455");
  await expect(fastest).toHaveValue("4:55");
  if (phone) await page.getByRole("button", { name: "Valider l'étape" }).click();
  await expect(page.getByRole("button", { name: /12 min$/ }).first()).toBeVisible();

  if (phone) {
    await page.getByRole("button", { name: "Semaine 1", exact: true }).click();
  } else {
    await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Terminer" }).click();
  }
  await expect(page).toHaveURL(/\?semaine=1&seance=/);
  // De retour, une nouvelle séance s'ajoute : l'éditeur repart du brouillon à jour (bug du 10/11 :
  // l'ancien état réaffiché enregistrait en conflit, puis « Page introuvable »).
  await page.getByRole("button", { name: "Ajouter une séance" }).click();
  await expect(page).toHaveURL(/\/seances\/[^/]+$/);
  await expect(
    page
      .getByText(/Séance 4 · Semaine 1/i)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  // La modification est enregistrée dans le brouillon : la séance l'affiche au retour.
  await page.goto(programUrl);
  if (phone) await page.getByRole("button", { name: /^Semaine 1 / }).click();
  await expect(
    page
      .getByText(/12 min/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
});

// Modèle « Bloc force 4 semaines » (Mes modèles du coach A, graine de développement).
const STRENGTH_TEMPLATE = "7a000000-0000-4000-8000-000000000011";

test("le coach règle les séries d'un exercice avec la saisie rapide", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const athlete = `Force ${suffix}`;

  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();
  const athleteId = new URL(page.url()).pathname.split("/").pop() ?? "";

  await page.goto(
    `/coach/o/${ORG}/programmes/nouveau?sportif=${athleteId}&modele=${STRENGTH_TEMPLATE}`,
  );
  await page.getByLabel("Titre du programme").fill(`Bloc force ${suffix}`);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);

  if (phone) {
    await page.getByRole("button", { name: /^Semaine 1 / }).click();
    await page.getByRole("button", { name: "Force A", exact: true }).click();
  }
  await page.getByRole("button", { name: "Modifier la séance" }).click();
  await expect(page.getByRole("heading", { name: "Force A", level: 2 })).toBeVisible();

  // Premier exercice : « 5 x 3 » remplit cinq séries de 3 répétitions.
  if (phone) await page.getByRole("button", { name: /^Soulevé de terre barre/ }).click();
  await page.getByRole("textbox", { name: "Saisie rapide" }).fill("5 x 3");
  await page.getByRole("button", { name: "Remplir" }).click();
  await expect(page.getByRole("textbox", { name: "Répétitions de la série 5" })).toHaveValue("3");
  if (phone) await page.getByRole("button", { name: "Valider l'exercice" }).click();
  await expect(
    page
      .getByText(/^5 × 3/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
});

test("depuis la fiche du sportif : créer, fixer les jours, publier, retrouver le programme", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const athlete = `Publication ${suffix}`;
  const title = `Premier 10 km ${suffix}`;

  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();
  const fiche = new URL(page.url()).pathname;

  // Onglet Programme vide : « Créer un programme » ouvre l'assistant avec ce sportif déjà choisi.
  await page.goto(`${fiche}?onglet=programme`);
  await expect(page.getByRole("heading", { name: /^Aucun programme pour/ })).toBeVisible();
  await page.getByRole("link", { name: "Créer un programme" }).click();
  await expect(page).toHaveURL(/\/programmes\/nouveau\?sportif=/);
  // Depuis un modèle : on repart de l'adresse avec le modèle Coory « Premier 10 km ».
  await page.goto(`${page.url()}&modele=${TEMPLATE}`);
  await page.getByLabel("Titre du programme").fill(title);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);

  if (!phone) {
    // Jours fixes : Coory propose un jour par séance, le coach valide.
    await page.getByText("Jours fixes", { exact: true }).filter({ visible: true }).click();
    await expect(page.getByRole("heading", { name: /^Fixer les jours/ })).toBeVisible();
    await page.getByRole("button", { name: "Fixer les jours" }).click();
    await expect(page.getByText(/Jours fixés pour la semaine/)).toBeVisible();
  }

  // Publier : la version 1, puis l'état « Publié v1 ».
  if (phone) await page.getByRole("button", { name: "Publier" }).click();
  else await page.getByRole("button", { name: "Publier" }).first().click();
  await expect(page.getByRole("heading", { name: "Publier le programme ?" })).toBeVisible();
  await page.getByRole("button", { name: "Publier la version 1" }).click();
  await expect(page.getByText("Programme publié (version 1).")).toBeVisible();

  // La fiche du sportif montre le programme publié.
  await page.goto(`${fiche}?onglet=programme`);
  await expect(page.getByText(title).filter({ visible: true }).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ouvrir l'éditeur" }).filter({ visible: true }),
  ).toBeVisible();
  if (phone) return;

  // Synchronisation (demande d'Antonino du 10/11) : une séance modifiée depuis la fiche va dans le
  // brouillon ; « Terminer » ramène à la fiche, qui propose de publier ; une fois publié, la fiche
  // montre la nouvelle valeur.
  const week = page.getByRole("region", { name: /Semaine/ });
  await week.locator("button[aria-pressed]").first().click();
  await page.getByRole("link", { name: "Modifier la séance" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/seances\/[^/?]+\?retour=/);
  await page.getByRole("textbox", { name: "Durée de l'étape" }).fill("12");
  await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page).toHaveURL(/onglet=programme/);
  await expect(page.getByText("Modifications non publiées.")).toBeVisible();
  await page.getByRole("button", { name: "Publier la version 2" }).click();
  await page
    .getByRole("dialog", { name: /^Publier le programme/ })
    .getByRole("button", { name: "Publier la version 2" })
    .click();
  await expect(page.getByText("Programme publié (version 2).")).toBeVisible();
  await expect(page.getByText("Modifications non publiées.")).toHaveCount(0);
  await expect(
    page
      .getByText(/Publié v2/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await week.locator("button[aria-pressed]").first().click();
  await expect(
    page
      .getByRole("region", { name: /^Détail de la séance/ })
      .getByText("12 min", { exact: true })
      .first(),
  ).toBeVisible();
});
