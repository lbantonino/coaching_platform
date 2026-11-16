import { expect, test, type Page } from "@playwright/test";

// Séances en cartes (test d'Antonino et de Gianluca sur iPhone, 15/11/2026, D-187) : une carte par
// exercice, le volume en haut à droite, jamais de RIR ; « ⋯ » d'un exercice lié : « Voir dans la
// Bibliothèque ». Modèle Coory « Développer sa force » (graine), en lecture seule : rien n'est écrit.
const ORG = "0a000000-0000-4000-8000-0000000000a1";
const FORCE = "7a000000-0000-4000-8000-000000000108";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("une séance de musculation en cartes : « séries » en haut, pas de RIR, lien vers la Bibliothèque", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  await login(page);
  await page.goto(`/coach/o/${ORG}/programmes/modeles/${FORCE}?semaine=1`);
  // Téléphone : la séance s'ouvre depuis sa carte ; ordinateur : la première est déjà à droite.
  if (phone) await page.locator("button[aria-pressed]").filter({ visible: true }).first().click();

  const steps = page.getByRole("list", { name: "Étapes de la séance" }).filter({ visible: true });
  await expect(steps).toBeVisible();
  await expect(steps.getByText(/^\d+ séries?$/).first()).toBeVisible();
  await expect(page.getByText(/\bRIR\b/).filter({ visible: true })).toHaveCount(0);

  // Un exercice lié : son « ⋯ » propose la fiche de la Bibliothèque (modèle en lecture : rien d'autre).
  await steps
    .getByRole("button", { name: /^Plus d'actions sur « / })
    .first()
    .click();
  await expect(page.getByRole("menuitem", { name: "Supprimer" })).toHaveCount(0);
  await page
    .getByRole("menuitem", { name: "Voir dans la Bibliothèque" })
    .or(page.getByRole("button", { name: "Voir dans la Bibliothèque" }))
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/coach\/bibliotheque\/[a-z0-9-]+\?retour=/);
  await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toBeVisible();
  // Le retour de la fiche ramène au modèle, comme le geste de retour (relecture, règle D-124) ; la
  // flèche porte le nom de la page d'avant.
  await page
    .getByRole("link", { name: /Développer sa force|Modèle/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/programmes/modeles/${FORCE}`));
});
