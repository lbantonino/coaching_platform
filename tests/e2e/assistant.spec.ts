import { expect, test, type Page } from "@playwright/test";

// Assistant IA, kit « Coory Pages », page 02 (D-132 ; décision 15) : la boîte s'ouvre par-dessus la
// page, une demande reçoit la réponse HONNÊTE tant qu'aucun fournisseur d'IA n'est branché (jamais
// de fausse réponse), « Plein écran » garde la conversation, « Nouvelle conversation » la vide.
// Rien n'est enregistré : les deux projets peuvent tourner en même temps.
async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("la boîte de l'assistant répond honnêtement, puis « Plein écran » garde la conversation", async ({
  page,
}) => {
  await loginAsCoachA(page);
  const button = page
    .getByRole("button", { name: "Assistant IA" })
    .filter({ visible: true })
    .first();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  const box = page.getByRole("dialog", { name: "Assistant IA" });
  await expect(box).toContainText(/Que veux-tu faire/);
  await expect(page).toHaveURL(/\/coach$/);

  // Champ vide : « Envoyer » grisé ; Entrée envoie.
  await expect(box.getByRole("button", { name: "Envoyer" })).toBeDisabled();
  const field = box.getByLabel("Ta demande à l'assistant");
  await field.fill("Prépare le bloc 2 du programme de Lucas");
  await field.press("Enter");
  const thread = box.getByRole("list", { name: "Conversation avec l'assistant" });
  await expect(thread).toContainText("Prépare le bloc 2 du programme de Lucas");
  await expect(thread).toContainText("Je ne suis pas encore branché");
  await expect(field).toHaveValue("");

  // Plein écran : la page, avec la même conversation.
  await box.getByRole("button", { name: "Plein écran" }).click();
  await expect(page).toHaveURL(/\/coach\/assistant$/);
  const pageThread = page.getByRole("list", { name: "Conversation avec l'assistant" });
  await expect(pageThread).toContainText("Prépare le bloc 2 du programme de Lucas");

  // Nouvelle conversation : l'accueil revient.
  await page
    .getByRole("button", { name: "Nouvelle conversation" })
    .filter({ visible: true })
    .first()
    .click();
  await expect(pageThread).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Comment puis-je t'aider/ })).toBeVisible();

  // Un raccourci envoie sa demande (réponse honnête, rien n'est inventé).
  await page.getByRole("button", { name: /^Analyser/ }).click();
  await expect(pageThread).toContainText("Je ne suis pas encore branché");
});
