import { expect, test, type Page } from "@playwright/test";

// Factures émises (D-65) : un virement reçu apparaît « à facturer » ; « Créer la facture » ouvre un
// brouillon (client et adresse repris de la fiche), modifiable ; « Émettre » donne un numéro et fige
// la facture ; le PDF se télécharge. Les espèces ne se facturent pas. Libellé unique par test : les
// projets tournent en parallèle.
async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

async function notePayment(page: Page, label: string, method: "Virement" | "Espèces") {
  await page.goto("/coach/comptabilite");
  await page.getByRole("button", { name: "Nouveau paiement" }).click();
  const dialog = page.getByRole("dialog", { name: "Nouveau paiement" });
  await dialog.getByRole("combobox", { name: "Sportif" }).selectOption({ label: "Sophie Lambert" });
  await dialog.getByLabel("Montant reçu (TVAC)").fill("78,65");
  await dialog.getByText(method, { exact: true }).click();
  await dialog.getByLabel(/^Libellé/).fill(label);
  await dialog.getByRole("button", { name: "Enregistrer le paiement" }).click();
  await expect(page.getByText("Paiement enregistré.")).toBeVisible();
}

test("un virement se facture : brouillon modifiable, émission numérotée, PDF", async ({
  page,
}, testInfo) => {
  const label = `Virement ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const cash = `Espèces ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await loginAsCoachA(page);
  await notePayment(page, label, "Virement");
  await notePayment(page, cash, "Espèces");

  await page.goto("/coach/facturation");
  const toInvoice = page.getByRole("list", { name: "Paiements à facturer" });
  const row = toInvoice.getByRole("listitem").filter({ hasText: label });
  await expect(row).toContainText(/78,65\s€ par virement/);
  // Règle de Gianluca : les espèces ne se facturent pas.
  await expect(toInvoice.getByRole("listitem").filter({ hasText: cash })).toHaveCount(0);

  await row.getByRole("button", { name: /^Créer la facture : Sophie Lambert/ }).click();
  await expect(page).toHaveURL(/\/coach\/facturation\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Brouillon de facture", level: 1 })).toBeVisible();
  // Client et adresse repris de la fiche ; montants déduits du virement (TVA 21 %).
  await expect(page.getByLabel("Nom", { exact: true })).toHaveValue("Sophie Lambert");
  await expect(page.getByLabel("Rue et numéro")).toHaveValue("Rue de l'Exemple 1");
  const amounts = page.getByRole("region", { name: "Montants" });
  await expect(amounts).toContainText(/65,00\s€/);
  await expect(amounts).toContainText(/13,65\s€/);

  // Brouillon : il se modifie, et son aperçu PDF existe déjà.
  await page.getByLabel("Description de la prestation").fill(`${label} · corrigé`);
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page.getByText("Brouillon enregistré.")).toBeVisible();
  const draftPdf = await page.request.get(`${page.url()}/pdf`);
  expect(draftPdf.headers()["content-type"]).toBe("application/pdf");
  expect(draftPdf.headers()["content-disposition"]).toContain("brouillon-facture.pdf");

  // Émettre : confirmation, puis numéro de la structure par défaut (FAC-AAAA-NNNN), figée.
  await page.getByRole("button", { name: "Émettre la facture" }).click();
  await page
    .getByRole("dialog", { name: "Émettre cette facture ?" })
    .getByRole("button", { name: "Émettre" })
    .click();
  const title = page.getByRole("heading", { name: /^Facture FAC-\d{4}-\d{4}$/, level: 1 });
  await expect(title).toBeVisible();
  const number = (await title.innerText()).replace("Facture ", "");
  await expect(page.getByRole("button", { name: "Émettre la facture" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Supprimer le brouillon" })).toHaveCount(0);
  await expect(page.getByLabel("Description de la prestation")).toHaveCount(0);

  const pdf = await page.request.get(`${page.url()}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-disposition"]).toContain(`facture-${number}.pdf`);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  // Dans la liste : numéro et statut ; le virement n'est plus « à facturer ».
  await page.goto("/coach/facturation");
  await expect(
    page
      .getByRole("list", { name: "Liste des factures" })
      .getByRole("listitem")
      .filter({ hasText: number }),
  ).toContainText("Payée");
  await expect(
    page
      .getByRole("list", { name: "Paiements à facturer" })
      .getByRole("listitem")
      .filter({ hasText: label }),
  ).toHaveCount(0);
});

test("un brouillon se supprime, et son virement redevient « à facturer »", async ({
  page,
}, testInfo) => {
  const label = `Brouillon ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await loginAsCoachA(page);
  await notePayment(page, label, "Virement");
  await page.goto("/coach/facturation");
  await page
    .getByRole("list", { name: "Paiements à facturer" })
    .getByRole("listitem")
    .filter({ hasText: label })
    .getByRole("button", { name: /^Créer la facture/ })
    .click();
  await expect(page.getByRole("heading", { name: "Brouillon de facture", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Supprimer le brouillon" }).click();
  await page
    .getByRole("dialog", { name: "Supprimer ce brouillon ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page).toHaveURL(/\/coach\/facturation$/);
  await expect(
    page
      .getByRole("list", { name: "Paiements à facturer" })
      .getByRole("listitem")
      .filter({ hasText: label }),
  ).toBeVisible();
});

test("la facture d'une autre organisation est introuvable, PDF compris", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-b@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  // Facture de suivi de l'organisation A (jeu de démo).
  const response = await page.request.get(
    "/coach/facturation/fa000000-0000-4000-8000-0000000000a1/pdf",
  );
  expect(response.status()).toBe(404);
});

test("« Créer une facture » : un nouveau sportif (sa fiche est créée), à payer, puis marquée payée", async ({
  page,
}, testInfo) => {
  const lastName = `Facture${testInfo.project.name}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await loginAsCoachA(page);
  await page.goto("/coach/facturation");
  await page.getByRole("button", { name: "Créer une facture" }).click();
  const dialog = page.getByRole("dialog", { name: "Nouvelle facture" });
  await dialog.getByLabel(/^Nouveau sportif/).check();
  await dialog.getByLabel("Prénom").fill("Testine");
  await dialog.getByLabel("Nom de famille").fill(lastName);
  await dialog.getByLabel("Rue et numéro").fill("Rue du Test 3");
  await dialog.getByLabel("Code postal").fill("1000");
  await dialog.getByLabel("Ville").fill("Bruxelles");
  await dialog.getByLabel("Description de la prestation").fill("Bilan de forme");
  await dialog.getByLabel("Montant (TVAC)").fill("121");
  await expect(dialog.getByText(/100,00\s€ HTVA · 21,00\s€ de TVA/)).toBeVisible();
  await dialog.getByText("À payer", { exact: true }).click();
  await dialog.getByRole("button", { name: "Créer le brouillon" }).click();

  await expect(page).toHaveURL(/\/coach\/facturation\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Brouillon de facture", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Rue et numéro")).toHaveValue("Rue du Test 3");
  // Le montant d'un brouillon se corrige (29/10).
  await page.getByLabel("Montant (TVAC)").fill("242");
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page.getByText("Brouillon enregistré.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Montants" })).toContainText(/200,00\s€/);
  const toPay = page.getByRole("region", { name: "À payer" });
  await expect(toPay).toBeVisible();
  // Tous les modes se facturent (l'app sert à tous les coachs) : ici, des espèces.
  await toPay.getByLabel("Mode").selectOption({ label: "Espèces" });
  await toPay.getByRole("button", { name: "Marquer comme payée" }).click();
  await expect(toPay).toHaveCount(0);
  await expect(page.locator("main header").filter({ visible: true }).first()).toContainText(
    "payée le",
  );

  // Le paiement reçu est dans la Comptabilité, et la fiche du sportif existe.
  await page.goto("/coach/comptabilite");
  const paymentRow = page
    .getByRole("list", { name: "Liste des paiements" })
    .getByRole("listitem")
    .filter({ hasText: `Testine ${lastName}` });
  await expect(paymentRow).toContainText(/242,00\s€/);
  await expect(paymentRow).toContainText("Espèces");
  await page.goto(`/coach/recherche?q=${lastName}`);
  await expect(page.getByRole("link", { name: new RegExp(lastName) }).first()).toBeVisible();
});
