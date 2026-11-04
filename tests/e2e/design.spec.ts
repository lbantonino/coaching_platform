import { expect, test, type Page } from "@playwright/test";

// Identité visuelle Coory : logo définitif (04/11/2026, docs/design/coory-brand), icônes et thème.

test("le logo Coory est annoncé par son nom, avec le favicon, l'icône iPhone et l'aperçu de partage du kit", async ({
  page,
}) => {
  await page.goto("/");
  // Le logo (icône + COORY) est lu « Coory » par un lecteur d'écran.
  await expect(page.getByRole("img", { name: "Coory" })).toBeVisible();
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    "href",
    "/icon.svg",
  );
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute(
    "href",
    "/favicon.ico",
  );
  // Seuls le SVG (qui suit le thème du navigateur) et le .ico de secours : pas de PNG que Chrome
  // pourrait préférer.
  await expect(page.locator('link[rel="icon"]')).toHaveCount(2);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/apple-touch-icon.png",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/og-image\.png$/,
  );
  // Le manifeste liste les trois icônes du kit (192, 512 et « maskable »).
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
    "/icon-192.png",
    "/icon-512.png",
    "/icon-maskable-512.png",
  ]);
});

test("le graphite (sombre) est le défaut, le clair se choisit et reste après rechargement", async ({
  page,
}) => {
  // Design system « Graphite & Or » (29/10/2026) : sombre par défaut.
  const html = page.locator("html");
  await page.goto("/login");
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "Passer au thème clair" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");

  // Le choix est retenu dans ce navigateur et appliqué avant l'affichage.
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Passer au thème sombre" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("sur téléphone, le menu hamburger couvre tout l'écran, contient le compte, et ✕ le referme", async ({
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
  // Tout l'écran (02/11), sans élargir la page.
  const size = page.viewportSize();
  await expect.poll(async () => (await menu.boundingBox())?.x ?? -1).toBe(0);
  expect((await menu.boundingBox())?.width).toBe(size?.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size?.width);
  await menu.getByRole("button", { name: /^Menu du compte/ }).click();
  await expect(
    menu.getByRole("group", { name: "Menu du compte" }).getByRole("button", {
      name: "Se déconnecter",
    }),
  ).toBeVisible();
  // Échap ferme le menu du compte, puis le menu.
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  // ✕, à la place du ☰, le referme aussi.
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: "Fermer le menu" }).click();
  await expect(menu).toBeHidden();
});

test("le menu de gauche : Assistant IA puis Messages, Notifications ; le menu du compte mène aux Paramètres", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "ordinateur", "Barre latérale de l'ordinateur");
  await loginAsCoachA(page);
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  // Le menu s'affiche avec la session (derrière Suspense) : l'attendre avant de lire ses entrées.
  await expect(nav.getByRole("link", { name: "Tâches", exact: true })).toBeVisible();
  const labels = await nav.getByRole("link").allInnerTexts();
  const names = labels.map((label) => label.trim().split("\n")[0]);
  // Messages juste en dessous de l'Assistant IA ; Notifications dans la même section.
  expect(names.indexOf("Messages")).toBe(names.indexOf("Assistant IA") + 1);
  expect(names).toContain("Notifications");
  expect(names).not.toContain("Paramètres");

  const account = page.getByRole("button", { name: /^Menu du compte/ });
  await expect(account).toContainText("Coach");
  await account.click();
  const settings = page.getByRole("group", { name: "Menu du compte" });
  for (const name of ["Mon profil", "Paramètres"]) {
    await expect(settings.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(settings.getByRole("button", { name: "Changer de compte" })).toBeVisible();
  // Le thème se change aussi directement dans ce menu.
  await settings.getByText("Sombre", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await settings.getByText("Clair", { exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
  // D-58 : les Paramètres s'ouvrent en grande fenêtre par-dessus la page, qu'on ne quitte pas.
  await settings.getByRole("button", { name: "Paramètres", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Paramètres" })).toBeVisible();
  await expect(page).toHaveURL(/\/coach$/);
});

test("dans les Paramètres, le thème se choisit : clair, sombre ou celui de l'appareil", async ({
  page,
}) => {
  const html = page.locator("html");
  await loginAsCoachA(page);
  await page.goto("/coach/profil?onglet=preferences");
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
  await page.goto("/coach/profil?onglet=securite");
  await expect(page.getByRole("region", { name: "Adresse e-mail" })).toContainText(
    "coach-a@example.test",
  );
});
