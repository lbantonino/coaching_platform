import { expect, test, type Locator, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Où se parle l'assistant (19/11) : sur ordinateur, la boîte ouverte par « Assistant IA » de
// l'en-tête ; sur téléphone, l'icône du haut mène à la page de l'assistant (même conversation, mêmes
// cartes d'action).
async function assistantSurface(page: Page): Promise<Locator> {
  if (isPhone(page)) {
    await page
      .getByRole("link", { name: "Assistant IA" })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/coach\/assistant$/);
    return page.getByRole("region", { name: "Assistant IA" });
  }
  await page
    .getByRole("button", { name: "Assistant IA" })
    .filter({ visible: true })
    .first()
    .click();
  return page.getByRole("dialog", { name: "Assistant IA" });
}

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
  return assistantSurface(page);
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

// Lot 2 (D-181) : « Compléter la fiche ». Le faux Claude lit la fiche (voir_fiche), puis propose le
// champ manquant ; la carte montre « ancien → nouveau ». Une fiche par appareil (Sarah sur ordinateur,
// Hugo sur téléphone), remise à vide par le nettoyage de fin de suite.
test("lot 2 : compléter la fiche d'un sportif", async ({ page }, testInfo) => {
  const who = testInfo.project.name === "telephone" ? "Hugo" : "Sarah";
  const full = who === "Hugo" ? "Hugo Lefèvre" : "Sarah Vermeulen";
  const box = await openAssistant(page);
  await ask(box, `Ajoute le tapis de course au matériel de ${who}`);
  const card = box.getByRole("region", { name: "Compléter la fiche" });
  await expect(card).toContainText(full, STEPS);
  await expect(card).toContainText("Matériel : — → Tapis de course (test assistant)");
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  const href = await card.getByRole("link", { name: "Voir" }).getAttribute("href");
  expect(href).toMatch(/\/sportifs\/db000000-[^?]+\?onglet=profil$/);
  await page.goto(href ?? "/");
  await expect(page.getByText("Tapis de course (test assistant)").first()).toBeVisible();
});

// Lot 2 (D-181) : « Nouvel exercice » dans la Bibliothèque du coach, par la même création que le
// formulaire (le nom porte le marqueur : l'exercice est retiré en fin de suite).
test("lot 2 : créer un exercice dans la Bibliothèque", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Crée l'exercice Fentes sautées");
  const card = box.getByRole("region", { name: "Nouvel exercice" });
  await expect(card).toContainText(`Fentes sautées ${MARK}`, STEPS);
  await expect(card).toContainText("Musculation · Quadriceps, Fessiers");
  await expect(card).toContainText("Poids du corps");
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  const href = await card.getByRole("link", { name: "Voir" }).getAttribute("href");
  expect(href).toMatch(/^\/coach\/bibliotheque\/[0-9a-f-]{36}$/);
  await page.goto(href ?? "/");
  await expect(page.getByText(`Fentes sautées ${MARK}`).first()).toBeVisible();
  await expect(page.getByText("Saute et change de jambe en l'air.").first()).toBeVisible();
});

// Lot 2 (D-181) : « PDF du programme ». Les deux liens de la version publiée, à la place de « Valider ».
test("lot 2 : les PDF d'un programme publié, en liens", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Donne-moi les PDF du programme de Sarah");
  const card = box.getByRole("region", { name: "PDF du programme" });
  await expect(card).toContainText("Programme test PDF", STEPS);
  await expect(card).toContainText("Sarah Vermeulen");
  await expect(card).toContainText("Version 1 publiée le dimanche 4 janvier 2026");
  await expect(card.getByRole("button", { name: "Valider" })).toHaveCount(0);
  for (const name of ["Agenda du programme", "Fiches et repères"]) {
    const href = await card.getByRole("link", { name }).getAttribute("href");
    const response = await page.request.get(href ?? "/");
    expect(response.status(), name).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  }
});

