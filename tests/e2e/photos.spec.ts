import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection, openAthleteTab, openSettings } from "./helpers";

// Photos de profil (D-28) : envoi et retrait sur la fiche d'un sportif, contrôle du format,
// accès refusé à un autre coach, profil du coach (Paramètres).
const PHOTO = "supabase/seed-photos/sophie.jpg";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach ajoute puis retire la photo d'un sportif ; un autre coach ne peut pas la voir", async ({
  page,
  browser,
}, testInfo) => {
  const name = `Photo ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await login(page, "coach-a@example.test");
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  // Le sportif enregistré, on arrive sur sa fiche (D-54).
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await openAthleteTab(page, "Profil");
  const photo = page.getByRole("region", { name: "Photo" });

  // Un faux fichier image est refusé (on lit ses premiers octets, pas son nom).
  await photo.getByLabel("Photo de profil").setInputFiles({
    name: "faux.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("ceci n'est pas une image"),
  });
  // D-58 : un seul bouton ; la photo part dès qu'elle est choisie.
  await expect(photo.getByRole("alert")).toContainText("Format non accepté");

  // Une vraie photo : enregistrée, puis servie par l'app à ce coach.
  await photo.getByLabel("Photo de profil").setInputFiles(PHOTO);
  await expect(photo.getByRole("status")).toContainText("Photo enregistrée.");
  const src = await photo.locator("img").first().getAttribute("src");
  expect(src).toMatch(/^\/photos\/org\//);
  expect((await page.request.get(src!)).status()).toBe(200);

  // Le coach de l'organisation B ne peut pas la télécharger, même avec l'adresse exacte.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await login(otherPage, "coach-b@example.test");
  expect((await otherPage.request.get(src!)).status()).toBe(404);
  await other.close();

  // Retrait : retour aux initiales, l'ancienne adresse ne sert plus rien.
  await photo.getByRole("button", { name: "Retirer la photo" }).click();
  await expect(photo.locator("img")).toHaveCount(0);
  expect((await page.request.get(src!)).status()).toBe(404);
});

// Demande d'Antonino du 14/11 : une photo de téléphone (3552 × 4879, plusieurs Mo) menait à une page
// d'erreur. Elle est réduite dans le navigateur avant l'envoi, puis enregistrée.
test("une grande photo de téléphone est réduite puis enregistrée", async ({ page }, testInfo) => {
  const name = `Grande photo ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await login(page, "coach-a@example.test");
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await openAthleteTab(page, "Profil");
  const photo = page.getByRole("region", { name: "Photo" });

  // Une photo de 3552 × 4879 pleine de détails (bruit), donc lourde, fabriquée dans le navigateur.
  const bytes = await photo.getByLabel("Photo de profil").evaluate(async (input) => {
    const canvas = document.createElement("canvas");
    canvas.width = 3552;
    canvas.height = 4879;
    const context = canvas.getContext("2d")!;
    const image = context.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < image.data.length; i += 4) {
      image.data[i] = Math.random() * 255;
      image.data[i + 1] = Math.random() * 255;
      image.data[i + 2] = Math.random() * 255;
      image.data[i + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((result) => resolve(result!), "image/jpeg", 0.95),
    );
    const transfer = new DataTransfer();
    transfer.items.add(new File([blob], "IMG_0001.jpg", { type: "image/jpeg" }));
    const field = input as HTMLInputElement;
    field.files = transfer.files;
    field.dispatchEvent(new Event("change", { bubbles: true }));
    return blob.size;
  });
  expect(bytes).toBeGreaterThan(5 * 1024 * 1024);

  await expect(photo.getByRole("status")).toContainText("Photo enregistrée.", { timeout: 30_000 });
  await expect(page.getByText("Une erreur est survenue")).toHaveCount(0);
  await photo.getByRole("button", { name: "Retirer la photo" }).click();
  await expect(photo.locator("img")).toHaveCount(0);
});

test("le coach renseigne son identité et son entreprise dans Paramètres", async ({ page }) => {
  // Coach de démo B : le profil du coach A est celui qu'Antonino utilise pour regarder l'app.
  await login(page, "coach-b@example.test");
  // Paramètres en fenêtre (D-127) : l'ancienne adresse l'ouvre sur la rubrique Profil.
  const dialog = await openSettings(page, "profil");
  await dialog.getByRole("textbox", { name: /^Prénom/ }).fill("Marco");
  await dialog.getByLabel(/^Entreprise/).fill("Bianchi Performance");
  await dialog.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("Profil enregistré.");
  await openSettings(page, "profil");
  await expect(dialog.getByLabel(/^Entreprise/)).toHaveValue("Bianchi Performance");
  await page.goto("/coach");
  // Le prénom apparaît sur la carte du compte (menu de gauche, ou menu hamburger sur téléphone).
  await expect(page.getByLabel(/^Menu du compte : Marco/).first()).toBeAttached();
});
