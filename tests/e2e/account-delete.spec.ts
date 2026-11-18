import { spawnSync } from "node:child_process";

import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  fillAthleteName,
  goToCoachSection,
  openAthleteTab,
  openSettings,
  signUpFreshCoach,
} from "./helpers";

// « Supprimer mon compte » (décisions d'Antonino du 18/11/2026 ; obligation légale) : Paramètres ›
// Sécurité, une carte à part ; la fenêtre dit ce qui sera effacé, propose l'export, et ne s'active
// qu'après « SUPPRIMER » ; tout est effacé tout de suite, le coach est déconnecté et voit une page de
// confirmation. Un coach NEUF (inscrit pour ce test) : jamais les données des autres tests.

const PHOTO = "supabase/seed-photos/sophie.jpg";

// Combien de ces fichiers sont encore stockés (base LOCALE, comme le nettoyage de fin de suite).
function storedFiles(paths: string[]): number {
  const list = paths.map((path) => `'${path.replaceAll("'", "''")}'`).join(",");
  const result = spawnSync(
    "docker",
    [
      "exec",
      "supabase_db_coaching-platform",
      "psql",
      "-U",
      "postgres",
      "-Atc",
      `select count(*) from storage.objects where name in (${list})`,
    ],
    { encoding: "utf8" },
  );
  return Number(result.stdout.trim());
}

// Chemin stocké d'une photo affichée (« /photos/<chemin> »).
async function storedPath(image: Locator): Promise<string> {
  const src = (await image.getAttribute("src")) ?? "";
  return decodeURIComponent(src.replace(/^\/photos\//, "").split("?")[0] ?? "");
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("un coach supprime son compte : tout part, il est déconnecté et ne peut plus se connecter", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(120_000);
  const email = await signUpFreshCoach(page, request, testInfo);
  // Un sportif, pour que l'organisation ait des données.
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, "Sportif Effacé");
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: "Sportif Effacé", level: 1 })).toBeVisible();
  // Des fichiers : la photo du sportif (sous-dossier org/<organisation>/athlete/<sportif>/) et celle
  // du coach (user/<coach>/).
  await openAthleteTab(page, "Profil");
  const athletePhoto = page.getByRole("region", { name: "Photo" });
  await athletePhoto.getByLabel("Photo de profil").setInputFiles(PHOTO);
  await expect(athletePhoto.getByRole("status")).toContainText("Photo enregistrée.");
  const files = [await storedPath(athletePhoto.locator("img").first())];
  const profile = await openSettings(page, "profil");
  await profile.locator('input[type="file"][aria-label="Photo de profil"]').setInputFiles(PHOTO);
  await expect(profile.getByRole("status").filter({ hasText: "Photo enregistrée." })).toBeVisible();
  files.push(await storedPath(profile.locator('img[src^="/photos/user/"]').first()));
  expect(files[0]).toMatch(/^org\/[^/]+\/athlete\//);
  expect(files[1]).toMatch(/^user\//);
  expect(storedFiles(files)).toBe(2);

  const security = await openSettings(page, "securite");
  const card = security.getByRole("region", { name: "Supprimer mon compte" });
  await card.getByRole("button", { name: "Supprimer mon compte" }).click();
  const confirm = page.getByRole("dialog", { name: "Supprimer ton compte ?" });
  await expect(confirm).toContainText("définitivement");
  await expect(confirm.getByRole("link", { name: /Télécharger mes données/ })).toBeVisible();
  const go = confirm.getByRole("button", { name: "Supprimer définitivement" });
  await expect(go).toBeDisabled();
  // « SUPPRIMER » exact : en minuscules, le bouton reste inactif.
  await confirm.getByLabel(/Tape SUPPRIMER/).fill("supprimer");
  await expect(go).toBeDisabled();
  await confirm.getByLabel(/Tape SUPPRIMER/).fill("SUPPRIMER");
  await go.click();

  await expect(page).toHaveURL(/\/compte-supprime$/);
  await expect(page.getByRole("heading", { name: "Ton compte a été supprimé" })).toBeVisible();
  expect(storedFiles(files)).toBe(0);
  // Déconnecté : l'espace coach renvoie à la connexion ; l'ancien mot de passe ne connecte plus.
  await page.goto("/coach");
  await expect(page).toHaveURL(/\/login/);
  await login(page, email, "un-mot-de-passe-solide");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("alert").filter({ hasText: "E-mail ou mot de passe incorrect." }),
  ).toBeVisible();
});