// Un programme d'une autre organisation (celui de Léa, coach A) : refusé, aucune carte (le faux Claude
// ne mène qu'une question par conversation, d'où ce test à part).
test("lot 2 : pas de PDF pour le programme d'une autre organisation", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Donne-moi les PDF du programme de Léa");
  // Le refus repart à Claude, qui l'explique ; surtout, aucune carte n'apparaît.
  await expect(box).toContainText("Je ne trouve pas ce programme dans ton organisation.", STEPS);
  await expect(box.getByRole("region", { name: "PDF du programme" })).toHaveCount(0);
});

// Lot 2 (D-181) : « Importer un document ». Le fichier joint reste dans le navigateur (Claude ne reçoit
// que son nom, son type et sa taille) et part avec la carte validée ; il arrive dans la fiche.
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

test("lot 2 : importer un document joint dans la fiche d'un sportif", async ({ page }) => {
  const box = await openAssistant(page);
  await box.locator('input[type="file"]').setInputFiles({
    name: "bilan-test.pdf",
    mimeType: "application/pdf",
    buffer: PDF,
  });
  await expect(
    box.getByRole("button", { name: "Retirer le fichier joint : bilan-test.pdf" }),
  ).toBeVisible();
  await ask(box, "Range ce document dans la fiche de Sarah");
  const card = box.getByRole("region", { name: "Importer un document" });
  await expect(card).toContainText(`Bilan test ${MARK}`, STEPS);
  await expect(card).toContainText("Fichier : bilan-test.pdf");
  await expect(card).toContainText("Sportif : Sarah Vermeulen");
  // Relecture : une catégorie de DOCUMENTS (pas de dépenses) est acceptée.
  await expect(card).toContainText("Catégorie : Bilans de test");
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  // Rangé : la pastille quitte la saisie (avant, elle reste pour la suite de la conversation).
  await expect(box.getByRole("button", { name: /^Retirer le fichier joint/ })).toHaveCount(0);
  const href = await card.getByRole("link", { name: "Voir" }).getAttribute("href");
  expect(href).toMatch(/\/sportifs\/db000000-0000-4000-8000-000000000001\?onglet=documents$/);
  await page.goto(href ?? "/");
  await expect(page.getByText(`Bilan test ${MARK}`).first()).toBeVisible();
});

test("lot 2 : sans fichier joint, aucune carte d'import", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Range ce document chez Hugo");
  await expect(box).toContainText("Joins d'abord le fichier avec le bouton « Joindre ».", STEPS);
  await expect(box.getByRole("region", { name: "Importer un document" })).toHaveCount(0);
});

// Relecture du lot 2 : le fichier joint reste pour toute la conversation. Après « Modifier » (ou une
// question de l'assistant), la demande suivante garde le fichier et une nouvelle carte apparaît.
test("lot 2 : le fichier joint reste pour la demande suivante", async ({ page }) => {
  const box = await openAssistant(page);
  await box.locator('input[type="file"]').setInputFiles({
    name: "bilan-test.pdf",
    mimeType: "application/pdf",
    buffer: PDF,
  });
  await ask(box, "Range ce document dans la fiche de Sarah");
  const first = box.getByRole("region", { name: "Importer un document" }).first();
  await expect(first).toContainText("Sportif : Sarah Vermeulen", STEPS);
  await expect(
    box.getByRole("button", { name: "Retirer le fichier joint : bilan-test.pdf" }),
  ).toBeVisible();
  await first.getByRole("button", { name: "Modifier" }).click();
  await expect(box).toContainText("Que veux-tu changer ?");
  await ask(box, "Mets-le plutôt chez Hugo");
  await expect(
    box.getByRole("region", { name: "Importer un document" }).filter({ hasText: "Hugo Lefèvre" }),
  ).toContainText(`Bilan Hugo ${MARK}`, STEPS);
});

