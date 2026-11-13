import { expect, test, type Page } from "@playwright/test";

import { FEATURES } from "../../src/config/features";

// MVP « espace coach seul » (D-167, décision d'Antonino du 13/11/2026) : la messagerie, les
// invitations et l'espace sportif sont masqués (le code reste). Les adresses sont coupées, les
// boutons « Écrire » et « Inviter » ouvrent la fenêtre « pas encore disponible », et un compte
// sportif apprend que son espace arrive plus tard. Rien n'est écrit en base.
test.skip(
  FEATURES.messages || FEATURES.invitations || FEATURES.athleteSpace,
  "Une partie de l'espace sportif est rouverte : ce test décrit le MVP coach seul.",
);

const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const THOMAS = "da000000-0000-4000-8000-000000000002";
const LUCAS = "da000000-0000-4000-8000-000000000004";
const SOPHIE_SESSION = "ca000000-0000-4000-8000-00000000020c";
const NOT_AVAILABLE = "Cette fonctionnalité n'est pas encore disponible sur cette version.";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
}

async function closeNotAvailable(page: Page) {
  const soon = page.getByRole("dialog", { name: "Bientôt disponible" });
  await expect(soon).toContainText(NOT_AVAILABLE);
  await soon.getByRole("button", { name: "J'ai compris" }).click();
  await expect(soon).toHaveCount(0);
}

test("les pages Messages, Inviter et l'espace sportif ne s'ouvrent plus", async ({ page }) => {
  await login(page, "coach-a@example.test");
  await expect(page).toHaveURL(/\/coach$/);

  await page.goto("/coach/messages");
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto(`/coach/messages?sportif=${THOMAS}`);
  await expect(page).toHaveURL(/\/coach$/);

  // La page Inviter ramène à la fiche du sportif.
  await page.goto(`/coach/o/${ORG_A}/sportifs/${LUCAS}/inviter`);
  await expect(page).toHaveURL(new RegExp(`/sportifs/${LUCAS}$`));

  await page.goto("/app");
  await expect(page).toHaveURL(/\/acces-refuse$/);
  await page.goto("/app/programme");
  await expect(page).toHaveURL(/\/acces-refuse$/);
});

test("un lien d'invitation ramène à la connexion", async ({ page }) => {
  await page.goto("/invitation/un-lien-quelconque");
  await expect(page).toHaveURL(/\/login$/);
});

test("« Écrire » et « Inviter » de la fiche et de la séance ouvrent « pas encore disponible »", async ({
  page,
}) => {
  await login(page, "coach-a@example.test");
  await expect(page).toHaveURL(/\/coach$/);

  // Fiche de Thomas (compte activé) : « Écrire ».
  await page.goto(`/coach/o/${ORG_A}/sportifs/${THOMAS}`);
  await page.getByRole("button", { name: "Écrire à Thomas Peeters" }).click();
  await closeNotAvailable(page);
  await expect(page).toHaveURL(new RegExp(`/sportifs/${THOMAS}$`));

  // Fiche de Lucas (sans compte) : « Inviter ».
  await page.goto(`/coach/o/${ORG_A}/sportifs/${LUCAS}`);
  await page.getByRole("button", { name: "Inviter Lucas Janssens dans son espace" }).click();
  await closeNotAvailable(page);
  await expect(page).toHaveURL(new RegExp(`/sportifs/${LUCAS}$`));

  // Page d'une séance de l'agenda : « Écrire » (en haut sur ordinateur, barre du bas sur téléphone).
  await page.goto(`/coach/o/${ORG_A}/agenda/seances/${SOPHIE_SESSION}`);
  await page.getByRole("button", { name: "Écrire" }).filter({ visible: true }).click();
  await closeNotAvailable(page);

  // Pas de Messages dans la navigation (menu de gauche ou menu du téléphone).
  await expect(page.getByRole("link", { name: /^Messages/ })).toHaveCount(0);
});

test("un compte sportif apprend que son espace n'est pas encore disponible", async ({ page }) => {
  await login(page, "thomas.peeters@example.test");
  await expect(page).toHaveURL(/\/acces-refuse$/);
  await expect(
    page.getByText("L'espace sportif n'est pas encore disponible sur cette version."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Retour à mon espace" })).toHaveCount(0);
});
