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

// MVP espace coach seul (D-167) : plus de message de Sarah dans les notifications. Chaque test crée
// sa propre notification, une tâche du jour du coach B, et la supprime à la fin.
async function addTodayTask(page: Page, title: string) {
  // Ajout rapide dans la vue « Aujourd'hui » (kit « Coory Pages », 01, D-129) : échéance aujourd'hui.
  await page.goto("/coach/taches?vue=aujourdhui");
  const quick = page.getByRole("textbox", { name: "Nouvelle tâche" }).filter({ visible: true });
  await quick.fill(title);
  await quick.press("Enter");
  await expect(
    page.getByRole("listitem").filter({ hasText: title }).filter({ visible: true }),
  ).toContainText("Aujourd'hui");
}

async function deleteTask(page: Page, title: string) {
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
}

const bellCount = async (page: Page) => {
  // La cloche : un lien sur téléphone, un bouton (aperçu) sur ordinateur.
  const label = await page
    .locator('[aria-label^="Notifications"]')
    .first()
    .getAttribute("aria-label");
  return Number(label?.match(/\d+/)?.[0] ?? 0);
};

test("une notification se marque lue, non lue, et se masque avec « Annuler »", async ({ page }) => {
  test.skip(isPhone(page), "État propre au coach B : un seul projet.");
  const title = `Lue ${Date.now()}`;
  await login(page, "coach-b@example.test");
  await addTodayTask(page, title);
  await page.goto("/coach/notifications");
  const before = await bellCount(page);
  const tasks = page.getByRole("region", { name: /Tâches du jour/ });
  const entry = tasks.getByRole("link", { name: new RegExp(title) });
  const menu = tasks.getByRole("button", { name: `Plus d'actions : ${title}` });
  const sheet = page.getByRole("dialog", { name: new RegExp(`^${title}`) });
  await expect(entry).toContainText("Non lue");

  await menu.click();
  await sheet.getByRole("button", { name: "Marquer comme lu", exact: true }).click();
  await expect(entry).not.toContainText("Non lue");
  await expect.poll(() => bellCount(page)).toBe(before - 1);

  await menu.click();
  await sheet.getByRole("button", { name: "Marquer comme non lu" }).click();
  await expect(entry).toContainText("Non lue");
  await expect.poll(() => bellCount(page)).toBe(before);

  // Masquer : la ligne disparaît ; « Annuler » la fait revenir.
  await menu.click();
  await sheet.getByRole("button", { name: "Masquer" }).click();
  await expect(entry).toHaveCount(0);
  await expect.poll(() => bellCount(page)).toBe(before - 1);
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(entry).toBeVisible();
  await expect.poll(() => bellCount(page)).toBe(before);
  await deleteTask(page, title);
});

test("« Tout marquer comme lu » vide la cloche ; une tâche reportée revient non lue", async ({
  page,
}) => {
  test.skip(isPhone(page), "État propre au coach B : un seul projet.");
  const title = `Notif ${Date.now()}`;
  await login(page, "coach-b@example.test");
  // Une tâche du jour pour le coach B : elle devient une notification.
  await addTodayTask(page, title);

  await page.goto("/coach/notifications");
  const row = page.getByRole("link", { name: new RegExp(title) });
  await expect(row).toContainText("Non lue");
  await page.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await expect(page.getByText("Tout est marqué comme lu.")).toBeVisible();
  await expect(page.getByText("Tout est lu", { exact: true })).toBeVisible();
  await expect(row).not.toContainText("Non lue");
  await expect.poll(() => bellCount(page)).toBe(0);

  // Remise en place : la tâche est supprimée, sa notification avec elle.
  await deleteTask(page, title);
});

// Kit « Coory Pages », page 03 (D-128) : onglet « Masquées » (réversible), « Supprimer » (cachée pour
// de bon, « Annuler » 5 s) et la sélection avec ses actions groupées.
test("Masquées, Supprimer avec « Annuler », et masquer par la sélection", async ({ page }) => {
  test.skip(isPhone(page), "État propre au coach B : un seul projet.");
  const title = `Masquée ${Date.now()}`;
  await login(page, "coach-b@example.test");
  await addTodayTask(page, title);
  await page.goto("/coach/notifications");
  const before = await bellCount(page);
  const tasks = page.getByRole("region", { name: /Tâches du jour/ });
  const entry = page.getByRole("link", { name: new RegExp(title) });
  const menu = page.getByRole("button", { name: `Plus d'actions : ${title}` });
  const sheet = page.getByRole("dialog", { name: new RegExp(`^${title}`) });
  const tab = (name: string) =>
    page.getByRole("group", { name: "Filtrer les notifications" }).getByRole("button", {
      name: new RegExp(`^${name}`),
    });

  // Masquer : la ligne passe dans « Masquées », d'où elle revient (« Afficher à nouveau »).
  await menu.click();
  await sheet.getByRole("button", { name: "Masquer" }).click();
  await expect(tasks.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
  await tab("Masquées").click();
  await expect(entry).toBeVisible();
  await menu.click();
  await sheet.getByRole("button", { name: "Afficher à nouveau" }).click();
  await expect(entry).toHaveCount(0);
  await tab("Toutes").click();
  await expect(entry).toBeVisible();
  await expect.poll(() => bellCount(page)).toBe(before);

  // Supprimer : nulle part, même pas dans « Masquées » ; « Annuler » la fait revenir.
  await menu.click();
  await sheet.getByRole("button", { name: "Supprimer" }).click();
  await expect(entry).toHaveCount(0);
  await expect.poll(() => bellCount(page)).toBe(before - 1);
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(entry).toBeVisible();
  await expect.poll(() => bellCount(page)).toBe(before);

  // Sélection : la case de la tâche, puis « Masquer » dans la barre ; « Annuler » rétablit.
  await page.getByRole("button", { name: "Sélectionner", exact: true }).click();
  await page.getByRole("checkbox", { name: new RegExp(title) }).click();
  await expect(page.getByText("1 sélectionnée")).toBeVisible();
  await page.getByRole("button", { name: "Masquer", exact: true }).click();
  await expect(page.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
  await expect(page.getByText("Notification masquée.")).toBeVisible();
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(entry).toBeVisible();
  await expect.poll(() => bellCount(page)).toBe(before);
  await deleteTask(page, title);
});
