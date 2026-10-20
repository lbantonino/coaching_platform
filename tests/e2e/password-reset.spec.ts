import { expect, test, type APIRequestContext } from "@playwright/test";

// Parcours « mot de passe oublié » de bout en bout, e-mail compris.
// Les e-mails locaux sont capturés par Mailpit (http://127.0.0.1:54324), lu ici via son API.
const MAILPIT = "http://127.0.0.1:54324/api/v1";
const RESET_ACCOUNT = "coach-reset@example.test"; // compte dédié (supabase/seed.sql)
const SENT_MESSAGE = /Si un compte correspond à cette adresse/;

async function clearMailbox(request: APIRequestContext, email: string) {
  await request.delete(`${MAILPIT}/search`, { params: { query: `to:"${email}"` } });
}

async function waitForResetLink(request: APIRequestContext, email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const search = await request.get(`${MAILPIT}/search`, { params: { query: `to:"${email}"` } });
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const message = await request.get(`${MAILPIT}/message/${messages[0].ID}`);
      const { Text } = (await message.json()) as { Text: string };
      const link = Text.match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify\?[^\s)\]"<>]+/)?.[0];
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Aucun e-mail de réinitialisation reçu pour ${email}`);
}

test("un compte inconnu reçoit exactement la même réponse qu'un compte existant", async ({
  page,
}) => {
  await page.goto("/mot-de-passe-oublie");
  await page.getByLabel("Adresse e-mail").fill("personne@example.test");
  await page.getByRole("button", { name: "Recevoir un lien de réinitialisation" }).click();
  await expect(page.getByRole("status")).toHaveText(SENT_MESSAGE);
});

test("le coach réinitialise son mot de passe via l'e-mail et se reconnecte avec", async ({
  page,
  request,
}, testInfo) => {
  // Un seul profil : le compte de test est partagé et son mot de passe change à chaque exécution.
  test.skip(testInfo.project.name !== "ordinateur", "parcours e-mail exécuté sur un seul profil");

  const newPassword = `nouveau-${Date.now()}`;
  await clearMailbox(request, RESET_ACCOUNT);

  // 1. Demande depuis la page de connexion.
  await page.goto("/login");
  await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
  // Attendre la nouvelle page : sinon le champ e-mail de /login (même libellé) serait rempli
  // pendant la navigation, et le formulaire partirait vide.
  await expect(page.getByRole("heading", { name: "Mot de passe oublié" })).toBeVisible();
  await page.getByLabel("Adresse e-mail").fill(RESET_ACCOUNT);
  await page.getByRole("button", { name: "Recevoir un lien de réinitialisation" }).click();
  await expect(page.getByRole("status")).toHaveText(SENT_MESSAGE);

  // 2. Ouverture du lien reçu par e-mail.
  const link = await waitForResetLink(request, RESET_ACCOUNT);
  await page.goto(link);
  await expect(page).toHaveURL(/\/nouveau-mot-de-passe$/);
  await expect(page.getByText(`Compte : ${RESET_ACCOUNT}`)).toBeVisible();

  // 3. Mot de passe trop court refusé, puis nouveau mot de passe valide.
  await page.getByLabel("Nouveau mot de passe").fill("court");
  await page.getByLabel("Confirme le mot de passe").fill("court");
  await page.getByRole("button", { name: "Enregistrer le nouveau mot de passe" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "au moins 10 caractères" })).toBeVisible();

  await page.getByLabel("Nouveau mot de passe").fill(newPassword);
  await page.getByLabel("Confirme le mot de passe").fill(newPassword);
  await page.getByRole("button", { name: "Enregistrer le nouveau mot de passe" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  // 4. Le lien est à usage unique.
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page.goto(link);
  // Supabase ajoute un fragment #error=...otp_expired, conservé par le navigateur.
  await expect(page).toHaveURL(/\/lien-invalide(#.*)?$/);
  await expect(page.getByRole("heading", { name: "Lien invalide ou expiré" })).toBeVisible();

  // 5. Connexion avec le nouveau mot de passe.
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(RESET_ACCOUNT);
  await page.getByLabel("Mot de passe", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByText("Organisation Démo A")).toBeVisible();
});

test("un lien falsifié mène à la page « lien invalide »", async ({ page }) => {
  await page.goto("/auth/confirm?code=faux-code&next=/nouveau-mot-de-passe");
  await expect(page).toHaveURL(/\/lien-invalide$/);
});

test("une destination non autorisée après le lien est refusée (pas de redirection ouverte)", async ({
  page,
}) => {
  await page.goto("/auth/confirm?code=x&next=https://exemple-malveillant.test");
  await expect(page).toHaveURL(/\/lien-invalide$/);
});
