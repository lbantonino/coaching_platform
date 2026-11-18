import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

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
// Modèle Coory « Préparation 10 km » pour créer un brouillon de test (nettoyé en fin de suite).
const TEN_K = "7a000000-0000-4000-8000-000000000002";
const PROGRAM = new RegExp(`/coach/o/${ORG}/programmes/[0-9a-f-]{36}(\\?.*)?$`);

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

// Cas voisin signalé le 15/11 : « Modifier la séance » ouvre la page de la séance ; son retour
// (« ← Semaine 1 » sur téléphone, « Terminer » sur ordinateur) revenait au programme en AJOUTANT une
// page, et le geste de retour rouvrait la séance. Il recule maintenant d'une
// page (comme le geste) et le programme montre ce qui vient d'être changé.
test("téléphone : après « Modifier la séance » puis « ← Semaine 1 », le geste de retour ne rouvre pas la séance", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "telephone",
    "La pile de niveaux n'existe que sur téléphone.",
  );
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, `Retour ${suffix}`);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: `Retour ${suffix}`, level: 1 })).toBeVisible();
  const athleteId = new URL(page.url()).pathname.split("/").pop() ?? "";
  await page.goto(`/coach/o/${ORG}/programmes/nouveau?sportif=${athleteId}&modele=${TEN_K}`);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(PROGRAM);

  // La semaine 1, une séance, « Modifier la séance » : la page de la séance ; on la renomme.
  await expect(weekHeading(page, 1)).toBeVisible();
  await page.locator("button[aria-pressed]").filter({ visible: true }).first().click();
  await page.getByRole("button", { name: "Modifier la séance" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/seances\//);
  const name = `Renommée ${suffix.slice(-6)}`;
  await page
    .getByRole("button", { name: "Plus d'actions sur la séance" })
    .filter({ visible: true })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "Renommer la séance" }).click();
  const rename = page.getByRole("dialog", { name: "Renommer la séance" });
  await rename.getByLabel("Nom de la séance").fill(name);
  await rename.getByRole("button", { name: "Renommer" }).click();
  // Le retour de la barre du téléphone : « ← Semaine 1 ».
  await page.getByRole("banner").getByRole("button", { name: "Semaine 1", exact: true }).click();

  // De retour sur la semaine 1 (comme l'annonce la barre), avec le nouveau nom ; le geste de retour
  // suivant quitte le programme, comme son retour : il ne rouvre ni la séance ni son détail.
  await expect(page).toHaveURL(/\/[0-9a-f-]{36}(\?semaine=1)?$/);
  await expect(weekHeading(page, 1)).toBeVisible();
  await expect(page.getByText(name).filter({ visible: true }).first()).toBeVisible();
  await page.goBack();
  await expect(page).not.toHaveURL(/\/seances\//);
  await expect(page).not.toHaveURL(PROGRAM);
});

// Relecture du 18/11 : le rechargement des données au retour (router.refresh) réécrit l'entrée
// d'historique et efface la marque « niveau séance » (Next ne garde pas un état personnel sur une
// navigation « soft »). Le retour de l'éditeur doit quand même remonter jusqu'à la semaine. Ici, la
// réécriture de Next est simulée juste avant « Modifier la séance ».
test("téléphone : même si l'historique perd sa marque, « ← Semaine 1 » remonte jusqu'à la semaine", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "telephone",
    "La pile de niveaux n'existe que sur téléphone.",
  );
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, `Marque ${suffix}`);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: `Marque ${suffix}`, level: 1 })).toBeVisible();
  const athleteId = new URL(page.url()).pathname.split("/").pop() ?? "";
  await page.goto(`/coach/o/${ORG}/programmes/nouveau?sportif=${athleteId}&modele=${TEN_K}`);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(PROGRAM);

  await expect(weekHeading(page, 1)).toBeVisible();
  await page.locator("button[aria-pressed]").filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/seance=/);
  // Ce que fait Next en fin de rechargement : la même adresse, un état d'historique sans notre marque.
  await page.evaluate(() => window.history.replaceState({ __NA: true }, "", window.location.href));
  await page.getByRole("button", { name: "Modifier la séance" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/seances\//);
  await page.getByRole("banner").getByRole("button", { name: "Semaine 1", exact: true }).click();
  await expect(page).toHaveURL(/\/[0-9a-f-]{36}(\?semaine=1)?$/);
  await expect(weekHeading(page, 1)).toBeVisible();
});
