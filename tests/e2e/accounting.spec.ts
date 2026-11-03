import { expect, test, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Paiements reçus et Comptabilité (D-36) : « Créer → Paiement reçu » ouvre la fenêtre, le HTVA se
// calcule en direct, le paiement apparaît dans la Comptabilité avec son mode (filtre compte bancaire /
// espèces), puis se supprime. Libellé unique par test : les projets tournent en parallèle.
async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach note un paiement reçu en espèces et le retrouve dans sa comptabilité", async ({
  page,
}, testInfo) => {
  const label = `Forfait test ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await loginAsCoachA(page);

  // Tableau de bord : la carte « CA de la semaine » mène à la Comptabilité.
  await expect(page.getByRole("link", { name: /encaissés cette semaine/ })).toHaveAttribute(
    "href",
    "/coach/comptabilite",
  );

  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Créer" })
    .getByRole("button", { name: "Paiement reçu" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Nouveau paiement" });
  await dialog.getByRole("combobox", { name: "Sportif" }).selectOption({ label: "Sophie Lambert" });
  await dialog.getByLabel(/^Montant reçu \(TVAC/).fill("3000");
  await expect(dialog.getByText(/2\s479,34\s€ HTVA · 520,66\s€ de TVA/)).toBeVisible();
  await dialog.getByText("Espèces", { exact: true }).click();
  // Forfait (D-52) : 3 mois payés d'avance, la période couverte est notée.
  await dialog.getByLabel(/^Forfait sur une période/).check();
  await dialog.getByLabel("Du", { exact: true }).fill("2026-11-01");
  await dialog.getByLabel("Au", { exact: true }).fill("2027-01-31");
  await dialog.getByLabel(/^Libellé/).fill(label);
  await dialog.getByRole("button", { name: "Enregistrer le paiement" }).click();
  await expect(page.getByText("Paiement enregistré.")).toBeVisible();
  await expect(dialog).toBeHidden();

  await page.goto("/coach/comptabilite");
  const payments = page.getByRole("list", { name: "Liste des paiements" });
  const row = payments.getByRole("listitem").filter({ hasText: label });
  await expect(row).toContainText("Espèces");
  await expect(row).toContainText("Forfait du 1 nov. au 31 janv.");
  await expect(row).toContainText(/3\s000,00\s€/);

  // Filtre : ce paiement en espèces n'est pas sur le compte bancaire.
  const filters = page.getByRole("navigation", { name: "Filtrer les paiements" });
  await filters.getByRole("link", { name: "Compte bancaire" }).click();
  await expect(page).toHaveURL(/mode=banque/);
  await expect(page.getByRole("listitem").filter({ hasText: label })).toHaveCount(0);
  await filters.getByRole("link", { name: "Espèces et autres" }).click();
  await expect(page).toHaveURL(/mode=especes/);
  const cashRow = page.getByRole("listitem").filter({ hasText: label });
  await expect(cashRow).toBeVisible();

  // Noté par erreur : il se supprime.
  await cashRow.getByRole("button", { name: "Plus d'actions" }).click();
  await page
    .getByRole("dialog", { name: "Paiement de Sophie Lambert" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page
    .getByRole("dialog", { name: "Supprimer ce paiement ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByRole("listitem").filter({ hasText: label })).toHaveCount(0);
});

test("le montant reçu est obligatoire, et la saisie est gardée après l'erreur", async ({
  page,
}) => {
  await loginAsCoachA(page);
  await page.goto("/coach/comptabilite");
  await page.getByRole("button", { name: "Nouveau paiement" }).click();
  const dialog = page.getByRole("dialog", { name: "Nouveau paiement" });
  await dialog.getByRole("combobox", { name: "Sportif" }).selectOption({ label: "Thomas Peeters" });
  await dialog.getByLabel(/^Montant reçu \(TVAC/).fill("abc");
  await dialog.getByRole("button", { name: "Enregistrer le paiement" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Indique le montant reçu");
  await expect(dialog.getByRole("combobox", { name: "Sportif" })).toHaveValue(
    "da000000-0000-4000-8000-000000000002",
  );
});

test("le tableau de comptabilité montre l'argent reçu par mode et par période, avec son graphique", async ({
  page,
}) => {
  await loginAsCoachA(page);
  await page.goto("/coach/comptabilite");
  // Mois par défaut : le graphique montre le mois en cours, les modes sont écrits avec leur montant.
  const share = page.getByRole("region", { name: /^Répartition · / });
  await expect(share.getByRole("figure")).toContainText("Total reçu");
  await expect(share.getByRole("button", { name: /^Virement/ })).toBeVisible();
  const table = page.getByRole("table", { name: /par mois$/ });
  await expect(table.getByRole("columnheader", { name: /Espèces/ })).toBeVisible();
  await expect(table.getByRole("rowheader", { name: "Total" })).toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(14);

  // Une autre période : la ligne choisie s'affiche dans le graphique.
  const previous = table.getByRole("rowheader").nth(1).getByRole("link");
  await previous.click();
  await expect(previous).toHaveAttribute("aria-current", "true");
  await expect(page).toHaveURL(/periode=/);

  // Par année et par semaine.
  await page
    .getByRole("navigation", { name: "Période du tableau" })
    .getByRole("link", { name: "Année" })
    .click();
  await expect(page.getByRole("table", { name: /par année$/ })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Période du tableau" })
    .getByRole("link", { name: "Semaine" })
    .click();
  await expect(page.getByRole("table", { name: /par semaine$/ })).toBeVisible();
  await expect(page.getByRole("region", { name: /^Répartition · Semaine du / })).toBeVisible();
});

test("une dépense mensuelle compte chaque mois, s'arrête, puis se supprime", async ({
  page,
}, testInfo) => {
  const label = `Loyer test ${testInfo.project.name} ${Date.now().toString(36)}`;
  await loginAsCoachA(page);
  await page.goto("/coach/comptabilite?liste=depenses");
  await page.getByRole("button", { name: "Nouvelle dépense" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle dépense" });
  await sheet.getByLabel("Description").fill(label);
  await sheet.getByLabel("Catégorie", { exact: true }).selectOption({ label: "Loyer et salle" });
  await sheet.getByLabel(/^Montant payé/).fill("121");
  // Coach A est soumis à la TVA : la TVA récupérable se calcule.
  await expect(sheet.getByText(/100,00\s€ HTVA \+ 21,00\s€ de TVA récupérable/)).toBeVisible();
  await sheet.getByText("Se répète chaque mois").click();
  await sheet.getByRole("button", { name: "Enregistrer la dépense" }).click();
  await expect(page.getByText("Dépense enregistrée.")).toBeVisible();

  const row = page
    .getByRole("list", { name: "Liste des dépenses" })
    .getByRole("listitem")
    .filter({ hasText: label });
  await expect(row).toContainText("Chaque mois");
  await expect(row).toContainText(/121,00\s€/);

  // « Arrêter » : elle ne compte plus après aujourd'hui, le passé reste.
  await row.getByRole("button", { name: "Plus d'actions" }).click();
  await page.getByRole("button", { name: /^Arrêter/ }).click();
  await expect(row).toContainText("Chaque mois jusqu'au");

  // Rangement : la dépense de test est supprimée.
  await row.getByRole("button", { name: "Plus d'actions" }).click();
  await page
    .getByRole("dialog", { name: label })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page
    .getByRole("dialog", { name: "Supprimer cette dépense ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByRole("listitem").filter({ hasText: label })).toHaveCount(0);
});

// À encaisser (D-90) : les séances passées avec un prix, pas encore payées, à la place des factures.
// Le tableau de bord les compte (en retard après une semaine : Sophie, dans le seed) ; la Comptabilité
// les liste et chacune se marque payée sur place. Ni Sophie (cloche) ni « Coaching force » (testé
// par sessions.spec) : les tests tournent en parallèle.
test("À encaisser : une séance passée se marque payée depuis la Comptabilité", async ({ page }) => {
  test.skip(!isPhone(page), "Enregistre un paiement de démonstration : un seul projet.");
  await loginAsCoachA(page);
  const finance = page.getByRole("region", { name: "Activité financière" });
  await expect(finance).toContainText(/\d+ séances? à encaisser/);
  await expect(finance).toContainText(/en retard/i);

  await page.goto("/coach/comptabilite?liste=a-encaisser");
  const list = page.getByRole("list", { name: "Séances à encaisser" });
  const row = list
    .getByRole("listitem")
    .filter({ hasNotText: "Sophie" })
    .filter({ hasNotText: "Coaching force" })
    .first();
  const href = await row.getByRole("link").getAttribute("href");
  const button = row.getByRole("button", { name: /^Marquer payée : / });
  const label = (await button.getAttribute("aria-label")) ?? "";
  await button.click();
  await expect(page.getByText("Paiement enregistré.")).toBeVisible();
  // Payée : elle quitte la liste, et sa page la montre payée.
  await expect(list.getByRole("button", { name: label, exact: true })).toHaveCount(0);
  await page.goto(href ?? "/");
  await expect(page.getByText(/^Payée le /).first()).toBeVisible();
});
