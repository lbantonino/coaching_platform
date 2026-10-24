import { expect, test, type Page } from "@playwright/test";

// Identité visuelle Coory (COORY_DESIGN_SYSTEM.md, COORY_LOGO.md) : logo, icônes et thème.

test("le logo Coory est annoncé par son nom et le favicon est le symbole rouge", async ({
  page,
}) => {
  await page.goto("/");
  // Le wordmark « C + boucle infinie + ry » est lu « Coory » par un lecteur d'écran.
  await expect(page.getByRole("img", { name: "Coory" })).toBeVisible();
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    "href",
    /icon\.svg/,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    /apple-icon\.png/,
  );
});

test("le thème clair est le défaut, le sombre se choisit et reste après rechargement", async ({
  page,
}) => {
  const html = page.locator("html");
  await page.goto("/login");
  await expect(html).not.toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "Passer au thème sombre" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  // Le choix est retenu dans ce navigateur et appliqué avant l'affichage.
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "Passer au thème clair" }).click();
  await expect(html).not.toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).not.toHaveAttribute("data-theme", "dark");
});

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("sur téléphone, le menu hamburger remplace la barre du bas et contient la roue dentée", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "telephone", "Menu propre au téléphone");
  await loginAsCoachA(page);
  await expect(
    page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();
  await menu.getByRole("button", { name: "Paramètres et compte" }).click();
  await expect(
    menu.getByRole("group", { name: "Paramètres et compte" }).getByRole("button", {
      name: "Se déconnecter",
    }),
  ).toBeVisible();
  await menu.getByRole("button", { name: "Fermer le menu" }).click();
  await expect(menu).toBeHidden();
});

test("le menu de gauche : Assistant IA et Notifications ; la roue dentée mène aux Paramètres", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "ordinateur", "Barre latérale de l'ordinateur");
  await loginAsCoachA(page);
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  // Le menu s'affiche avec la session (derrière Suspense) : l'attendre avant de lire ses entrées.
  await expect(nav.getByRole("link", { name: "Tâches", exact: true })).toBeVisible();
  const labels = await nav.getByRole("link").allInnerTexts();
  const names = labels.map((label) => label.trim().split("\n")[0]);
  // Assistant IA juste au-dessus de Tâches, Notifications juste au-dessus de Messages.
  expect(names.indexOf("Assistant IA")).toBe(names.indexOf("Tâches") - 1);
  expect(names.indexOf("Notifications")).toBe(names.indexOf("Messages") - 1);
  expect(names).not.toContain("Paramètres");

  await page.getByRole("button", { name: "Paramètres et compte" }).click();
  const settings = page.getByRole("group", { name: "Paramètres et compte" });
  await expect(settings.getByRole("radio", { name: "Système" })).toBeVisible();
  await settings.getByRole("link", { name: "Paramètres" }).click();
  await expect(page.getByRole("heading", { name: "Paramètres", level: 1 })).toBeVisible();
});

test("dans les Paramètres, le thème se choisit : clair, sombre ou celui de l'appareil", async ({
  page,
}) => {
  const html = page.locator("html");
  await loginAsCoachA(page);
  await page.goto("/coach/profil");
  const theme = page.getByRole("region", { name: "Thème" });
  await theme.getByText("Sombre", { exact: true }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  // « Système » suit l'appareil (clair dans le navigateur de test, puis sombre quand il le devient).
  await theme.getByText("Système", { exact: true }).click();
  await expect(html).not.toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await theme.getByText("Clair", { exact: true }).click();
  await expect(html).not.toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("region", { name: "Compte" })).toContainText("coach-a@example.test");
});
