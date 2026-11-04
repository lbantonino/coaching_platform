import { expect, test, type Page } from "@playwright/test";

// Documents du coach (4e, D-60) : importer, voir, rechercher, modifier, supprimer ; fichier privé
// à l'organisation. Coach de démo B (le compte A est celui qu'Antonino regarde) ; chaque projet
// importe SON document, au nom unique, et le supprime.
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

const PDF = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< >>\n%%EOF\n");

// Menu « Catégorie » (kit « Coory Pages » 05, D-120) : le bouton, puis le choix (« Contrat, 2 documents »).
async function chooseCategory(page: Page, name: string) {
  await page.getByRole("button", { name: /^Catégorie :/ }).click();
  await page.getByRole("option", { name: new RegExp(`^${name}, \\d+ documents?$`) }).click();
  await expect(page.getByRole("button", { name: `Catégorie : ${name}` })).toBeVisible();
}

test("un document s'importe, se retrouve, se renomme et se supprime ; il reste privé", async ({
  page,
  browser,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await login(page, "coach-b@example.test");
  await page.goto("/coach/documents");
  await page.getByRole("button", { name: "Importer un fichier" }).click();
  const sheet = page.getByRole("dialog", { name: "Importer un fichier" });

  // Un faux PDF (du texte) est refusé : on lit ses premiers octets, pas son nom. Rien n'est perdu.
  await sheet.getByLabel("Fichier à importer").setInputFiles({
    name: `Contrat_${stamp}.pdf`,
    mimeType: "application/pdf",
    buffer: Buffer.from("ceci n'est pas un PDF"),
  });
  await expect(sheet.getByRole("textbox", { name: "Nom" })).toHaveValue(`Contrat ${stamp}`);
  await expect(sheet.getByRole("radio", { name: "Contrat" })).toBeChecked();
  await sheet.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(sheet.getByRole("alert")).toContainText("Format non accepté");
  await expect(sheet.getByRole("textbox", { name: "Nom" })).toHaveValue(`Contrat ${stamp}`);

  // Le vrai fichier : importé, nom et catégorie proposés d'après son nom.
  await sheet.getByLabel("Fichier à importer").setInputFiles({
    name: `Contrat_${stamp}.pdf`,
    mimeType: "application/pdf",
    buffer: PDF,
  });
  await sheet.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.getByText("Document importé.")).toBeVisible();
  await expect(sheet).toBeHidden();

  // Recherche et filtre en direct (une ligne du tableau, ou de la liste sur téléphone).
  const row = page.getByRole("row").filter({ hasText: `Contrat ${stamp}` });
  await page.getByRole("searchbox", { name: "Rechercher un document" }).fill(stamp);
  await expect(row).toBeVisible();
  await chooseCategory(page, "Facture");
  await expect(row).toHaveCount(0);
  await chooseCategory(page, "Contrat");
  await expect(row).toBeVisible();

  // Aperçu : le fichier est servi par l'app, au coach de l'organisation seulement.
  await row.getByRole("button", { name: new RegExp(`^Contrat ${stamp}`) }).click();
  const preview = page.getByRole("dialog", { name: `Contrat ${stamp}` });
  const href = await preview.getByRole("link", { name: "Télécharger" }).getAttribute("href");
  expect(href).toMatch(/^\/documents\/[0-9a-f-]{36}\?telecharger$/);
  const url = href!.replace("?telecharger", "");
  const own = await page.request.get(url);
  expect(own.status()).toBe(200);
  expect(own.headers()["content-type"]).toBe("application/pdf");
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await login(otherPage, "coach-a@example.test");
  expect((await otherPage.request.get(url)).status()).toBe(404);
  await other.close();

  // Modifier : renommer et changer de catégorie.
  await preview.getByRole("button", { name: "Modifier" }).click();
  const edit = page.getByRole("dialog", { name: "Modifier le document" });
  await edit.getByRole("textbox", { name: "Nom" }).fill(`Bilan ${stamp}`);
  await edit.getByText("Bilan", { exact: true }).click();
  await edit.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Document enregistré.")).toBeVisible();
  await chooseCategory(page, "Toutes");
  const renamed = page.getByRole("row").filter({ hasText: `Bilan ${stamp}` });
  await expect(renamed).toContainText("Bilan");

  // Supprimer (menu « ••• », confirmation) : le fichier ne se sert plus.
  await renamed.getByRole("button", { name: `Plus d'actions : Bilan ${stamp}` }).click();
  await page
    .getByRole("dialog", { name: `Bilan ${stamp}` })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page
    .getByRole("dialog", { name: "Supprimer ce document ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Document supprimé.")).toBeVisible();
  await expect(renamed).toHaveCount(0);
  expect((await page.request.get(url)).status()).toBe(404);
});

