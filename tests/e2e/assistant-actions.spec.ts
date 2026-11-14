import { expect, test, type Locator, type Page } from "@playwright/test";

// Assistant IA qui agit (lot 1 des actions) : le coach B (organisation abonnée dans la graine) parle à
// un FAUX Claude (tests/e2e/fixtures/assistant-script.json, activé par ASSISTANT_FAKE_SCRIPT dans
// playwright.config.ts) : aucun appel payant. Chaque action devient une carte ; rien n'est fait avant
// « Valider ». Les données créées portent le marqueur 1700000000000 et sont retirées en fin de suite.
const MARK = "1700000000000";
// Une demande en deux étapes (lecture puis carte) : sous la charge de la suite complète, la seconde
// étape peut dépasser les 10 s par défaut (48 passages sur 48 hors charge, le 13/11).
const STEPS = { timeout: 30_000 };

async function openAssistant(page: Page): Promise<Locator> {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-b@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page
    .getByRole("button", { name: "Assistant IA" })
    .filter({ visible: true })
    .first()
    .click();
  return page.getByRole("dialog", { name: "Assistant IA" });
}

async function ask(box: Locator, question: string) {
  const field = box.getByLabel("Ta demande à l'assistant");
  await field.fill(question);
  await field.press("Enter");
}

test("une séance proposée par l'assistant est créée au clic « Valider »", async ({ page }) => {
  const box = await openAssistant(page);
  await expect(box).toContainText("N'écris pas de données de santé ici.");
  await ask(box, "Crée une séance avec Sarah mardi 24 novembre à 18h");
  const card = box.getByRole("region", { name: "Nouvelle séance" });
  await expect(card).toContainText(`Séance e2e ${MARK}`, STEPS);
  await expect(card).toContainText("Sarah Vermeulen");
  await expect(card).toContainText("mardi 24 novembre 2026 · 18:00 · 60 min");
  await expect(box).toContainText("Voici la séance, valide-la si c'est bon.");

  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  await expect(card.getByRole("button", { name: "Valider" })).toHaveCount(0);
  const href = await card.getByRole("link", { name: "Voir" }).getAttribute("href");
  expect(href).toMatch(/\/agenda\/seances\/.+\?date=2026-11-24$/);
  await page.goto(href ?? "/");
  await expect(page.getByText(`Séance e2e ${MARK}`).first()).toBeVisible();
});

test("« Annuler » ne crée rien", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Crée une séance avec Hugo jeudi à 7h");
  const card = box.getByRole("region", { name: "Nouvelle séance" });
  await expect(card).toContainText("Hugo Lefèvre");
  await card.getByRole("button", { name: "Annuler" }).click();
  await expect(card).toContainText("Annulé");
  await expect(card.getByRole("button", { name: "Valider" })).toHaveCount(0);
  await page.goto("/coach/o/0b000000-0000-4000-8000-0000000000b1/agenda?vue=liste");
  await expect(page.getByText(`Séance annulée ${MARK}`)).toHaveCount(0);
});

test("« Modifier » ouvre la fenêtre « Nouveau paiement » pré-remplie", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Note 40 euros de Sarah en espèces");
  const card = box.getByRole("region", { name: "Nouveau paiement" });
  await expect(card).toContainText("40,00 € · espèces");
  await card.getByRole("button", { name: "Modifier" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouveau paiement" });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("#payment-amount")).toHaveValue("40,00");
  await expect(sheet.locator("select[name=athleteId]")).toHaveValue(
    "db000000-0000-4000-8000-000000000001",
  );
});

test("une tâche liée attend la fiche du sportif, puis se valide", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Crée la fiche de Zoé Test et une tâche pour l'appeler");
  const fiche = box.getByRole("region", { name: "Nouvelle fiche sportif" });
  const tache = box.getByRole("region", { name: "Nouvelle tâche" });
  await expect(fiche).toContainText(`Zoé Test ${MARK}`);
  await expect(tache).toContainText(`Après la création de Zoé Test ${MARK}`);
  await expect(tache.getByRole("button", { name: "Valider" })).toBeDisabled();

  await fiche.getByRole("button", { name: "Valider" }).click();
  await expect(fiche).toContainText("Fait");
  await expect(tache.getByRole("button", { name: "Valider" })).toBeEnabled();
  await tache.getByRole("button", { name: "Valider" }).click();
  await expect(tache).toContainText("Fait");
});

