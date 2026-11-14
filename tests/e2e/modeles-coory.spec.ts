import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

// Modèles Coory (D-177, liste validée par Antonino le 14/11/2026) : les 11 modèles de programme
// s'affichent dans l'onglet Modèles dans l'ordre de la liste ; un modèle s'ouvre pour voir son
// contenu. « Utiliser » en direct (D-178) : la fenêtre « Utiliser ce modèle » s'ouvre par-dessus le
// modèle, on choisit le sportif (titre et début déjà remplis) et le brouillon s'ouvre.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
const TEN_K = "7a000000-0000-4000-8000-000000000002";
const HYBRID_2 = "7a000000-0000-4000-8000-000000000110";
const HYBRID_3 = "7a000000-0000-4000-8000-000000000111";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

const useCard = (page: Page, title: string) =>
  page
    .locator("main article")
    .filter({ hasText: title })
    .getByRole("link", { name: "Utiliser" })
    .click();

// Prénoms des sportifs de test : jamais un mot de libellé (« Discipline… » faisait échouer un autre
// parcours, qui cherche le champ « Discipline » pendant que celui-ci tourne en parallèle).
test("D-177, D-178 : modèles dans l'ordre, « Utiliser » en direct pour un sportif", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const athlete = `Lina ${suffix}`;

  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();

  // L'onglet Modèles : les modèles de programme Coory d'abord, dans l'ordre de la liste validée.
  await page.goto(`/coach/o/${ORG}/programmes?onglet=modeles`);
  const titles = page.locator("main article h2");
  await expect(titles.first()).toHaveText("Réussir son 5 km");
  expect((await titles.allTextContents()).slice(0, 11)).toEqual([
    "Réussir son 5 km",
    "Préparation 10 km",
    "Préparation semi-marathon",
    "Préparation marathon",
    "Améliorer son seuil",
    "Améliorer sa vitesse (VMA)",
    "Développer sa force",
    "Renforcement musculaire et hypertrophie",
    "Préparation Hyrox (toutes catégories)",
    "Hybride : 2 running + 2 musculation",
    "Hybride : 3 running + 2 musculation",
  ]);
  await expect(
    page.locator("main article").filter({ hasText: "Hybride : 3 running + 2 musculation" }),
  ).toContainText("8 sem. · 5 séances / sem.");

  // Ouvrir le modèle : son contenu, en lecture (course et musculation la même semaine).
  await page.getByRole("link", { name: "Hybride : 3 running + 2 musculation" }).click();
  await expect(page).toHaveURL(new RegExp(`/programmes/modeles/${HYBRID_3}$`));
  await expect(
    page.getByText("Force · Full body A").filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Sortie longue").filter({ visible: true }).first()).toBeVisible();

  // « Utiliser » : la fenêtre s'ouvre par-dessus le modèle, le titre est celui du modèle ; on choisit
  // le sportif et le brouillon s'ouvre, sans passer par l'assistant.
  await page.getByRole("button", { name: "Utiliser" }).filter({ visible: true }).first().click();
  const sheet = page.getByRole("dialog", { name: "Utiliser ce modèle" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByLabel("Titre du programme")).toHaveValue(
    "Hybride : 3 running + 2 musculation",
  );
  await expect(sheet.getByRole("button", { name: "Créer le programme" })).toBeDisabled();
  await sheet.getByPlaceholder("Rechercher un sportif").fill(athlete);
  await sheet.getByText(athlete, { exact: true }).click();
  await sheet.getByRole("button", { name: "Créer le programme" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);

  // Le brouillon a les 8 semaines du modèle (téléphone : la liste des semaines ; ordinateur : la
  // colonne des semaines) et ses séances de course et de musculation.
  const weeks =
    testInfo.project.name === "telephone"
      ? page.getByRole("option", { name: /^Semaine \d+ ·/ })
      : page
          .getByRole("navigation", { name: "Semaines" })
          .getByRole("button", { name: /^Semaine \d+/ });
  await expect(weeks).toHaveCount(8);
  await expect(
    page.getByText("Force · Full body B").filter({ visible: true }).first(),
  ).toBeVisible();
});

test("D-178 : « Utiliser » depuis la carte, puis l'assistant complet qui repart de zéro à chaque modèle", async ({
  page,
}) => {
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes?onglet=modeles`);

  // Un modèle hybride : la carte ouvre la fenêtre sur la page du modèle ; « Plus d'options » mène à
  // l'assistant, rempli d'après le modèle.
  // La page laissée (Next 16 la garde cachée) reste dans le document : on ne vise que le visible.
  await useCard(page, "Hybride : 2 running + 2 musculation");
  await expect(page).toHaveURL(new RegExp(`/programmes/modeles/${HYBRID_2}\\?utiliser=1$`));
  await page
    .getByRole("dialog", { name: "Utiliser ce modèle" })
    .getByRole("link", { name: "Plus d'options" })
    .click();
  await expect(page).toHaveURL(new RegExp(`/programmes/nouveau\\?modele=${HYBRID_2}$`));
  await expect(page.getByLabel("Titre du programme").filter({ visible: true })).toHaveValue(
    "Hybride : 2 running + 2 musculation",
  );
  await page.getByPlaceholder("Rechercher un sportif").filter({ visible: true }).fill("Lucas");
  await page.getByText("Lucas Janssens", { exact: true }).filter({ visible: true }).first().click();
  await page.getByRole("button", { name: "Continuer" }).filter({ visible: true }).click();
  await expect(
    page.getByRole("radio", { name: "Hybride", exact: true }).filter({ visible: true }),
  ).toBeChecked();

  // Retour aux modèles, puis le 10 km : l'assistant repart de l'étape 1, avec le nom du 10 km, et
  // reste un programme Running même pour un sportif « hybride » (le modèle passe avant).
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/onglet=modeles/);
  await useCard(page, "Préparation 10 km");
  await expect(page).toHaveURL(new RegExp(`/programmes/modeles/${TEN_K}\\?utiliser=1$`));
  const sheet = page.getByRole("dialog", { name: "Utiliser ce modèle" });
  await expect(sheet.getByLabel("Titre du programme")).toHaveValue("Préparation 10 km");
  await sheet.getByRole("link", { name: "Plus d'options" }).click();
  await expect(page).toHaveURL(new RegExp(`/programmes/nouveau\\?modele=${TEN_K}$`));
  await expect(page.getByRole("heading", { name: "Pour qui est ce programme ?" })).toBeVisible();
  await expect(page.getByLabel("Titre du programme").filter({ visible: true })).toHaveValue(
    "Préparation 10 km",
  );
  await page.getByPlaceholder("Rechercher un sportif").filter({ visible: true }).fill("Lucas");
  await page.getByText("Lucas Janssens", { exact: true }).filter({ visible: true }).first().click();
  await page.getByRole("button", { name: "Continuer" }).filter({ visible: true }).click();
  await expect(
    page.getByRole("radio", { name: "Running", exact: true }).filter({ visible: true }),
  ).toBeChecked();
});

test("D-178 : choisir un sportif en bas de la liste ne fait pas remonter la fenêtre", async ({
  page,
}) => {
  await login(page);
  await page.goto(
    `/coach/o/${ORG}/programmes/modeles/7a000000-0000-4000-8000-000000000106?utiliser=1`,
  );
  const sheet = page.getByRole("dialog", { name: "Utiliser ce modèle" });
  await expect(sheet).toBeVisible();
  // Le dernier sportif de la liste, sans recherche : la liste défile, jamais la fenêtre entière.
  await sheet.getByRole("radio").last().locator("..").click();
  await expect(sheet.getByRole("button", { name: "Créer le programme" })).toBeEnabled();
  await expect.poll(() => sheet.evaluate((dialog) => dialog.scrollTop)).toBe(0);
  await expect(sheet.getByRole("heading", { name: "Utiliser ce modèle" })).toBeInViewport();
});

// D-179 (demande d'Antonino du 14/11) : dans un programme parti d'un modèle, renommer une étape de
// course et un exercice de musculation ; les nouveaux noms restent après l'enregistrement.
test("D-179 : renommer une étape de course et un exercice", async ({ page }, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const athlete = `Rémi ${suffix}`;
  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();

  await page.goto(`/coach/o/${ORG}/programmes/modeles/${HYBRID_2}?utiliser=1`);
  const sheet = page.getByRole("dialog", { name: "Utiliser ce modèle" });
  await sheet.getByPlaceholder("Rechercher un sportif").fill(athlete);
  await sheet.getByText(athlete, { exact: true }).click();
  await sheet.getByRole("button", { name: "Créer le programme" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);
  const programUrl = page.url();

  const openSession = async (title: string) => {
    // Téléphone : depuis la liste des semaines, on ouvre la semaine 1 (après « Terminer », la page
    // revient déjà sur elle : ?semaine=1).
    if (phone && !page.url().includes("semaine=")) {
      await page.getByRole("button", { name: /^Semaine 1 \d/ }).click();
    }
    await page
      .getByRole("button", { name: new RegExp(`^${title}`) })
      .filter({ visible: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Modifier la séance" })
      .filter({ visible: true })
      .click();
    await expect(page.getByRole("heading", { name: title, level: 2 })).toBeVisible();
  };
  const finish = async () => {
    if (phone) {
      await page.getByRole("button", { name: "Semaine 1", exact: true }).click();
    } else {
      await expect(
        page.getByText("Enregistré", { exact: true }).filter({ visible: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Terminer" }).click();
    }
    await expect(page).toHaveURL(/\?semaine=1&seance=/);
  };

  // Running : l'étape « Endurance » devient « Footing facile ».
  await openSession("Endurance");
  if (phone)
    await page
      .getByRole("button", { name: /^Endurance/ })
      .first()
      .click();
  const stepName = page.getByRole("textbox", { name: "Nom de l'étape" }).filter({ visible: true });
  await expect(stepName).toHaveValue("Endurance");
  await stepName.fill("Footing facile");
  if (phone) await page.getByRole("button", { name: "Valider l'étape" }).click();
  await expect(
    page
      .getByRole("button", { name: /^Footing facile/ })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await finish();

  // Musculation : « Back squat » devient « Squat arrière ».
  await openSession("Force · Full body A");
  if (phone)
    await page
      .getByRole("button", { name: /^Back squat/ })
      .first()
      .click();
  const exerciseName = page
    .getByRole("textbox", { name: "Nom de l'exercice" })
    .filter({ visible: true });
  await expect(exerciseName).toHaveValue("Back squat");
  await exerciseName.fill("Squat arrière");
  if (phone) await page.getByRole("button", { name: "Valider l'exercice" }).click();
  await expect(
    page
      .getByRole("button", { name: /^Squat arrière/ })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await finish();

  // Enregistré dans le brouillon : rouvertes depuis la page du programme, les séances gardent les noms.
  await page.goto(programUrl);
  await openSession("Endurance");
  await expect(
    page
      .getByRole("button", { name: /^Footing facile/ })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await page.goto(programUrl);
  await openSession("Force · Full body A");
  await expect(
    page
      .getByRole("button", { name: /^Squat arrière/ })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
});

// D-180 (demande d'Antonino du 14/11) : un même programme change d'objectif dans l'année (marathon,
// force, Hyrox) ; le coach en change la discipline depuis le menu « ··· », et le retrouve sous le
// bon filtre de la page Programmes.
test("D-180 : changer la discipline d'un programme", async ({ page }, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const athlete = `Nora ${suffix}`;
  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();

  await page.goto(`/coach/o/${ORG}/programmes/modeles/${TEN_K}?utiliser=1`);
  const use = page.getByRole("dialog", { name: "Utiliser ce modèle" });
  await use.getByPlaceholder("Rechercher un sportif").fill(athlete);
  await use.getByText(athlete, { exact: true }).click();
  await use.getByLabel("Titre du programme").fill(athlete);
  await use.getByRole("button", { name: "Créer le programme" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);

  const openSheet = async () => {
    await page
      .getByRole("button", { name: "Plus d'actions sur le programme" })
      .filter({ visible: true })
      .first()
      .click();
    // Ordinateur : un menu ; téléphone : une feuille de boutons.
    await page
      .getByRole("menuitem", { name: "Changer la discipline" })
      .or(page.getByRole("button", { name: "Changer la discipline" }))
      .first()
      .click();
    return page.getByRole("dialog", { name: "Changer la discipline" });
  };
  let sheet = await openSheet();
  await expect(sheet.getByRole("radio", { name: "Running" })).toBeChecked();
  await sheet.getByText("Hybride", { exact: true }).click();
  await sheet.getByRole("button", { name: "Changer" }).click();
  await expect(sheet).toBeHidden();
  await expect(
    page.getByText("Enregistré", { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();

  // Rouverte, la fenêtre part de la discipline actuelle.
  sheet = await openSheet();
  await expect(sheet.getByRole("radio", { name: "Hybride" })).toBeChecked();
  await sheet.getByRole("button", { name: "Fermer" }).click();

  // La page Programmes, filtrée sur Hybride, montre le programme.
  await page.goto(`/coach/o/${ORG}/programmes?discipline=hybride`);
  await expect(page.getByRole("link", { name: athlete }).first()).toBeVisible();
});
