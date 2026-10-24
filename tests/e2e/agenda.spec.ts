import { expect, test, type Page } from "@playwright/test";

import { goToCoachSection } from "./helpers";

// Agenda du coach (P2-05, refonte 4a) et tableau de bord, sur les données du seed (supabase/seed.sql).
// Les mois sont fixés dans l'adresse pour que le test ne dépende pas de la date du jour.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const ORG_B = "0b000000-0000-4000-8000-0000000000b1";

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach voit les compétitions de ses sportifs, filtre et ouvre la fiche", async ({
  page,
}) => {
  await loginAsCoachA(page);

  // L'agenda est dans la navigation (barre latérale ou menu selon l'écran) ; il ouvre la semaine.
  await goToCoachSection(page, "Agenda");
  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: /^Semaine du/ })).toBeVisible();

  // Mars 2027 (ancienne adresse ?mois= conservée) : le Hyrox d'Inès ; jamais Sarah (organisation B).
  await page.goto(`/coach/o/${ORG_A}/agenda?mois=2027-03`);
  const march = page.getByRole("region", { name: "Mars 2027" });
  await expect(march.getByRole("link", { name: /Hyrox Bruxelles/ })).toBeVisible();
  await expect(march.getByText(/Sarah/)).toHaveCount(0);

  // Filtre « Collectives » : les compétitions disparaissent.
  const filters = page.getByRole("navigation", { name: "Filtrer l'agenda" });
  await filters.getByRole("link", { name: "Collectives" }).click();
  await expect(page).toHaveURL(/type=collectives/);
  await expect(march.getByRole("link", { name: /Hyrox Bruxelles/ })).toHaveCount(0);

  // Mois suivant, filtre « Compétitions » : le semi de Thomas en avril, qui ouvre sa fiche.
  await page.getByRole("link", { name: "Période suivante" }).click();
  await expect(page).toHaveURL(/date=2027-04-01/);
  await filters.getByRole("link", { name: "Compétitions" }).click();
  await expect(page).toHaveURL(/type=competitions/);
  const april = page.getByRole("region", { name: "Avril 2027" });
  await april.getByRole("link", { name: /Semi-marathon de printemps/ }).click();
  await expect(page).toHaveURL(/onglet=objectifs/);
  await expect(page.getByRole("heading", { name: "Thomas Peeters", level: 1 })).toBeVisible();
});

