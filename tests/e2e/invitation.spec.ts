import { expect, test, type Browser, type Page } from "@playwright/test";

import {
  fillAthleteName,
  goToCoachSection,
  isPhone,
  logoutAthlete,
  openAthleteTab,
} from "./helpers";

// Parcours d'invitation (P1-05) : le coach invite, le sportif crée son accès dans un AUTRE navigateur.
const DEMO_PASSWORD = "demo-coach-local";

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// Crée un sportif unique dans l'organisation A et ouvre sa page d'invitation.
async function createAthleteAndOpenInvite(page: Page, name: string, email: string) {
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nouveau sportif" })).toBeVisible();
  await fillAthleteName(page, name);
  await page.getByLabel(/Adresse e-mail/).fill(email);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  // Le sportif enregistré, on arrive sur sa fiche (D-54) ; son invitation est à /inviter.
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await page.goto(`${page.url()}/inviter`);
  // « Inviter Prénom Nom » sur ordinateur, « Inviter Prénom » sur téléphone (kit « Coory Pages » 09).
  await expect(
    page.getByRole("heading", { name: new RegExp(`^Inviter ${name.split(" ")[0]}`) }),
  ).toBeVisible();
}

async function generateLink(page: Page): Promise<string> {
  await page.getByRole("button", { name: /Générer/ }).click();
  const field = page.getByLabel(/Lien d'invitation/);
  await expect(field).toBeVisible();
  return field.inputValue();
}

async function newAthletePage(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  return context.newPage();
}

test("le coach invite un sportif, qui crée son accès et arrive dans son espace", async ({
  page,
  browser,
  context,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `Invité ${suffix}`;
  const email = `invite-${suffix}@example.test`;
  const athletePassword = `sportif-${Date.now()}`;

  // --- Coach : création de la fiche et génération du lien ---
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await loginAsCoachA(page);
  await createAthleteAndOpenInvite(page, name, email);
  const link = await generateLink(page);
  expect(link).toMatch(/\/invitation\/[A-Za-z0-9_-]{43}$/);

  // Le bouton « Copier » copie réellement le lien (toast, kit « Coory Pages » 09) ; WhatsApp, e-mail
  // et SMS ouvrent l'app du coach avec le message prérempli et le lien.
  await page.getByRole("button", { name: "Copier le lien" }).click();
  await expect(page.getByText("Lien copié.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);
  const whatsapp = await page.getByRole("link", { name: "WhatsApp" }).getAttribute("href");
  expect(whatsapp).toMatch(/^https:\/\/wa\.me\/\?text=/);
  expect(whatsapp).toContain(encodeURIComponent(link));
  const mail = await page.getByRole("link", { name: "E-mail" }).getAttribute("href");
  expect(mail?.startsWith(`mailto:${email}?subject=`)).toBe(true);

  // --- Sportif : autre navigateur, ouverture du lien ---
  const athlete = await newAthletePage(browser);
  await athlete.goto(link);
  await expect(
    athlete.getByRole("heading", { name: "Rejoins l'espace de ton coach" }),
  ).toBeVisible();
  await expect(athlete.getByText(`Pour ${name}`)).toBeVisible();
  await expect(athlete.getByLabel("Adresse e-mail")).toHaveValue(email);

  // Case « 18 ans ou plus » obligatoire.
  await athlete.getByLabel("Mot de passe", { exact: true }).fill(athletePassword);
  await athlete.getByLabel("Confirmation du mot de passe").fill(athletePassword);
  await athlete.getByRole("button", { name: "Rejoindre l'espace" }).click();
  await expect(
    athlete.getByRole("alert").filter({ hasText: "confirmer avoir 18 ans ou plus" }),
  ).toBeVisible();

  await athlete.getByLabel("J'ai 18 ans ou plus").check({ force: true });
  await athlete.getByLabel("Mot de passe", { exact: true }).fill(athletePassword);
  await athlete.getByLabel("Confirmation du mot de passe").fill(athletePassword);
  await athlete.getByRole("button", { name: "Rejoindre l'espace" }).click();

  await expect(athlete).toHaveURL(/\/app$/);
  await expect(athlete.getByText("Ton coach (Organisation Démo A) t'a ajouté")).toBeVisible();

  // Un sportif n'entre jamais dans l'espace coach (AUTH-01).
  await athlete.goto("/coach");
  await expect(athlete).toHaveURL(/\/acces-refuse$/);

  // Le lien ne sert qu'une fois.
  await athlete.goto(link);
  await expect(athlete.getByText("Cette invitation a déjà été acceptée")).toBeVisible();

  // Reconnexion classique : le sportif arrive dans son espace.
  await athlete.goto("/app");
  await logoutAthlete(athlete);
  await expect(athlete).toHaveURL(/\/login$/);
  await athlete.getByLabel("Adresse e-mail").fill(email);
  await athlete.getByLabel("Mot de passe", { exact: true }).fill(athletePassword);
  await athlete.getByRole("button", { name: "Se connecter" }).click();
  await expect(athlete).toHaveURL(/\/app$/);

  // --- Coach : dans la liste, le compte activé se voit à l'icône « écrire » (plus de libellé).
  // Téléphone (carte compacte, 28/10) : « Écrire un message » est dans le menu « ••• ». ---
  await page.goto(page.url().replace(/\/[^/]+\/inviter$/, ""));
  const row = page.getByRole("listitem").filter({ hasText: name });
  if (isPhone(page)) {
    await row.getByRole("button", { name: `Actions pour ${name}` }).click();
    const actions = page.getByRole("dialog", { name });
    await expect(actions.getByRole("button", { name: "Écrire un message" })).toBeVisible();
    await expect(actions.getByRole("button", { name: "Inviter dans son espace" })).toHaveCount(0);
    await page.keyboard.press("Escape");
  } else {
    await expect(row.getByRole("link", { name: `Écrire à ${name}` })).toHaveAttribute(
      "href",
      /\/coach\/messages\?sportif=/,
    );
  }
  await expect(row.getByRole("link", { name: `Inviter ${name}` })).toHaveCount(0);

  // Sur la fiche, l'e-mail (identifiant de connexion) est verrouillé.
  await row.getByRole("link", { name: new RegExp(`^${name}`) }).click();
  await openAthleteTab(page, "Profil");
  await expect(page.getByLabel("Adresse e-mail")).toHaveAttribute("readonly", "");
  await expect(page.getByText("Identifiant de connexion du sportif")).toBeVisible();
});

test("un lien révoqué par le coach n'est plus utilisable", async ({ page, browser }, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `Révoqué ${suffix}`;

  await loginAsCoachA(page);
  await createAthleteAndOpenInvite(page, name, `revoque-${suffix}@example.test`);
  const link = await generateLink(page);

  await page.reload();
  await expect(page.getByText(/Un lien est valable jusqu'au/)).toBeVisible();
  // Révoquer demande une confirmation (kit « Coory Pages » 09).
  await page.getByRole("button", { name: "Révoquer ce lien" }).click();
  await page
    .getByRole("dialog", { name: "Révoquer ce lien ?" })
    .getByRole("button", { name: "Révoquer" })
    .click();
  await expect(page.getByText(/Un lien est valable/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Générer le lien d'invitation" })).toBeVisible();

  const athlete = await newAthletePage(browser);
  await athlete.goto(link);
  await expect(athlete.getByText("Cette invitation a été annulée par ton coach")).toBeVisible();
});

test("un lien d'invitation inventé est refusé", async ({ page }) => {
  await page.goto(`/invitation/${"x".repeat(43)}`);
  await expect(page.getByRole("heading", { name: "Invitation indisponible" })).toBeVisible();
  await page.goto("/invitation/trop-court");
  await expect(page.getByText("Ce lien d'invitation n'est pas valide")).toBeVisible();
});
