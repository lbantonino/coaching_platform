import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, openAthleteTab } from "./helpers";

// Page « Nouveau sportif » (D-54) : toute la fiche en une fois (identité, profil, objectif principal,
// disponibilités, accord santé), puis arrivée sur la fiche, où tout se retrouve. Nom unique par test.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach crée une fiche complète d'un coup, accord santé compris, et la retrouve", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const name = `Noa Complet ${suffix}`;
  const competition = `Hyrox ${suffix}`;
  const nextYear = `${new Date().getFullYear() + 1}-03-20`;
  await login(page);
  await page.goto(`/coach/o/${ORG_A}/sportifs/nouveau`);
  await expect(page.getByRole("heading", { name: "Nouveau sportif", level: 1 })).toBeVisible();

  // Identité, contact et profil.
  await fillAthleteName(page, name);
  await page.getByLabel(/^Sexe/).selectOption({ label: "Femme" });
  await page.getByLabel("Canal de contact préféré").selectOption({ label: "WhatsApp" });
  await page.getByLabel("Niveau").selectOption({ label: "Intermédiaire" });
  await page.getByLabel("Type de programme").selectOption({ label: "Hyrox" });
  await page.getByText("Box Hyrox / CrossFit", { exact: true }).click();

  // Objectif principal : une compétition sans date est refusée, la saisie est gardée.
  await page.getByLabel(/^Type d'objectif/).selectOption({ label: "Hyrox" });
  await page.getByLabel(/^Prochaine compétition/).fill(competition);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Une compétition a besoin d'une date." }),
  ).toBeVisible();
  await expect(page.getByLabel(/^Prochaine compétition/)).toHaveValue(competition);
  await expect(page.getByLabel("Type de programme")).toHaveValue("hyrox");
  await page.getByLabel(/^Date visée/).fill(nextYear);

  // Disponibilités.
  await page.getByLabel("Séances par semaine").fill("4");
  await page.getByText("Lundi", { exact: true }).click();
  await page.getByText("Jeudi", { exact: true }).click();

  // Accord santé : le champ des contraintes physiques n'existe qu'avec l'accord coché.
  const consent = page.getByRole("region", { name: "Accord santé" });
  await expect(page.getByLabel("Contraintes physiques", { exact: true })).toHaveCount(0);
  await consent.getByLabel(/m'a donné son accord explicite/).check();
  await consent.getByLabel("Comment ?").selectOption({ label: "Formulaire signé" });
  await consent.getByLabel("Contraintes physiques", { exact: true }).fill("Épaule gauche fragile");
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();

  // Arrivée sur la fiche, puis chaque onglet montre ce qui a été saisi.
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG_A}/sportifs/[0-9a-f-]{36}$`));

  await openAthleteTab(page, "Objectifs");
  await expect(page.getByRole("list", { name: "Objectifs en cours" })).toContainText(competition);

  await openAthleteTab(page, "Disponibilités");
  const section = page.getByRole("region", { name: "Disponibilités & contraintes" });
  await expect(section.getByLabel("Séances par semaine")).toHaveValue("4");
  await expect(section.getByLabel("Jeudi")).toBeChecked();
  await expect(section.getByLabel("Mardi")).not.toBeChecked();
  await expect(section.getByText(/Accord en cours depuis le/)).toBeVisible();
  await expect(section.getByLabel("Contraintes physiques", { exact: true })).toHaveValue(
    "Épaule gauche fragile",
  );

  await openAthleteTab(page, "Profil");
  await expect(page.getByLabel("Niveau")).toHaveValue("intermediate");
  await expect(page.getByLabel("Canal de contact préféré")).toHaveValue("whatsapp");
});

test("sans accord coché, aucune contrainte physique ne peut être enregistrée", async ({
  page,
}, testInfo) => {
  const name = `Noa Sans ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await login(page);
  await page.goto(`/coach/o/${ORG_A}/sportifs/nouveau`);
  await fillAthleteName(page, name);
  // L'accord coché puis décoché : le champ disparaît avec sa saisie.
  const consent = page.getByRole("region", { name: "Accord santé" });
  await consent.getByLabel(/m'a donné son accord explicite/).check();
  await consent.getByLabel("Contraintes physiques", { exact: true }).fill("Genou");
  await consent.getByLabel(/m'a donné son accord explicite/).uncheck();
  await expect(page.getByLabel("Contraintes physiques", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await openAthleteTab(page, "Disponibilités");
  const section = page.getByRole("region", { name: "Disponibilités & contraintes" });
  await expect(section.getByLabel("Contraintes physiques", { exact: true })).toHaveCount(0);
});
