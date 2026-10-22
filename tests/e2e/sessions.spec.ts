import { expect, test, type Page } from "@playwright/test";

// Séances encadrées du coach (P2-05b, D-27) : collective hebdomadaire avec inscrits, individuelle,
// affichage dans l'agenda, modification, suppression, isolation. Dates fixées en 2027 : le test ne
// dépend pas du jour où il tourne.
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

async function fillSchedule(page: Page, date: string, time: string, minutes: string) {
  await page.getByLabel(/Première séance|^Date$/).fill(date);
  await page.getByLabel("Heure", { exact: true }).fill(time);
  await page.getByLabel("Durée (min)").fill(minutes);
}

test("le coach crée une séance collective chaque semaine, la retrouve, la modifie et la supprime", async ({
  page,
}, testInfo) => {
  const title = `Piste ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda`);
  await page.getByRole("link", { name: "Nouvelle séance" }).click();

  await page.getByLabel("Titre").fill(title);
  await page.getByLabel(/^Discipline/).selectOption({ label: "Running" });
  await page.getByLabel(/^Lieu/).fill("Stade de test");
  await fillSchedule(page, "2027-01-06", "19:00", "90");
  await page.getByLabel(/^Jusqu'au/).fill("2027-01-27");
  const enrolled = page.getByRole("group", { name: /Sportifs inscrits/ });
  await enrolled.getByText("Thomas Peeters", { exact: true }).click();
  await enrolled.getByText("Inès Benali", { exact: true }).click();
  await page.getByRole("button", { name: "Créer la séance" }).click();

  // Page de la séance : rythme, période et inscrits.
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  const details = page.getByRole("region", { name: "Détails de la séance" });
  await expect(details).toContainText("Chaque mercredi à 19:00 · 1 h 30");
  await expect(details).toContainText("Depuis le 6 janvier 2027, jusqu'au 27 janvier 2027");
  await expect(
    page.getByRole("list", { name: "Sportifs de la séance" }).getByRole("link"),
  ).toHaveCount(2);

  // Dans l'agenda de janvier 2027 : quatre mercredis, pas un de plus.
  await page.goto(`/coach/o/${ORG_A}/agenda?mois=2027-01`);
  const month = page.getByRole("region", { name: "janvier 2027" });
  await expect(
    month.getByRole("link", { name: new RegExp(title) }).filter({ visible: true }),
  ).toHaveCount(4);

  // Filtrée sur une sportive non inscrite, la séance disparaît.
  await page.getByLabel("Sportif", { exact: true }).selectOption({ label: "Nadia El Amrani" });
  await page.getByRole("button", { name: "Filtrer" }).click();
  await expect(month.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);

  // Modification : nouvelle heure, un inscrit en moins.
  await page.goto(`/coach/o/${ORG_A}/agenda?mois=2027-01`);
  await month
    .getByRole("link", { name: new RegExp(title) })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("link", { name: "Modifier" }).click();
  await page.getByLabel("Heure", { exact: true }).fill("19:30");
  await page
    .getByRole("group", { name: /Sportifs inscrits/ })
    .getByText("Thomas Peeters", { exact: true })
    .click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("region", { name: "Détails de la séance" })).toContainText("19:30");
  await expect(page.getByRole("heading", { name: "Sportifs inscrits (1)" })).toBeVisible();

  // Suppression après confirmation : retour à l'agenda, la séance n'y est plus.
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG_A}/agenda$`));
  await page.goto(`/coach/o/${ORG_A}/agenda?mois=2027-01`);
  await expect(month.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
});

test("une séance individuelle exige son sportif, et la saisie est conservée après l'erreur", async ({
  page,
}, testInfo) => {
  const title = `Force ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda/seances/nouvelle`);

  await page.getByText("Individuelle", { exact: true }).click();
  await page.getByLabel("Titre").fill(title);
  await page.getByLabel(/Chaque semaine/).uncheck();
  await fillSchedule(page, "2027-01-13", "07:30", "60");
  await page.getByRole("button", { name: "Créer la séance" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Choisis le sportif de la séance individuelle." }),
  ).toBeVisible();
  await expect(page.getByLabel("Titre")).toHaveValue(title);
  await expect(page.getByLabel("Heure", { exact: true })).toHaveValue("07:30");

  await page.getByLabel("Sportif", { exact: true }).selectOption({ label: "Nadia El Amrani" });
  await page.getByRole("button", { name: "Créer la séance" }).click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Détails de la séance" })).toContainText(
    "Le 13 janvier 2027 à 07:30 · 1 h",
  );
  await expect(
    page
      .getByRole("list", { name: "Sportifs de la séance" })
      .getByRole("link", { name: "Nadia El Amrani" }),
  ).toBeVisible();
});

test("le coach A ne voit ni ne crée de séance dans l'organisation B", async ({ page }) => {
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda/seances/${SESSION_OF_B}`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await page.goto(`/coach/o/${ORG_B}/agenda/seances/nouvelle`);
  await expect(page).toHaveURL(/\/acces-refuse$/);
});