// Lot 3b (D-182) : « Modifier le programme ». Le faux Claude lit le brouillon (voir_brouillon), puis
// propose UNE carte : un exercice remplacé, une semaine retirée, le programme renommé. Un brouillon par
// appareil (Sarah sur ordinateur, Hugo sur téléphone), remis dans son état de graine en fin de suite
// (supabase/seed-tests-assistant.sql, relancé par le nettoyage).
test("lot 3b : modifier un programme en une carte (exercice, semaine, titre)", async ({
  page,
}, testInfo) => {
  const who = testInfo.project.name === "telephone" ? "Hugo" : "Sarah";
  const full = who === "Hugo" ? "Hugo Lefèvre" : "Sarah Vermeulen";
  const box = await openAssistant(page);
  await ask(
    box,
    `Dans le bloc force de ${who}, remplace le soulevé de terre par la presse à cuisses, retire la semaine 4 et renomme-le Bloc force · version 2`,
  );
  const card = box.getByRole("region", { name: "Modifier le programme" });
  await expect(card).toContainText("Bloc force · test assistant", STEPS);
  await expect(card).toContainText(full);
  await expect(card).toContainText(
    "Semaine 1 · Force A : Soulevé de terre barre → Presse à cuisses",
  );
  await expect(card).toContainText("Semaine 4 retirée (2 séances, définitif)");
  await expect(card).toContainText(
    "Titre : « Bloc force · test assistant » → « Bloc force · version 2 »",
  );
  await expect(card).toContainText("Brouillon : à relire et publier dans l'éditeur");

  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  const href = await card.getByRole("link", { name: "Voir" }).getAttribute("href");
  expect(href).toMatch(/\/programmes\/fb000000-0000-4000-8000-00000000000[23]\?semaine=1$/);
  const visible = (text: string | RegExp) => page.getByText(text).filter({ visible: true }).first();
  // L'éditeur (ouvert en haut : sur téléphone, la liste des semaines) : nouveau titre, et 3 semaines dès
  // le lundi 1er mars, qui se terminent avant le lundi 22 mars.
  const editor = (href ?? "/").split("?")[0] ?? "/";
  await page.goto(editor);
  await expect(visible("Bloc force · version 2")).toBeVisible();
  await expect(visible(/→ 22 mars/)).toBeVisible();
  // La séance 1 de la semaine 1 : la presse à cuisses à la place du soulevé de terre.
  await page.goto(`${editor}/seances/ta-s1-1`);
  await expect(visible("Presse à cuisses")).toBeVisible();
  await expect(page.getByText("Soulevé de terre barre")).toHaveCount(0);
});

test("lot 3b : aucune carte pour le programme d'une autre organisation", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Retire la semaine 2 du bloc de force de Nadia");
  await expect(box).toContainText("Je ne trouve pas ce programme parmi les tiens.", STEPS);
  await expect(box.getByRole("region", { name: "Modifier le programme" })).toHaveCount(0);
});

// Lot 3b (D-182) : les actions d'un programme, en cartes, dans une même conversation : publier (les
// contrôles de « Publier » : l'avertissement s'affiche sur la carte), archiver puis désarchiver. Le
// programme publié apparaît dans l'onglet Programme de la fiche (à venir, en juin 2027). Remis en
// brouillon en fin de suite (supabase/seed-tests-assistant.sql).
test("lot 3b : publier, archiver puis désarchiver un programme", async ({ page }, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const who = phone ? "Hugo" : "Sarah";
  const full = phone ? "Hugo Lefèvre" : "Sarah Vermeulen";
  const box = await openAssistant(page);

  await ask(box, `Publie le bloc de juin de ${who}`);
  const publish = box.getByRole("region", { name: "Publier le programme" });
  await expect(publish).toContainText(
    `« Bloc juin · test assistant » · version 1 · ${full}`,
    STEPS,
  );
  await expect(publish).toContainText("Attention :");
  await expect(publish).toContainText("% sans max connu");
  await expect(publish).toContainText("Les PDF seront tirés de cette version.");
  await publish.getByRole("button", { name: "Valider" }).click();
  await expect(publish).toContainText("Fait");

  await ask(box, `Archive le bloc de juin de ${who}`);
  const archive = box.getByRole("region", { name: "Archiver le programme" });
  await expect(archive).toContainText("Ses versions publiées restent conservées.", STEPS);
  await archive.getByRole("button", { name: "Valider" }).click();
  await expect(archive).toContainText("Fait");

  await ask(box, `Désarchive le bloc de juin de ${who}`);
  const restore = box.getByRole("region", { name: "Désarchiver le programme" });
  await expect(restore).toContainText("Il redevient publié (version 1)", STEPS);
  await restore.getByRole("button", { name: "Valider" }).click();
  await expect(restore).toContainText("Fait");

  const href = (await restore.getByRole("link", { name: "Voir" }).getAttribute("href")) ?? "/";
  await page.goto(href);
  await expect(page.getByText("Publié v1").filter({ visible: true }).first()).toBeVisible();
  const athlete = phone
    ? "db000000-0000-4000-8000-000000000002"
    : "db000000-0000-4000-8000-000000000001";
  await page.goto(href.replace(/\/programmes\/.*$/, `/sportifs/${athlete}?onglet=programme`));
  await expect(
    page.getByText("Bloc juin · test assistant").filter({ visible: true }).first(),
  ).toBeVisible();
});

