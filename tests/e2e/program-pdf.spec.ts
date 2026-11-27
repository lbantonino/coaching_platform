import { expect, test, type Page } from "@playwright/test";

// PDF du programme (phase 5 ; un seul fichier depuis D-211, 27/11/2026 : l'agenda puis « Fiches et
// repères »), tiré de la version publiée, servi seulement au coach de l'organisation.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Graine de développement : programme publié (v1) de Léa Vandenberghe, et un brouillon jamais publié.
const PUBLISHED = "f1000000-0000-4000-8000-000000000008";
const LEA = "da000000-0000-4000-8000-000000000015";
const NEVER_PUBLISHED = "f1000000-0000-4000-8000-000000000021";
const pdfUrl = (programId: string) => `/coach/o/${ORG}/programmes/${programId}/pdf`;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach télécharge le PDF complet d'un programme publié", async ({ page }) => {
  await login(page);
  const response = await page.request.get(pdfUrl(PUBLISHED));
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  expect(response.headers()["content-disposition"]).toContain("Programme - ");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  // Les deux PDF séparés n'existent plus.
  for (const old of ["agenda", "fiches"])
    expect((await page.request.get(`${pdfUrl(PUBLISHED)}/${old}`)).status(), old).toBe(404);
});

test("pas de PDF pour un brouillon jamais publié ni pour un programme inconnu", async ({
  page,
}) => {
  await login(page);
  expect((await page.request.get(pdfUrl(NEVER_PUBLISHED))).status()).toBe(404);
  expect((await page.request.get(pdfUrl("f1000000-0000-4000-8000-0000000000ff"))).status()).toBe(
    404,
  );
  expect((await page.request.get(pdfUrl("pas-un-identifiant"))).status()).toBe(404);
});

test("sans session, le PDF renvoie à la connexion", async ({ request }) => {
  const response = await request.get(pdfUrl(PUBLISHED));
  expect(response.url()).toContain("/login");
  expect(response.headers()["content-type"]).not.toBe("application/pdf");
});

// Onglet Agenda de la fiche (15/11/2026, D-186) : le bouton PDF de l'en-tête ouvre le PDF complet dans
// un nouvel onglet (D-211 : plus de menu à deux choix).
test("onglet Agenda : le bouton PDF du programme ouvre le PDF complet", async ({ page }) => {
  await login(page);
  await page.goto(`/coach/o/${ORG}/sportifs/${LEA}?onglet=agenda&semaine=1`);
  const button = page.getByRole("link", { name: "PDF du programme" }).filter({ visible: true });
  await expect(button.first()).toBeVisible();
  await expect(button.first()).toHaveAttribute("target", "_blank");
  const href = await button.first().getAttribute("href");
  expect(href).toMatch(
    new RegExp(`^/coach/o/${ORG}/programmes/${PUBLISHED}/pdf(#nameddest=week-\\d+)?$`),
  );
  const response = await page.request.get(href!.split("#")[0]!);
  expect(response.headers()["content-type"]).toBe("application/pdf");
});
