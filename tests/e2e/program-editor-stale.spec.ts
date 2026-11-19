import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, goToCoachSection } from "./helpers";

// Bug du 19/11 (TC-02 instable sur téléphone) : l'éditeur de séance enregistre le brouillon, puis le
// retour rouvre la page du programme, gardée en mémoire avec l'ANCIENNE version du brouillon. Tant que
// la version à jour n'est pas relue (rechargement en arrière-plan, lent sur un téléphone), un geste du
// coach partait avec l'ancienne version : refusé comme un conflit (« Le brouillon n'est pas
// enregistré »), puis effacé sans rien dire à l'arrivée de la version à jour. Ici, ce rechargement est
// volontairement ralenti de 3 s : la séance ajoutée doit attendre la version à jour, s'y ajouter et
// s'ouvrir, et la modification faite dans l'éditeur de séance doit rester.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
// Modèle Coory « Préparation 10 km » (graine de développement).
const TEMPLATE = "7a000000-0000-4000-8000-000000000002";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("retour de l'éditeur de séance : un ajout fait avant la relecture du brouillon n'est pas perdu", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const phone = testInfo.project.name === "telephone";
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const athlete = `Relecture ${suffix}`;

  await login(page);
  await goToCoachSection(page, "Sportifs");
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, athlete);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  await expect(page.getByRole("heading", { name: athlete, level: 1 })).toBeVisible();
  const athleteId = new URL(page.url()).pathname.split("/").pop() ?? "";

  await page.goto(`/coach/o/${ORG}/programmes/nouveau?sportif=${athleteId}&modele=${TEMPLATE}`);
  await page.getByLabel("Titre du programme").fill(`Relecture 10 km ${suffix}`);
  for (let step = 1; step < 4; step += 1) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/programmes\/[0-9a-f-]{36}$/);
  const programPath = new URL(page.url()).pathname;

  // L'éditeur de séance : la première étape passe de 30 à 12 min (enregistrée).
  if (phone) await page.getByRole("button", { name: "Endurance", exact: true }).click();
  await page.getByRole("button", { name: "Modifier la séance" }).click();
  await expect(page).toHaveURL(/\/seances\/[^/]+$/);
  if (phone)
    await page
      .getByRole("button", { name: /^Course.*30 min/ })
      .first()
      .click();
  await page.getByRole("textbox", { name: "Durée de l'étape" }).fill("12");
  if (phone) await page.getByRole("button", { name: "Valider l'étape" }).click();
  await expect(
    page
      .getByRole("button", { name: /^Course.*12 min/ })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  // Le rechargement de la page du programme (requête RSC) est ralenti de 3 s à partir d'ici.
  await page.route(
    (url) => url.pathname === programPath,
    async (route) => {
      const request = route.request();
      if (request.method() === "GET" && request.headers()["rsc"] === "1") {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      await route.continue();
    },
  );
  if (phone) {
    await page.getByRole("button", { name: "Semaine 1", exact: true }).click();
  } else {
    await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Terminer" }).click();
  }
  await expect(page).toHaveURL(new RegExp(`${programPath}(\\?.*)?$`));

  // Tout de suite, avant la relecture : une séance de musculation s'ajoute et s'ouvre.
  await page.getByRole("button", { name: "Ajouter une séance" }).click();
  await page
    .getByRole("dialog", { name: "Nouvelle séance" })
    .getByRole("button", { name: /^Musculation/ })
    .click();
  await expect(page).toHaveURL(/\/seances\/[^/]+$/, { timeout: 15_000 });
  await expect(
    page
      .getByText(/Musculation · Séance 5 · Semaine 1/i)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(page.getByText("Le brouillon n'est pas enregistré")).toHaveCount(0);

  // La modification de l'éditeur de séance est restée (12 min), à côté de la nouvelle séance.
  await page.unroute((url) => url.pathname === programPath);
  await page.goto(programPath);
  if (phone) await page.getByRole("button", { name: "Endurance", exact: true }).click();
  await expect(
    page
      .getByText(/12 min/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
});
