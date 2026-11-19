import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { FEATURES } from "../../src/config/features";

// Inscription libre (D-30), e-mail de confirmation compris (Mailpit, http://127.0.0.1:54324).
const MAILPIT = "http://127.0.0.1:54324/api/v1";
const PASSWORD = "un-mot-de-passe-solide";
// Code d'accès de l'inscription en local (supabase/seed.sql, D-140).
const ACCESS_CODE = "coory-dev-2026";

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
  values: {
    kind: "Je suis coach" | "Je suis sportif";
    first: string;
    last: string;
    email: string;
    code?: string;
  },
) {
  await page.goto("/inscription");
  // « Je suis coach » sur ordinateur, « Coach » sur téléphone : on vise le bouton radio. MVP espace
  // coach seul (D-167) : pas de choix, le compte est un compte coach.
  if (FEATURES.athleteSpace) {
    await page
      .getByRole("radio", { name: values.kind === "Je suis coach" ? /coach/i : /sportif/i })
      .check({ force: true });
  }
  await page.getByRole("textbox", { name: /^Prénom/ }).fill(values.first);
  await page.getByLabel("Nom", { exact: true }).fill(values.last);
  await page.getByLabel("Adresse e-mail").fill(values.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  // Bêta privée (D-140) : code d'accès local du seed.
  await page.getByLabel("Code d'accès").fill(values.code ?? ACCESS_CODE);
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
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  // Page « Vérifie ta boîte mail » : l'adresse vient d'un cookie, jamais de l'URL.
  await expect(page).toHaveURL(/\/verifier-email$/);
  await expect(page.getByRole("heading", { name: "Vérifie ta boîte mail" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  // Le lien de l'e-mail confirme l'adresse puis souhaite la bienvenue avec ce qui a été saisi.
  await page.goto(await confirmationLink(request, email));
  await expect(page).toHaveURL(/\/bienvenue$/);
  await expect(page.getByRole("heading", { name: /^Bienvenue,\s*Léa\./ })).toBeVisible();
  // Étape « Pays et devise » (D-69) : le pays propose sa devise. Plus de question sur la TVA (D-163) :
  // elle se choisit à chaque paiement. Libellés exacts : la section porte aussi « pays » et « devise ».
  await page.getByLabel("Pays", { exact: true }).selectOption("CH");
  await expect(page.getByLabel("Devise", { exact: true })).toHaveValue("CHF");
  await expect(page.getByText("Je facture la TVA")).toHaveCount(0);
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click();

  // Son espace est vide et n'a rien en commun avec les organisations de démonstration.
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByRole("heading", { name: "Tableau de bord", level: 1 })).toBeVisible();
  await expect(page.getByLabel(/^Menu du compte : Léa/).first()).toBeAttached();
  await expect(page.getByRole("link", { name: /^0\s*tâche à faire/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /encaissés cette semaine/ })).toContainText(
    /0,00\sCHF/,
  );
  await expect(page.getByText("Aucune séance prévue dans les 30 prochains jours.")).toBeVisible();
  await expect(page.getByText("Organisation Démo A")).toHaveCount(0);
  // Son pays est enregistré : Paramètres › Pays et devise, sans rubrique TVA (D-163).
  await page.goto("/coach/profil?onglet=argent");
  await expect(page.getByLabel("Pays", { exact: true })).toHaveValue("CH");
  await expect(page.getByRole("region", { name: "TVA" })).toHaveCount(0);
});

test("un coach qui déménage change de devise : le futur passe en francs suisses", async ({
  page,
  request,
}, testInfo) => {
  const email = `devise-${unique(testInfo)}@example.test`;
  await fillSignup(page, { kind: "Je suis coach", first: "Noé", last: "Keller", email });
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/verifier-email$/);
  await page.goto(await confirmationLink(request, email));
  await page.getByLabel("Pays", { exact: true }).selectOption("BE");
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  // Paramètres › Pays et devise : « Changer de devise » (D-70), taux saisi, aperçu, confirmation.
  await page.goto("/coach/profil?onglet=argent");
  await page.getByRole("button", { name: "Changer de devise" }).click();
  const sheet = page.getByRole("dialog", { name: "Changer de devise" });
  await sheet.getByLabel("Nouvelle devise").selectOption("CHF");
  await sheet.getByLabel(/^Taux : 1 EUR/).fill("0,94");
  await expect(sheet.getByText(/100,00\s€ deviendront 94,00\sCHF/)).toBeVisible();
  await expect(sheet.getByRole("region", { name: "Reste en" })).toContainText("0 paiement reçu");
  await sheet.getByRole("button", { name: "Passer en CHF" }).click();
  await expect(page.getByText("Devise changée : Franc suisse (CHF).")).toBeVisible();
  await expect(page.getByRole("list", { name: "Changements de devise" })).toContainText(
    "EUR → CHF (1 EUR = 0,94 CHF)",
  );

  await page.goto("/coach");
  await expect(page.getByRole("link", { name: /encaissés cette semaine/ })).toContainText(
    /0,00\sCHF/,
  );
});

// MVP espace coach seul (D-167) : l'inscription ne propose plus « Je suis sportif ».
test("l'inscription ne propose que le compte coach", async ({ page }) => {
  test.skip(FEATURES.athleteSpace, "Espace sportif ouvert : le choix Coach / Sportif revient.");
  await page.goto("/inscription");
  await expect(page.getByRole("heading", { name: "Créer ton compte" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Type de compte" })).toHaveCount(0);
  await expect(page.getByText(/Je suis sportif|^Sportif$/)).toHaveCount(0);
});

// Recette du 19/11 : l'assistant s'appelle « Assistant IA » partout, aussi sur le badge de l'inscription
// (téléphone), qui disait encore « Copilote IA ».
test("le badge de l'inscription dit « Assistant IA », comme partout dans Coory", async ({
  page,
}) => {
  await page.goto("/inscription");
  await expect(page.getByRole("heading", { name: "Créer ton compte" })).toBeVisible();
  await expect(page.getByText(/Copilote/)).toHaveCount(0);
  await expect(page.getByText("Assistant IA", { exact: true })).toHaveCount(1);
});

test("un sportif s'inscrit seul et attend que son coach le rattache", async ({
  page,
  request,
}, testInfo) => {
  test.skip(!FEATURES.athleteSpace, "MVP espace coach seul (D-167) : inscription sportif masquée.");
  const email = `inscription-sportif-${unique(testInfo)}@example.test`;
  await fillSignup(page, { kind: "Je suis sportif", first: "Sam", last: "Lefort", email });
  await expect(page.getByLabel(/entreprise/)).toHaveCount(0);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("heading", { name: "Vérifie ta boîte mail" })).toBeVisible();

  await page.goto(await confirmationLink(request, email));
  await expect(page.getByRole("heading", { name: /^Bienvenue,\s*Sam\./ })).toBeVisible();
  await page.getByRole("button", { name: "Compris" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Ton compte est prêt" })).toBeVisible();
  // Phrase sous le titre : affichée sur téléphone, masquée sur ordinateur (29/10/2026).
  await expect(page.getByText(email).first()).toBeAttached();
});

test("l'e-mail de confirmation peut être renvoyé depuis « Vérifie ta boîte mail »", async ({
  page,
}, testInfo) => {
  const email = `inscription-renvoi-${unique(testInfo)}@example.test`;
  await fillSignup(page, { kind: "Je suis coach", first: "Noa", last: "Renvoi", email });
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
  // Conditions non acceptées : le bouton reste grisé (maquette du 06/11/2026, D-139).
  const submit = page.getByRole("button", { name: "Créer mon compte" });
  await page.getByRole("checkbox", { name: /J'ai 18 ans ou plus/ }).uncheck({ force: true });
  await expect(submit).toBeDisabled();
  await page.getByRole("checkbox", { name: /J'ai 18 ans ou plus/ }).check({ force: true });

  // Mot de passe trop court : refusé par le serveur, champ signalé, bandeau « Corrige les champs ».
  await page.getByLabel("Mot de passe", { exact: true }).fill("court");
  await submit.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Corrige les champs signalés pour continuer." }),
  ).toBeVisible();
  await expect(page.getByLabel("Mot de passe", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  // La saisie est conservée, la case des conditions reste cochée.
  await expect(page.getByLabel("Adresse e-mail")).toHaveValue("erreurs@example.test");
  await expect(page.getByRole("textbox", { name: /^Prénom/ })).toHaveValue("Max");
  await expect(page.getByLabel("Code d'accès")).toHaveValue(ACCESS_CODE);
  await expect(page.getByRole("checkbox", { name: /J'ai 18 ans ou plus/ })).toBeChecked();
  await expect(submit).toBeEnabled();
});

test("la connexion propose l'inscription, sans bouton social tant qu'aucun n'est configuré", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Créer un compte" }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: /^Créer ton compte\.?$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continuer avec/ })).toHaveCount(0);
  // Les pages légales provisoires sont accessibles et annoncées comme telles.
  await page.goto("/confidentialite");
  await expect(page.getByText("Version provisoire")).toBeVisible();
  // La dernière étape est réservée aux comptes connectés.
  await page.goto("/bienvenue");
  await expect(page).toHaveURL(/\/login$/);
});

test("sans le bon code d'accès, l'inscription est refusée (bêta privée)", async ({
  page,
}, testInfo) => {
  const email = `inscription-code-${unique(testInfo)}@example.test`;
  await fillSignup(page, {
    kind: "Je suis coach",
    first: "Zoé",
    last: "Sanscode",
    email,
    code: "PAS-LE-BON",
  });
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/inscription$/);
  await expect(
    page.getByText("Code d'accès incorrect. Demande-le à la personne qui t'a invité."),
  ).toBeVisible();
  // La saisie est gardée (sauf le mot de passe) pour corriger le code.
  await expect(page.getByLabel("Adresse e-mail")).toHaveValue(email);
});
