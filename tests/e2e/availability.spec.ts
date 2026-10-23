import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, openAthleteTab } from "./helpers";

// Disponibilités et contraintes physiques avec accord du sportif (P2-02 partie 3, D-20).
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
// Thomas Peeters : sportif de démo du seed, avec un compte activé (supabase/seed.sql).
const THOMAS_PROFILE = "da000000-0000-4000-8000-000000000002";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("le coach renseigne les disponibilités et gère l'accord pour les contraintes physiques", async ({
  page,
}, testInfo) => {
  const name = `Dispos ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await login(page, "coach-a@example.test");
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto(`/coach/o/${ORG_A}/sportifs/nouveau`);
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
  await openAthleteTab(page, "Disponibilités");
  const section = page.getByRole("region", { name: "Disponibilités & contraintes" });
  const saved = section.getByRole("status").filter({ hasText: "Disponibilités enregistrées." });

  // Disponibilités ; sans accord, aucun champ pour les contraintes physiques.
  await expect(section.getByLabel("Contraintes physiques", { exact: true })).toHaveCount(0);
  await section.getByLabel("Séances par semaine").fill("3");
  await section.getByLabel(/Durée maximale/).fill("60");
  await section.getByText("Lundi", { exact: true }).click();
  await section.getByText("Mercredi", { exact: true }).click();
  await section.getByText("Samedi", { exact: true }).click();
  await section.getByLabel("Contraintes d'organisation").fill("Déplacements le jeudi");
  await section.getByRole("button", { name: "Enregistrer les disponibilités" }).click();
  await expect(saved).toBeVisible();
  await page.reload();
  await expect(section.getByLabel("Séances par semaine")).toHaveValue("3");
  await expect(section.getByLabel("Mercredi")).toBeChecked();
  await expect(section.getByLabel("Mardi")).not.toBeChecked();

  // L'accord exige la case cochée, puis le coach précise comment il l'a obtenu.
  await section.getByLabel("Comment ?").selectOption({ label: "Oral (en séance, au téléphone)" });
  await section.getByRole("button", { name: "Enregistrer l'accord" }).click();
  await expect(section.getByRole("alert").filter({ hasText: "Coche la case" })).toBeVisible();
  await section.getByLabel(/m'a donné son accord explicite/).check();
  await section.getByLabel("Comment ?").selectOption({ label: "Oral (en séance, au téléphone)" });
  await section.getByRole("button", { name: "Enregistrer l'accord" }).click();
  await expect(section.getByText(/Accord en cours depuis le/)).toBeVisible();

  // Avec l'accord, le champ apparaît et s'enregistre.
  await section
    .getByLabel("Contraintes physiques", { exact: true })
    .fill("Genou droit sensible en descente");
  await section.getByRole("button", { name: "Enregistrer les disponibilités" }).click();
  await expect(saved).toBeVisible();
  await page.reload();
  await expect(section.getByLabel("Contraintes physiques", { exact: true })).toHaveValue(
    "Genou droit sensible en descente",
  );

  // Retrait (après confirmation) : la contrainte est effacée, le journal garde les deux événements.
  await section.getByRole("button", { name: "Retirer l'accord" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Retirer l'accord" }).click();
  await expect(section.getByLabel("Contraintes physiques", { exact: true })).toHaveCount(0);
  await section.getByText("Historique de l'accord (2)").click();
  await expect(section.getByRole("list", { name: "Historique de l'accord" })).toContainText(
    "Accord retiré, noté par le coach",
  );
});

test("le sportif donne son accord depuis son espace, voit ce que le coach note, puis le retire", async ({
  page,
  browser,
}, testInfo) => {
  // Compte de démo partagé : un seul navigateur à la fois, pour ne pas se marcher dessus.
  test.skip(testInfo.project.name !== "ordinateur", "Compte de démo partagé entre les profils");

  await login(page, "thomas.peeters@example.test");
  await expect(page).toHaveURL(/\/app$/);
  const card = page.getByRole("region", { name: "Tes contraintes physiques" });
  // Repart d'un état propre si un essai précédent a été interrompu.
  if (await card.getByRole("button", { name: "Retirer mon accord" }).isVisible()) {
    await card.getByRole("button", { name: "Retirer mon accord" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Retirer mon accord" }).click();
  }
  await card.getByRole("button", { name: "J'accepte" }).click();
  await expect(card.getByText(/Tu as donné ton accord le/)).toBeVisible();
  await expect(card.getByText("Rien pour l'instant.")).toBeVisible();

  // Côté coach : l'accord vient du sportif, le champ est ouvert.
  const coachContext = await browser.newContext();
  const coach = await coachContext.newPage();
  await login(coach, "coach-a@example.test");
  await expect(coach).toHaveURL(/\/coach$/);
  await coach.goto(`/coach/o/${ORG_A}/sportifs/${THOMAS_PROFILE}?onglet=disponibilites`);
  const section = coach.getByRole("region", { name: "Disponibilités & contraintes" });
  await expect(
    section
      .getByRole("status")
      .filter({ hasText: "Accord donné par le sportif depuis son espace" }),
  ).toBeVisible();
  await section
    .getByLabel("Contraintes physiques", { exact: true })
    .fill("Tendon d'Achille à surveiller");
  await section.getByRole("button", { name: "Enregistrer les disponibilités" }).click();
  await expect(
    section.getByRole("status").filter({ hasText: "Disponibilités enregistrées." }),
  ).toBeVisible();
  await coachContext.close();

  // Le sportif voit ce qui a été noté sur lui, puis retire son accord (effacement).
  await page.reload();
  await expect(card.getByText("Tendon d'Achille à surveiller")).toBeVisible();
  await card.getByRole("button", { name: "Retirer mon accord" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Retirer mon accord" }).click();
  await expect(card.getByRole("button", { name: "J'accepte" })).toBeVisible();
  await expect(card.getByText("Tendon d'Achille à surveiller")).toHaveCount(0);
});
