import { expect, test, type Page } from "@playwright/test";

import { goToCoachSection, isPhone, setAgendaFilter } from "./helpers";

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

test("l'agenda du coach, façon Google Agenda : vues, filtres en cases, et aucune compétition", async ({
  page,
}) => {
  await loginAsCoachA(page);

  // L'agenda est dans la navigation (barre latérale ou menu selon l'écran) ; il ouvre la semaine.
  await goToCoachSection(page, "Agenda");
  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: /^Semaine du/ })).toBeVisible();
  // Ordinateur : le menu Coory se replie en arrivant (D-78).
  if (!isPhone(page)) await expect(page.locator("html")).toHaveAttribute("data-sidebar", "hidden");
  // Vues : menu « Semaine ▾ » sur ordinateur ; feuille « Vue et filtres » sur téléphone (avec 3 jours).
  await page.getByRole("button", { name: /^Vue : / }).click();
  if (isPhone(page)) {
    const sheet = page.getByRole("dialog", { name: "Vue et filtres" });
    await expect(
      sheet.getByRole("navigation", { name: "Vue de l'agenda" }).getByRole("link"),
    ).toHaveText(["Liste", "Jour", "3 jours", "Semaine", "Mois"]);
    await expect(sheet.getByRole("checkbox", { name: "Individuelles" })).toBeChecked();
    await expect(sheet.getByRole("checkbox", { name: "Collectives" })).toBeChecked();
  } else {
    await expect(
      page.getByRole("menu", { name: "Vue de l'agenda" }).getByRole("menuitemradio"),
    ).toContainText(["Jour", "Semaine", "Mois", "Liste"]);
  }
  await page.keyboard.press("Escape");

  // Mars 2027 : le Hyrox d'Inès (20 mars) n'est plus dans le planning du coach (26/10).
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=mois&date=2027-03-01`);
  const march = page.getByRole("region", { name: "Mars 2027" });
  await expect(march).toBeVisible();
  await expect(march.getByText(/Hyrox Bruxelles/)).toHaveCount(0);

  // Semaine fixée (janvier 2027) : la piste du mercredi est collective ; elle disparaît quand on
  // décoche « Collectives », revient quand on la recoche.
  await page.goto(`/coach/o/${ORG_A}/agenda?date=2027-01-06`);
  const week = page.getByRole("region", { name: /^Semaine du/ });
  // La grille contient plusieurs semaines (sur ordinateur, seule celle choisie est affichée).
  const piste = week.getByRole("link", { name: /Piste du mercredi/ }).filter({ visible: true });
  await expect(piste.first()).toBeVisible();
  await setAgendaFilter(page, "Collectives", false);
  await expect(page).toHaveURL(/type=individuelles/);
  await expect(week.getByRole("link", { name: /Piste du mercredi/ })).toHaveCount(0);
  await setAgendaFilter(page, "Collectives", true);
  await expect(page).not.toHaveURL(/type=/);
  await expect(piste.first()).toBeVisible();
});

test("le tableau de bord montre les séances à venir, jour par jour, et les programmes en cours", async ({
  page,
}) => {
  await loginAsCoachA(page);
  await expect(page.getByRole("heading", { name: "Tableau de bord", level: 1 })).toBeVisible();
  // Plus d'agenda sur le tableau de bord (D-78) : il est sur la page Agenda.
  await expect(page.locator("[data-drop-date]")).toHaveCount(0);
  // Séances à venir : les deux prochains jours qui ont des séances, chacun avec sa date en titre et
  // ses séances (la démo en a tous les jours de la semaine), la plus proche marquée « Prochaine ».
  const upcoming = page.getByRole("region", { name: "Séances à venir" });
  // Téléphone (02/11) : le premier jour seul, « Voir plus » montre le suivant.
  if (isPhone(page)) {
    await expect(upcoming.getByRole("heading", { level: 3 })).toHaveCount(1);
    await upcoming.getByRole("button", { name: /^Voir plus/ }).click();
  }
  await expect(upcoming.getByRole("heading", { level: 3 })).toHaveCount(2);
  await expect(upcoming.getByRole("heading", { level: 3 }).first()).toHaveText(
    /^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche) \d{1,2} \p{L}+$/u,
  );
  await expect(upcoming.getByText("Prochaine", { exact: true })).toHaveCount(1);
  await expect(upcoming.getByRole("link", { name: "Voir tout" })).toHaveAttribute(
    "href",
    /\/agenda\?vue=liste$/,
  );
  // Programmes en cours (D-46) : le programme publié d'Inès, avec sa semaine en cours.
  const programs = page.getByRole("region", { name: "Programmes en cours" });
  await expect(programs.getByRole("link", { name: /Inès Benali/ })).toContainText(
    "Prépa Hyrox Bruxelles",
  );
  await expect(programs).toContainText(/Sem\. \d+\/12/);
  await expect(page.getByRole("region", { name: "Activité financière" })).toBeVisible();
  // L'Agenda est la 2e entrée du menu, juste sous le Tableau de bord (D-78).
  if (isPhone(page)) await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const nav = page
    .getByRole("navigation", { name: "Navigation principale" })
    .filter({ visible: true });
  const entries = (await nav.getByRole("link").allInnerTexts()).map((t) => t.trim().split("\n")[0]);
  expect(entries.slice(0, 2)).toEqual(["Tableau de bord", "Agenda"]);
  await nav.getByRole("link", { name: "Agenda", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
});

test("le menu « Créer » mène aux vraies créations : séance, programme et tâche", async ({
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
  // Programmes construits (D-157) : l'assistant « Créer un programme » s'ouvre à sa première étape.
  await expect(page).toHaveURL(/\/coach\/o\/[^/]+\/programmes\/nouveau$/);
  await expect(page.getByText("Étape 1 sur 4").filter({ visible: true }).first()).toBeVisible();
});

// Carte Tâches et messages (D-35, D-36). Chaque projet (ordinateur, téléphone) touche SES lignes du seed :
// les deux tournent en parallèle sur la même base. L'état de départ est lu, pas supposé (la base
// locale sert aussi au serveur de dev), et chaque tâche est remise à faire à la fin.
const ATHLETE_OF_B = "db000000-0000-4000-8000-000000000001";

test("une tâche cochée quitte la carte du tableau de bord et passe dans « Terminées »", async ({
  page,
}, testInfo) => {
  // Carte du tableau de bord : liste détaillée sur ordinateur, petit widget (intitulé + rond) sur
  // téléphone ; on coche dans la carte sur les deux.
  const phone = testInfo.project.name === "telephone";
  const title = phone
    ? "Relancer Sophie pour la facture d'octobre"
    : "Préparer le bloc 2 du programme de Lucas";
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
  const card = page.getByRole("link", { name: /tâches? à faire/ });
  await expect(card).toHaveAttribute("href", "/coach/taches");
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await checkbox.click();
  await expect(page.getByText("Tâche terminée.")).toBeVisible();
  await expect(checkbox).toHaveCount(0);
  // « Annuler » dans le message (audit apple-design du 28/10) : la tâche revient, à faire ; on la
  // recoche pour continuer.
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.getByText("Tâche rouverte.")).toBeVisible();
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await checkbox.click();
  await expect(page.getByText("Tâche terminée.")).toBeVisible();
  await expect(checkbox).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(checkbox).toHaveCount(0);

  // Elle est dans « Terminées », cochée ; la rouvrir la remet à faire.
  await page.goto("/coach/taches");
  // Vues de la page Tâches (kit « Coory Pages », 01, D-129) : des tuiles.
  await page
    .getByRole("navigation", { name: "Vues des tâches" })
    .getByRole("link", { name: /Terminées/ })
    .click();
  await expect(page).toHaveURL(/vue=terminees/);
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
    await expect(
      page.locator('[aria-label^="Notifications,"]').filter({ visible: true }).first(),
    ).toBeVisible();
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
