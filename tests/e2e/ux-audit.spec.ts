import { expect, test, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Retouches de l'audit apple-design (28/10) : une feuille se ferme en la glissant vers le bas
// (téléphone), sans bloquer la page pendant sa sortie ; un champ faux est signalé dès qu'on le quitte.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("téléphone : la feuille « Créer » se ferme en la glissant vers le bas par sa poignée", async ({
  page,
}) => {
  test.skip(!isPhone(page), "Geste propre au téléphone.");
  await login(page);
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Créer" });
  await expect(sheet).toBeVisible();
  // Fin de l'entrée : attrapée encore basse, la feuille relâchée se fermerait (c'est voulu).
  await page.waitForTimeout(700);
  // Un petit glissé lent (ni assez loin, ni lancé) : la feuille revient à sa place. Lent compte :
  // la fermeture tient compte de l'élan du geste, pas seulement de la distance.
  const grip = await sheet.locator("[data-sheet-grab]").first().boundingBox();
  const x = grip!.x + grip!.width / 2;
  const y = grip!.y + grip!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 8; step += 1) {
    await page.mouse.move(x, y + step * 5);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(150);
  await page.mouse.up();
  await expect(sheet).toBeVisible();
  // Un vrai glissé vers le bas : elle se ferme, et la page répond aussitôt.
  await page.waitForTimeout(600);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 420, { steps: 12 });
  await page.mouse.up();
  await expect(sheet).toBeHidden();
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await expect(sheet).toBeVisible();
});

test("un e-mail ou un téléphone faux est signalé dès qu'on quitte le champ", async ({ page }) => {
  await login(page);
  await page.goto(`/coach/o/${ORG_A}/sportifs/nouveau`);
  const email = page.getByRole("textbox", { name: /^Adresse e-mail/ });
  await email.fill("camille@");
  await page.getByRole("textbox", { name: /^Téléphone/ }).focus();
  await expect(page.getByText("Adresse e-mail invalide.")).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  // Corrigé : le message disparaît pendant la frappe.
  await email.fill("camille@example.test");
  await expect(page.getByText("Adresse e-mail invalide.")).toHaveCount(0);
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
});
