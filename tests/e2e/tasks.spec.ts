import { expect, test, type Page } from "@playwright/test";

// Tâches complètes (4e, D-59) : créer, modifier, supprimer, en plus de cocher. Coach de démo B (le
// compte A est celui qu'Antonino regarde). Chaque projet crée SA tâche, au nom unique, et la supprime.
async function loginAsCoachB(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-b@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("une tâche se crée, se modifie et se supprime, avec « associée à »", async ({
  page,
}, testInfo) => {
  const title = `Tâche ${testInfo.project.name}-${Date.now()}`;
  await loginAsCoachB(page);
  await page.goto("/coach/taches");
  await page.getByRole("button", { name: "Nouvelle tâche" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle tâche" });

  // Sans titre : refusée, rien n'est perdu.
  await sheet.getByText("Paiement", { exact: true }).click();
  await sheet.getByRole("button", { name: "Ajouter la tâche" }).click();
  await expect(sheet.getByRole("alert")).toContainText("Donne un titre à la tâche.");
  await expect(sheet.getByRole("radio", { name: "Paiement" })).toBeChecked();

  await sheet.getByRole("textbox", { name: "Tâche" }).fill(title);
  await sheet.getByText("Haute", { exact: true }).click();
  await sheet.getByLabel(/^Note/).fill("Vérifier le virement");
  await sheet.getByRole("button", { name: "Ajouter la tâche" }).click();
  await expect(page.getByText("Tâche ajoutée.")).toBeVisible();
  await expect(sheet).toBeHidden();

  const row = page.getByRole("listitem").filter({ hasText: title });
  // Seule l'urgence porte une étiquette (D-84) : la catégorie reste dans la tâche, pas sur la ligne.
  await expect(row).toContainText("Haute");
  await expect(row).not.toContainText("Paiement");

  // Modifier : la fenêtre s'ouvre déjà remplie.
  await row.getByRole("button", { name: title }).click();
  const edit = page.getByRole("dialog", { name: "Modifier la tâche" });
  await expect(edit.getByRole("textbox", { name: "Tâche" })).toHaveValue(title);
  await expect(edit.getByLabel(/^Note/)).toHaveValue("Vérifier le virement");
  await expect(edit.getByRole("radio", { name: "Haute" })).toBeChecked();
  await expect(edit.getByRole("radio", { name: "Paiement" })).toBeChecked();
  await edit.getByRole("textbox", { name: "Tâche" }).fill(`${title} (modifiée)`);
  await edit.getByText("Suivi", { exact: true }).click();
  await edit.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Tâche enregistrée.")).toBeVisible();
  const renamed = page.getByRole("listitem").filter({ hasText: `${title} (modifiée)` });
  await expect(renamed).toBeVisible();

  // Supprimer : confirmation d'abord ; « Annuler » ne supprime rien. La nouvelle catégorie est gardée.
  await renamed.getByRole("button", { name: `${title} (modifiée)` }).click();
  const again = page.getByRole("dialog", { name: "Modifier la tâche" });
  await expect(again.getByRole("radio", { name: "Suivi" })).toBeChecked();
  await again.getByRole("button", { name: "Supprimer" }).click();
  const confirm = page.getByRole("dialog", { name: "Supprimer cette tâche ?" });
  await confirm.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("Tâche supprimée.")).toBeVisible();
  await expect(renamed).toHaveCount(0);
});

test("« Créer → Tâche » ouvre la fenêtre sans quitter le tableau de bord", async ({ page }) => {
  await loginAsCoachB(page);
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await page.getByRole("dialog", { name: "Créer" }).getByRole("button", { name: "Tâche" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle tâche" });
  await expect(sheet.getByRole("textbox", { name: "Tâche" })).toBeVisible();
  await expect(page).toHaveURL(/\/coach$/);
  await sheet.getByRole("button", { name: "Fermer" }).click();
  await expect(sheet).toBeHidden();
});
