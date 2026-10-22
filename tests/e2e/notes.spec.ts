import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, openAthleteTab } from "./helpers";

// Notes du coach et historique (P2-04 étape 2).
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("le coach écrit une note privée et un message, visibles dans la vue d'ensemble et l'historique", async ({
  page,
}, testInfo) => {
  const name = `Notes ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await login(page, "coach-a@example.test");
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto(`/coach/o/${ORG_A}/sportifs/nouveau`);
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();

  await openAthleteTab(page, "Notes");
  await page.getByLabel("Note privée").fill("Très investie, progresse bien.");
  await page.getByRole("button", { name: "Enregistrer : note privée" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Note enregistrée." })).toBeVisible();
  await page.getByLabel("Message au sportif").fill("Semaine facile, reste en endurance.");
  await page.getByRole("button", { name: "Enregistrer : message au sportif" }).click();
  await expect(page.getByText(/Mis à jour le/)).toBeVisible();

  // Vue d'ensemble : les deux notes, la seconde marquée « Visible par le sportif ».
  await openAthleteTab(page, "Vue d'ensemble");
  const notes = page.getByRole("region", { name: "Notes du coach" });
  await expect(notes).toContainText("Très investie, progresse bien.");
  await expect(notes).toContainText("Visible par le sportif");
  await expect(notes).toContainText("Semaine facile, reste en endurance.");
  const recent = page.getByRole("region", { name: "Historique récent" });
  await expect(recent).toContainText("Message au sportif mis à jour");

  // Historique complet : du plus récent à la création de la fiche.
  await page.getByRole("link", { name: "Voir tout : Historique récent" }).click();
  const history = page.getByRole("list", { name: "Historique de la fiche" });
  await expect(history.getByRole("listitem").last()).toContainText("Fiche créée");
  await expect(history).toContainText("Note privée mise à jour");

  // Vider une note puis l'enregistrer la supprime.
  await openAthleteTab(page, "Notes");
  await page.getByLabel("Note privée").fill("");
  await page.getByRole("button", { name: "Enregistrer : note privée" }).click();
  await openAthleteTab(page, "Vue d'ensemble");
  await expect(notes).toContainText("Aucune note privée.");
});

test("le sportif lit le message de son coach dans son espace", async ({ page }) => {
  // Lecture seule du seed : Thomas Peeters a un message visible (et aucune note privée ne lui est montrée,
  // ce que garantissent les tests SQL de 09_notes).
  await login(page, "thomas.peeters@example.test");
  await expect(page).toHaveURL(/\/app$/);
  const message = page.getByRole("region", { name: "Message de ton coach" });
  await expect(message).toContainText("Semaine de reprise");
});
