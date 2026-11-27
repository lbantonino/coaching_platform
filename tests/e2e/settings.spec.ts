import { expect, test, type Page } from "@playwright/test";

import { chooseSettingsSection, isPhone, openSettings } from "./helpers";

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
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();

  // On change de rubrique sans changer d'adresse (colonne ; menu déroulant sur téléphone).
  await chooseSettingsSection(page, "Sécurité");
  await expect(dialog.getByRole("heading", { name: "Sécurité" })).toBeAttached();
  await expect(dialog.getByRole("region", { name: "Adresse e-mail" })).toContainText(
    "coach-b@example.test",
  );
  expect(page.url()).toBe(here);

  // Échap referme la fenêtre : on est toujours sur la même page.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(page.url()).toBe(here);

  // « Mon profil » ouvre directement la rubrique Profil.
  if (isPhone(page)) await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page
    .getByRole("button", { name: /^Menu du compte/ })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Mon profil", exact: true }).click();
  await expect(dialog.getByRole("region", { name: "Identité" })).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Prénom" })).not.toHaveValue("");
});

test("téléphone : un menu déroulant des rubriques, Échap referme le menu d'abord", async ({
  page,
}) => {
  test.skip(!isPhone(page), "Menu déroulant propre au téléphone.");
  await loginAsCoachB(page);
  // L'ancienne adresse ouvre la fenêtre par-dessus le tableau de bord (décision 5).
  const dialog = await openSettings(page, "profil");
  const picker = dialog.locator("button[aria-expanded]");
  await expect(picker).toContainText("Profil");
  await expect(picker).toHaveAttribute("aria-expanded", "false");
  await picker.click();
  const sections = dialog.getByRole("navigation", { name: "Sections des paramètres" });
  for (const name of ["Profil", "Préférences", "Pays et devise", "Sécurité", "Données"]) {
    await expect(sections.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(sections.getByRole("button", { name: "Profil", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // Échap : le menu se referme, la fenêtre reste.
  await page.keyboard.press("Escape");
  await expect(sections).toBeHidden();
  await expect(dialog).toBeVisible();
  await chooseSettingsSection(page, "Données");
  await expect(sections).toBeHidden();
  await expect(picker).toContainText("Données");
  await expect(dialog.getByRole("button", { name: "Télécharger mes données" })).toBeVisible();
  // La croix referme la fenêtre.
  await dialog.getByRole("button", { name: "Fermer" }).filter({ visible: true }).click();
  await expect(dialog).toBeHidden();
});

test("les préférences préremplissent une nouvelle séance, et la cloche se règle", async ({
  page,
}) => {
  test.skip(isPhone(page), "Écrit les préférences du coach B : un seul projet.");
  await loginAsCoachB(page);
  // Un seul « Enregistrer » pour toute la rubrique (décision 7).
  let dialog = await openSettings(page, "preferences");
  const defaults = dialog.getByRole("region", { name: "Valeurs par défaut" });
  const agenda = dialog.getByRole("region", { name: "Heures de l'agenda" });
  const save = dialog.getByRole("button", { name: "Enregistrer", exact: true });
  await defaults.getByLabel("Durée", { exact: true }).fill("45");
  await defaults.getByLabel(/^Lieu/).fill("Box de test");
  await defaults.getByLabel(/^Prix/).fill("70");
  await defaults.getByText("Espèces", { exact: true }).click();
  await agenda.getByLabel("À partir de").selectOption("7");
  await save.click();
  await expect(page.getByText("Préférences enregistrées.")).toBeVisible();

  // La fenêtre « Nouvelle séance » reprend ces valeurs ; la TVA, décochée par défaut (D-163), est
  // comprise dans le prix en espèces quand on la coche.
  await page.goto("/coach");
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await page.getByRole("dialog", { name: "Créer" }).getByRole("button", { name: "Séance" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle séance" });
  // Durée proposée : la fin suit le début (19:00 + 45 min).
  await expect(sheet.getByLabel("Heure de fin")).toHaveValue("19:45");
  await expect(sheet.getByText("Durée : 45 min")).toBeVisible();
  await expect(sheet.getByLabel(/^Lieu/)).toHaveValue("Box de test");
  await expect(sheet.getByLabel(/^Prix de la séance/)).toHaveValue("70");
  await expect(sheet.getByRole("radio", { name: "Espèces" })).toBeChecked();
  await expect(sheet.getByLabel(/^Appliquer la TVA/)).not.toBeChecked();
  await sheet.getByLabel(/^Appliquer la TVA/).check();
  await expect(sheet.getByLabel(/^TVA comprise dans le prix/)).toBeChecked();
  await sheet.getByRole("button", { name: "Annuler" }).click();

  // Cloche : couper « Fiches à compléter » (puis Enregistrer) la retire de la page Notifications.
  dialog = await openSettings(page, "preferences");
  const bell = dialog.getByRole("region", { name: "Notifications" });
  await bell.getByRole("switch", { name: "Fiches à compléter" }).uncheck();
  await save.click();
  await expect(page.getByText("Préférences enregistrées.")).toBeVisible();
  await page.goto("/coach/notifications");
  await expect(page.getByText(/Masqué : fiches à compléter/)).toBeVisible();

  // « Changer dans Paramètres » ouvre la fenêtre sur Préférences, par-dessus la page Notifications.
  await page.getByRole("link", { name: "Changer dans Paramètres" }).click();
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/coach\/notifications$/);

  // Remise en place.
  await bell.getByRole("switch", { name: "Fiches à compléter" }).check();
  await defaults.getByLabel("Durée", { exact: true }).fill("60");
  await defaults.getByLabel(/^Lieu/).fill("");
  await defaults.getByLabel(/^Prix/).fill("");
  await defaults.getByText("Virement", { exact: true }).click();
  await agenda.getByLabel("À partir de").selectOption("6");
  await save.click();
  await expect(page.getByText("Préférences enregistrées.")).toBeVisible();
});

// Plus de TVA dans les Paramètres (D-163, demande d'Antonino du 11/11) : elle se choisit à chaque
// paiement, dépense ou séance. La rubrique ne garde que le pays et la devise.
test("Pays et devise : la TVA n'est plus un réglage", async ({ page }) => {
  await loginAsCoachB(page);
  const dialog = await openSettings(page, "argent");
  await expect(dialog.getByLabel("Pays", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "TVA" })).toHaveCount(0);
  await expect(dialog.getByText("Je facture la TVA")).toHaveCount(0);
  await expect(dialog.locator("button[aria-expanded]")).not.toContainText("%");
});

test("sécurité : le mot de passe actuel est vérifié, et les données s'exportent", async ({
  page,
}) => {
  await loginAsCoachB(page);
  const dialog = await openSettings(page, "securite");
  const password = dialog.getByRole("region", { name: "Mot de passe" });
  const current = password.getByLabel("Mot de passe actuel", { exact: true });
  await current.fill("pas-le-bon-mot-de-passe");
  // « Afficher » montre ce qu'on a tapé (kit), « Masquer » le recache.
  await password.getByRole("button", { name: "Afficher le mot de passe actuel" }).click();
  await expect(current).toHaveAttribute("type", "text");
  await password.getByRole("button", { name: "Masquer le mot de passe actuel" }).click();
  await expect(current).toHaveAttribute("type", "password");
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
  // Tout ce que l'organisation contient (relecture du 18/11 : une dizaine de tables manquaient),
  // y compris les réglages de l'organisation ; jamais le jeton secret d'une invitation.
  for (const table of [
    "account_signups",
    "organization_members",
    "coach_documents",
    "document_categories",
    "coach_expenses",
    "expense_categories",
    "coach_task_lists",
    "exercises",
    "exercise_favorites",
    "program_drafts",
    "program_templates",
    "session_templates",
    "organization_currency_changes",
    "athlete_invites",
    "assistant_usage",
    // D-212 : les conversations de l'Assistant IA.
    "assistant_conversations",
  ]) {
    expect(Array.isArray(body.donnees[table]), table).toBe(true);
  }
  expect(body.organisation.pays).toBeTruthy();
  expect(body.organisation.devise).toBeTruthy();
  expect(JSON.stringify(body)).not.toContain("token_hash");
});

// Relecture du 18/11 : le fichier se télécharge depuis le bouton ; un export qui échoue le DIT dans
// la carte (avant, le navigateur échouait en silence, ou enregistrait la phrase d'erreur).
test("export : le fichier se télécharge, et un échec s'affiche dans la carte", async ({ page }) => {
  await loginAsCoachB(page);
  const dialog = await openSettings(page, "donnees");
  const card = dialog.getByRole("region", { name: "Exporter mes données" });
  const download = page.waitForEvent("download");
  await card.getByRole("button", { name: "Télécharger mes données" }).click();
  expect((await download).suggestedFilename()).toMatch(/^coory-export-\d{4}-\d{2}-\d{2}\.json$/);

  await page.route("**/coach/profil/export", (route) =>
    route.fulfill({ status: 503, contentType: "text/plain", body: "indisponible" }),
  );
  await card.getByRole("button", { name: "Télécharger mes données" }).click();
  await expect(card.getByRole("alert")).toContainText("L'export n'a pas abouti");
});
