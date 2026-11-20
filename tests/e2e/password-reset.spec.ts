import { expect, test, type APIRequestContext } from "@playwright/test";

import { logoutCoach, signUpFreshCoach } from "./helpers";

// Parcours « mot de passe oublié » de bout en bout, e-mail compris.
// Les e-mails locaux sont capturés par Mailpit (http://127.0.0.1:54324), lu ici via son API.
const MAILPIT = "http://127.0.0.1:54324/api/v1";
const RESET_ACCOUNT = "coach-reset@example.test"; // compte dédié (supabase/seed.sql)
// Réponse identique que le compte existe ou non (rien n'est révélé).
const SENT_MESSAGE = /un lien vient d.être envoyé\. Il est valable 1 h\./;

async function clearMailbox(request: APIRequestContext, email: string) {
  await request.delete(`${MAILPIT}/search`, { params: { query: `to:"${email}"` } });
}

async function waitForResetLink(request: APIRequestContext, email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const search = await request.get(`${MAILPIT}/search`, { params: { query: `to:"${email}"` } });
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const message = await request.get(`${MAILPIT}/message/${messages[0].ID}`);
      const { HTML, Text } = (await message.json()) as { HTML: string; Text: string };
      // Le lien du modèle Coory (vers l'app) ou, à défaut, celui de Supabase.
      const link = `${Text}\n${HTML}`
        .replaceAll("&amp;", "&")
        .match(
          /http:\/\/(?:localhost:3100\/auth\/confirm|127\.0\.0\.1:54321\/auth\/v1\/verify)\?[^\s)\]"<>]+/,
        )?.[0];
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
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByRole("status")).toContainText(SENT_MESSAGE);
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
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByRole("status")).toContainText(SENT_MESSAGE);

  // 2. Ouverture du lien reçu par e-mail.
  const link = await waitForResetLink(request, RESET_ACCOUNT);
  await page.goto(link);
  await expect(page).toHaveURL(/\/nouveau-mot-de-passe$/);
  // Le lien n'est vérifié qu'à l'enregistrement : la page ne connaît pas encore le compte.
  await expect(
    page.getByText("Choisis le nouveau mot de passe de ton compte Coory."),
  ).toBeVisible();

  // 3. Mot de passe trop court refusé, puis nouveau mot de passe valide.
  await page.getByLabel("Nouveau mot de passe").fill("court");
  await page.getByLabel("Confirmation", { exact: true }).fill("court");
  await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "au moins 10 caractères" })).toBeVisible();

  await page.getByLabel("Nouveau mot de passe").fill(newPassword);
  await page.getByLabel("Confirmation", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  // 4. Le lien est à usage unique.
  await logoutCoach(page);
  // Attendre la fin de la déconnexion : naviguer trop tôt interromprait l'action.
  await expect(page).toHaveURL(/\/login$/);
  // Rouvert, le lien affiche le formulaire (il n'est vérifié qu'à l'enregistrement), puis il est refusé.
  await page.goto(link);
  await expect(page).toHaveURL(/\/nouveau-mot-de-passe$/);
  const again = `encore-${Date.now()}`;
  await page.getByLabel("Nouveau mot de passe").fill(again);
  await page.getByLabel("Confirmation", { exact: true }).fill(again);
  await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
  await expect(page).toHaveURL(/\/lien-invalide$/);
  await expect(page.getByRole("heading", { name: "Ce lien n'est plus valide" })).toBeVisible();

  // 5. Connexion avec le nouveau mot de passe.
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(RESET_ACCOUNT);
  await page.getByLabel("Mot de passe", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByRole("heading", { name: "Tableau de bord", level: 1 })).toBeVisible();
});

// Incident du 20/11/2026 en ligne : le lien ouvert ailleurs que dans le navigateur de la demande (app
// Gmail, Coory installée sur l'écran d'accueil, autre ordinateur) menait à « lien invalide », alors que
// Supabase l'avait accepté. Et le robot d'une messagerie qui ouvre le lien avant la personne ne doit
// pas le consommer.
test("le lien marche dans un autre navigateur que celui de la demande, même ouvert avant par un robot", async ({
  page,
  request,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "ordinateur", "parcours e-mail exécuté sur un seul profil");
  // Un compte neuf, à lui seul : le compte de réinitialisation partagé sert au test précédent.
  const email = await signUpFreshCoach(page, request, testInfo);
  await logoutCoach(page);
  await expect(page).toHaveURL(/\/login$/);
  await clearMailbox(request, email);

  await page.goto("/mot-de-passe-oublie");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByRole("status")).toContainText(SENT_MESSAGE);
  const link = await waitForResetLink(request, email);

  // Le robot d'une messagerie ouvre le lien d'abord, sans les cookies de personne.
  await request.get(link);

  // La personne l'ouvre dans un autre navigateur, qui n'a aucun cookie de la demande.
  const elsewhere = await browser.newContext();
  const other = await elsewhere.newPage();
  await other.goto(link);
  await expect(other).toHaveURL(/\/nouveau-mot-de-passe$/);
  const newPassword = `ailleurs-${Date.now()}`;
  await other.getByLabel("Nouveau mot de passe").fill(newPassword);
  await other.getByLabel("Confirmation", { exact: true }).fill(newPassword);
  await other.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
  await expect(other).toHaveURL(/\/coach$/);
  await elsewhere.close();

  // Le nouveau mot de passe ouvre le compte, dans le premier navigateur aussi.
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
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

// Revue de sécurité du 13/11/2026 : une session ordinaire (ordinateur resté connecté) ne permet pas
// de choisir un nouveau mot de passe sans l'ancien. Seul le lien de réinitialisation l'ouvre.
test("connecté normalement, « Nouveau mot de passe » n'est pas accessible", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/nouveau-mot-de-passe");
  await expect(page).toHaveURL(/\/lien-invalide$/);
});
