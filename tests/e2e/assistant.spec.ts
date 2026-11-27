import { expect, test, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Assistant IA (kit « Coory Pages », page 02, D-132), réservé à l'abonnement mensuel Coory depuis
// D-168 (13/11/2026). Le coach C (organisation A, non abonnée, adresse non autorisée, D-171) voit la
// boîte et la page verrouillées, sans saisie ni suggestion : aucune demande ne peut partir chez
// Claude. La base refuse aussi toute demande (supabase/tests/database/41 et 44).
// Rien n'est écrit : les deux projets peuvent tourner en même temps.
// Message de la bêta (demande d'Antonino du 14/11).
const LOCKED = "L'Assistant IA n'est pas encore disponible sur la version bêta.";

async function loginAsCoachC(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-c@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("sans abonnement Coory, l'assistant est verrouillé dans la boîte et sur sa page", async ({
  page,
}) => {
  await loginAsCoachC(page);
  // Téléphone (19/11) : l'icône du haut mène directement à la page de l'assistant, verrouillée.
  if (isPhone(page)) {
    await page
      .getByRole("link", { name: "Assistant IA" })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/coach\/assistant$/);
    await expect(page.getByRole("heading", { name: LOCKED })).toBeVisible();
    await expect(page.getByLabel("Ta demande à l'assistant")).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Raccourcis" })).toHaveCount(0);
    return;
  }
  const button = page
    .getByRole("button", { name: "Assistant IA" })
    .filter({ visible: true })
    .first();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  const box = page.getByRole("dialog", { name: "Assistant IA" });
  await expect(box).toContainText(LOCKED);
  await expect(box).toContainText(
    "Il sera disponible prochainement avec l'abonnement mensuel Coory.",
  );
  await expect(page).toHaveURL(/\/coach$/);

  // Ni saisie, ni « Envoyer », ni suggestions : aucune demande ne peut partir.
  await expect(box.getByLabel("Ta demande à l'assistant")).toHaveCount(0);
  await expect(box.getByRole("button", { name: "Envoyer" })).toHaveCount(0);
  await expect(box.getByRole("list", { name: "Suggestions" })).toHaveCount(0);

  // Plein écran : la page, verrouillée elle aussi.
  await box.getByRole("button", { name: "Plein écran" }).click();
  await expect(page).toHaveURL(/\/coach\/assistant$/);
  await expect(page.getByRole("heading", { name: LOCKED })).toBeVisible();
  await expect(page.getByLabel("Ta demande à l'assistant")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Raccourcis" })).toHaveCount(0);
});

// D-171 : le coach A (même organisation, non abonnée) est autorisé par son adresse : l'assistant
// est ouvert, avec la saisie et le rappel santé (faux Claude des tests, aucun appel payant).
test("autorisé par son adresse, le coach A a l'assistant ouvert sans abonnement", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  if (isPhone(page)) {
    await page
      .getByRole("link", { name: "Assistant IA" })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/coach\/assistant$/);
  } else {
    await page
      .getByRole("button", { name: "Assistant IA" })
      .filter({ visible: true })
      .first()
      .click();
  }
  const box = isPhone(page)
    ? page.getByRole("region", { name: "Assistant IA" })
    : page.getByRole("dialog", { name: "Assistant IA" });
  await expect(box.getByLabel("Ta demande à l'assistant")).toBeVisible();
  await expect(box).toContainText("N'écris pas de données de santé ici.");
  await expect(box).not.toContainText(LOCKED);
});

// Page de l'Assistant IA (27/11, demande d'Antonino) : la barre latérale, la barre du haut et la colonne
// « Nouvelle conversation » restent en place ; SEULE la conversation défile, et elle descend au
// dernier message. Le modèle simulé répond « Réponse simulée. ».
test("page de l'assistant : seule la conversation défile", async ({ page }) => {
  test.skip(isPhone(page), "Colonne de l'historique et molette : ordinateur.");
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/coach/assistant");
  const region = page.getByRole("region", { name: "Assistant IA" });
  const long = "Une longue demande pour remplir la conversation de l'assistant. ".repeat(20);
  for (let round = 1; round <= 4; round += 1) {
    const field = region.getByLabel("Ta demande à l'assistant");
    await field.fill(`${long}n°${round}`);
    await field.press("Enter");
    await expect(region.getByText("Réponse simulée.")).toHaveCount(round, { timeout: 20_000 });
  }
  const thread = region.getByRole("list", { name: "Conversation avec l'assistant" });
  const history = page.getByRole("navigation", { name: "Historique des conversations" });
  const title = page.getByRole("heading", { name: "Assistant IA", level: 1 });
  // La page ne défile pas ; le fil, si, et il est descendu au dernier message.
  expect(
    await page.evaluate(() => document.scrollingElement!.scrollHeight - window.innerHeight),
  ).toBeLessThanOrEqual(1);
  const metrics = () =>
    thread.evaluate((element) => ({
      top: element.scrollTop,
      room: element.scrollHeight - element.clientHeight,
    }));
  const bottom = await metrics();
  expect(bottom.room).toBeGreaterThan(100);
  await expect.poll(async () => (await metrics()).top).toBeGreaterThanOrEqual(bottom.room - 2);
  // La molette sur la conversation la fait remonter ; titre et historique ne bougent pas.
  const titleBefore = (await title.boundingBox())!.y;
  const historyBefore = (await history.boundingBox())!.y;
  const box = (await thread.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -600);
  await expect.poll(async () => (await metrics()).top).toBeLessThan(bottom.room - 100);
  expect((await title.boundingBox())!.y).toBe(titleBefore);
  expect((await history.boundingBox())!.y).toBe(historyBefore);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
