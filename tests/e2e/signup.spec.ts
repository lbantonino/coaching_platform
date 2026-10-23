import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// Inscription libre (D-30), e-mail de confirmation compris (Mailpit, http://127.0.0.1:54324).
const MAILPIT = "http://127.0.0.1:54324/api/v1";
const PASSWORD = "un-mot-de-passe-solide";

async function confirmationLink(request: APIRequestContext, email: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await request.get(`${MAILPIT}/search`, { params: { query: `to:"${email}"` } });
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const message = await request.get(`${MAILPIT}/message/${messages[0].ID}`);
      const { HTML, Text } = (await message.json()) as { HTML: string; Text: string };
      const link = `${Text}\n${HTML}`
        .replaceAll("&amp;", "&")
        .match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify\?[^\s)\]"<>]+/)?.[0];
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Aucun e-mail de confirmation reçu pour ${email}`);
}

async function fillSignup(
  page: Page,
  values: { kind: "Je suis coach" | "Je suis sportif"; first: string; last: string; email: string },
) {
  await page.goto("/inscription");
  await page.getByText(values.kind, { exact: true }).click();
  await page.getByLabel("Prénom").fill(values.first);
  await page.getByLabel("Nom", { exact: true }).fill(values.last);
  await page.getByLabel("Adresse e-mail").fill(values.email);
  await page.getByLabel(/^Téléphone/).fill("0470/12.34.56");
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmation du mot de passe").fill(PASSWORD);
  await page.getByRole("checkbox", { name: /J'ai 18 ans ou plus/ }).check();
}

const unique = (testInfo: { project: { name: string } }) =>
  `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

test("un coach s'inscrit, confirme son e-mail et arrive dans son propre espace", async ({
  page,
  request,
}, testInfo) => {
  const email = `inscription-coach-${unique(testInfo)}@example.test`;
  await fillSignup(page, { kind: "Je suis coach", first: "Léa", last: "Martin", email });
  await page.getByLabel(/^Nom de ton activité/).fill("Studio Léa");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("status")).toContainText("Vérifie ta boîte mail");

  // Le lien de l'e-mail confirme l'adresse puis ouvre la dernière étape, pré-remplie.
  await page.goto(await confirmationLink(request, email));
  await expect(page).toHaveURL(/\/bienvenue$/);
  await expect(page.getByLabel("Prénom")).toHaveValue("Léa");
  await expect(page.getByLabel(/^Nom de ton activité/)).toHaveValue("Studio Léa");
  await expect(page.getByRole("checkbox", { name: /J'ai 18 ans ou plus/ })).toBeChecked();
  await page.getByRole("button", { name: "Créer mon espace coach" }).click();

  // Son espace est vide et n'a rien en commun avec les organisations de démonstration.
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByRole("heading", { name: /^Bonjour Léa/, level: 1 })).toBeVisible();
  await expect(page.getByText(/0\s*sportif/)).toBeVisible();
  await expect(page.getByText("Organisation Démo A")).toHaveCount(0);
});

test("un sportif s'inscrit seul et attend que son coach le rattache", async ({
  page,
  request,
}, testInfo) => {
  const email = `inscription-sportif-${unique(testInfo)}@example.test`;
  await fillSignup(page, { kind: "Je suis sportif", first: "Sam", last: "Lefort", email });
  await expect(page.getByLabel(/^Nom de ton activité/)).toHaveCount(0);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("status")).toContainText("Vérifie ta boîte mail");

  await page.goto(await confirmationLink(request, email));
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Ton compte est prêt" })).toBeVisible();
  await expect(page.getByText(email).first()).toBeVisible();
});

test("les erreurs de saisie sont expliquées et la saisie est conservée", async ({ page }) => {
  await fillSignup(page, {
    kind: "Je suis coach",
    first: "Max",
    last: "Dupont",
    email: "erreurs@example.test",
  });
  await page.getByLabel("Confirmation du mot de passe").fill("autre-mot-de-passe");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Les deux mots de passe ne correspondent pas." }),
  ).toBeVisible();
  await expect(page.getByLabel("Adresse e-mail")).toHaveValue("erreurs@example.test");
  await expect(page.getByLabel("Prénom")).toHaveValue("Max");

  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmation du mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Accepte les conditions" })).toBeVisible();
});

test("la connexion propose l'inscription, sans bouton social tant qu'aucun n'est configuré", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await expect(page.getByRole("heading", { name: "Créer un compte", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continuer avec/ })).toHaveCount(0);
  // Les pages légales provisoires sont accessibles et annoncées comme telles.
  await page.goto("/confidentialite");
  await expect(page.getByText("Version provisoire")).toBeVisible();
  // La dernière étape est réservée aux comptes connectés.
  await page.goto("/bienvenue");
  await expect(page).toHaveURL(/\/login$/);
});
