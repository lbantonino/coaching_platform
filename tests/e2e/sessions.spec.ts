import { expect, test, type Locator, type Page } from "@playwright/test";

// Séances encadrées du coach (P2-05b, D-27, D-35) : collective hebdomadaire avec inscrits,
// individuelle, nouveau sportif (fiche minimale), fenêtre « Nouvelle séance » commune, page Séances,
// modification, suppression, isolation. Dates fixées en 2027 : le test ne dépend pas du jour où il tourne.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const ORG_B = "0b000000-0000-4000-8000-0000000000b1";
const SESSION_OF_B = "cb000000-0000-4000-8000-000000000001";

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

async function fillSchedule(scope: Locator, date: string, time: string, minutes: string) {
  await scope.getByLabel(/Première séance|^Date$/).fill(date);
  await scope.getByLabel("Heure", { exact: true }).fill(time);
  await scope.getByLabel("Durée (min)").fill(minutes);
}

// « Nouvelle séance » ouvre la même fenêtre sur toutes les pages (D-35), sans changer de page.
async function openNewSession(page: Page) {
  await page.getByRole("button", { name: "Nouvelle séance" }).click();
  const dialog = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(dialog.getByLabel("Titre")).toBeVisible();
  return dialog;
}

async function deleteOpenSession(page: Page, title: string) {
  await page.getByRole("button", { name: "Plus d'actions" }).click();
  await page
    .getByRole("dialog", { name: title })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page
    .getByRole("dialog", { name: "Supprimer cette séance ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG_A}/agenda$`));
}

const unique = (testInfo: { project: { name: string } }) =>
  `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

test("le coach crée une séance collective chaque semaine, la retrouve, la modifie et la supprime", async ({
  page,
}, testInfo) => {
  const title = `Piste ${unique(testInfo)}`;
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda?date=2027-01-06`);
  const dialog = await openNewSession(page);

  // « Individuelle » est le type proposé d'abord : on choisit « Collective ».
  await dialog.getByText("Collective", { exact: true }).click();
  await dialog.getByLabel("Titre").fill(title);
  await dialog.getByLabel(/^Discipline/).selectOption({ label: "Running" });
  await dialog.getByLabel(/^Lieu/).fill("Stade de test");
  await dialog.getByLabel(/Chaque semaine/).check();
  await fillSchedule(dialog, "2027-01-06", "19:00", "90");
  await dialog.getByLabel(/^Jusqu'au/).fill("2027-01-27");
  const enrolled = dialog.getByRole("group", { name: /Sportifs inscrits/ });
  await enrolled.getByText("Thomas Peeters", { exact: true }).click();
  await enrolled.getByText("Inès Benali", { exact: true }).click();
  await dialog.getByRole("button", { name: "Créer la séance" }).click();

  // On reste sur l'agenda : la fenêtre se ferme et la séance apparaît le mercredi 6.
  await expect(page.getByText("Séance créée.")).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/agenda\?date=2027-01-06$/);
  await page
    .locator('[data-drop-date="2027-01-06"]')
    .getByRole("link", { name: new RegExp(title) })
    .click();

  // Page de la séance : rythme, période et inscrits.
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  const details = page.getByRole("region", { name: "Détails", exact: true });
  await expect(details).toContainText("Chaque mercredi à 19:00 · 1 h 30");
  await expect(details).toContainText("Depuis le 6 janvier 2027, jusqu'au 27 janvier 2027");
  await expect(
    page.getByRole("list", { name: "Sportifs de la séance" }).getByRole("link"),
  ).toHaveCount(2);

  // Dans l'agenda de janvier 2027 : quatre mercredis, pas un de plus (chaque case du mois nomme
  // ses séances).
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=mois&date=2027-01-01`);
  const month = page.getByRole("region", { name: "Janvier 2027" });
  await expect(month.getByRole("link", { name: new RegExp(title) })).toHaveCount(4);

  // Modification depuis la journée du 13 : nouvelle heure, un inscrit en moins.
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=jour&date=2027-01-13`);
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.getByRole("link", { name: "Modifier", exact: true }).click();
  await page.getByLabel("Heure", { exact: true }).fill("19:30");
  await page
    .getByRole("group", { name: /Sportifs inscrits/ })
    .getByText("Thomas Peeters", { exact: true })
    .click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(details).toContainText("19:30");
  await expect(page.getByRole("heading", { name: "Inscrits · 1" })).toBeVisible();

  // Suppression par le menu « ••• », après confirmation : retour à l'agenda, la séance n'y est plus.
  await deleteOpenSession(page, title);
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=mois&date=2027-01-01`);
  await expect(month.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
});

test("une séance individuelle demande son sportif (ou un nouveau client), et la saisie est conservée après l'erreur", async ({
  page,
}, testInfo) => {
  const title = `Force ${unique(testInfo)}`;
  await loginAsCoachA(page);
  await page.goto("/coach/seances");
  const dialog = await openNewSession(page);

  await expect(dialog.getByRole("radio", { name: "Individuelle" })).toBeChecked();
  await dialog.getByLabel("Titre").fill(title);
  await fillSchedule(dialog, "2027-01-13", "07:30", "60");
  await dialog.getByRole("button", { name: "Créer la séance" }).click();

  await expect(
    dialog
      .getByRole("alert")
      .filter({ hasText: "Choisis le sportif de la séance, ou coche « Nouveau sportif »." }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Titre")).toHaveValue(title);
  await expect(dialog.getByLabel("Heure", { exact: true })).toHaveValue("07:30");

  await dialog.getByLabel("Sportif", { exact: true }).selectOption({ label: "Nadia El Amrani" });
  await dialog.getByRole("button", { name: "Créer la séance" }).click();
  await expect(page.getByText("Séance créée.")).toBeVisible();
  await expect(dialog).toBeHidden();

  await page.goto(`/coach/o/${ORG_A}/agenda?vue=jour&date=2027-01-13`);
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Détails", exact: true })).toContainText(
    "Le 13 janvier 2027 à 07:30 · 1 h",
  );
  await expect(
    page
      .getByRole("list", { name: "Sportifs de la séance" })
      .getByRole("link", { name: "Nadia El Amrani" }),
  ).toBeVisible();
  await deleteOpenSession(page, title);
});

test("un nouveau sportif tapé dans « Nouvelle séance » a aussitôt sa fiche, signalée à compléter", async ({
  page,
}, testInfo) => {
  const title = `Découverte ${unique(testInfo)}`;
  // Un seul mot : un prénom, sans nom de famille ni contact (unique, les tests tournent en parallèle).
  const name = `John${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await loginAsCoachA(page);
  await page.goto("/coach/seances");
  const dialog = await openNewSession(page);

  await dialog.getByLabel("Titre").fill(title);
  await dialog.getByLabel(/^Nouveau sportif/).check();
  await expect(dialog.getByRole("combobox", { name: "Sportif", exact: true })).toHaveCount(0);
  await dialog.getByLabel("Nom du nouveau sportif").fill(name);
  await fillSchedule(dialog, "2027-01-20", "08:00", "45");
  await dialog.getByRole("button", { name: "Créer la séance" }).click();
  await expect(
    page.getByText(`Séance créée. Fiche de ${name} ajoutée à tes sportifs, à compléter.`),
  ).toBeVisible();

  // Dans Sportifs : la fiche existe déjà, avec son repère « à compléter ».
  await page.goto(`/coach/o/${ORG_A}/sportifs`);
  const row = page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("listitem")
    .filter({ hasText: name });
  await expect(
    row.getByTitle("Fiche à compléter : nom de famille, e-mail ou téléphone"),
  ).toBeVisible();
  await row
    .getByRole("link", { name: new RegExp(name) })
    .first()
    .click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Fiche à compléter" }).click();
  await expect(page).toHaveURL(/onglet=profil/);

  // La séance est bien la sienne (vue du jour en grille : le bloc porte le nom du sportif).
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=jour&date=2027-01-20`);
  const session = page.getByRole("link", { name: new RegExp(title) });
  await expect(session).toContainText(name);
  await session.click();
  await expect(
    page.getByRole("list", { name: "Sportifs de la séance" }).getByRole("link", { name }),
  ).toBeVisible();
  await deleteOpenSession(page, title);
});

test("la page Séances liste les séances à venir, avec ses filtres", async ({ page }) => {
  await loginAsCoachA(page);
  await page.goto("/coach/seances");
  await expect(page.getByRole("heading", { name: "Séances", level: 1 })).toBeVisible();
  const upcoming = page.getByRole("region", { name: "À venir" });
  // « Piste du mercredi » (collective, chaque semaine, sans fin) est toujours à venir.
  await expect(upcoming.getByRole("link", { name: /Piste du mercredi/ }).first()).toBeVisible();
  await page
    .getByRole("navigation", { name: "Filtrer les séances" })
    .getByRole("link", { name: "Individuelles" })
    .click();
  await expect(page).toHaveURL(/type=individuelles/);
  await expect(upcoming.getByRole("link", { name: /Piste du mercredi/ })).toHaveCount(0);
});

test("le coach A ne voit ni ne modifie de séance de l'organisation B", async ({ page }) => {
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda/seances/${SESSION_OF_B}`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await page.goto(`/coach/o/${ORG_B}/agenda/seances/${SESSION_OF_B}/modifier`);
  await expect(page).toHaveURL(/\/acces-refuse$/);
});
