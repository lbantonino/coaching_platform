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
  // « Je suis coach » sur ordinateur, « Coach » sur téléphone : on vise le bouton radio.
  await page
    .getByRole("radio", { name: values.kind === "Je suis coach" ? /coach/i : /sportif/i })
    .check({ force: true });
  await page.getByLabel("Prénom").fill(values.first);
  await page.getByLabel("Nom", { exact: true }).fill(values.last);
  await page.getByLabel("Adresse e-mail").fill(values.email);
  await page.getByLabel(/^Téléphone/).fill("0470/12.34.56");
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmation du mot de passe").fill(PASSWORD);
  await page.getByRole("checkbox", { name: /J'ai 18 ans ou plus/ }).check({ force: true });
}

const unique = (testInfo: { project: { name: string } }) =>
  `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

test("un coach s'inscrit, confirme son e-mail et arrive dans son propre espace", async ({
  page,
  request,
}, testInfo) => {
  const email = `inscription-coach-${unique(testInfo)}@example.test`;
  await fillSignup(page, { kind: "Je suis coach", first: "Léa", last: "Martin", email });
  await page.getByLabel(/entreprise/).fill("Studio Léa");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  // Page « Vérifie ta boîte mail » : l'adresse vient d'un cookie, jamais de l'URL.
  await expect(page).toHaveURL(/\/verifier-email$/);
  await expect(page.getByRole("heading", { name: "Vérifie ta boîte mail" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  // Le lien de l'e-mail confirme l'adresse puis souhaite la bienvenue avec ce qui a été saisi.
  await page.goto(await confirmationLink(request, email));
  await expect(page).toHaveURL(/\/bienvenue$/);
  await expect(page.getByRole("heading", { name: "Bienvenue, Léa." })).toBeVisible();
  await expect(page.getByText("Studio Léa")).toBeVisible();
  await page.getByRole("button", { name: "Accéder à mon tableau de bord" }).click();

  // Son espace est vide et n'a rien en commun avec les organisations de démonstration.
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByRole("heading", { name: /^Bonjour Léa/, level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /^0\s*tâche à faire$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^0\s*message non lu$/ })).toBeVisible();
  await expect(page.getByText("Aucune séance prévue dans les 30 prochains jours.")).toBeVisible();
  await expect(page.getByText("Organisation Démo A")).toHaveCount(0);
});

test("un sportif s'inscrit seul et attend que son coach le rattache", async ({
  page,
  request,
}, testInfo) => {
  const email = `inscription-sportif-${unique(testInfo)}@example.test`;
  await fillSignup(page, { kind: "Je suis sportif", first: "Sam", last: "Lefort", email });
  await expect(page.getByLabel(/entreprise/)).toHaveCount(0);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("heading", { name: "Vérifie ta boîte mail" })).toBeVisible();

  await page.goto(await confirmationLink(request, email));
  await expect(page.getByRole("heading", { name: "Bienvenue, Sam." })).toBeVisible();
  await page.getByRole("button", { name: "Compris" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Ton compte est prêt" })).toBeVisible();
  await expect(page.getByText(email).first()).toBeVisible();
});

test("l'e-mail de confirmation peut être renvoyé depuis « Vérifie ta boîte mail »", async ({
  page,
}, testInfo) => {
  const email = `inscription-renvoi-${unique(testInfo)}@example.test`;
  await fillSignup(page, { kind: "Je suis sportif", first: "Noa", last: "Renvoi", email });
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/verifier-email$/);
  // Supabase limite l'envoi à un e-mail par seconde et par adresse (max_frequency).
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Renvoyer l'e-mail" }).click();
  await expect(page.getByRole("button", { name: "E-mail renvoyé ✓" })).toBeDisabled();
  await page.getByRole("link", { name: "Modifier l'adresse" }).click();
  await expect(page).toHaveURL(/\/inscription$/);
});

test("les erreurs de saisie sont expliquées et la saisie est conservée", async ({ page }) => {
  await fillSignup(page, {
    kind: "Je suis coach",
    first: "Max",
    last: "Dupont",
    email: "erreurs@example.test",
  });
  // Conditions non acceptées : message sous la case et bandeau « Corrige les champs signalés ».
  await page.getByRole("checkbox", { name: /J'ai 18 ans ou plus/ }).uncheck({ force: true });
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Tu dois accepter les conditions pour continuer." }),
  ).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "Corrige les champs signalés pour continuer." }),
  ).toBeVisible();

  await page.getByRole("checkbox", { name: /J'ai 18 ans ou plus/ }).check({ force: true });
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmation du mot de passe").fill("autre-mot-de-passe");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Les deux mots de passe ne correspondent pas." }),
  ).toBeVisible();
  await expect(page.getByLabel("Confirmation du mot de passe")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Adresse e-mail")).toHaveValue("erreurs@example.test");
  await expect(page.getByLabel("Prénom")).toHaveValue("Max");
});

test("la connexion propose l'inscription, sans bouton social tant qu'aucun n'est configuré", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Créer un compte" }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Créer un compte" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continuer avec/ })).toHaveCount(0);
  // Les pages légales provisoires sont accessibles et annoncées comme telles.
  await page.goto("/confidentialite");
  await expect(page.getByText("Version provisoire")).toBeVisible();
  // La dernière étape est réservée aux comptes connectés.
  await page.goto("/bienvenue");
  await expect(page).toHaveURL(/\/login$/);
});
