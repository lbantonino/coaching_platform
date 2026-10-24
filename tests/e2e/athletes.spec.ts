import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

const DEMO_PASSWORD = "demo-coach-local";
// Identifiants fixes du seed (supabase/seed.sql).
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const ORG_B = "0b000000-0000-4000-8000-0000000000b1";

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach ajoute un sportif depuis son espace et le retrouve dans la liste", async ({
  page,
}, testInfo) => {
  // Nom et e-mail uniques par exécution et par profil : les tests ne se gênent pas entre eux.
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `Camille Test ${suffix}`;
  const email = `camille-${suffix}@example.test`;

  await loginAsCoachA(page);
  await goToCoachSection(page, "Sportifs");
  await expect(page.getByRole("heading", { name: "Sportifs" })).toBeVisible();

  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nouveau sportif" })).toBeVisible();

  // Prénom manquant : erreur claire, rien n'est enregistré.
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Le prénom est obligatoire." }),
  ).toBeVisible();

  await fillAthleteName(page, name);
  await page.getByLabel(/Adresse e-mail/).fill(email);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();

  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG_A}/sportifs$`));
  const list = page.getByRole("list", { name: "Liste des sportifs" });
  await expect(list.getByText(name)).toBeVisible();
  // L'e-mail n'est plus affiché sur la ligne (prototype) : la recherche le retrouve.
  await page.getByLabel("Rechercher un sportif").fill(email);
  await page.getByLabel("Rechercher un sportif").press("Enter");
  await expect(list.getByText(name)).toBeVisible();

  // Même e-mail une seconde fois : refusé avec un message compréhensible.
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, `${name} bis`);
  await page.getByLabel(/Adresse e-mail/).fill(email.toUpperCase());
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "utilise déjà cette adresse e-mail" }),
  ).toBeVisible();
});

test("le coach A ne peut pas ouvrir les sportifs de l'organisation B en changeant l'URL", async ({
  page,
}) => {
  await loginAsCoachA(page);

  await page.goto(`/coach/o/${ORG_B}/sportifs`);
  await expect(page).toHaveURL(/\/acces-refuse$/);

  await page.goto(`/coach/o/${ORG_B}/sportifs/nouveau`);
  await expect(page).toHaveURL(/\/acces-refuse$/);

  await page.goto("/coach/o/pas-un-identifiant/sportifs");
  await expect(page).toHaveURL(/\/acces-refuse$/);
});

test("la liste montre l'accès de chaque sportif par une icône, et se filtre par discipline", async ({
  page,
}) => {
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/sportifs`);
  const list = page.getByRole("list", { name: "Liste des sportifs" });
  // Plus de libellés « Compte activé / Invitation en attente / Sans compte » (demande d'Antonino).
  await expect(list.getByText(/Compte activé|Invitation en attente|Sans compte/)).toHaveCount(0);

  // Thomas a activé son compte : on peut lui écrire, plus besoin de l'inviter.
  const thomas = list.getByRole("listitem").filter({ hasText: "Thomas Peeters" });
  await expect(thomas.getByRole("link", { name: "Écrire à Thomas Peeters" })).toBeVisible();
  await expect(thomas.getByRole("link", { name: "Inviter Thomas Peeters" })).toHaveCount(0);
  // Inès a une invitation en attente : l'icône le signale, « Inviter » permet d'en renvoyer une.
  const ines = list.getByRole("listitem").filter({ hasText: "Inès Benali" });
  await expect(ines.getByText("Invitation envoyée")).toBeAttached();
  await expect(ines.getByRole("link", { name: "Inviter Inès Benali" })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Filtrer par discipline" })
    .getByRole("link", { name: "Hyrox" })
    .click();
  await expect(page).toHaveURL(/discipline=hyrox/);
  await expect(list.getByText("Inès Benali")).toBeVisible();
  await expect(list.getByText("Thomas Peeters")).toHaveCount(0);
});
