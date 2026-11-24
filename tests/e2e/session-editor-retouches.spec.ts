import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

// Retouches de l'éditeur de séance demandées par Antonino le 24/11/2026 : renommer la séance en
// cliquant sur son nom, « Valider l'exercice » toujours visible, « Terminer » aussi sur téléphone.
// Chaque test crée son sportif et son brouillon (retirés en fin de suite).
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Modèle « Bloc force 4 semaines » (Mes modèles du coach A, graine de développement).
const STRENGTH_TEMPLATE = "7a000000-0000-4000-8000-000000000011";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// Un sportif neuf, un brouillon depuis le modèle de force, puis « Modifier la séance » sur Force A.
async function openForceA(page: Page, testInfo: TestInfo) {
  const phone = testInfo.project.name === "telephone";
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const athlete = `Retouche ${suffix}`;
  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();
  const athleteId = new URL(page.url()).pathname.split("/").pop() ?? "";
  await page.goto(
    `/coach/o/${ORG}/programmes/nouveau?sportif=${athleteId}&modele=${STRENGTH_TEMPLATE}`,
  );
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);
  if (phone) await page.getByRole("button", { name: "Force A", exact: true }).click();
  await page.getByRole("button", { name: "Modifier la séance" }).click();
  await expect(title(page, "Force A")).toBeVisible();
  return { phone };
}

const title = (page: Page, name: string) =>
  page.getByRole("heading", { name, level: 2 }).filter({ visible: true });

test("renommer la séance en cliquant sur son nom : Entrée enregistre, vide ou Échap ne change rien", async ({
  page,
}, testInfo) => {
  await openForceA(page, testInfo);
  const field = page.getByRole("textbox", { name: "Nom de la séance" }).filter({ visible: true });

  await title(page, "Force A").getByRole("button").click();
  await expect(field).toBeFocused();
  await field.fill("Force lourde");
  await field.press("Enter");
  await expect(title(page, "Force lourde")).toBeVisible();
  await expect(title(page, "Force lourde").getByRole("button")).toBeFocused();

  // Un nom vide (des espaces) : l'ancien revient.
  await title(page, "Force lourde").getByRole("button").click();
  await field.fill("   ");
  await field.press("Enter");
  await expect(title(page, "Force lourde")).toBeVisible();

  // Échap annule.
  await title(page, "Force lourde").getByRole("button").click();
  await field.fill("Autre nom");
  await field.press("Escape");
  await expect(title(page, "Force lourde")).toBeVisible();
  await expect(page.getByText("Autre nom")).toHaveCount(0);
});

test("ordinateur : « Valider l'exercice » est visible sans défiler, même avec beaucoup de séries", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "telephone",
    "Le panneau de droite est celui de l'ordinateur.",
  );
  await page.setViewportSize({ width: 1280, height: 640 });
  await openForceA(page, testInfo);
  // Huit séries : le panneau est plus haut que l'écran.
  await page.getByRole("textbox", { name: "Saisie rapide" }).fill("8 x 5");
  await page.getByRole("button", { name: "Remplir" }).click();
  await expect(page.getByRole("textbox", { name: "Répétitions de la série 8" })).toHaveValue("5");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByRole("button", { name: "Valider l'exercice" })).toBeInViewport({
    ratio: 1,
  });
});

test("téléphone : « Terminer » revient au programme, sur la semaine de la séance", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "telephone",
    "« Terminer » est déjà dans l'en-tête sur ordinateur.",
  );
  await openForceA(page, testInfo);
  // Renommée d'abord : le retour montre ce qui vient d'être enregistré.
  await title(page, "Force A").getByRole("button").click();
  await page
    .getByRole("textbox", { name: "Nom de la séance" })
    .filter({ visible: true })
    .fill("Force du lundi");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Terminer" }).filter({ visible: true }).click();
  // Comme « ← Semaine 1 » (le téléphone n'a pas de colonne de droite) : la semaine, avec la séance.
  await expect(page).not.toHaveURL(/\/seances\//);
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}/);
  await expect(
    page.getByRole("heading", { name: "Semaine 1", level: 2 }).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByText("Force du lundi").filter({ visible: true }).first()).toBeVisible();
});