test("lot 3b : dupliquer un modèle Coory dans Mes modèles", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Copie le modèle Coory Préparation 10 km dans mes modèles");
  const card = box.getByRole("region", { name: "Dupliquer dans Mes modèles" });
  await expect(card).toContainText("« Préparation 10 km » · modèle Coory", STEPS);
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  const href = await card.getByRole("link", { name: "Voir" }).getAttribute("href");
  expect(href).toMatch(/\/programmes\/modeles\/[0-9a-f-]{36}$/);
  expect(href).not.toContain("7a000000-0000-4000-8000-000000000002");
  await page.goto(href ?? "/");
  await expect(page.getByText("Mes modèles").filter({ visible: true }).first()).toBeVisible();
});

// Lot 4 (D-183) : le quotidien. Chaque appareil a ses lignes de test (Sarah sur ordinateur, Hugo sur
// téléphone), remises en état en fin de suite (supabase/seed-tests-assistant.sql).
const lot4 = (phone: boolean) => (phone ? { who: "Hugo", k: "2" } : { who: "Sarah", k: "1" });
const visibleText = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true }).first();

test("lot 4 : modifier une séance répétée de l'agenda", async ({ page }, testInfo) => {
  const { who } = lot4(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(
    box,
    `Renomme la séance test de ${who} en Séance test modifiée ${who} et passe-la à 19h`,
  );
  const card = box.getByRole("region", { name: "Modifier la séance" });
  await expect(card).toContainText(
    `Titre : Séance test ${who} → Séance test modifiée ${who}`,
    STEPS,
  );
  await expect(card).toContainText("Heure : 18:00 → 19:00");
  await expect(card).toContainText("Toute la série (chaque semaine)");
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  await page.goto((await card.getByRole("link", { name: "Voir" }).getAttribute("href")) ?? "/");
  await expect(visibleText(page, `Séance test modifiée ${who}`)).toBeVisible();
});

test("lot 4 : supprimer une séance de l'agenda", async ({ page }, testInfo) => {
  const { who } = lot4(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Supprime la séance à supprimer de ${who}`);
  const card = box.getByRole("region", { name: "Supprimer la séance" });
  await expect(card).toContainText(
    "Elle disparaîtra de l'agenda et des sportifs inscrits (définitif)",
    STEPS,
  );
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  await page.goto("/coach/o/0b000000-0000-4000-8000-0000000000b1/agenda?vue=liste");
  await expect(page.getByText(`Séance à supprimer ${who}`)).toHaveCount(0);
});

test("lot 4 : cocher, décaler, et supprimer une liste en une réponse", async ({
  page,
}, testInfo) => {
  const { who } = lot4(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Coche, décale et range les tâches test de ${who}`);
  const done = box.getByRole("region", { name: "Tâche faite" });
  const moved = box.getByRole("region", { name: "Modifier la tâche" });
  const list = box.getByRole("region", { name: "Supprimer la liste" });
  await expect(done).toContainText(`Tâche à cocher ${who}`, STEPS);
  await expect(moved).toContainText(
    "Échéance : vendredi 20 novembre 2026 → mercredi 25 novembre 2026",
  );
  await expect(list).toContainText("Sa tâche reste, sans liste (définitif)");
  for (const card of [done, moved, list]) {
    await card.getByRole("button", { name: "Valider" }).click();
    await expect(card).toContainText("Fait");
  }
  // Sur téléphone, la page Tâches s'ouvre sur le menu des vues : la vue « Toutes » directement.
  await page.goto("/coach/taches?vue=toutes");
  await expect(page.getByText(`Liste test ${who}`)).toHaveCount(0);
  await expect(visibleText(page, `Tâche rangée ${who}`)).toBeVisible();
});

test("lot 4 : supprimer un paiement et arrêter un abonnement", async ({ page }, testInfo) => {
  const { who } = lot4(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Supprime le paiement test de ${who} et arrête son abonnement test`);
  const payment = box.getByRole("region", { name: "Supprimer le paiement" });
  const expense = box.getByRole("region", { name: "Arrêter la dépense" });
  await expect(payment).toContainText(
    "La séance du lundi 9 novembre 2026 redevient à encaisser",
    STEPS,
  );
  await expect(expense).toContainText("Ne compte plus après aujourd'hui");
  for (const card of [payment, expense]) {
    await card.getByRole("button", { name: "Valider" }).click();
    await expect(card).toContainText("Fait");
  }
  await page.goto("/coach/comptabilite");
  await expect(page.getByText(`Paiement test ${who}`)).toHaveCount(0);
});

test("lot 4 : renommer un document", async ({ page }, testInfo) => {
  const { who } = lot4(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Renomme le document test de ${who} en Document renommé ${who}`);
  const card = box.getByRole("region", { name: "Modifier le document" });
  await expect(card).toContainText(`Nom : Document test ${who} → Document renommé ${who}`, STEPS);
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  await page.goto("/coach/documents");
  await expect(visibleText(page, `Document renommé ${who}`)).toBeVisible();
});

test("lot 4 : aucune carte pour la tâche d'une autre organisation", async ({ page }) => {
  const box = await openAssistant(page);
  await ask(box, "Supprime la tâche de l'autre coach");
  await expect(box).toContainText("Je ne trouve pas cette tâche.", STEPS);
  await expect(box.getByRole("region", { name: "Supprimer la tâche" })).toHaveCount(0);
});

test("lot 4 : une tâche supprimée ne se modifie plus, rien de faux n'est écrit", async ({
  page,
}, testInfo) => {
  const { who } = lot4(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Modifie puis supprime la tâche double de ${who}`);
  const edit = box.getByRole("region", { name: "Modifier la tâche" });
  const remove = box.getByRole("region", { name: "Supprimer la tâche" });
  await expect(remove).toContainText(`Tâche double ${who}`, STEPS);
  await remove.getByRole("button", { name: "Valider" }).click();
  await expect(remove).toContainText("Fait");
  await edit.getByRole("button", { name: "Valider" }).click();
  await expect(edit).toContainText("Tâche introuvable : elle a peut-être été supprimée.");
});

// Lot 5 (D-184) : les sportifs. Par appareil : « Léa Test » (ordinateur) / « Noah Test » (téléphone),
// « Léa Archive » / « Noah Archive », un exercice du coach ; remis en état en fin de suite.
const lot5 = (phone: boolean) =>
  phone
    ? { who: "Noah", athlete: "e5000000-0000-4000-8000-000000000002" }
    : { who: "Léa", athlete: "e5000000-0000-4000-8000-000000000001" };
const sheet = (athlete: string, tab: string) =>
  `/coach/o/0b000000-0000-4000-8000-0000000000b1/sportifs/${athlete}?onglet=${tab}`;
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("lot 5 : disponibilités changées, blessure intacte", async ({ page }, testInfo) => {
  const { who, athlete } = lot5(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Passe ${who} Test à 3 séances par semaine, lundi mercredi vendredi`);
  const card = box.getByRole("region", { name: "Disponibilités" });
  await expect(card).toContainText("Séances par semaine : 2 → 3", STEPS);
  await expect(card).toContainText("Jours : lundi, jeudi → lundi, mercredi, vendredi");
  await expect(card).not.toContainText("Genou");
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  await page.goto(sheet(athlete, "disponibilites"));
  await expect
    .poll(() =>
      page.evaluate(
        () => (document.querySelector('input[name="sessionsPerWeek"]') as HTMLInputElement)?.value,
      ),
    )
    .toBe("3");
  await page.goto(sheet(athlete, "notes"));
  await expect
    .poll(() =>
      page.evaluate(
        (text) =>
          [...document.querySelectorAll("textarea")].some((area) => area.value.includes(text)),
        `Genou droit fragile (test ${who})`,
      ),
    )
    .toBe(true);
});

test("lot 5 : une note s'ajoute sous l'ancienne", async ({ page }, testInfo) => {
  const { who, athlete } = lot5(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Note pour ${who} Test : préfère courir le matin`);
  const card = box.getByRole("region", { name: "Ajouter à la note privée" });
  await expect(card).toContainText("« Préfère courir le matin »", STEPS);
  await expect(card).not.toContainText("Note existante");
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  await page.goto(sheet(athlete, "notes"));
  await expect(page.getByRole("textbox", { name: "Notes libres" })).toHaveValue(
    new RegExp(
      `^Note existante de ${who} \\(test\\)\\.\\n\\n\\d\\d/\\d\\d/\\d{4} : Préfère courir le matin$`,
    ),
  );
});

test("lot 5 : un objectif ajouté, un autre rendu principal", async ({ page }, testInfo) => {
  const { who, athlete } = lot5(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(
    box,
    `Ajoute un objectif semi-marathon à ${who} Test et rends principal son objectif forme`,
  );
  const added = box.getByRole("region", { name: "Nouvel objectif" });
  const main = box.getByRole("region", { name: "Objectif principal" });
  await expect(added).toContainText("Semi-marathon le dimanche 17 octobre 2027", STEPS);
  for (const card of [added, main]) {
    await card.getByRole("button", { name: "Valider" }).click();
    await expect(card).toContainText("Fait");
  }
  await page.goto(sheet(athlete, "objectifs"));
  await expect(page.getByText("Semi-marathon").filter({ visible: true }).first()).toBeVisible();
});

test("lot 5 : un repère supprimé, un record ajouté", async ({ page }, testInfo) => {
  const { who, athlete } = lot5(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Supprime la FC max de ${who} Test et ajoute son record 5 km en 21:30`);
  const removed = box.getByRole("region", { name: "Supprimer le repère" });
  const record = box.getByRole("region", { name: "Nouveau record" });
  await expect(removed).toContainText("FC max : 192 bpm", STEPS);
  await expect(record).toContainText("5 km : 21:30");
  for (const card of [removed, record]) {
    await card.getByRole("button", { name: "Valider" }).click();
    await expect(card).toContainText("Fait");
  }
  await page.goto(sheet(athlete, "reperes"));
  await expect(page.getByText("21:30").filter({ visible: true }).first()).toBeVisible();
});

test("lot 5 : archiver un sportif", async ({ page }, testInfo) => {
  const { who } = lot5(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Archive ${who} Archive`);
  const card = box.getByRole("region", { name: "Statut du sportif" });
  await expect(card).toContainText("Statut : Actif → Archivé", STEPS);
  await expect(card).toContainText("Il quitte la liste active sans rien effacer");
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  // La liste montre aussi les archivés, avec leur statut : la ligne du sportif dit « Archivé ».
  await page.goto("/coach/o/0b000000-0000-4000-8000-0000000000b1/sportifs");
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: `${who} Archive` })
      .filter({ visible: true })
      .first(),
  ).toContainText("Archivé");
});

test("lot 5 : renommer un exercice du coach ; un exercice Coory, aucune carte", async ({
  page,
}, testInfo) => {
  const { who } = lot5(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await ask(box, `Renomme mon exercice test ${who} en Exercice test renommé ${who}`);
  const card = box.getByRole("region", { name: "Modifier l'exercice" });
  await expect(card).toContainText(
    `Nom : Exercice test ${who} → Exercice test renommé ${who}`,
    STEPS,
  );
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
  await ask(box, "Modifie la presse à cuisses de Coory");
  await expect(box).toContainText(
    "C'est un exercice Coory : je ne peux que le mettre en favori.",
    STEPS,
  );
  await expect(box.getByRole("region", { name: "Modifier l'exercice" })).toHaveCount(1);
});

test("lot 5 : la photo jointe devient celle du sportif", async ({ page }, testInfo) => {
  const { who } = lot5(testInfo.project.name === "telephone");
  const box = await openAssistant(page);
  await box.locator('input[type="file"]').setInputFiles({
    name: "photo-test.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await ask(box, `Mets cette photo pour ${who} Test`);
  const card = box.getByRole("region", { name: "Photo du sportif" });
  await expect(card).toContainText("Nouvelle photo : photo-test.png", STEPS);
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(card).toContainText("Fait");
});

// Lot 6 (D-185) : les réglages, avec un coach À PART (« Coach Réglages », organisation abonnée) pour
// ne gêner aucun autre test ; chaque appareil touche ses propres réglages (pas deux écritures en même
// temps sur la même ligne). Remis en état en fin de suite (supabase/seed-tests-assistant.sql).
async function openAssistantAsSettingsCoach(page: Page): Promise<Locator> {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-reglages@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  return assistantSurface(page);
}

test("lot 6 : une préférence, puis une sorte de notifications coupée", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "telephone",
    "Préférences du coach Réglages : un seul projet.",
  );
  const box = await openAssistantAsSettingsCoach(page);
  await ask(box, "Passe ma durée par défaut à 75 minutes");
  const prefs = box.getByRole("region", { name: "Préférences" });
  await expect(prefs).toContainText("Durée par défaut : 60 min → 75 min", STEPS);
  await prefs.getByRole("button", { name: "Valider" }).click();
  await expect(prefs).toContainText("Fait");
  await ask(box, "Coupe les notifications des tâches");
  const notify = box.getByRole("region", { name: "Couper une notification" });
  await expect(notify).toContainText("Tâches du jour et en retard", STEPS);
  await notify.getByRole("button", { name: "Valider" }).click();
  await expect(notify).toContainText("Fait");
  await page.goto("/coach/profil?onglet=preferences");
  const dialog = page.getByRole("dialog", { name: "Paramètres" });
  await expect(
    dialog.getByRole("region", { name: "Valeurs par défaut" }).getByLabel("Durée", { exact: true }),
  ).toHaveValue("75");
});

test("lot 6 : renommer l'organisation, masquer puis réafficher une notification", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "telephone",
    "Organisation du coach Réglages : un seul projet.",
  );
  const box = await openAssistantAsSettingsCoach(page);
  await ask(box, "Renomme mon organisation en Organisation Réglages modifiée");
  const name = box.getByRole("region", { name: "Nom de l'organisation" });
  await expect(name).toContainText(
    "Nom : Organisation Réglages → Organisation Réglages modifiée",
    STEPS,
  );
  await name.getByRole("button", { name: "Valider" }).click();
  await expect(name).toContainText("Fait");
  await ask(box, "Masque la notification de la fiche de Zoé");
  const hide = box.getByRole("region", { name: "Masquer des notifications" });
  await expect(hide).toContainText("Fiche à compléter : Zoé Réglages", STEPS);
  await hide.getByRole("button", { name: "Valider" }).click();
  await expect(hide).toContainText("Fait");
  await ask(box, "Réaffiche la notification de la fiche de Zoé");
  const show = box.getByRole("region", { name: "Afficher des notifications" });
  await expect(show).toContainText("1 notification affichée", STEPS);
  await show.getByRole("button", { name: "Valider" }).click();
  await expect(show).toContainText("Fait");
});

test("lot 6 : un taux de devise invalide, aucune carte", async ({ page }) => {
  const box = await openAssistantAsSettingsCoach(page);
  await ask(box, "Passe ma devise en CHF au taux zéro");
  await expect(box).toContainText("Le taux doit être plus grand que 0", STEPS);
  await expect(box.getByRole("region", { name: "Changer de devise" })).toHaveCount(0);
});
