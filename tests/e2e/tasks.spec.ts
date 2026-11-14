import { expect, test, type Page } from "@playwright/test";

import { signUpFreshCoach } from "./helpers";

// Tâches complètes (4e, D-59) : créer, modifier, supprimer, en plus de cocher. Coach de démo B (le
// compte A est celui qu'Antonino regarde). Chaque projet crée SA tâche, au nom unique, et la supprime.
async function loginAsCoachB(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-b@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// Kit « Coory Pages », page 01 (D-129) : les listes du coach (décisions 8 et 9) et l'ajout rapide
// (décision 10). Chaque projet crée SA liste et SA tâche, aux noms uniques, et les supprime.
test("une liste se crée ; on y ajoute une tâche, la modifie, la coche, puis la liste se supprime", async ({
  page,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  const listName = `Liste ${stamp}`.slice(0, 40);
  const title = `Tâche ${stamp}`;
  await loginAsCoachB(page);
  await page.goto("/coach/taches");

  // Nouvelle liste : saisie dans la ligne, Entrée la crée.
  await page.getByRole("button", { name: "Nouvelle liste" }).filter({ visible: true }).click();
  await page.getByRole("textbox", { name: "Nom de la liste" }).fill(listName);
  await page.getByRole("textbox", { name: "Nom de la liste" }).press("Enter");
  await expect(page.getByText(`Liste « ${listName} » créée.`)).toBeVisible();
  await page
    .getByRole("link", { name: new RegExp(listName) })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/vue=[0-9a-f-]{36}/);
  await expect(
    page.getByRole("heading", { name: listName }).filter({ visible: true }),
  ).toBeVisible();

  // Ajout rapide : le titre seul, dans la liste ouverte.
  const quick = page.getByRole("textbox", { name: "Nouvelle tâche" }).filter({ visible: true });
  await quick.fill(title);
  await quick.press("Enter");
  const row = page.getByRole("listitem").filter({ hasText: title }).filter({ visible: true });
  await expect(row).toBeVisible();

  // Modifier : la fenêtre propose les listes du coach (« Associée à »), la sienne cochée.
  await row.getByRole("button", { name: title, exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Modifier la tâche" });
  await expect(edit.getByRole("radio", { name: listName })).toBeChecked();
  await edit.getByText("Haute", { exact: true }).click();
  await edit.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Tâche enregistrée.")).toBeVisible();
  await expect(row).toContainText("Haute");

  // Cocher : la tâche passe dans « Terminées » ; « Annuler » la rend.
  await row.getByRole("checkbox", { name: `Tâche faite : ${title}` }).click();
  await expect(page.getByText("Tâche terminée.")).toBeVisible();
  await expect(row).toHaveCount(0);
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(row).toBeVisible();

  // Supprimer la liste (confirmation) : la tâche reste, sans liste.
  await page.goto("/coach/taches");
  await page
    .getByRole("button", { name: `Options de la liste ${listName}` })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Supprimer la liste" }).click();
  await page
    .getByRole("dialog", { name: `Supprimer la liste « ${listName} » ?` })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText(/Ses tâches restent, sans liste\./)).toBeVisible();
  await page.goto("/coach/taches?vue=toutes");
  const kept = page.getByRole("listitem").filter({ hasText: title }).filter({ visible: true });
  await expect(kept).toBeVisible();
  await expect(kept).not.toContainText(listName);

  // Remise en place : la tâche est supprimée (fenêtre, confirmation).
  await kept.getByRole("button", { name: title, exact: true }).click();
  await page
    .getByRole("dialog", { name: "Modifier la tâche" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page
    .getByRole("dialog", { name: "Supprimer cette tâche ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Tâche supprimée.")).toBeVisible();
  await expect(kept).toHaveCount(0);
});

test("« Créer → Tâche » ouvre la fenêtre sans quitter le tableau de bord", async ({ page }) => {
  await loginAsCoachB(page);
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await page.getByRole("dialog", { name: "Créer" }).getByRole("button", { name: "Tâche" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle tâche" });
  await expect(sheet.getByRole("textbox", { name: "Tâche" })).toBeVisible();
  await expect(page).toHaveURL(/\/coach$/);
  // Sans titre : refusée, la fenêtre reste ouverte.
  await sheet.getByRole("button", { name: "Ajouter la tâche" }).click();
  await expect(sheet.getByRole("alert")).toContainText("Donne un titre à la tâche.");
  await sheet.getByRole("button", { name: "Fermer" }).click();
  await expect(sheet).toBeHidden();
});

// Demande d'Antonino du 14/11 : un bouton « Supprimer » à côté de chaque tâche, et « Tout supprimer »
// dans « Terminées ». Coach NEUF (sa propre organisation) : la suppression en masse ne touche aucune
// donnée des autres tests.
test("une tâche se supprime depuis sa ligne ; « Tout supprimer » vide « Terminées »", async ({
  page,
  request,
}, testInfo) => {
  await signUpFreshCoach(page, request, testInfo);
  await page.goto("/coach/taches?vue=toutes");
  const quick = page.getByRole("textbox", { name: "Nouvelle tâche" }).filter({ visible: true });
  for (const title of ["Appeler Hugo", "Relancer Sarah", "Préparer le bloc 2"]) {
    await quick.fill(title);
    await quick.press("Enter");
    await expect(
      page.getByRole("listitem").filter({ hasText: title }).filter({ visible: true }),
    ).toBeVisible();
  }

  // Supprimer depuis la ligne : confirmation, puis la tâche disparaît.
  await page
    .getByRole("button", { name: "Supprimer la tâche : Appeler Hugo" })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("dialog", { name: "Supprimer cette tâche ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Tâche supprimée.")).toBeVisible();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Appeler Hugo" }).filter({ visible: true }),
  ).toHaveCount(0);

  // Les deux autres sont terminées, puis toutes supprimées d'un coup depuis « Terminées ».
  for (const title of ["Relancer Sarah", "Préparer le bloc 2"]) {
    await page
      .getByRole("checkbox", { name: `Tâche faite : ${title}` })
      .filter({ visible: true })
      .click();
    await expect(
      page.getByRole("listitem").filter({ hasText: title }).filter({ visible: true }),
    ).toHaveCount(0);
  }
  await page.goto("/coach/taches?vue=terminees");
  await page.getByRole("button", { name: "Tout supprimer" }).filter({ visible: true }).click();
  await page
    .getByRole("dialog", { name: "Supprimer les 2 tâches terminées ?" })
    .getByRole("button", { name: "Tout supprimer" })
    .click();
  await expect(page.getByText("2 tâches supprimées.")).toBeVisible();
  await expect(page.getByText("Aucune tâche terminée.").filter({ visible: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tout supprimer" }).filter({ visible: true }),
  ).toHaveCount(0);
});
