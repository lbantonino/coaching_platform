import { expect, test, type Page } from "@playwright/test";

import { FEATURES } from "../../src/config/features";

// MVP espace coach seul (D-167) : la messagerie est masquée, ses tests attendent sa réouverture.
test.skip(!FEATURES.messages, "MVP espace coach seul (D-167) : messagerie masquée.");

// Messages, kit « Coory Pages », page 07 (D-131) : « Nouveau message » (choisir un sportif ouvre son
// fil), la recherche dans les conversations et « Planifier » (Nouvelle séance avec ce sportif). Rien
// n'est écrit en base : les deux projets peuvent tourner en même temps.
async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("« Nouveau message » ouvre le fil du sportif choisi ; « Planifier » prépare une séance", async ({
  page,
}) => {
  await loginAsCoachA(page);
  await page.goto("/coach/messages");

  // Recherche : seules les conversations qui correspondent restent.
  const list = page.getByRole("list", { name: "Conversations" });
  await page.getByRole("searchbox", { name: "Rechercher une conversation" }).fill("Inès");
  await expect(list.getByRole("link", { name: /Inès Benali/ })).toBeVisible();
  await expect(list.getByRole("link", { name: /Thomas Peeters/ })).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Rechercher une conversation" }).fill("");

  // Nouveau message (en-tête sur ordinateur, bouton flottant sur téléphone).
  await page
    .getByRole("button", { name: "Nouveau message" })
    .filter({ visible: true })
    .first()
    .click();
  const sheet = page.getByRole("dialog", { name: "Nouveau message" });
  await sheet.getByRole("searchbox", { name: "Rechercher un sportif" }).fill("Chloé");
  await sheet.getByRole("button", { name: "Chloé Martin" }).click();
  await expect(page).toHaveURL(/\/coach\/messages\?sportif=[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Chloé Martin", level: 2 })).toBeVisible();
  // Champ vide : « Envoyer » grisé.
  await expect(page.getByRole("button", { name: "Envoyer" })).toBeDisabled();

  // Planifier : la fenêtre « Nouvelle séance », déjà avec Chloé.
  await page.getByRole("button", { name: "Planifier" }).click();
  const session = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(session).toBeVisible();
  await expect(session.getByRole("button", { name: "Sportif : Chloé Martin" })).toBeVisible();
  await session.getByRole("button", { name: "Annuler" }).click();
  await expect(session).toBeHidden();
});
