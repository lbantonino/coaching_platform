import { expect, test } from "@playwright/test";

// Recette du 19/11/2026 : juste après la connexion, l'espace coach restait un fond uni le temps que sa
// coquille lise la session (repli de chargement vide). Le premier HTML envoyé, avant les données,
// porte maintenant la silhouette de la page (shell-skeleton.tsx).
test("pendant le chargement, l'espace coach montre sa silhouette, jamais un écran vide", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  const html = await (await page.request.get("/coach")).text();
  const skeleton = html.indexOf("data-shell-skeleton");
  // La silhouette arrive d'abord, la vraie coquille (le menu) ensuite dans le flux.
  expect(skeleton).toBeGreaterThan(-1);
  expect(skeleton).toBeLessThan(html.indexOf("data-app-sidebar"));
});
