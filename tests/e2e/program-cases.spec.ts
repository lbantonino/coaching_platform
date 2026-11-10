import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

// Cas de test des maquettes « Programmes » (handoff 14_QA/TEST_CASES.md), phase 4 du 10/11/2026.
// Chaque test porte le numéro du cas. Les autres cas : TC-02, TC-10 et TC-11 dans
// program-editor.spec.ts (avec la création depuis un modèle) ; TC-06, TC-07, TC-13 et TC-16 dans le
// parcours « depuis la fiche du sportif » du même fichier ; TC-08 et TC-12 en tests unitaires
// (scheduling, hyrox-edit) ; TC-17 dans pdf-render.test.ts et program-pdf.spec.ts.
// Décision d'Antonino du 10/11 pour TC-01 : « Partir de zéro » crée les semaines SANS séance (le coach
// les ajoute) ; le cas attend donc 12 semaines vides, pas 48 séances vides.

const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Modèle Coory « Premier 10 km · 8 semaines » (graine de développement).
const COORY_TEMPLATE = "7a000000-0000-4000-8000-000000000002";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

const uniqueSuffix = (project: string) =>
  `${project}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// TC-18 : aucune séance n'est dessinée en graphique (pas de canvas, aucune image vectorielle plus
// grande qu'une icône).
async function expectNoChart(page: Page) {
  await expect(page.locator("main canvas")).toHaveCount(0);
  const big = await page.locator("main svg").evaluateAll(
    (nodes) =>
      nodes.filter((node) => {
        const box = node.getBoundingClientRect();
        return box.width > 48 || box.height > 48;
      }).length,
  );
  expect(big).toBe(0);
}

test("TC-01, TC-14, TC-05, TC-04 : de zéro, publication bloquée, phases, modèle, archives", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const suffix = uniqueSuffix(testInfo.project.name);
  const athlete = `Zéro ${suffix}`;
  const title = `De zéro ${suffix}`;

  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();
  const athleteId = new URL(page.url()).pathname.split("/").pop() ?? "";

  // TC-01 : 12 semaines, 4 séances par semaine, « Partir de zéro ».
  await page.goto(`/coach/o/${ORG}/programmes/nouveau?sportif=${athleteId}`);
  await page.getByLabel("Titre du programme").fill(title);
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("radio", { name: "Running", exact: true }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText("Partir de zéro").filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Brouillon créé.")).toBeVisible();
  await expect(
    page.getByText("Brouillon", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  const programUrl = page.url();

  if (phone) {
    // Téléphone : 12 semaines vides, et « + Semaine », « + Phase » sous la liste (phase 4).
    await expect(page.getByRole("button", { name: /^Semaine \d+ / })).toHaveCount(12);
    await expect(
      page.getByText("Aucune séance", { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Semaine", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Phase", exact: true })).toBeVisible();
    return;
  }

  const weeks = page.getByRole("navigation", { name: "Semaines" });
  await expect(weeks.getByRole("button", { name: /^Semaine \d+/ })).toHaveCount(12);
  await expect(page.getByText("Aucune séance cette semaine.")).toBeVisible();

  // TC-14 : sans séance, la publication est bloquée.
  await page.getByRole("button", { name: "Publier" }).first().click();
  const publish = page.getByRole("dialog", { name: /^Publier le programme/ });
  await expect(publish.getByRole("button", { name: "Publier la version 1" })).toBeDisabled();
  await page.keyboard.press("Escape");

  // TC-05 : une phase S5–9, renommée puis retirée ; les 12 semaines restent.
  await weeks.getByRole("button", { name: "Phase", exact: true }).click();
  await expect(weeks.getByText("Base · S1–12")).toBeVisible();
  await page.getByRole("button", { name: "Plus d'actions sur la phase Base" }).click();
  await page.getByRole("menuitem", { name: "Modifier les semaines" }).click();
  const range = page.getByRole("dialog", { name: "Semaines de la phase Base" });
  await range.getByRole("combobox", { name: "Première semaine" }).selectOption("5");
  await range.getByRole("combobox", { name: "Dernière semaine" }).selectOption("9");
  await range.getByRole("button", { name: "Enregistrer" }).click();
  await expect(weeks.getByText("Base · S5–9")).toBeVisible();
  await page.getByRole("button", { name: "Plus d'actions sur la phase Base" }).click();
  await page.getByRole("menuitem", { name: "Renommer la phase" }).click();
  await page.getByRole("textbox", { name: "Nom de la phase" }).fill("Bloc 2");
  await page.getByRole("button", { name: "Renommer" }).click();
  await expect(weeks.getByText("Bloc 2 · S5–9")).toBeVisible();
  await page.getByRole("button", { name: "Plus d'actions sur la phase Bloc 2" }).click();
  await page.getByRole("menuitem", { name: "Retirer la phase" }).click();
  await page
    .getByRole("dialog", { name: "Retirer la phase « Bloc 2 » ?" })
    .getByRole("button", { name: "Retirer la phase" })
    .click();
  await expect(weeks.getByText(/Bloc 2 · S/)).toHaveCount(0);
  await expect(weeks.getByRole("button", { name: /^Semaine \d+/ })).toHaveCount(12);

  // TC-04 : « Enregistrer comme modèle » : il arrive dans Mes modèles, sans sportif ni dates.
  const templateName = `Modèle ${suffix}`;
  await page.getByRole("button", { name: "Plus d'actions sur le programme" }).first().click();
  await page.getByRole("menuitem", { name: "Enregistrer comme modèle" }).click();
  await page.getByRole("textbox", { name: "Nom du modèle" }).fill(templateName);
  await page.getByRole("button", { name: "Enregistrer le modèle" }).click();
  await expect(page.getByText("Modèle enregistré dans Mes modèles.")).toBeVisible();
  await page.goto(
    `/coach/o/${ORG}/programmes?onglet=modeles&source=mes-modeles&q=${encodeURIComponent(templateName)}`,
  );
  await page.getByRole("link", { name: templateName }).click();
  await expect(page.getByText(/Mes modèles · sans sportif ni dates/)).toBeVisible();
  // Le modèle d'essai repart aux archives (la liste du coach reste propre).
  await page.getByRole("button", { name: "Plus d'actions sur le modèle" }).first().click();
  await page.getByRole("menuitem", { name: "Archiver le modèle" }).click();
  await page.getByRole("button", { name: "Archiver", exact: true }).click();
  await expect(page).toHaveURL(/onglet=modeles/);

  // Archives (décision d'Antonino du 10/11) : le programme archivé se retrouve et se désarchive.
  await page.goto(programUrl);
  await page.getByRole("button", { name: "Plus d'actions sur le programme" }).first().click();
  await page.getByRole("menuitem", { name: "Archiver" }).click();
  await page.getByRole("button", { name: "Archiver", exact: true }).click();
  await expect(page.getByText("Programme archivé.")).toBeVisible();
  await page.goto(`/coach/o/${ORG}/programmes?statut=archives&q=${encodeURIComponent(title)}`);
  await expect(page.getByText("Archivé", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Désarchiver" }).filter({ visible: true }).click();
  await expect(page.getByText("Programme désarchivé : il redevient un brouillon.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publier" }).first()).toBeVisible();
});

test("TC-03, TC-18 : un modèle Coory se lit, se duplique, et ses séances se modifient dans la copie", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "telephone", "Parcours vérifié sur ordinateur.");
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes/modeles/${COORY_TEMPLATE}`);
  await expect(page.getByText("Lecture seule").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Ajouter une séance" })).toHaveCount(0);
  await expectNoChart(page);

  await page.getByRole("button", { name: "Dupliquer dans Mes modèles" }).first().click();
  await expect(page.getByText("Modèle dupliqué dans Mes modèles.")).toBeVisible();
  await expect(page).not.toHaveURL(new RegExp(COORY_TEMPLATE));
  await expect(page.getByText("Mes modèles", { exact: true }).first()).toBeVisible();

  // EDT-F09 (phase 4) : la séance d'un modèle « Mes modèles » s'ouvre dans l'éditeur de séance.
  await page.getByRole("button", { name: "Modifier la séance" }).click();
  await expect(page).toHaveURL(/\/modeles\/[0-9a-f-]{36}\/seances\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Endurance", level: 2 })).toBeVisible();
  await expectNoChart(page);
  await page.getByRole("textbox", { name: "Durée de l'étape" }).fill("12");
  await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page).toHaveURL(/\/modeles\/[0-9a-f-]{36}\?semaine=1&seance=/);
  await expect(
    page
      .getByText(/12 min/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  // La copie d'essai repart aux archives.
  await page.getByRole("button", { name: "Plus d'actions sur le modèle" }).first().click();
  await page.getByRole("menuitem", { name: "Archiver le modèle" }).click();
  await page.getByRole("button", { name: "Archiver", exact: true }).click();
  await expect(page).toHaveURL(/onglet=modeles/);
});

test("TC-15 : une recherche sans résultat, puis « Effacer la recherche et les filtres »", async ({
  page,
}) => {
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes?q=zzzz-introuvable&discipline=running`);
  await expect(page.getByRole("heading", { name: "Aucun programme trouvé" })).toBeVisible();
  await page.getByRole("link", { name: "Effacer la recherche et les filtres" }).click();
  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG}/programmes$`));
  await expect(page.getByRole("heading", { name: "Aucun programme trouvé" })).toHaveCount(0);
  // Le champ de recherche se vide avec l'adresse (PRG-F05).
  await expect(
    page.getByRole("searchbox", { name: "Rechercher un programme" }).filter({ visible: true }),
  ).toHaveValue("");
});

test.fixme("TC-09 : le sportif autorisé déplace une séance à jour fixe dans sa semaine", async () => {
  // Attend l'espace du sportif (roadmap P6) : l'autorisation est déjà enregistrée par séance
  // (athleteCanMove, C-14), le déplacement et la notification du coach viendront avec lui.
});
