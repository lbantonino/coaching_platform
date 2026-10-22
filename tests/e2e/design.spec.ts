import { expect, test } from "@playwright/test";

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

test("le thème sombre est le défaut, le clair se choisit et reste après rechargement", async ({
  page,
}) => {
  const html = page.locator("html");
  await page.goto("/login");
  await expect(html).not.toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Passer au thème clair" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");

  // Le choix est retenu dans ce navigateur et appliqué avant l'affichage.
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Passer au thème sombre" }).click();
  await expect(html).not.toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html).not.toHaveAttribute("data-theme", "light");
});
