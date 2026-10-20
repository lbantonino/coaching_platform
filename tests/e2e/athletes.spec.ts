import { expect, test, type Page } from "@playwright/test";

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
  await page.getByRole("link", { name: /Organisation Démo A/ }).click();
  await expect(page.getByRole("heading", { name: "Sportifs" })).toBeVisible();

  await page.getByRole("link", { name: "Ajouter un sportif" }).click();
  await expect(page.getByRole("heading", { name: "Nouveau sportif" })).toBeVisible();

  // Nom manquant : erreur claire, rien n'est enregistré.
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Le nom est obligatoire." }),
  ).toBeVisible();

  await page.getByLabel("Nom du sportif").fill(name);
  await page.getByLabel(/Adresse e-mail/).fill(email);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();

  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG_A}/sportifs$`));
  const list = page.getByRole("list", { name: "Liste des sportifs" });
  await expect(list.getByText(name)).toBeVisible();
  await expect(list.getByText(email)).toBeVisible();

  // Même e-mail une seconde fois : refusé avec un message compréhensible.
  await page.getByRole("link", { name: "Ajouter un sportif" }).click();
  await page.getByLabel("Nom du sportif").fill(`${name} bis`);
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
