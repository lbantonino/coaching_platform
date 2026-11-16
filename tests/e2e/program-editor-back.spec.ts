import { expect, test, type Page } from "@playwright/test";

// Téléphone : la page d'un programme ouvre sur la semaine, comme l'ordinateur (D-187, « la même
// page ») ; « Semaine N ⌄ » ouvre la liste des semaines ; le geste de retour (balayage depuis le bord,
// bouton « Précédent ») fait toujours la même chose que le retour de la barre : une séance → sa
// semaine, la liste → la semaine, la semaine → la page d'avant. Changer de semaine (‹ ›, ou dans la
// liste) ne laisse pas d'étape en trop. Test d'Antonino et de son frère sur iPhone, 15/11/2026.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Modèle Coory « Préparation 10 km » (graine de développement), en lecture seule : rien n'est écrit.
const TEMPLATE = "7a000000-0000-4000-8000-000000000002";
const LIST = new RegExp(`/coach/o/${ORG}/programmes\\?onglet=modeles$`);
const EDITOR = new RegExp(`/coach/o/${ORG}/programmes/modeles/${TEMPLATE}(\\?.*)?$`);

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

const weekHeading = (page: Page, index: number) =>
  page.getByRole("heading", { name: new RegExp(`^Semaine ${index}\\b`), level: 2 }).filter({
    visible: true,
  });
const weekCard = (page: Page, index: number) =>
  page.getByRole("button", { name: new RegExp(`^Semaine ${index}\\b`) }).filter({ visible: true });
const barBack = (page: Page, label: string) =>
  page.getByRole("button", { name: label, exact: true }).filter({ visible: true });
const picker = (page: Page) =>
  page.getByRole("button", { name: /^Choisir une semaine/ }).filter({ visible: true });

test("téléphone : l'accueil est la semaine ; le geste de retour suit le retour de la barre", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "telephone",
    "La pile de niveaux n'existe que sur téléphone.",
  );
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes?onglet=modeles`);
  await page.goto(`/coach/o/${ORG}/programmes/modeles/${TEMPLATE}`);

  // L'accueil : la semaine 1, et le retour de la page dans la barre.
  await expect(weekHeading(page, 1)).toBeVisible();
  await expect(page.getByRole("link", { name: /Modèles/ }).filter({ visible: true })).toBeVisible();

  // « Semaine 1 ⌄ » : la liste ; la semaine 2 y est choisie, puis sa première séance.
  await picker(page).click();
  await expect(barBack(page, "Semaine 1")).toBeVisible();
  await weekCard(page, 2).click();
  await expect(weekHeading(page, 2)).toBeVisible();
  await page.locator("button[aria-pressed]").filter({ visible: true }).first().click();
  await expect(barBack(page, "Semaine 2")).toBeVisible();

  // Le geste de retour : la séance → la semaine 2.
  await page.goBack();
  await expect(page).toHaveURL(EDITOR);
  await expect(weekHeading(page, 2)).toBeVisible();

  // La liste, refermée par la barre ; ‹ › change de semaine sur place.
  await picker(page).click();
  await barBack(page, "Semaine 2").click();
  await expect(weekHeading(page, 2)).toBeVisible();
  await page.getByRole("button", { name: "Semaine suivante" }).click();
  await expect(weekHeading(page, 3)).toBeVisible();

  // Aucune étape en trop : le geste suivant quitte la page, comme « ← Modèles ».
  await page.goBack();
  await expect(page).toHaveURL(LIST);
});

test("téléphone : rechargée sur la liste des semaines, la page y reste et le retour suit la barre", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "telephone",
    "La pile de niveaux n'existe que sur téléphone.",
  );
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes?onglet=modeles`);
  await page.goto(`/coach/o/${ORG}/programmes/modeles/${TEMPLATE}`);
  await picker(page).click();
  await expect(barBack(page, "Semaine 1")).toBeVisible();

  // Safari recharge parfois un onglet : la liste revient, pas la semaine.
  await page.reload();
  await expect(barBack(page, "Semaine 1")).toBeVisible();
  await weekCard(page, 2).click();
  await expect(weekHeading(page, 2)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(LIST);
});
