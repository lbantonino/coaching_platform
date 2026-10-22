import { expect, test, type Page } from "@playwright/test";

import { goToCoachSection } from "./helpers";

// Agenda du coach (P2-05) : lecture seule sur les objectifs datés du seed (supabase/seed.sql).
// Les mois sont fixés dans l'adresse pour que le test ne dépende pas de la date du jour.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const ORG_B = "0b000000-0000-4000-8000-0000000000b1";

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach voit les compétitions de ses sportifs, filtre et ouvre la fiche", async ({
  page,
}) => {
  await loginAsCoachA(page);

  // L'agenda est dans la navigation (barre latérale ou onglets selon l'écran).
  await goToCoachSection(page, "Agenda");
  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "7 prochains jours" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Prochaines compétitions" })).toBeVisible();

  // Mars 2027 : le Hyrox d'Inès ; jamais le 10 km de Sarah, sportive de l'organisation B.
  await page.goto(`/coach/o/${ORG_A}/agenda?mois=2027-03`);
  const month = page.getByRole("region", { name: "mars 2027" });
  const hyrox = month.getByRole("link", { name: /Hyrox Bruxelles/ }).filter({ visible: true });
  await expect(hyrox).toBeVisible();
  await expect(month.getByText(/Sarah/)).toHaveCount(0);

  // Filtre de discipline : la course à pied masque le Hyrox.
  await page.getByRole("link", { name: "Course à pied" }).click();
  await expect(page).toHaveURL(/discipline=course/);
  await expect(month.getByRole("link", { name: /Hyrox Bruxelles/ })).toHaveCount(0);

  // Mois suivant, filtre conservé : le semi de Thomas en avril.
  await page.getByRole("link", { name: "Mois suivant" }).click();
  await expect(page).toHaveURL(/mois=2027-04/);
  const april = page.getByRole("region", { name: "avril 2027" });
  await expect(
    april.getByRole("link", { name: /Semi-marathon de printemps/ }).filter({ visible: true }),
  ).toBeVisible();

  // Filtre par sportif (formulaire classique) puis ouverture de la fiche, onglet Objectifs.
  await page.goto(`/coach/o/${ORG_A}/agenda?mois=2027-03`);
  await page.getByLabel("Sportif", { exact: true }).selectOption({ label: "Inès Benali" });
  await page.getByRole("button", { name: "Filtrer" }).click();
  await expect(page).toHaveURL(/sportif=/);
  await month
    .getByRole("link", { name: /Hyrox Bruxelles/ })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/onglet=objectifs/);
  await expect(page.getByRole("heading", { name: "Inès Benali", level: 1 })).toBeVisible();
});

test("le tableau de bord montre la semaine du coach avec ses vraies séances", async ({ page }) => {
  await loginAsCoachA(page);
  await expect(page.getByRole("heading", { name: /^Bonjour/, level: 1 })).toBeVisible();
  // Semaine fixée dans l'adresse : le mercredi 6 janvier 2027 a la piste collective (19:00).
  await page.goto("/coach?date=2027-01-06");
  const week = page.getByRole("region", { name: "Agenda de la semaine" });
  await expect(
    week.getByRole("link", { name: /Piste du mercredi/ }).filter({ visible: true }),
  ).toHaveCount(1);
  // Les modules pas encore construits sont annoncés, jamais simulés.
  await expect(page.getByText("Bientôt · P4").first()).toBeVisible();
  await week.getByRole("link", { name: "Filtres" }).click();
  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
});

test("l'agenda du tableau de bord passe du jour à la semaine et au mois sans quitter la page", async ({
  page,
}) => {
  await loginAsCoachA(page);
  const views = page.getByRole("navigation", { name: "Vue de l'agenda" });
  await views.getByRole("link", { name: "Mois" }).click();
  await expect(page.getByRole("heading", { name: "Agenda du mois" })).toBeVisible();
  await expect(page).toHaveURL(/\/coach\?vue=mois/);
  // Un jour du mois ouvre sa journée, toujours sur le tableau de bord.
  await page.getByRole("link", { name: /^15 :/ }).click();
  await expect(page.getByRole("heading", { name: "Agenda du jour" })).toBeVisible();
  await views.getByRole("link", { name: "Semaine" }).click();
  await expect(page.getByRole("heading", { name: "Agenda de la semaine" })).toBeVisible();
  await views.getByRole("link", { name: "Aujourd'hui" }).click();
  await expect(page.getByRole("heading", { name: "Agenda du jour" })).toBeVisible();
});

test("le menu « Créer » mène aux vraies créations, et « Bientôt » pour le reste", async ({
  page,
}) => {
  await loginAsCoachA(page);
  await page.getByText("Créer", { exact: true }).click();
  await page.getByRole("list", { name: "Créer" }).getByRole("link", { name: "Séance" }).click();
  await expect(page.getByRole("heading", { name: "Nouvelle séance", level: 1 })).toBeVisible();
  await page.goto("/coach");
  await page.getByText("Créer", { exact: true }).click();
  await page
    .getByRole("list", { name: "Créer" })
    .getByRole("link", { name: /Programme/ })
    .click();
  await expect(page.getByRole("heading", { name: "Programmes", level: 1 })).toBeVisible();
  await expect(page.getByRole("main").getByText("Bientôt · P4")).toBeVisible();
});

test("le coach A ne peut pas ouvrir l'agenda de l'organisation B", async ({ page }) => {
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_B}/agenda`);
  await expect(page).toHaveURL(/\/acces-refuse$/);
});