test("le tableau de bord montre la semaine du coach avec ses vraies séances", async ({ page }) => {
  await loginAsCoachA(page);
  await expect(page.getByRole("heading", { name: /^Bonjour/, level: 1 })).toBeVisible();
  // Semaine fixée dans l'adresse : le mercredi 6 janvier 2027 a la piste collective (19:00).
  await page.goto("/coach?date=2027-01-06");
  const week = page.getByRole("region", { name: "Semaine du 4 au 10 janvier" });
  await expect(
    week.getByRole("link", { name: /Piste du mercredi/ }).filter({ visible: true }),
  ).toHaveCount(1);
  // Les modules pas encore construits disent ce qu'ils contiennent : rien, jamais de faux chiffres.
  await expect(
    page.getByRole("region", { name: "Programmes en cours" }).getByText(/Aucun programme/),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Séances à venir" })).toBeVisible();
  await week.getByRole("link", { name: "Agenda →" }).click();
  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
});

test("l'agenda du tableau de bord passe du jour à la semaine et au mois sans quitter la page", async ({
  page,
}) => {
  await loginAsCoachA(page);
  const views = page.getByRole("navigation", { name: "Vue de l'agenda" });
  await views.getByRole("link", { name: "Mois" }).click();
  await expect(page).toHaveURL(/\/coach\?vue=mois/);
  // Un jour du mois ouvre sa journée, toujours sur le tableau de bord.
  await page.getByRole("link", { name: /^15 :/ }).click();
  await expect(page).toHaveURL(/\/coach\?vue=jour&date=\d{4}-\d{2}-15/);
  await expect(views.getByRole("link", { name: "Aujourd'hui" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await views.getByRole("link", { name: "Semaine" }).click();
  await expect(page.getByRole("heading", { name: /^Semaine du/, level: 2 })).toBeVisible();
  await views.getByRole("link", { name: "Mois" }).click();
  await expect(page.getByRole("link", { name: /^15 :/ })).toBeVisible();
});

test("le menu « Créer » mène aux vraies créations, et à la page vide du module pour le reste", async ({
  page,
}) => {
  await loginAsCoachA(page);
  const menu = page.getByRole("dialog", { name: "Créer" });
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  // Séance : la fenêtre « Nouvelle séance » s'ouvre par-dessus le tableau de bord (D-35).
  await menu.getByRole("button", { name: "Séance" }).click();
  const newSession = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(newSession.getByLabel("Titre")).toBeVisible();
  await expect(page).toHaveURL(/\/coach$/);
  await newSession.getByRole("button", { name: "Fermer" }).click();
  await expect(newSession).toBeHidden();
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await menu.getByRole("button", { name: "Programme" }).click();
  await expect(page.getByRole("heading", { name: "Programmes", level: 1 })).toBeVisible();
  // Module pas encore construit (D-32) : sa page, vide et honnête, sans badge « Bientôt ».
  await expect(page.getByRole("main").getByText("Aucun programme pour l'instant")).toBeVisible();
  await expect(page.getByRole("main").getByText(/Bientôt/)).toHaveCount(0);
});

// Cartes Tâches et Messages (D-35). Chaque projet (ordinateur, téléphone) touche SES lignes du seed :
// les deux tournent en parallèle sur la même base. L'état de départ est lu, pas supposé (la base
// locale sert aussi au serveur de dev), et chaque tâche est remise à faire à la fin.
const ATHLETE_OF_B = "db000000-0000-4000-8000-000000000001";

test("une tâche cochée quitte la carte du tableau de bord et passe dans « Terminées »", async ({
  page,
}, testInfo) => {
  const title =
    testInfo.project.name === "telephone"
      ? "Relancer Sophie pour la facture d'octobre"
      : "Finaliser le programme Hyrox de Lucas";
  const checkbox = page.getByRole("checkbox", { name: `Tâche faite : ${title}` });
  await loginAsCoachA(page);

  // Départ : la tâche est à faire (rouverte si un passage précédent l'a laissée terminée).
  await page.goto("/coach/taches?onglet=terminees");
  await expect(page.getByRole("heading", { name: "Tâches", level: 1 })).toBeVisible();
  if ((await checkbox.count()) > 0) {
    await checkbox.click();
    await expect(page.getByText("Tâche rouverte.")).toBeVisible();
  }

  await page.goto("/coach");
  await expect(page.getByRole("link", { name: /tâches? à faire/ })).toHaveAttribute(
    "href",
    "/coach/taches",
  );
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await checkbox.click();
  await expect(page.getByText("Tâche terminée.")).toBeVisible();
  await expect(checkbox).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("link", { name: /tâches? à faire/ })).toBeVisible();
  await expect(checkbox).toHaveCount(0);

  // Elle est dans « Terminées », cochée ; la rouvrir la remet sur le tableau de bord.
  await page.goto("/coach/taches");
  await page
    .getByRole("navigation", { name: "Onglets des tâches" })
    .getByRole("link", { name: "Terminées" })
    .click();
  await expect(page).toHaveURL(/onglet=terminees/);
  await expect(checkbox).toHaveAttribute("aria-checked", "true");
  await checkbox.click();
  await expect(page.getByText("Tâche rouverte.")).toBeVisible();
  await expect(checkbox).toHaveCount(0);
  await page.goto("/coach");
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
});

test("les messages non lus : pastille sur la cloche ; ouvrir le fil les marque lus, et le coach répond", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const sender = phone ? "Inès Benali" : "Thomas Peeters";
  const reply = `Réponse ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await loginAsCoachA(page);

  // La cloche annonce ce qui attend, messages non lus compris (pastille rouge, D-36, D-37).
  await page.goto("/coach/messages");
  const conversation = page
    .getByRole("list")
    .getByRole("link", { name: new RegExp(sender) })
    .first();
  if (/non lu/.test(await conversation.innerText())) {
    await expect(page.getByRole("link", { name: /^Notifications, \d+ à voir$/ })).toBeVisible();
  }
  await conversation.click();
  await expect(page).toHaveURL(/\/coach\/messages\?sportif=/);
  await expect(page.getByRole("heading", { name: sender, level: 2 })).toBeVisible();
  const thread = page.url();

  // Ouvert : ses messages sont lus, la conversation n'a plus de pastille « non lu ».
  await expect
    .poll(async () => {
      await page.goto("/coach/messages");
      return page
        .getByRole("list")
        .getByRole("link", { name: new RegExp(sender) })
        .first()
        .innerText();
    })
    .not.toMatch(/non lu/);

  // Réponse enregistrée dans le fil (sans e-mail ni WhatsApp, et la page le dit).
  await page.goto(thread);
  await expect(page.getByRole("heading", { name: sender, level: 2 })).toBeVisible();
  await page.getByLabel("Ton message").fill(reply);
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(
    page.getByRole("list", { name: `Messages avec ${sender}` }).getByText(reply),
  ).toBeVisible();
  await expect(page.getByLabel("Ton message")).toHaveValue("");
  await expect(page.getByText(/Aucun e-mail ni WhatsApp/)).toBeVisible();

  // Isolation : un sportif d'une autre organisation n'a pas de conversation ici.
  await page.goto(`/coach/messages?sportif=${ATHLETE_OF_B}`);
  await expect(page.getByText("Conversation introuvable")).toBeVisible();
});

test("le coach A ne peut pas ouvrir l'agenda de l'organisation B", async ({ page }) => {
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_B}/agenda`);
  await expect(page).toHaveURL(/\/acces-refuse$/);
});
