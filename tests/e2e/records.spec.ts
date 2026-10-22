import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, openAthleteTab } from "./helpers";

// Records personnels (P2-02 partie 4) : performances datées, meilleur temps calculé, contrôles de saisie.
async function openNewAthleteRecords(page: Page, name: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByRole("link", { name: "Sportifs", exact: true }).filter({ visible: true }).click();
  await page.getByRole("link", { name: "Ajouter un sportif" }).click();
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
  await openAthleteTab(page, "Repères");
  await expect(page.getByRole("heading", { name: "Records personnels" })).toBeVisible();
}

async function addPerformance(page: Page, event: string, time: string, date?: string) {
  await page.getByLabel("Épreuve").selectOption({ label: event });
  await page.getByLabel("Temps", { exact: true }).fill(time);
  if (date) await page.getByLabel("Date de la performance").fill(date);
  await page.getByRole("button", { name: "Ajouter la performance" }).click();
}

test("le coach enregistre des performances et voit le meilleur temps par épreuve", async ({
  page,
}, testInfo) => {
  const name = `Records ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await openNewAthleteRecords(page, name);
  const best = page.getByRole("list", { name: "Records actuels" });
  const saved = page.getByRole("status").filter({ hasText: "Performance ajoutée." });

  // Deux 5 km : le record est le meilleur temps, avec son allure moyenne.
  await addPerformance(page, "5 km", "22:30", "2026-05-01");
  await expect(saved).toBeVisible();
  await addPerformance(page, "5 km", "21:45");
  await expect(best.getByText("21:45", { exact: true })).toBeVisible();
  await expect(best.getByText(/4:21 min\/km/)).toBeVisible();
  await expect(best.getByText("22:30", { exact: true })).toHaveCount(0);

  // Hyrox : la catégorie est obligatoire, puis le record porte son nom.
  await addPerformance(page, "Hyrox", "1:18:40");
  await expect(
    page.getByRole("alert").filter({ hasText: "Choisis la catégorie Hyrox." }),
  ).toBeVisible();
  await page.getByLabel("Catégorie Hyrox").selectOption({ label: "Open" });
  await page.getByRole("button", { name: "Ajouter la performance" }).click();
  await expect(best.getByText("Hyrox Open")).toBeVisible();

  // Faute de frappe : « 3:15 » pour un marathon est refusé, et la saisie reste à corriger.
  await addPerformance(page, "Marathon", "3:15");
  await expect(
    page.getByRole("alert").filter({ hasText: "Temps invraisemblable pour un marathon" }),
  ).toBeVisible();
  await expect(page.getByLabel("Temps", { exact: true })).toHaveValue("3:15");

  // Historique : les trois performances ; supprimer le record fait remonter l'ancien temps.
  await page.getByText("Toutes les performances (3)").click();
  const history = page.getByRole("list", { name: "Historique des performances" });
  await expect(history.getByRole("listitem")).toHaveCount(3);
  await history
    .getByRole("listitem")
    .filter({ hasText: "21:45" })
    .getByRole("button", { name: /Supprimer la performance 5 km/ })
    .click();
  await expect(best.getByText("22:30", { exact: true })).toBeVisible();
});
