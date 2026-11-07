import { expect, test, type Page } from "@playwright/test";

import { goToCoachSection } from "./helpers";

// Bibliothèque d'exercices (P3-01, D-75, maquette D-142) : rubriques, stations Hyrox dans l'ordre, image de
// remplacement, recherche en français et en anglais, fiche, favori, filtres gardés au retour, et un
// exercice masqué introuvable. Coach de démo B ; chaque projet met en favori SON exercice, puis le retire.
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

const results = (page: Page) => page.getByRole("region", { name: /exercices?$/ });

// Menu « Catégorie » (maquette « Bibliothèque », D-142) : son bouton porte le choix en cours ; la liste
// s'ouvre sous le bouton (ordinateur) ou en feuille (téléphone).
async function chooseCategory(page: Page, current: RegExp, choice: RegExp) {
  await page.getByRole("button", { name: current }).click();
  await page.getByRole("option", { name: choice }).click();
}

test("la bibliothèque se parcourt : rubriques, recherche, fiche et favori", async ({
  page,
}, testInfo) => {
  // Un exercice par projet (téléphone et ordinateur tournent en même temps sur le même compte).
  const mine =
    testInfo.project.name === "telephone"
      ? { query: "goblet squat", name: "Goblet squat", key: "goblet-squat" }
      : { query: "back squat", name: "Back squat", key: "squat" };
  await login(page, "coach-b@example.test");
  await goToCoachSection(page, "Bibliothèque");
  await expect(page).toHaveURL(/\/coach\/bibliotheque$/);
  await expect(page.getByRole("link", { name: "Exercise data by RepDB (repdb.co)" })).toBeVisible();

  // Hyrox : les 8 stations, dans l'ordre de la course, avec les illustrations de Coory.
  await chooseCategory(page, /^Tous( \d+)?$/, /^Hyrox/);
  await expect(page).toHaveURL(/rubrique=hyrox/);
  await expect(page.getByRole("heading", { name: "8 exercices" })).toBeVisible();
  const cards = results(page).getByRole("listitem");
  await expect(cards.first()).toContainText("SkiErg");
  await expect(cards.first()).toContainText("Station 1");
  await expect(cards.nth(7)).toContainText("Wall ball");
  await expect(page.getByRole("link", { name: /Sled pull assis/ })).toHaveCount(0);

  // Recherche sans accents, en français ou en anglais (alias).
  await chooseCategory(page, /^Hyrox/, /^Tous/);
  const search = page.getByRole("searchbox", { name: "Rechercher un exercice" });
  await search.fill("developpe couche barre");
  await expect(page.getByRole("heading", { name: "3 exercices" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Développé couché barre Barre/ })).toBeVisible();
  await search.fill("rdl");
  await expect(page.getByRole("link", { name: /^Soulevé de terre roumain/ }).first()).toBeVisible();

  // La fiche : images, muscles et matériel, consignes traduites, mention RepDB ; pas de réglages de
  // séance (ils viendront dans la création de programme).
  await search.fill(mine.query);
  await page
    .getByRole("link", { name: new RegExp(`^${mine.name}`) })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/coach/bibliotheque/${mine.key}$`));
  await expect(page.getByRole("heading", { level: 1, name: mine.name })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Consignes" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Muscles principaux" }).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dans une séance, tu règles" })).toHaveCount(0);
  // Next garde la liste quittée, cachée, dans la page : seule la mention visible compte.
  await expect(
    page.getByRole("link", { name: "Exercise data by RepDB (repdb.co)" }).filter({ visible: true }),
  ).toBeVisible();

  // Favori depuis la fiche, retrouvé dans « Favoris » au retour (la recherche est gardée).
  // Ordinateur : le bouton « Favori » de l'en-tête ; téléphone : le menu ⋮ de la barre du haut.
  if (testInfo.project.name === "telephone") {
    const more = page.getByRole("button", { name: "Plus d'actions" });
    await more.click();
    await page.getByRole("button", { name: "Mettre en favori" }).click();
    await page.waitForLoadState("networkidle");
    await more.click();
    await expect(page.getByRole("button", { name: "Retirer des favoris" })).toBeVisible();
    await page.keyboard.press("Escape");
  } else {
    const favorite = page.getByRole("button", { name: "Favori", exact: true });
    await expect(favorite).toHaveAttribute("aria-pressed", "false");
    await favorite.click();
    await expect(favorite).toHaveAttribute("aria-pressed", "true");
    await page.waitForLoadState("networkidle");
  }
  await page.getByRole("link", { name: "Bibliothèque" }).filter({ visible: true }).first().click();
  await expect(search).toHaveValue(mine.query);
  await chooseCategory(page, /^Tous( \d+)?$/, /^Favoris/);
  const star = page.getByRole("button", { name: `Mettre ${mine.name} en favori` });
  await expect(star).toHaveAttribute("aria-pressed", "true");

  // Retiré depuis la carte : après rechargement, il n'est plus dans les favoris.
  await star.click();
  await expect(star).toHaveAttribute("aria-pressed", "false");
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByRole("link", { name: new RegExp(`^${mine.name}`) })).toHaveCount(0);
});

test("un exercice masqué ou inconnu n'a pas de fiche", async ({ page }) => {
  await login(page, "coach-b@example.test");
  await page.goto("/coach/bibliotheque/sled-pull-seated");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await page.goto("/coach/bibliotheque/n-existe-pas");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  // Page d'erreur dans la coquille (D-147) : aucun lien du menu actif, retour au tableau de bord.
  await expect(page.locator('nav a[aria-current="page"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Retour au tableau de bord" })).toBeVisible();
});
