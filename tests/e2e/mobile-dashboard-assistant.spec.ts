import { expect, test, type Page } from "@playwright/test";

// Retouches du téléphone (demandes d'Antonino du 19/11, maquettes validées) : sur le tableau de bord,
// une carte par ligne et une « Prochaine séance » détaillée ; l'Assistant IA en page plein écran,
// façon messagerie (sur le modèle de ChatGPT), où mènent l'icône du haut ET le menu. L'ordinateur ne
// change pas (ses tests restent ceux de la boîte).

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "telephone", "retouches du téléphone");
});

test("tableau de bord : Prochaine séance et Tâches en pleine largeur, la séance détaillée", async ({
  page,
}) => {
  await login(page);
  const next = page.locator('section[aria-labelledby="next-session-title"]');
  const tasks = page.locator('section[aria-labelledby="tasks-title"]');
  const upcoming = page.getByRole("region", { name: "Séances à venir" });
  const width = async (locator: typeof next) => (await locator.boundingBox())!.width;
  const full = await width(upcoming);
  expect(Math.abs((await width(next)) - full)).toBeLessThan(2);
  expect(Math.abs((await width(tasks)) - full)).toBeLessThan(2);
  // Une carte par ligne : les Tâches sous la Prochaine séance.
  expect((await tasks.boundingBox())!.y).toBeGreaterThan((await next.boundingBox())!.y);
  // Le détail : l'heure de fin, la durée, et les étiquettes de la séance.
  await expect(next).toContainText(/jusqu'à \d{2}:\d{2}/);
  await expect(next).toContainText(/\d+ min/);
  await expect(next).toContainText(/Individuelle|Collective/);
});

test("Assistant IA : l'icône du haut mène à la page, plein écran, sans cadre", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Assistant IA" }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/coach\/assistant$/);

  const surface = page.getByRole("region", { name: "Assistant IA" });
  const style = await surface.evaluate((element) => {
    const css = getComputedStyle(element);
    return { radius: css.borderTopLeftRadius, background: css.backgroundColor };
  });
  expect(style).toEqual({ radius: "0px", background: "rgba(0, 0, 0, 0)" });
  // Tout l'écran sur le fond des cartes, tant que la page est affichée.
  await expect(page.locator("html")).toHaveAttribute("data-assistant-screen", "");
  // Pas de bouton vers l'assistant quand on y est.
  await expect(
    page.getByRole("link", { name: "Assistant IA" }).filter({ visible: true }),
  ).toHaveCount(0);

  // Les raccourcis en lignes, juste au-dessus de la saisie, collée en bas de l'écran.
  const field = page.getByLabel("Ta demande à l'assistant");
  const shortcut = page.getByRole("list", { name: "Raccourcis" }).getByRole("button").first();
  const fieldBox = (await field.boundingBox())!;
  expect((await shortcut.boundingBox())!.y).toBeLessThan(fieldBox.y);
  expect(fieldBox.y + fieldBox.height).toBeGreaterThan(page.viewportSize()!.height * 0.65);

  // Ailleurs, le fond normal revient.
  await page.goto("/coach");
  await expect(page.locator("html")).not.toHaveAttribute("data-assistant-screen", "");
});
