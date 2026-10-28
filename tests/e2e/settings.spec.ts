import { expect, test, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Paramètres (D-57). Coach de démo B : le compte A est celui qu'Antonino regarde. Les deux projets
// tournent en parallèle sur la même base : chaque test qui écrit ne tourne que sur UN projet, et
// remet en place ce qu'il a changé.
async function loginAsCoachB(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-b@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le menu du compte ouvre les Paramètres en fenêtre, par-dessus la page en cours", async ({
  page,
}) => {
  await loginAsCoachB(page);
  const here = page.url();
  // Téléphone : le menu du compte est au bas du menu hamburger, qui se referme derrière.
  if (isPhone(page)) await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page
    .getByRole("button", { name: /^Menu du compte/ })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Paramètres", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Paramètres" });
  const sections = dialog.getByRole("navigation", { name: "Sections des paramètres" });
  await expect(sections).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();

  // On change de section sans changer d'adresse.
  await sections.getByRole("button", { name: /^Sécurité/ }).click();
  await expect(dialog.getByRole("heading", { name: "Sécurité" })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "Adresse e-mail" })).toContainText(
    "coach-b@example.test",
  );
  if (isPhone(page)) {
    // Téléphone : un retour vers le sommaire.
    await dialog.getByRole("button", { name: "Paramètres", exact: true }).click();
    await expect(sections.getByRole("button", { name: /^Données/ })).toBeVisible();
  }
  expect(page.url()).toBe(here);

  // Échap referme la fenêtre : on est toujours sur la même page.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(page.url()).toBe(here);

  // « Mon profil » ouvre directement la section Profil.
  if (isPhone(page)) await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page
    .getByRole("button", { name: /^Menu du compte/ })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Mon profil", exact: true }).click();
  await expect(dialog.getByRole("region", { name: "Identité" })).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Prénom" })).not.toHaveValue("");
});