// Lot 3a : l'assistant crée des BROUILLONS de programme (jamais publiés), au clic « Valider ».
test("un programme proposé depuis un modèle Coory s'ouvre dans l'éditeur", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Prépare un programme 10 km pour Sarah à partir d'un modèle");
  const card = box.getByRole("region", { name: "Nouveau programme" });
  await expect(card).toContainText(`Objectif 10 km ${MARK}`, STEPS);
  await expect(card).toContainText("Sarah Vermeulen");
  await expect(card).toContainText("Running · 8 semaines · 4 séances par semaine");
  await expect(card).toContainText("Dès le lundi 30 novembre 2026, dans l'ordre");
  await expect(card).toContainText("Depuis le modèle « Préparation 10 km »");
  await expect(card).toContainText("Brouillon : à relire et publier dans l'éditeur");

  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  const href = await card.getByRole("link", { name: "Voir" }).getAttribute("href");
  expect(href).toMatch(/\/programmes\/[0-9a-f-]{36}$/);
  await page.goto(href ?? "/");
  await expect(page.getByText(`Objectif 10 km ${MARK}`).first()).toBeVisible();
  await expect(page.getByText("Sortie longue").filter({ visible: true }).first()).toBeVisible();
});

test("un programme écrit par l'assistant arrive dans l'éditeur avec ses séances", async ({
  page,
}) => {
  const box = await openAssistant(page);
  await ask(box, "Écris un programme de reprise de 2 semaines pour Hugo");
  const card = box.getByRole("region", { name: "Nouveau programme" });
  await expect(card).toContainText(`Reprise ${MARK}`);
  await expect(card).toContainText("Hugo Lefèvre");
  await expect(card).toContainText("Séances écrites par l'assistant : 3");

  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  const href = await card.getByRole("link", { name: "Voir" }).getAttribute("href");
  await page.goto(href ?? "/");
  await expect(page.getByText(`Reprise ${MARK}`).first()).toBeVisible();
  await expect(
    page.getByText("Footing de reprise").filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Sortie longue douce").filter({ visible: true }).first(),
  ).toBeVisible();
});

// D-173 : dictée. Le vrai micro ne se teste pas ici : un faux SpeechRecognition (même interface que
// celle du navigateur) « entend » une phrase dès le début de l'écoute.
test("le micro dicte la demande dans la saisie, sans l'envoyer", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          const result = Object.assign([{ transcript: "crée une séance avec Sarah" }], {
            isFinal: true,
          });
          this.onresult?.({ resultIndex: 0, results: [result] });
        }, 50);
      }
      stop() {
        setTimeout(() => this.onend?.(), 20);
      }
      abort() {
        this.onend?.();
      }
    }
    // Les deux noms : Chromium fournit aussi la version sans préfixe, choisie en premier.
    Object.assign(window, {
      SpeechRecognition: FakeRecognition,
      webkitSpeechRecognition: FakeRecognition,
    });
  });
  const box = await openAssistant(page);
  const field = box.getByLabel("Ta demande à l'assistant");
  await box.getByRole("button", { name: "Dicter ta demande" }).click();
  const stop = box.getByRole("button", { name: "Arrêter la dictée" });
  await expect(stop).toHaveAttribute("aria-pressed", "true");
  await expect(box).toContainText("Je t'écoute");
  await expect(field).toHaveValue("Crée une séance avec Sarah");
  await stop.click();
  await expect(box.getByRole("button", { name: "Dicter ta demande" })).toBeVisible();
  await expect(box).toContainText("N'écris pas de données de santé ici.");
  // Rien n'est parti : la demande attend le coach.
  await expect(box.getByRole("list", { name: "Conversation avec l'assistant" })).toHaveCount(0);
});

test("sans dictée dans le navigateur, le bouton micro n'apparaît pas", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { SpeechRecognition: undefined, webkitSpeechRecognition: undefined });
  });
  const box = await openAssistant(page);
  await expect(box.getByLabel("Ta demande à l'assistant")).toBeVisible();
  await expect(box.getByRole("button", { name: "Dicter ta demande" })).toHaveCount(0);
});