// Classement, option D (D-67) : le coach crée, renomme et supprime ses catégories ; les documents
// d'une catégorie supprimée restent, « sans catégorie ». Nom unique par projet (tests en parallèle).
test("le coach gère ses catégories : ajouter, ranger, renommer, supprimer", async ({
  page,
}, testInfo) => {
  const stamp = `${testInfo.project.name}${Date.now().toString(36)}`;
  const category = `Certificats ${stamp}`;
  await login(page, "coach-b@example.test");
  await page.goto("/coach/documents");

  await page.getByRole("button", { name: "Gérer les catégories" }).click();
  const manager = page.getByRole("dialog", { name: "Gérer les catégories" });
  await manager.getByLabel("Nouvelle catégorie").fill(category);
  await manager.getByRole("button", { name: "Ajouter" }).click();
  await expect(manager.getByLabel(`Nom de la catégorie ${category}`)).toBeVisible();
  await manager.getByRole("button", { name: "Fermer" }).click();

  // Un document rangé dans la nouvelle catégorie.
  await page.getByRole("button", { name: "Importer un fichier" }).click();
  const sheet = page.getByRole("dialog", { name: "Importer un fichier" });
  await sheet
    .getByLabel("Fichier à importer")
    .setInputFiles({ name: `certif-${stamp}.pdf`, mimeType: "application/pdf", buffer: PDF });
  await sheet.getByText(category, { exact: true }).click();
  await sheet.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(sheet).toBeHidden();
  await chooseCategory(page, category);
  await expect(page.getByRole("row").filter({ hasText: `certif-${stamp}` })).toBeVisible();

  // Renommer, puis supprimer : le document reste, « sans catégorie ».
  await page.getByRole("button", { name: "Gérer les catégories" }).click();
  await manager.getByLabel(`Nom de la catégorie ${category}`).fill(`${category} bis`);
  await manager.getByRole("button", { name: "Enregistrer" }).click();
  await expect(manager.getByLabel(`Nom de la catégorie ${category} bis`)).toBeVisible();
  // Couleur (D-68) : le rond ouvre la palette, le choix est enregistré.
  const color = manager.getByRole("button", { name: `Couleur de la catégorie ${category} bis :` });
  await color.click();
  await manager
    .getByRole("radiogroup", { name: `Couleur de la catégorie ${category} bis` })
    .getByRole("radio", { name: "Rose" })
    .click();
  await expect(color).toHaveAccessibleName(`Couleur de la catégorie ${category} bis : Rose`);
  await manager.getByRole("button", { name: `Supprimer la catégorie ${category} bis` }).click();
  await page
    .getByRole("dialog", { name: "Supprimer cette catégorie ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(manager.getByLabel(`Nom de la catégorie ${category} bis`)).toHaveCount(0);
  await manager.getByRole("button", { name: "Fermer" }).click();
  await chooseCategory(page, "Sans catégorie");
  const row = page.getByRole("row").filter({ hasText: `certif-${stamp}` });
  await expect(row).toBeVisible();

  // Rangement : le document de test est supprimé.
  await row.getByRole("button", { name: /^Plus d'actions/ }).click();
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Supprimer ce document ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText(`certif-${stamp}`)).toHaveCount(0);
});

test("l'onglet Documents de la fiche montre les documents du sportif et importe pour lui", async ({
  page,
}) => {
  await login(page, "coach-a@example.test");
  const fiche =
    "/coach/o/0a000000-0000-4000-8000-0000000000a1/sportifs/da000000-0000-4000-8000-000000000001";
  await page.goto(`${fiche}?onglet=documents`);
  const tab = page.getByRole("region", { name: "Documents" });
  await expect(tab.getByRole("link", { name: /Contrat de coaching 2026/ })).toBeVisible();
  await expect(tab.getByRole("link", { name: /Bilan de rentrée/ })).toHaveCount(0);
  await tab.getByRole("link", { name: "Importer un document" }).click();
  await expect(page.getByRole("dialog", { name: "Importer un fichier" })).toBeVisible();
  await expect(page.getByLabel(/^Sportif/)).toHaveValue("da000000-0000-4000-8000-000000000001");
  // La page Documents est filtrée sur ce sportif.
  await expect(page.getByRole("combobox", { name: "Filtrer par sportif" })).toHaveValue(
    "da000000-0000-4000-8000-000000000001",
  );
});

// Kit « Coory Pages » 05 (D-120) : le tableau se trie par « Ajouté le » (le plus récent d'abord, par
// défaut) ou par catégorie (A→Z, puis Z→A) ; le menu « Catégorie » filtre. Lecture seule (coach A).
test("le tableau des documents se trie, et le menu « Catégorie » le filtre", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "telephone", "Le tri est celui du tableau de l'ordinateur.");
  await login(page, "coach-a@example.test");
  await page.goto("/coach/documents");
  const byCategory = page.getByRole("columnheader", { name: "Catégorie" });
  const byDate = page.getByRole("columnheader", { name: "Ajouté le" });
  await expect(byDate).toHaveAttribute("aria-sort", "descending");
  await expect(byCategory).toHaveAttribute("aria-sort", "none");

  // Catégorie de chaque ligne (2e cellule), sans les documents « Sans catégorie » (toujours à la fin).
  const categories = async () =>
    (await page.getByRole("row").locator("[role=cell]:nth-child(2)").allInnerTexts())
      .map((text) => text.trim())
      .filter((text) => text !== "Sans catégorie");
  const ordered = (values: string[], sign: 1 | -1) =>
    values.every((value, i) => i === 0 || sign * values[i - 1].localeCompare(value, "fr") <= 0);

  await byCategory.getByRole("button").click();
  await expect(byCategory).toHaveAttribute("aria-sort", "ascending");
  await expect(byDate).toHaveAttribute("aria-sort", "none");
  expect(ordered(await categories(), 1)).toBe(true);
  await byCategory.getByRole("button").click();
  await expect(byCategory).toHaveAttribute("aria-sort", "descending");
  expect(ordered(await categories(), -1)).toBe(true);

  // Filtre : seulement des contrats, dont celui de la démo.
  await chooseCategory(page, "Contrat");
  await expect(page.getByRole("row").filter({ hasText: "Contrat de coaching 2026" })).toBeVisible();
  expect(new Set(await categories())).toEqual(new Set(["Contrat"]));
});
