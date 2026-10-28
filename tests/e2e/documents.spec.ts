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

  // Recherche et filtre en direct.
  const row = page.getByRole("listitem").filter({ hasText: `Contrat ${stamp}` });
  await page.getByRole("searchbox", { name: "Rechercher un document" }).fill(stamp);
  await expect(row).toBeVisible();
  await page.getByRole("button", { name: "Facture", exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole("button", { name: "Contrat", exact: true }).click();
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
  await page.getByRole("button", { name: "Tous", exact: true }).click();
  const renamed = page.getByRole("listitem").filter({ hasText: `Bilan ${stamp}` });
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
