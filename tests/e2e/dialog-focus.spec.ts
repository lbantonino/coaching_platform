import { expect, test, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Recette du 19/11/2026 (iPhone d'Antonino) : à l'ouverture des Paramètres, le contour violet du
// focus clavier entourait le premier bouton de la fenêtre, alors qu'on l'avait ouverte au doigt.
// Ouverte au doigt, à la souris ou par son adresse, une fenêtre prend le focus elle-même, sans
// contour ; ouverte au clavier, sa première commande le prend, contour visible (accessibilité).
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-b@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// L'élément qui a le focus : sa balise et son contour.
const focused = (page: Page) =>
  page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    return {
      tag: element?.tagName ?? null,
      outline: element ? getComputedStyle(element).outlineStyle : null,
      visible: element ? element.matches(":focus-visible") : false,
      inDialog: Boolean(element?.closest("dialog[open]")),
    };
  });

test("ouverte au doigt ou à la souris, la fenêtre des Paramètres n'entoure aucun bouton", async ({
  page,
}) => {
  await login(page);
  if (isPhone(page)) await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page
    .getByRole("button", { name: /^Menu du compte/ })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Paramètres", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Paramètres" })).toBeVisible();
  await expect.poll(() => focused(page)).toMatchObject({ tag: "DIALOG", outline: "none" });
});

test("ouverte par son adresse, la fenêtre des Paramètres n'entoure aucun bouton", async ({
  page,
}) => {
  await login(page);
  await page.goto("/coach/profil?onglet=profil");
  await expect(page.getByRole("dialog", { name: "Paramètres" })).toBeVisible();
  await expect.poll(() => focused(page)).toMatchObject({ tag: "DIALOG", outline: "none" });
});

test("ouverte au clavier, une fenêtre donne le focus visible à sa première commande", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "telephone", "Le clavier se vérifie sur ordinateur.");
  await login(page);
  await page.getByRole("button", { name: "Créer", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Créer" })).toBeVisible();
  await expect.poll(() => focused(page)).toMatchObject({ inDialog: true, visible: true });
  expect((await focused(page)).tag).not.toBe("DIALOG");
});
