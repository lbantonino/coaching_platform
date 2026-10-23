import { expect, test, type Page } from "@playwright/test";

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
  await dialog.getByLabel("Montant reçu (TVAC)").fill("3000");
  await expect(dialog.getByText(/2\s479,34\s€ HTVA · 520,66\s€ de TVA/)).toBeVisible();
  await dialog.getByText("Espèces", { exact: true }).click();
  await dialog.getByLabel(/^Libellé/).fill(label);
  await dialog.getByRole("button", { name: "Enregistrer le paiement" }).click();
  await expect(page.getByText("Paiement enregistré.")).toBeVisible();
  await expect(dialog).toBeHidden();

  await page.goto("/coach/comptabilite");
  const payments = page.getByRole("list", { name: "Liste des paiements" });
  const row = payments.getByRole("listitem").filter({ hasText: label });
  await expect(row).toContainText("Espèces");
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
  await dialog.getByLabel("Montant reçu (TVAC)").fill("abc");
  await dialog.getByRole("button", { name: "Enregistrer le paiement" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Indique le montant reçu");
  await expect(dialog.getByRole("combobox", { name: "Sportif" })).toHaveValue(
    "da000000-0000-4000-8000-000000000002",
  );
});
