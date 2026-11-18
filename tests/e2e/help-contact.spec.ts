import { expect, test, type Page } from "@playwright/test";

import { openSettings } from "./helpers";

// « Aide et contact » (demande d'Antonino du 18/11/2026) : une rubrique des Paramètres pour joindre
// le support. Les demandes arrivent par e-mail et sont traitées à la main. Sur un ordinateur sans
// messagerie configurée, un lien « mailto » ne fait rien de visible : l'adresse est donc affichée et
// se copie d'un geste.

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-b@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("Aide et contact : écrire au support, copier l'adresse, signaler un problème", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await login(page);
  const dialog = await openSettings(page, "aide");
  await expect(dialog.getByRole("heading", { name: "Aide et contact" }).first()).toBeVisible();

  const support = dialog.getByRole("region", { name: "Écrire au support" });
  const write = support.getByRole("link", { name: "Écrire un e-mail" });
  const href = (await write.getAttribute("href")) ?? "";
  expect(href).toMatch(/^mailto:[^?@]+@[^?]+\?subject=/);
  const address = decodeURIComponent(href.slice("mailto:".length).split("?")[0] ?? "");
  // L'adresse est écrite en clair, et se copie.
  await expect(support).toContainText(address);
  await support.getByRole("button", { name: "Copier l'adresse" }).click();
  // Le retour est DANS la carte : une notification en bas de page passerait sous la fenêtre.
  await expect(support.getByRole("status")).toContainText("Adresse copiée.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(address);

  const problem = dialog.getByRole("region", { name: "Signaler un problème" });
  const report =
    (await problem.getByRole("link", { name: "Signaler un problème" }).getAttribute("href")) ?? "";
  expect(report.startsWith(`mailto:${address}?`)).toBe(true);
  expect(decodeURIComponent(report)).toContain("Problème dans Coory");
  expect(decodeURIComponent(report)).toContain("Ce qui s'est passé");

  // Raccourcis vers l'export et la suppression du compte.
  const account = dialog.getByRole("region", { name: "Tes données et ton compte" });
  await account.getByRole("button", { name: "Exporter mes données" }).click();
  await expect(dialog.getByRole("button", { name: "Télécharger mes données" })).toBeVisible();
});

test("page introuvable de l'espace coach : « Signale-le » écrit au support", async ({
  page,
}, testInfo) => {
  await login(page);
  await page.goto("/coach/page-qui-n-existe-pas");
  const link = page.getByRole("link", { name: /Signale-le/ });
  await expect(link).toBeVisible();
  const href = (await link.getAttribute("href")) ?? "";
  expect(href).toMatch(/^mailto:[^?@]+@[^?]+\?subject=Lien%20cass/);
  // Ordinateur sans messagerie : le lien ne fait rien de visible, l'adresse est donc écrite en clair.
  if (testInfo.project.name === "ordinateur") {
    const address = decodeURIComponent(href.slice("mailto:".length).split("?")[0] ?? "");
    await expect(page.getByText(address, { exact: false })).toBeVisible();
  }
});
