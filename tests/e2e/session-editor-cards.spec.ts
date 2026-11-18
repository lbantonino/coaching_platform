import { expect, test, type Page } from "@playwright/test";

// Éditeur « Modifier la séance » en cartes (D-190, 17/11/2026), relecture indépendante : ce que les
// parcours de l'éditeur ne couvrent pas. Lecture seule sur les données de démo (rien n'est enregistré),
// sauf mention.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// « Programme renforcement · bloc 1 » de Chloé (démo) : une séance reprise d'une ancienne version, avec
// un bloc texte répété (« Circuit », 4 tours).
const CHLOE = "f1000000-0000-4000-8000-000000000004";
// « Prépa HYROX · bloc 2 » d'Inès (démo).
const INES = "f1000000-0000-4000-8000-000000000020";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("un bloc texte répété (ancienne séance) montre ses tours et ses lignes", async ({ page }) => {
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes/${CHLOE}/seances/s1-1`);
  const list = page.locator("main");
  await expect(
    list.getByText("10 squats au poids du corps").filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(list.getByText("4 tours").filter({ visible: true }).first()).toBeVisible();
});

test("téléphone : le titre d'une grande carte (bloc Hyrox) est une cible de 44 px au moins", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "telephone", "Les cibles tactiles concernent le téléphone.");
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes/${INES}/seances/b2-s1-3`);
  const title = page
    .getByRole("button", { name: "Circuit", exact: true })
    .filter({ visible: true });
  const box = await title.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});