test("le compte de démonstration ne peut pas être supprimé", async ({ page }) => {
  await login(page, "coach-demo@example.test", "demo-coach-local");
  await expect(page).toHaveURL(/\/coach$/);
  const security = await openSettings(page, "securite");
  const card = security.getByRole("region", { name: "Supprimer mon compte" });
  await card.getByRole("button", { name: "Supprimer mon compte" }).click();
  const confirm = page.getByRole("dialog", { name: "Supprimer ton compte ?" });
  const go = confirm.getByRole("button", { name: "Supprimer définitivement" });
  // Le serveur revérifie le mot : bouton forcé avec « supprimer », refusé quand même.
  await confirm.getByLabel(/Tape SUPPRIMER/).fill("supprimer");
  await go.evaluate((button) => {
    (button as HTMLButtonElement).disabled = false;
  });
  await go.click();
  await expect(confirm.getByRole("alert")).toContainText("Tape SUPPRIMER pour confirmer.");
  await confirm.getByLabel(/Tape SUPPRIMER/).fill("SUPPRIMER");
  await go.click();
  await expect(confirm.getByRole("alert")).toContainText(
    "Désactivé sur le compte de démonstration.",
  );
  await expect(page).not.toHaveURL(/\/compte-supprime/);
});

// Relecture du 18/11 : la touche « OK » du clavier (Entrée) ne supprime rien ; seul le bouton rouge
// le fait. Compte de démo : si le formulaire partait, le refus de la démo s'afficherait.
test("Entrée dans le champ ne lance pas la suppression", async ({ page }) => {
  await login(page, "coach-demo@example.test", "demo-coach-local");
  await expect(page).toHaveURL(/\/coach$/);
  const security = await openSettings(page, "securite");
  await security
    .getByRole("region", { name: "Supprimer mon compte" })
    .getByRole("button", { name: "Supprimer mon compte" })
    .click();
  const confirm = page.getByRole("dialog", { name: "Supprimer ton compte ?" });
  const field = confirm.getByLabel(/Tape SUPPRIMER/);
  await field.fill("SUPPRIMER");
  await field.press("Enter");
  await page.waitForTimeout(1500);
  await expect(confirm.getByRole("alert")).toHaveCount(0);
  await expect(confirm).toBeVisible();
});

// Relecture du 18/11 : sur un petit téléphone (ou clavier ouvert), la fenêtre est plus haute que
// l'écran ; elle doit défiler au doigt jusqu'à « Annuler ».
test("petit téléphone : la fenêtre défile au doigt", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "telephone", "geste tactile");
  await page.setViewportSize({ width: 375, height: 480 });
  await login(page, "coach-demo@example.test", "demo-coach-local");
  await expect(page).toHaveURL(/\/coach$/);
  const security = await openSettings(page, "securite");
  await security
    .getByRole("region", { name: "Supprimer mon compte" })
    .getByRole("button", { name: "Supprimer mon compte" })
    .click();
  const confirm = page.getByRole("dialog", { name: "Supprimer ton compte ?" });
  const body = confirm.getByText(/Rien ne pourra être récupéré/);
  await expect(body).toBeVisible();
  await page.waitForTimeout(500);
  const box = (await body.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 10; step += 1) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y - step * 20 }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const form = confirm.locator("form");
  await expect.poll(() => form.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
});
