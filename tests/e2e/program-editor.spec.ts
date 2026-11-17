import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

// Éditeur de programmes (phase 3b, D-157) : l'assistant crée un brouillon depuis un modèle Coory, le
// brouillon s'ouvre dans l'éditeur, une séance Running se modifie, « Terminer » revient au programme.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Modèle Coory « Préparation 10 km » (graine de développement).
const TEMPLATE = "7a000000-0000-4000-8000-000000000002";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("TC-02, TC-10 : brouillon depuis un modèle Coory, séance Running modifiée, modèle intact", async ({
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
  // Téléphone : la page ouvre sur la semaine 1 (D-187) ; sa séance s'ouvre depuis sa carte.
  if (phone) await page.getByRole("button", { name: "Endurance", exact: true }).click();
  await page.getByRole("button", { name: "Modifier la séance" }).click();
  await expect(page).toHaveURL(/\/seances\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Endurance", level: 2 })).toBeVisible();

  // La première étape (30 min) passe à 12 min ; sur téléphone, elle s'ouvre dans une feuille.
  // (Éditeur en cartes, 17/11 : la carte s'appelle d'abord par son titre, « Course ».)
  if (phone)
    await page
      .getByRole("button", { name: /^Course.*30 min/ })
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

  // TC-10 : en zone de FC sans FC max (sportif neuf), pas de calcul : la plage s'écrit à la main et
  // reste avec la zone quand on en change (elle partait sans les bpm avant la phase 4).
  if (phone) await stepPanel.getByRole("radio", { name: "Zone de FC" }).dispatchEvent("click");
  else
    await stepPanel
      .getByRole("group", { name: "Cible de l'étape" })
      .filter({ visible: true })
      .getByText("Zone de FC", { exact: true })
      .click();
  const zones = stepPanel
    .getByRole("group", { name: "Zone de fréquence cardiaque" })
    .filter({ visible: true });
  const pick = (zone: string) =>
    phone
      ? zones.getByRole("radio", { name: zone }).dispatchEvent("click")
      : zones.getByText(zone, { exact: true }).click();
  await pick("Z4");
  const low = stepPanel
    .getByRole("textbox", { name: "FC la plus basse" })
    .filter({ visible: true });
  const high = stepPanel
    .getByRole("textbox", { name: "FC la plus haute" })
    .filter({ visible: true });
  await expect(low).toHaveValue("");
  await expect(stepPanel.getByText(/Pas de FC max pour/).filter({ visible: true })).toBeVisible();
  await low.fill("150");
  await high.fill("160");
  await pick("Z3");
  await expect(low).toHaveValue("150");
  await expect(high).toHaveValue("160");
  if (phone) await page.getByRole("button", { name: "Valider l'étape" }).click();
  // La carte de l'étape écrit comme la séance : « 12 min · zone 3 · 150–160 bpm » (le tiret est collé
  // à ses nombres par des caractères invisibles, glue()).
  await expect(
    page
      .getByRole("button", { name: /^Course.*12 min · zone 3 · 150\u2060?–\u2060?160 bpm/ })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  if (phone) {
    await page.getByRole("button", { name: "Semaine 1", exact: true }).click();
  } else {
    await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Terminer" }).click();
  }
  // Téléphone : « ← Semaine 1 » remonte jusqu'à la semaine (geste de retour cohérent, 17/11) ;
  // ordinateur : « Terminer » rouvre la semaine et la séance.
  await expect(page).toHaveURL(phone ? /\/[0-9a-f-]{36}(\?semaine=1)?$/ : /\?semaine=1&seance=/);
  // De retour, une nouvelle séance s'ajoute : l'éditeur repart du brouillon à jour (bug du 10/11 :
  // l'ancien état réaffiché enregistrait en conflit, puis « Page introuvable »). Toutes les
  // disciplines sont proposées (D-163) : une séance de musculation dans ce programme running (le modèle
  // 10 km a 4 séances par semaine depuis D-165, la nouvelle est la 5e).
  await page.getByRole("button", { name: "Ajouter une séance" }).click();
  const choice = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(choice.getByRole("button", { name: /^Running/ })).toBeVisible();
  await expect(choice.getByRole("button", { name: /^Hyrox/ })).toBeVisible();
  await choice.getByRole("button", { name: /^Musculation/ }).click();
  await expect(page).toHaveURL(/\/seances\/[^/]+$/);
  await expect(
    page
      .getByText(/Musculation · Séance 5 · Semaine 1/i)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  // La modification est enregistrée dans le brouillon : la séance l'affiche au retour.
  await page.goto(programUrl);
  await expect(
    page
      .getByText(/12 min/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  // TC-02 : le modèle Coory n'a pas changé (sa première séance garde ses 30 min).
  if (phone) return;
  await page.goto(`/coach/o/${ORG}/programmes/modeles/${TEMPLATE}?semaine=1`);
  const detail = page.getByRole("complementary", { name: "Séance choisie" });
  await expect(detail.getByText(/30 min/).first()).toBeVisible();
  await expect(detail.getByText(/12 min/)).toHaveCount(0);
});

// Modèle « Bloc force 4 semaines » (Mes modèles du coach A, graine de développement).
const STRENGTH_TEMPLATE = "7a000000-0000-4000-8000-000000000011";

test("TC-11 : séries en saisie rapide, et % du max sans max connu", async ({ page }, testInfo) => {
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

  if (phone) await page.getByRole("button", { name: "Force A", exact: true }).click();
  await page.getByRole("button", { name: "Modifier la séance" }).click();
  await expect(page.getByRole("heading", { name: "Force A", level: 2 })).toBeVisible();

  // Premier exercice : « 5 x 3 » remplit cinq séries de 3 répétitions.
  if (phone) await page.getByRole("button", { name: /^Soulevé de terre barre/ }).click();
  await page.getByRole("textbox", { name: "Saisie rapide" }).fill("5 x 3");
  await page.getByRole("button", { name: "Remplir" }).click();
  await expect(page.getByRole("textbox", { name: "Répétitions de la série 5" })).toHaveValue("3");
  // TC-11 : en % du max, sans max connu pour ce sportif neuf : le % seul et un avertissement.
  const load = page.getByRole("group", { name: "Charge de l'exercice" }).filter({ visible: true });
  if (phone) await load.getByRole("radio", { name: "% du max" }).dispatchEvent("click");
  else await load.getByText("% du max", { exact: true }).click();
  await expect(
    page.getByText(/^Pas de max pour .+ les kg ne sont pas calculés/).filter({ visible: true }),
  ).toBeVisible();
  if (phone) await page.getByRole("button", { name: "Valider l'exercice" }).click();
  // La carte de l'exercice (éditeur en cartes, 17/11) : « 5 séries », « 3 répétitions · 70 % du max ».
  const deadlift = page
    .getByRole("button", { name: /^Soulevé de terre barre/ })
    .filter({ visible: true })
    .first();
  await expect(deadlift).toContainText("5 séries");
  await expect(deadlift).toContainText(/3 répétitions · \d+ % du max/);

  // D-166 (demande d'Antonino du 13/11) : un exercice tenu se compte en secondes. « Mesure :
  // Secondes », puis « 3 séries de 45 s » ; le % du max disparaît (un temps se met en kg).
  if (phone) await page.getByRole("button", { name: /^Soulevé de terre barre/ }).click();
  const measure = page
    .getByRole("group", { name: "Mesure de l'exercice" })
    .filter({ visible: true });
  if (phone) await measure.getByRole("radio", { name: "Secondes" }).dispatchEvent("click");
  else await measure.getByText("Secondes", { exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Charge de l'exercice" }).filter({ visible: true }),
  ).toHaveCount(0);
  await page.getByRole("textbox", { name: "Saisie rapide" }).fill("3 séries de 45 s");
  await page.getByRole("button", { name: "Remplir" }).click();
  await expect(page.getByRole("textbox", { name: "Secondes de la série 3" })).toHaveValue("45");
  if (phone) await page.getByRole("button", { name: "Valider l'exercice" }).click();
  await expect(deadlift).toContainText("3 séries");
  await expect(deadlift).toContainText("45 s");

  // Éditeur en cartes (décisions d'Antonino du 17/11) : plus de colonne RIR ; l'échauffement est une
  // carte de la liste, son texte s'ouvre dans le panneau (la feuille sur téléphone).
  await expect(page.getByText("RIR", { exact: true }).filter({ visible: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: /^Échauffement/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByLabel("Ce que fait le sportif").filter({ visible: true })).toBeVisible();
});

// D-164 (demande d'Antonino du 11/11) : plus de 7 séances par semaine. « 8+ » ouvre un compteur de 8 à
// 14 ; l'aperçu suit. Lecture seule : l'assistant n'est pas validé (aucun modèle de test créé).
test("assistant : « 8+ » séances par semaine, jusqu'à 14", async ({ page }) => {
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes/nouveau?modele=nouveau`);
  await page.getByLabel("Nom du modèle").fill("Doubles séances");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByText("Running", { exact: true }).first().click();
  await page.getByRole("button", { name: "Continuer" }).click();
  const perWeek = page.getByRole("group", { name: "Séances par semaine" });
  await perWeek.getByText("8+", { exact: true }).click();
  await expect(page.getByText("De 8 à 14")).toBeVisible();
  await page.getByRole("button", { name: "Une séance de plus" }).click();
  await expect(page.getByText(/certains jours auront plusieurs séances/)).toBeVisible();
  // 9 → 14 : cinq fois « + », puis le bouton se désactive.
  for (let i = 0; i < 5; i += 1) {
    await page.getByRole("button", { name: "Une séance de plus" }).click();
  }
  await expect(page.getByRole("button", { name: "Une séance de plus" })).toBeDisabled();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText(/× 14 séances/)).toBeVisible();
});

test("TC-06, TC-07, TC-13, TC-16 : depuis la fiche, jours fixes à la phase, publier, agenda", async ({
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

  // Onglet Programme vide : « Créer un programme » ouvre l'assistant dans la fiche (D-163), le
  // sportif fixé : ni liste ni recherche de sportifs, et le retour ramène chez lui.
  await page.goto(`${fiche}?onglet=programme`);
  // Aucun programme (15/11/2026 : d'anciens programmes s'afficheraient en cartes).
  await expect(page.getByRole("heading", { name: /^Aucun programme pour/ })).toBeVisible();
  await page.getByRole("link", { name: "Créer un programme" }).click();
  await expect(page).toHaveURL(/\/sportifs\/[0-9a-f-]{36}\/nouveau-programme$/);
  await expect(
    page.getByRole("heading", { name: /^Comment s'appelle le programme de/ }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Rechercher un sportif")).toHaveCount(0);
  if (!phone) {
    await expect(page.getByRole("link", { name: new RegExp(athlete) }).first()).toHaveAttribute(
      "href",
      `${fiche}?onglet=programme`,
    );
  }
  // Depuis un modèle : on repart de l'adresse avec le modèle Coory « Préparation 10 km ».
  await page.goto(`${page.url()}?modele=${TEMPLATE}`);
  await page.getByLabel("Titre du programme").fill(title);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);

  if (!phone) {
    // TC-06 : jours fixes, appliqués à la phase « Base » (semaines 1 à 3 du modèle).
    await page.getByText("Jours fixes", { exact: true }).filter({ visible: true }).click();
    await expect(page.getByRole("heading", { name: /^Fixer les jours/ })).toBeVisible();
    await page
      .getByRole("group", { name: "Appliquer à" })
      .getByText(/^Phase Base/)
      .click();
    await page.getByRole("button", { name: "Fixer les jours" }).click();
    await expect(
      page.getByText("Jours fixés ; les semaines passées n'ont pas changé."),
    ).toBeVisible();
    const weeks = page.getByRole("navigation", { name: "Semaines" });
    for (const index of [1, 2, 3])
      await expect(
        weeks
          .getByRole("button", { name: new RegExp(`^Semaine ${index}\\b`) })
          .locator('[aria-label="jours fixes"]'),
      ).toHaveCount(1);
    await expect(
      weeks.getByRole("button", { name: /^Semaine 4\b/ }).locator('[aria-label="jours fixes"]'),
    ).toHaveCount(0);

    // TC-07, D-164 : la séance 2 posée le jour de la séance 1 : c'est permis (jusqu'à 4 par jour),
    // le moment se choisit (le soir est proposé) et chaque séance du jour l'affiche.
    await page
      .getByRole("button", { name: /^Changer le jour de la séance/ })
      .nth(1)
      .click();
    const picker = page.getByRole("complementary", { name: "Jour de la séance" });
    await picker.getByRole("button", { name: /S1/ }).click();
    const moment = picker.getByRole("group", { name: "Moment de la séance" });
    await expect(moment.getByRole("radio", { name: "Soir" })).toBeChecked();
    await picker.getByRole("button", { name: "Valider" }).click();
    await expect(page.getByRole("complementary", { name: "Jour de la séance" })).toHaveCount(0);
    const weekColumn = page.getByRole("region", { name: /^Semaine \d+$/ }).first();
    await expect(weekColumn.getByText("Matin", { exact: true }).first()).toBeVisible();
    await expect(weekColumn.getByText("Soir", { exact: true }).first()).toBeVisible();
  }

  // Publier : la version 1, puis l'état « Publié v1 ».
  if (phone) await page.getByRole("button", { name: "Publier" }).click();
  else await page.getByRole("button", { name: "Publier" }).first().click();
  await expect(page.getByRole("heading", { name: "Publier le programme ?" })).toBeVisible();
  await page.getByRole("button", { name: "Publier la version 1" }).click();
  await expect(page.getByText("Programme publié (version 1).")).toBeVisible();

  // La fiche du sportif montre le programme publié : sa carte, la même que la page Programmes (15/11).
  await page.goto(`${fiche}?onglet=programme`);
  // (Il commence lundi prochain : sa pastille dit « À venir », comme sur la page Programmes.)
  const card = page.getByRole("article").filter({ hasText: title }).filter({ visible: true });
  await expect(card.getByRole("link", { name: title })).toBeVisible();
  await expect(card.getByText(/^(À venir|Publié v1)$/)).toBeVisible();
  if (phone) return;

  // Synchronisation (demande d'Antonino du 10/11) : une séance modifiée depuis l'AGENDA de la fiche (le
  // programme tel que le sportif le reçoit, 15/11) va dans le brouillon ; « Terminer » ramène à l'agenda,
  // à la même semaine, qui propose de publier ; une fois publié, l'agenda montre la nouvelle valeur.
  await page.goto(`${fiche}?onglet=agenda&semaine=1`);
  const week = page.getByRole("region", { name: "Semaine 1", exact: true });
  await week.getByRole("button", { name: /^Déplier la séance 1 : / }).click();
  await week.getByRole("link", { name: "Modifier la séance" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/seances\/[^/?]+\?retour=/);
  await page.getByRole("textbox", { name: "Durée de l'étape" }).fill("12");
  await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page).toHaveURL(/onglet=agenda&semaine=1/);
  await expect(page.getByText("Modifications non publiées.")).toBeVisible();
  await page.getByRole("button", { name: "Publier la version 2" }).click();
  await page
    .getByRole("dialog", { name: /^Publier le programme/ })
    .getByRole("button", { name: "Publier la version 2" })
    .click();
  await expect(page.getByText("Programme publié (version 2).")).toBeVisible();
  await expect(page.getByText("Modifications non publiées.")).toHaveCount(0);
  await week.getByRole("button", { name: /^(Déplier|Replier) la séance 1 : / }).click();
  await expect(
    week
      .getByText(/\b12 min\b/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  // TC-16 : dans l'agenda, déplier une séance puis une autre : une seule reste dépliée ; Échap referme.
  await page.goto(`${fiche}?onglet=agenda&vue=toutes`);
  const first = page.getByRole("button", { name: /^(Déplier|Replier) la séance 1 : / }).first();
  const second = page.getByRole("button", { name: /^(Déplier|Replier) la séance 2 : / }).first();
  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await second.click();
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  // Vue « Toutes les semaines » : la séance 1 de la semaine 2 ne s'ouvre pas en plus.
  await page
    .getByRole("button", { name: /^Déplier la séance 1 : / })
    .nth(1)
    .click();
  const opened = page.getByRole("button", { name: /^Replier la séance \d+ : / });
  await expect(opened).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(opened).toHaveCount(0);
});