test("téléphone : un sommaire façon Réglages, puis chaque section avec un retour", async ({
  page,
}) => {
  test.skip(!isPhone(page), "Sommaire propre au téléphone.");
  await loginAsCoachB(page);
  await page.goto("/coach/profil");
  const sections = page.getByRole("navigation", { name: "Sections des paramètres" });
  for (const name of ["Profil", "Préférences", "Facturation et légal", "Sécurité", "Données"]) {
    await expect(sections.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await sections.getByRole("link", { name: /^Sécurité/ }).click();
  await expect(page).toHaveURL(/onglet=securite/);
  await expect(page.getByRole("heading", { name: "Sécurité", level: 2 })).toBeVisible();
  await page.getByRole("link", { name: "Paramètres", exact: true }).click();
  await expect(page).toHaveURL(/\/coach\/profil$/);
  await expect(sections.getByRole("link", { name: /^Données/ })).toBeVisible();
});

test("les préférences préremplissent une nouvelle séance, et la cloche se règle", async ({
  page,
}) => {
  test.skip(isPhone(page), "Écrit les préférences du coach B : un seul projet.");
  await loginAsCoachB(page);
  await page.goto("/coach/profil?onglet=preferences");
  const defaults = page.getByRole("region", { name: "Valeurs par défaut" });
  await defaults.getByLabel("Durée (min)").fill("45");
  await defaults.getByLabel(/^Lieu/).fill("Box de test");
  await defaults.getByLabel(/^Prix/).fill("70");
  await defaults.getByText("Espèces", { exact: true }).click();
  await defaults.getByLabel("À partir de").selectOption("7");
  await defaults.getByRole("button", { name: "Enregistrer les préférences" }).click();
  await expect(defaults.getByRole("status")).toContainText("Préférences enregistrées.");

  // La fenêtre « Nouvelle séance » reprend ces valeurs (espèces : TVA comprise).
  await page.goto("/coach");
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await page.getByRole("dialog", { name: "Créer" }).getByRole("button", { name: "Séance" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(sheet.getByLabel("Durée (min)")).toHaveValue("45");
  await expect(sheet.getByLabel(/^Lieu/)).toHaveValue("Box de test");
  await expect(sheet.getByLabel(/^Prix de la séance/)).toHaveValue("70");
  await expect(sheet.getByRole("radio", { name: "Espèces" })).toBeChecked();
  await expect(sheet.getByLabel("TVA comprise dans le prix")).toBeChecked();
  await sheet.getByRole("button", { name: "Fermer" }).click();

  // Cloche : décocher « Fiches à compléter » la retire de la page Notifications.
  await page.goto("/coach/profil?onglet=preferences");
  const bell = page.getByRole("region", { name: "Notifications" });
  const profiles = bell.getByRole("switch", { name: "Fiches à compléter" });
  await profiles.uncheck({ force: true });
  await expect(page.getByText("Masqué de la cloche.")).toBeVisible();
  await page.goto("/coach/notifications");
  await expect(page.getByText(/Masqué : fiches à compléter/)).toBeVisible();

  // Remise en place.
  await page.goto("/coach/profil?onglet=preferences");
  await bell.getByRole("switch", { name: "Fiches à compléter" }).check({ force: true });
  await expect(page.getByText("Affiché dans la cloche.")).toBeVisible();
  await defaults.getByLabel("Durée (min)").fill("60");
  await defaults.getByLabel(/^Lieu/).fill("");
  await defaults.getByLabel(/^Prix/).fill("");
  await defaults.getByText("Virement", { exact: true }).click();
  await defaults.getByLabel("À partir de").selectOption("6");
  await defaults.getByRole("button", { name: "Enregistrer les préférences" }).click();
  await expect(defaults.getByRole("status")).toContainText("Préférences enregistrées.");
});

test("une structure légale s'ajoute, se modifie et se supprime, numéros vérifiés", async ({
  page,
}) => {
  test.skip(!isPhone(page), "Écrit les structures de l'organisation B : un seul projet.");
  await loginAsCoachB(page);
  await page.goto("/coach/profil?onglet=facturation");
  await page.getByRole("button", { name: "Ajouter une structure" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle structure" });
  await sheet.getByLabel("Raison sociale").fill("Structure de test");
  await sheet.getByLabel(/^Numéro d'entreprise/).fill("0123.456.749");
  await expect(sheet.getByText("Numéro de TVA : BE0123.456.749")).toBeVisible();
  // IBAN faux : signalé dès qu'on quitte le champ, puis refusé à l'envoi.
  const iban = sheet.getByRole("textbox", { name: /^IBAN/ });
  await iban.fill("BE68 5390 0754 7035");
  await sheet.getByLabel("BIC").focus();
  await expect(sheet.getByText(/^IBAN invalide/).first()).toBeVisible();
  await iban.fill("BE68 5390 0754 7034");
  await sheet.getByRole("button", { name: "Enregistrer la structure" }).click();
  await expect(page.getByText("Structure enregistrée.")).toBeVisible();

  const card = page.getByRole("region", { name: "Structure de test" });
  await expect(card).toContainText("BE68 5390 0754 7034");
  await expect(card).toContainText("Assujetti à la TVA · BE0123.456.749");
  // Première structure de l'organisation : par défaut d'office.
  await expect(card).toContainText("Par défaut");

  await card.getByRole("button", { name: "Modifier Structure de test" }).click();
  const edit = page.getByRole("dialog", { name: "Modifier Structure de test" });
  await edit.getByLabel("Raison sociale").fill("Structure de test renommée");
  await edit.getByRole("button", { name: "Enregistrer la structure" }).click();
  const renamed = page.getByRole("region", { name: "Structure de test renommée" });
  await expect(renamed).toBeVisible();

  await renamed.getByRole("button", { name: "Plus d'actions" }).click();
  await page
    .getByRole("dialog", { name: "Structure de test renommée" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page
    .getByRole("dialog", { name: "Supprimer cette structure ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(renamed).toHaveCount(0);
});

test("sécurité : le mot de passe actuel est vérifié, et les données s'exportent", async ({
  page,
}) => {
  await loginAsCoachB(page);
  await page.goto("/coach/profil?onglet=securite");
  const password = page.getByRole("region", { name: "Mot de passe" });
  await password.getByLabel("Mot de passe actuel").fill("pas-le-bon-mot-de-passe");
  await password.getByLabel("Nouveau mot de passe").fill("nouveau-mot-de-passe-1");
  await password.getByLabel("Confirmer le nouveau").fill("nouveau-mot-de-passe-1");
  await password.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(password.getByRole("alert")).toContainText("Mot de passe actuel incorrect.");

  // Export : un fichier JSON avec les données de SON organisation seulement.
  const response = await page.request.get("/coach/profil/export");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-disposition"]).toMatch(/attachment; filename="coory-export-/);
  const body = await response.json();
  expect(body.organisation.nom).toBeTruthy();
  expect(Array.isArray(body.donnees.athlete_profiles)).toBe(true);
  const orgIds = new Set(
    (body.donnees.athlete_profiles as { organization_id: string }[]).map(
      (row) => row.organization_id,
    ),
  );
  expect([...orgIds].every((id) => id === body.organisation.id)).toBe(true);
});
