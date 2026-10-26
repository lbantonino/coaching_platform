import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection, openAthleteTab } from "./helpers";

// Objectifs et compétitions (P2-02 partie 2) sur la fiche d'un sportif.
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach ajoute des objectifs, change le principal et en clôture un", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `Objectifs ${suffix}`;
  const competition = `Hyrox ${suffix}`;

  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
  await openAthleteTab(page, "Objectifs");
  await expect(page.getByRole("heading", { name: "Objectifs & compétitions" })).toBeVisible();
  const current = page.getByRole("list", { name: "Objectifs en cours" });

  // Une compétition sans date est refusée, avec un message clair.
  await page.getByLabel("Type d'objectif").selectOption({ label: "Hyrox" });
  await page.getByLabel("C'est une compétition").check();
  await page.getByLabel("Nom de la compétition").fill(competition);
  await page.getByLabel("Catégorie Hyrox").selectOption({ label: "Pro" });
  await page.getByRole("button", { name: "Ajouter l'objectif" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Une compétition a besoin d'une date." }),
  ).toBeVisible();

  // Avec une date : premier objectif, donc principal, avec son compte à rebours.
  const inSixtyDays = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel(/Date cible/).fill(inSixtyDays);
  await page.getByRole("button", { name: "Ajouter l'objectif" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Objectif ajouté." })).toBeVisible();
  const hyrox = current.getByRole("listitem").filter({ hasText: competition });
  await expect(hyrox).toContainText("Principal");
  await expect(hyrox).toContainText("Catégorie Pro");
  await expect(hyrox).toContainText(/J-\d+/);

  // Un nouvel objectif principal fait passer l'ancien en secondaire.
  await page.getByLabel("Type d'objectif").selectOption({ label: "Semi-marathon" });
  await page
    .getByRole("group", { name: "Priorité" })
    .getByText("Principal", { exact: true })
    .click();
  await page.getByRole("button", { name: "Ajouter l'objectif" }).click();
  const half = current.getByRole("listitem").filter({ hasText: "Semi-marathon" });
  await expect(half).toContainText("Principal");
  await expect(hyrox).toContainText("Secondaire");

  // Atteint : l'objectif quitte la liste en cours et rejoint l'historique.
  await page.getByRole("button", { name: "Atteint : Semi-marathon" }).click();
  await expect(half).toHaveCount(0);
  await page.getByText("Objectifs passés (1)").click();
  await expect(page.getByRole("list", { name: "Objectifs passés" })).toContainText("Atteint");

  // L'objectif restant redevient principal.
  await page.getByRole("button", { name: `Rendre principal : ${competition}` }).click();
  await expect(hyrox).toContainText("Principal");

  // Modifier (demande d'Antonino du 26/10) : corriger le nom et la date sans supprimer l'objectif.
  const renamed = `${competition} Gand`;
  const inNinetyDays = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);
  await page.getByRole("button", { name: `Modifier : ${competition}` }).click();
  const edit = page.getByRole("dialog", { name: "Modifier l'objectif" });
  await expect(edit.getByLabel("Nom de la compétition")).toHaveValue(competition);
  await edit.getByLabel("Nom de la compétition").fill(renamed);
  await edit.getByLabel(/Date cible/).fill(inNinetyDays);
  await edit.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Objectif modifié.")).toBeVisible();
  await expect(edit).toBeHidden();
  const edited = current.getByRole("listitem").filter({ hasText: renamed });
  await expect(edited).toContainText("Principal");
  await expect(edited).toContainText("Catégorie Pro");
  await page.reload();
  await expect(current.getByRole("listitem").filter({ hasText: renamed })).toBeVisible();
});
