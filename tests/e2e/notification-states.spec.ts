import { expect, test, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Notifications lues et masquées (4e, D-61). Un seul projet : l'état est propre au coach, les deux
// projets se marcheraient dessus. Coach B : les tests du coach A en créent pendant ce temps. En série,
// et chaque test remet en place ce qu'il a changé.
test.describe.configure({ mode: "serial" });
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

const bellCount = async (page: Page) => {
  const label = await page
    .getByRole("link", { name: /^Notifications(, \d+ à voir)?$/ })
    .first()
    .getAttribute("aria-label");
  return Number(label?.match(/\d+/)?.[0] ?? 0);
};

test("une notification se marque lue, non lue, et se masque avec « Annuler »", async ({ page }) => {
  test.skip(isPhone(page), "État propre au coach B : un seul projet.");
  await login(page, "coach-b@example.test");
  await page.goto("/coach/notifications");
  const before = await bellCount(page);
  const messages = page.getByRole("region", { name: /Messages non lus/ });
  const sarah = messages.getByRole("link", { name: /Sarah/ });
  const menu = messages.getByRole("button", { name: /^Plus d'actions : Sarah/ });
  const sheet = page.getByRole("dialog", { name: /^Sarah/ });
  await expect(sarah).toContainText("Non lue");

  await menu.click();
  await sheet.getByRole("button", { name: "Marquer comme lue" }).click();
  await expect(sarah).not.toContainText("Non lue");
  await expect.poll(() => bellCount(page)).toBe(before - 1);

  await menu.click();
  await sheet.getByRole("button", { name: "Marquer comme non lue" }).click();
  await expect(sarah).toContainText("Non lue");
  await expect.poll(() => bellCount(page)).toBe(before);

  // Masquer : la ligne disparaît ; « Annuler » la fait revenir.
  await menu.click();
  await sheet.getByRole("button", { name: "Masquer" }).click();
  await expect(sarah).toHaveCount(0);
  await expect.poll(() => bellCount(page)).toBe(before - 1);
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(sarah).toBeVisible();
  await expect.poll(() => bellCount(page)).toBe(before);
});

test("« Tout marquer comme lu » vide la cloche ; une tâche reportée revient non lue", async ({
  page,
}) => {
  test.skip(isPhone(page), "État propre au coach B : un seul projet.");
  const title = `Notif ${Date.now()}`;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(
    new Date(),
  );
  await login(page, "coach-b@example.test");
  // Une tâche du jour pour le coach B : elle devient une notification.
  await page.goto("/coach/taches");
  await page.getByRole("button", { name: "Nouvelle tâche" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle tâche" });
  await sheet.getByRole("textbox", { name: "Tâche" }).fill(title);
  await sheet.getByLabel(/^Échéance/).fill(today);
  await sheet.getByRole("button", { name: "Ajouter la tâche" }).click();
  await expect(page.getByText("Tâche ajoutée.")).toBeVisible();

  await page.goto("/coach/notifications");
  const row = page.getByRole("link", { name: new RegExp(title) });
  await expect(row).toContainText("Non lue");
  await page.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await expect(page.getByText("Tout est marqué comme lu.")).toBeVisible();
  await expect(page.getByText("Tout est à jour.")).toBeVisible();
  await expect(row).not.toContainText("Non lue");
  await expect.poll(() => bellCount(page)).toBe(0);
  // Le message de Sarah redevient non lu (le test précédent en a besoin à la prochaine exécution).
  await page
    .getByRole("region", { name: /Messages non lus/ })
    .getByRole("button", { name: /^Plus d'actions : Sarah/ })
    .click();
  await page
    .getByRole("dialog", { name: /^Sarah/ })
    .getByRole("button", { name: "Marquer comme non lue" })
    .click();
  await expect.poll(() => bellCount(page)).toBe(1);

  // Remise en place : la tâche est supprimée, sa notification avec elle.
  await page.goto("/coach/taches");
  await page
    .getByRole("listitem")
    .filter({ hasText: title })
    .getByRole("button", { name: title })
    .click();
  await page
    .getByRole("dialog", { name: "Modifier la tâche" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page
    .getByRole("dialog", { name: "Supprimer cette tâche ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Tâche supprimée.")).toBeVisible();
});
