import { expect, test, type Page } from "@playwright/test";

// Assistant IA (kit « Coory Pages », page 02, D-132), réservé à l'abonnement mensuel Coory depuis
// D-168 (13/11/2026). Le coach C (organisation A, non abonnée, adresse non autorisée, D-171) voit la
// boîte et la page verrouillées, sans saisie ni suggestion : aucune demande ne peut partir chez
// Claude. La base refuse aussi toute demande (supabase/tests/database/41 et 44).
// Rien n'est écrit : les deux projets peuvent tourner en même temps.
const LOCKED = "L'Assistant IA est disponible avec l'abonnement mensuel Coory.";

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
  const button = page
    .getByRole("button", { name: "Assistant IA" })
    .filter({ visible: true })
    .first();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  const box = page.getByRole("dialog", { name: "Assistant IA" });
  await expect(box).toContainText(LOCKED);
  await expect(box).toContainText("Il n'est pas activé pour ton organisation.");
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
  await page
    .getByRole("button", { name: "Assistant IA" })
    .filter({ visible: true })
    .first()
    .click();
  const box = page.getByRole("dialog", { name: "Assistant IA" });
  await expect(box.getByLabel("Ta demande à l'assistant")).toBeVisible();
  await expect(box).toContainText("N'écris pas de données de santé ici.");
  await expect(box).not.toContainText(LOCKED);
});
