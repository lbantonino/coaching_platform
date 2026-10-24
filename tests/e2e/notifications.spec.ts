import { expect, test, type Page } from "@playwright/test";

// Notifications du coach (D-37) : la cloche compte ce qui attend, la page le range en sections
// (messages non lus, tâches du jour ou en retard, factures en retard, fiches à compléter), et chaque
// ligne mène là où on s'en occupe. Lignes stables du seed : la facture en retard de Sophie et la
// fiche de Manon (prénom seul) ; les messages et les tâches bougent avec les autres tests.
async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("la cloche mène aux notifications, rangées en sections, et chaque ligne au bon endroit", async ({
  page,
}) => {
  await loginAsCoachA(page);
  const bell = page.getByRole("link", { name: /^Notifications, \d+ à voir$/ });
  await expect(bell).toBeVisible();
  await bell.click();
  await expect(page).toHaveURL(/\/coach\/notifications$/);
  await expect(page.getByRole("heading", { name: "Notifications", level: 1 })).toBeVisible();

  for (const name of [
    "Messages non lus",
    "Tâches du jour ou en retard",
    "Factures en retard",
    "Fiches à compléter",
  ]) {
    await expect(page.getByRole("region", { name })).toBeVisible();
  }
  const invoices = page.getByRole("region", { name: "Factures en retard" });
  await expect(invoices.getByRole("link", { name: /Sophie Lambert/ })).toHaveAttribute(
    "href",
    "/coach/facturation",
  );

  await page
    .getByRole("region", { name: "Fiches à compléter" })
    .getByRole("link", { name: /Manon/ })
    .click();
  await expect(page).toHaveURL(/onglet=profil/);
  await expect(page.getByRole("heading", { name: "Manon", level: 1 })).toBeVisible();
});
