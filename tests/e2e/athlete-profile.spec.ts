import { expect, test, type Browser, type Page } from "@playwright/test";

import { chooseAthleteFilter, fillAthleteName, goToCoachSection, openAthleteTab } from "./helpers";

// Fiche sportif (P2-01b) : modifier, archiver, restaurer, rechercher, et isolation par organisation.
const DEMO_PASSWORD = "demo-coach-local";
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// Crée un sportif et revient sur la liste ; renvoie le chemin de la liste.
async function createAthlete(page: Page, name: string, email: string) {
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nouveau sportif" })).toBeVisible();
  await fillAthleteName(page, name);
  await page.getByLabel(/Adresse e-mail/).fill(email);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await expect(page.getByRole("heading", { name: "Sportifs" })).toBeVisible();
}

test("le coach modifie, archive, retrouve et restaure un sportif", async ({ page }, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `Fiche ${suffix}`;
  const renamed = `Fiche modifiée ${suffix}`;
  const list = page.getByRole("list", { name: "Liste des sportifs" });

  await login(page, "coach-a@example.test");
  await createAthlete(page, name, `fiche-${suffix}@example.test`);

  // Recherche : retrouve le sportif par une partie de son nom, en ignorant la casse.
  await page.getByLabel("Rechercher un sportif").fill(`FICHE ${suffix}`);
  await page.getByLabel("Rechercher un sportif").press("Enter");
  await expect(list.getByText(name)).toBeVisible();
  await expect(list.getByRole("listitem")).toHaveCount(1);

  // Fiche : modification du nom et du téléphone.
  await list.getByRole("link", { name: new RegExp(`^${name}`) }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await openAthleteTab(page, "Profil");
  await fillAthleteName(page, renamed);
  await page.getByLabel("Téléphone").fill("+32 470 12 34 56");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Modifications enregistrées." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: renamed })).toBeVisible();

  // Téléphone invalide : refusé avec un message clair.
  await page.getByLabel("Téléphone").fill("appelle-moi");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Numéro de téléphone invalide" }),
  ).toBeVisible();
  await page.getByLabel("Téléphone").fill("+32 470 12 34 56");

  // Archivage : disparaît des actifs, apparaît dans « Archivés ».
  await page.getByText("Archivé", { exact: true }).click();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Modifications enregistrées." }),
  ).toBeVisible();

  // Lien retour de l'en-tête de page (le menu latéral a aussi un lien « Sportifs », hors de <main>).
  await page.getByRole("main").getByRole("link", { name: "Sportifs", exact: true }).click();
  await page.getByLabel("Rechercher un sportif").fill(suffix);
  await page.getByLabel("Rechercher un sportif").press("Enter");
  // Filtre « Tous » par défaut (maquette du 24/10) : il reste visible, marqué « Archivé ».
  await expect(list.getByRole("button", { name: /^Statut : Archivé/ })).toBeVisible();
  await chooseAthleteFilter(page, "Statut", "Actifs");
  await expect(page.getByText(/Aucun sportif ne correspond/)).toBeVisible();

  await chooseAthleteFilter(page, "Statut", "Archivés");
  await expect(list.getByText(renamed)).toBeVisible();

  // Restauration.
  await list.getByRole("link", { name: new RegExp(`^${renamed}`) }).click();
  await openAthleteTab(page, "Profil");
  await page.getByText("Actif", { exact: true }).click();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Modifications enregistrées." }),
  ).toBeVisible();
  await page.goto(`/coach/o/${ORG_A}/sportifs?q=${encodeURIComponent(suffix)}`);
  await expect(list.getByText(renamed)).toBeVisible();
});

test("le coach renseigne l'identité et le profil sportif, retrouvés après rechargement", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `Profil ${suffix}`;
  await login(page, "coach-a@example.test");
  await createAthlete(page, name, `profil-${suffix}@example.test`);
  await page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await openAthleteTab(page, "Profil");

  // Prénom et nom sont enregistrés séparément ; le titre affiche le nom complet.
  await expect(page.getByRole("textbox", { name: /^Prénom/ })).toHaveValue("Profil");
  await expect(page.getByRole("textbox", { name: /^Nom de famille/ })).toHaveValue(suffix);

  await page.getByLabel("Sexe").selectOption({ label: "Femme" });
  await page.getByLabel("Canal de contact préféré").selectOption({ label: "WhatsApp" });
  await page.getByLabel("Niveau").selectOption({ label: "Intermédiaire" });
  await page.getByLabel("Expérience").fill("Course depuis 3 ans, un Hyrox en Open");
  await page.getByText("Salle de sport", { exact: true }).click();
  await page.getByText("Extérieur (route, trail)", { exact: true }).click();
  await page.getByLabel("Matériel disponible").fill("Haltères jusqu'à 20 kg");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Modifications enregistrées." }),
  ).toBeVisible();

  // Après rechargement, tout vient de la base.
  await page.reload();
  await expect(page.getByLabel("Sexe")).toHaveValue("female");
  // Le symbole ♀ s'affiche à côté du nom, annoncé « Femme » aux lecteurs d'écran.
  await expect(page.getByRole("img", { name: "Femme" }).first()).toBeVisible();
  await expect(page.getByLabel("Canal de contact préféré")).toHaveValue("whatsapp");
  await expect(page.getByLabel("Niveau")).toHaveValue("intermediate");
  await expect(page.getByLabel("Expérience")).toHaveValue("Course depuis 3 ans, un Hyrox en Open");
  await expect(page.getByLabel("Salle de sport")).toBeChecked();
  await expect(page.getByLabel("Extérieur (route, trail)")).toBeChecked();
  await expect(page.getByLabel("Domicile")).not.toBeChecked();
  await expect(page.getByLabel("Matériel disponible")).toHaveValue("Haltères jusqu'à 20 kg");
});

async function createAthleteAsCoachB(browser: Browser, suffix: string): Promise<string> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, "coach-b@example.test");
  await createAthlete(page, `Sportif B ${suffix}`, `sportif-b-${suffix}@example.test`);
  await page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("link", { name: new RegExp(`^Sportif B ${suffix}`) })
    .click();
  await expect(page.getByRole("heading", { name: `Sportif B ${suffix}` })).toBeVisible();
  const athleteId = page.url().split("/").pop() ?? "";
  await context.close();
  return athleteId;
}

test("le coach A ne peut pas ouvrir la fiche d'un sportif de l'organisation B", async ({
  page,
  browser,
}, testInfo) => {
  const athleteIdOfB = await createAthleteAsCoachB(
    browser,
    `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  expect(athleteIdOfB).toMatch(/^[0-9a-f-]{36}$/);

  await login(page, "coach-a@example.test");
  // ID de B glissé dans l'URL de l'organisation A : réponse « introuvable », sans fuite.
  await page.goto(`/coach/o/${ORG_A}/sportifs/${athleteIdOfB}`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await expect(page.getByText("Sportif B")).toHaveCount(0);
});
