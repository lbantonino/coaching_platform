import { expect, test, type Page } from "@playwright/test";

// Exercices du coach (D-76) : créer (photo + lien vidéo), retrouver dans « Mes exercices », modifier,
// rester invisible pour un autre coach, préparer une variante d'un exercice du catalogue, supprimer.
// Coach de démo B ; chaque projet crée SON exercice, au nom unique, et le supprime.
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// Une vraie image PNG de 1 × 1 pixel (signature lue par le serveur).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("un coach crée son exercice avec photo et vidéo, le modifie et le supprime ; il reste privé", async ({
  page,
  browser,
}, testInfo) => {
  const name = `Mobilité test ${testInfo.project.name}-${Date.now()}`;
  await login(page, "coach-b@example.test");
  await page.goto("/coach/bibliotheque");
  await page.getByRole("link", { name: "Créer un exercice" }).click();
  await expect(page).toHaveURL(/\/coach\/bibliotheque\/nouveau$/);

  await page.getByRole("textbox", { name: "Nom de l'exercice" }).fill(name);
  // La pastille (le libellé) recouvre la vraie case, cachée pour le clavier et les lecteurs d'écran.
  await page.getByRole("radio", { name: "Mobilité" }).check({ force: true });
  await page.getByRole("checkbox", { name: "Hanches et adducteurs" }).check({ force: true });
  await page.getByRole("combobox", { name: "Matériel" }).selectOption("mat");
  await page
    .getByRole("textbox", { name: "Consignes" })
    .fill("Pose le genou arrière au sol.\nBascule doucement vers l'avant.");
  await page.getByLabel("Photo de l'exercice").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG,
  });

  // Un lien http (non sécurisé) est refusé ; la saisie est gardée.
  await page
    .getByRole("textbox", { name: "Lien vidéo" })
    .fill("http://www.instagram.com/reel/abc123/");
  await page.getByRole("button", { name: "Créer l'exercice" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Lien vidéo invalide" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Nom de l'exercice" })).toHaveValue(name);

  await page
    .getByRole("textbox", { name: "Lien vidéo" })
    .fill("https://www.instagram.com/reel/abc123/");
  await page.getByLabel("Photo de l'exercice").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.getByRole("button", { name: "Créer l'exercice" }).click();

  // La fiche : « Mon exercice », sa photo servie par l'app, son bouton vidéo, ses consignes.
  await expect(page).toHaveURL(/\/coach\/bibliotheque\/[0-9a-f-]{36}$/);
  const sheetUrl = page.url();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  // La pastille : sous le titre (téléphone) ou sur la ligne du chemin (ordinateur, s'il y a la
  // place), D-124 : seule celle affichée compte.
  await expect(
    page.getByText("Mon exercice", { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  const photo = page.getByRole("img", { name: `Illustration : ${name}` });
  await expect(photo).toBeVisible();
  await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1);
  await expect(page.getByRole("link", { name: "Voir la vidéo sur Instagram" })).toHaveAttribute(
    "href",
    "https://www.instagram.com/reel/abc123/",
  );
  await expect(page.getByText("Bascule doucement vers l'avant.")).toBeVisible();

  // Modifier (kit « Coory Pages », page 11, D-121) : la photo et le lien vidéo enregistrés sont
  // réaffichés ; « Supprimer l'exercice » demande toujours une confirmation (« Annuler » ne supprime
  // rien) ; le nouveau nom s'affiche.
  await page.getByRole("link", { name: "Modifier" }).click();
  await expect(page.getByText("Photo actuelle")).toBeVisible();
  await expect(page.getByRole("img", { name: "Aperçu de la photo" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Lien vidéo" })).toHaveValue(
    "https://www.instagram.com/reel/abc123/",
  );
  await page.getByRole("button", { name: "Supprimer l'exercice" }).click();
  const confirmDelete = page.getByRole("dialog", { name: `Supprimer « ${name} » ?` });
  await expect(confirmDelete).toBeVisible();
  await confirmDelete.getByRole("button", { name: "Annuler" }).click();
  await expect(confirmDelete).toBeHidden();
  await page.getByRole("textbox", { name: "Nom de l'exercice" }).fill(`${name} bis`);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `${name} bis` })).toBeVisible();

  // Dans la bibliothèque : « Mes exercices », avec la rubrique Mobilité.
  await page.goto("/coach/bibliotheque?miens");
  await expect(page.getByRole("button", { name: /^Mobilité/ })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`^${name} bis`) })).toContainText(
    "Mon exercice",
  );

  // Un autre coach (organisation A) ne le voit pas, même avec son adresse.
  const other = await (await browser.newContext()).newPage();
  await login(other, "coach-a@example.test");
  await other.goto(sheetUrl.replace(/^https?:\/\/[^/]+/, ""));
  await expect(other.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await other.goto("/coach/bibliotheque?miens");
  await expect(other.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveCount(0);
  await other.close();

  // Supprimer, après confirmation.
  await page.goto(sheetUrl.replace(/^https?:\/\/[^/]+/, ""));
  await page.getByRole("button", { name: "Supprimer" }).click();
  await page
    .getByRole("dialog", { name: `Supprimer « ${name} bis » ?` })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Exercice supprimé.")).toBeVisible();
  await expect(page).toHaveURL(/\/coach\/bibliotheque$/);
  await page.goto("/coach/bibliotheque?miens");
  await expect(page.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveCount(0);
});

test("« Créer ma variante » pré-remplit le formulaire depuis un exercice du catalogue", async ({
  page,
}) => {
  await login(page, "coach-b@example.test");
  await page.goto("/coach/bibliotheque/squat");
  await page.getByRole("link", { name: "Créer ma variante" }).click();
  await expect(page).toHaveURL(/\/coach\/bibliotheque\/nouveau\?variante=squat$/);
  // Bandeau de variante (kit « Coory Pages », page 08, D-122) : le nom de l'original et un lien
  // vers sa fiche ; le bouton principal devient « Enregistrer ma variante ».
  await expect(
    page.getByText(/Variante de « Back squat »/).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir l'original" })).toHaveAttribute(
    "href",
    "/coach/bibliotheque/squat",
  );
  await expect(page.getByRole("button", { name: "Enregistrer ma variante" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Nom de l'exercice" })).toHaveValue(
    "Back squat (ma variante)",
  );
  await expect(page.getByRole("combobox", { name: "Matériel" })).toHaveValue("barbell");
  await expect(page.getByRole("checkbox", { name: "Fessiers" })).toBeChecked();
  await page.getByRole("link", { name: "Annuler" }).click();
  await expect(page).toHaveURL(/\/coach\/bibliotheque\/squat$/);
});
