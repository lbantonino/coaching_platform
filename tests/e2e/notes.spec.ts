import { expect, test, type Page } from "@playwright/test";

import { FEATURES } from "../../src/config/features";
import { fillAthleteName, openAthleteTab } from "./helpers";

// Notes du coach et historique (P2-04 étape 2).
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("le coach écrit une note libre, visible dans la vue d'ensemble et l'historique", async ({
  page,
}, testInfo) => {
  const name = `Notes ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await login(page, "coach-a@example.test");
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto(`/coach/o/${ORG_A}/sportifs/nouveau`);
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  // Le sportif enregistré, on arrive sur sa fiche (D-54).
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();

  await openAthleteTab(page, "Notes");
  await page.getByRole("textbox", { name: "Notes libres" }).fill("Très investie, progresse bien.");
  await page.getByRole("button", { name: "Enregistrer : notes libres" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Note enregistrée." })).toBeVisible();
  await expect(page.getByText(/^Mise à jour le /)).toBeVisible();
  // La carte « Message au sportif » a été retirée (choix d'Antonino du 04/11).
  await expect(page.getByText("Message au sportif")).toHaveCount(0);

  // Vue d'ensemble : la note libre.
  await openAthleteTab(page, "Vue d'ensemble");
  const notes = page.getByRole("region", { name: "Notes du coach" });
  await expect(notes).toContainText("Très investie, progresse bien.");
  await expect(notes).not.toContainText("Visible par le sportif");
  const recent = page.getByRole("region", { name: "Historique récent" });
  await expect(recent).toContainText("Notes libres mises à jour");

  // Historique complet : du plus récent à la création de la fiche.
  await page.getByRole("link", { name: "Voir tout : Historique récent" }).click();
  const history = page.getByRole("list", { name: "Historique de la fiche" });
  await expect(history.getByRole("listitem").last()).toContainText("Fiche créée");
  await expect(history).toContainText("Notes libres mises à jour");

  // Vider une note puis l'enregistrer la supprime.
  await openAthleteTab(page, "Notes");
  await page.getByRole("textbox", { name: "Notes libres" }).fill("");
  await page.getByRole("button", { name: "Enregistrer : notes libres" }).click();
  await openAthleteTab(page, "Vue d'ensemble");
  await expect(notes).toContainText("Aucune note libre.");
});

test("l'espace du sportif n'affiche plus de message du coach", async ({ page }) => {
  test.skip(!FEATURES.athleteSpace, "MVP espace coach seul (D-167) : espace sportif masqué.");
  // Le seed garde un message « visible par le sportif » pour Thomas Peeters (données dormantes depuis
  // le retrait de la carte, 04/11) : il ne doit plus apparaître.
  await login(page, "thomas.peeters@example.test");
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("region", { name: "Message de ton coach" })).toHaveCount(0);
  await expect(page.getByText(/garde l.endurance vraiment facile/)).toHaveCount(0);
});
