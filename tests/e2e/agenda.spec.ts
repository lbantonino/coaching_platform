import { expect, test, type Page } from "@playwright/test";

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
  await page.getByRole("link", { name: "Agenda", exact: true }).filter({ visible: true }).click();
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

test("le coach A ne peut pas ouvrir l'agenda de l'organisation B", async ({ page }) => {
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_B}/agenda`);
  await expect(page).toHaveURL(/\/acces-refuse$/);
});
