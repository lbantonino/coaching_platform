import { expect, test, type Page } from "@playwright/test";

import { isPhone, setAgendaFilter } from "./helpers";
import {
  chooseAthlete,
  chooseDiscipline,
  chooseNewAthlete,
  chooseRecurrence,
  enrollAthletes,
  setRepeatEnd,
  setWhen,
  submitNewSession,
} from "./new-session";

// Séances encadrées du coach (P2-05b, D-27, D-35) : collective hebdomadaire avec inscrits,
// individuelle, nouveau sportif (fiche minimale), fenêtre « Nouvelle séance » commune, page Séances,
// modification, suppression, isolation. Dates fixées en 2027 : le test ne dépend pas du jour où il tourne.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const ORG_B = "0b000000-0000-4000-8000-0000000000b1";
const SESSION_OF_B = "cb000000-0000-4000-8000-000000000001";

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

// « Nouvelle séance » ouvre la même fenêtre sur toutes les pages (D-35), sans changer de page.
async function openNewSession(page: Page) {
  await page.getByRole("button", { name: "Nouvelle séance" }).click();
  const dialog = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(dialog.getByLabel("Titre")).toBeVisible();
  return dialog;
}

async function deleteOpenSession(page: Page, title: string) {
  // Ordinateur : « ••• » puis « Supprimer » ; téléphone : « Supprimer la séance » en bas de page (02/11).
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "Supprimer la séance" }).click();
  } else {
    await page.getByRole("button", { name: "Plus d'actions" }).click();
    await page
      .getByRole("dialog", { name: title })
      .getByRole("button", { name: "Supprimer" })
      .click();
  }
  await page
    .getByRole("dialog", { name: "Supprimer cette séance ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG_A}/agenda$`));
}

const unique = (testInfo: { project: { name: string } }) =>
  `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

test("le coach crée une séance collective chaque semaine, la retrouve, la modifie et la supprime", async ({
  page,
}, testInfo) => {
  const title = `Piste ${unique(testInfo)}`;
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda?date=2027-01-06`);
  const dialog = await openNewSession(page);

  // « Individuelle » est le type proposé d'abord : on choisit « Collective ».
  await dialog.getByText("Collective", { exact: true }).click();
  await dialog.getByLabel("Titre").fill(title);
  await chooseDiscipline(dialog, "Running");
  await dialog.getByLabel(/^Lieu/).fill("Stade de test");
  await setWhen(dialog, "2027-01-06", "19:00", "20:30");
  await expect(dialog.getByText("Durée : 1 h 30")).toBeVisible();
  await chooseRecurrence(dialog, "Chaque semaine");
  await setRepeatEnd(dialog, "2027-01-27");
  await expect(
    dialog.getByRole("button", { name: /^Fin de la répétition : 27 janv\. 2027/ }),
  ).toBeVisible();
  await enrollAthletes(dialog, ["Thomas Peeters", "Inès Benali"]);
  await expect(
    dialog.getByRole("button", { name: "Sportifs inscrits : 2 inscrits" }),
  ).toBeVisible();
  // Prix (D-52) : 80 € TVA comprise pour toute la séance, en espèces. TVA de la séance (D-163) :
  // cochée, le taux normal du pays (21 %) est proposé.
  await dialog.getByLabel(/^Prix pour toute la séance/).fill("80");
  await dialog.getByRole("radio", { name: "Espèces" }).click();
  await dialog.getByLabel(/^Appliquer la TVA/).check();
  await expect(dialog.getByLabel("Taux de TVA")).toHaveValue("21");
  await submitNewSession(dialog);

  // On reste sur l'agenda : la fenêtre se ferme et la séance apparaît le mercredi 6.
  await expect(page.getByText("Séance créée.")).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/agenda\?date=2027-01-06$/);
  await page
    .locator('[data-drop-date="2027-01-06"]')
    .getByRole("link", { name: new RegExp(title) })
    .click();

  // Page de la séance : rythme, période et inscrits.
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  const details = page.getByRole("region", { name: "Détails", exact: true });
  await expect(details).toContainText("Chaque mercredi à 19:00 · 1 h 30");
  await expect(details).toContainText("Depuis le 6 janvier 2027, jusqu'au 27 janvier 2027");
  // Séance collective : les participants se déplient depuis la carte de la séance (03/11).
  await expect(page.getByText("2 inscrits", { exact: true })).toBeVisible();
  await page.locator("summary", { hasText: "Participants" }).click();
  await expect(
    page.getByRole("list", { name: "Sportifs de la séance" }).getByRole("link"),
  ).toHaveCount(2);
  const price = page.getByRole("region", { name: "Prix et paiements" });
  await expect(price).toContainText(/80,00\s€ TVAC · 66,12\s€ HTVA/);
  await expect(price).toContainText("Espèces");

  // Dans l'agenda de janvier 2027 : quatre mercredis, pas un de plus (chaque case du mois nomme
  // ses séances).
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=mois&date=2027-01-01`);
  const month = page.getByRole("region", { name: "Janvier 2027" });
  await expect(month.getByRole("link", { name: new RegExp(title) })).toHaveCount(4);

  // Modification depuis la journée du 13 : nouvelle heure, un inscrit en moins.
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=jour&date=2027-01-13`);
  // La grille contient plusieurs semaines : la séance de ce mercredi-là.
  await page
    .locator('[data-drop-date="2027-01-13"]')
    .getByRole("link", { name: new RegExp(title) })
    .click();
  // Ordinateur : « Modifier » en haut et dans la barre d'actions du bas (même page).
  await page.getByRole("link", { name: "Modifier", exact: true }).first().click();
  await expect(page.getByLabel(/^Prix pour toute la séance/)).toHaveValue("80");
  await page.getByLabel("Heure de début").fill("19:30");
  // Kit « Coory Pages », 06 / 12 (D-123) : le récapitulatif (ordinateur) et la ligne du prix suivent
  // la saisie ; le prix par inscrit est un simple calcul (TVA de la séance : 21 %).
  if (testInfo.project.name === "ordinateur") {
    await expect(
      page.getByRole("complementary", { name: "Récapitulatif de la séance" }),
    ).toContainText("Chaque mercredi, 19:30");
  }
  const priceLine = page.locator("p[aria-live]").filter({ hasText: "par inscrit" });
  await expect(priceLine).toHaveText(/80,00\s€ TTC pour la séance, soit 40,00\s€ par inscrit\./);
  // Page façon Apple (D-206) : « Sportifs inscrits » ouvre la liste sur place ; on décoche Thomas.
  await enrollAthletes(page.locator("main"), ["Thomas Peeters"]);
  await expect(priceLine).toHaveText(/soit 80,00\s€ par inscrit\./);
  // Supprimer depuis « Modifier » demande toujours une confirmation ; « Annuler » ne supprime rien.
  await page.getByRole("button", { name: "Supprimer la séance" }).click();
  const confirmDelete = page.getByRole("dialog", { name: "Supprimer cette séance ?" });
  await expect(confirmDelete).toContainText("toutes ses dates seront supprimées");
  await confirmDelete.getByRole("button", { name: "Annuler" }).click();
  await expect(confirmDelete).toBeHidden();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(details).toContainText("19:30");
  // Dans la carte de la séance : la page « Modifier » quittée reste cachée dans le DOM (Next), avec
  // son récapitulatif « 1 inscrit ».
  await expect(
    page.getByRole("region", { name: "Cette séance" }).getByText("1 inscrit", { exact: true }),
  ).toBeVisible();

  // Suppression par le menu « ••• », après confirmation : retour à l'agenda, la séance n'y est plus.
  await deleteOpenSession(page, title);
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=mois&date=2027-01-01`);
  await expect(month.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
});

test("une séance individuelle demande son sportif (ou un nouveau client), et la saisie est conservée après l'erreur", async ({
  page,
}, testInfo) => {
  const title = `Force ${unique(testInfo)}`;
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda`);
  const dialog = await openNewSession(page);

  await expect(dialog.getByRole("radio", { name: "Individuelle" })).toBeChecked();
  await dialog.getByLabel("Titre").fill(title);
  await setWhen(dialog, "2027-01-13", "07:30", "08:30");
  await submitNewSession(dialog);

  await expect(
    dialog.getByRole("alert").filter({
      hasText: "Choisis le sportif de la séance, ou « Nouveau sportif » dans la liste.",
    }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Titre")).toHaveValue(title);
  await expect(dialog.getByLabel("Heure de début")).toHaveValue("07:30");
  await expect(dialog.getByLabel("Heure de fin")).toHaveValue("08:30");

  await chooseAthlete(dialog, "Nadia El Amrani");
  await submitNewSession(dialog);
  await expect(page.getByText("Séance créée.")).toBeVisible();
  await expect(dialog).toBeHidden();

  await page.goto(`/coach/o/${ORG_A}/agenda?vue=jour&date=2027-01-13`);
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  // Séance unique : sa date et son heure sont dans la carte de la séance (pas de carte Détails, 03/11).
  const hero = page.getByRole("region", { name: "Cette séance" });
  await expect(hero).toContainText("Mercredi 13 janvier");
  await expect(hero).toContainText("07:30");
  await expect(page.getByRole("region", { name: "Détails", exact: true })).toHaveCount(0);
  // Séance individuelle : le sportif sur une ligne dans la carte de la séance (03/11).
  await expect(
    page
      .getByRole("region", { name: "Cette séance" })
      .getByRole("link", { name: /Nadia El Amrani/ }),
  ).toBeVisible();
  await deleteOpenSession(page, title);
});

test("un nouveau sportif tapé dans « Nouvelle séance » a aussitôt sa fiche, signalée à compléter", async ({
  page,
}, testInfo) => {
  const title = `Découverte ${unique(testInfo)}`;
  // Un seul mot : un prénom, sans nom de famille ni contact (unique, les tests tournent en parallèle).
  // L'heure en chiffres sert aussi de marqueur au nettoyage de fin de suite (scripts/clean-test-data.sql).
  const name = `John${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda`);
  const dialog = await openNewSession(page);

  await dialog.getByLabel("Titre").fill(title);
  await chooseNewAthlete(dialog, name);
  await expect(dialog.getByRole("button", { name: /^Sportif :/ })).toHaveCount(0);
  await setWhen(dialog, "2027-01-20", "08:00", "08:45");
  await submitNewSession(dialog);
  await expect(
    page.getByText(`Séance créée. Fiche de ${name} ajoutée à tes sportifs, à compléter.`),
  ).toBeVisible();

  // Dans Sportifs : la fiche existe déjà, avec son repère « à compléter ».
  await page.goto(`/coach/o/${ORG_A}/sportifs`);
  const row = page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("listitem")
    .filter({ hasText: name });
  await expect(
    row.getByTitle("Fiche à compléter : nom de famille, e-mail ou téléphone"),
  ).toBeVisible();
  await row
    .getByRole("link", { name: new RegExp(name) })
    .first()
    .click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Fiche à compléter" }).click();
  await expect(page).toHaveURL(/onglet=profil/);

  // La séance est bien la sienne (vue du jour en grille : le bloc porte le nom du sportif).
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=jour&date=2027-01-20`);
  const session = page.getByRole("link", { name: new RegExp(title) });
  await expect(session).toContainText(name);
  await session.click();
  await expect(
    page
      .getByRole("region", { name: "Cette séance" })
      .getByRole("link", { name: new RegExp(name) }),
  ).toBeVisible();
  await deleteOpenSession(page, title);
});

// Une date de séance se marque « payée » (D-52) : un vrai paiement reçu, visible dans la
// Comptabilité, puis annulé. Chaque projet (ordinateur, téléphone) prend un lundi différent de la
// séance de démo « Coaching force » du lundi 7 h : ils tournent en parallèle.
const DAY_MS = 86_400_000;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const longDay = new Intl.DateTimeFormat("fr-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
function pastMonday(weeksBack: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(
    new Date(),
  );
  const day = Math.round(Date.parse(`${today}T00:00:00Z`) / DAY_MS);
  const monday = day - ((new Date(day * DAY_MS).getUTCDay() + 6) % 7);
  return new Date((monday - 7 * weeksBack) * DAY_MS).toISOString().slice(0, 10);
}

test("une date de séance se marque payée, compte dans la comptabilité, puis s'annule", async ({
  page,
}) => {
  const date = pastMonday(isPhone(page) ? 2 : 1);
  const dayText = longDay.format(new Date(`${date}T00:00:00Z`));
  const when = `${capitalize(dayText)} · 07:00`;
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda/seances/ca000000-0000-4000-8000-000000000201`);
  const price = page.getByRole("region", { name: "Prix et paiements" });
  // Par virement, sans TVA (séance de démonstration, D-163) : 65 € payés.
  await expect(price).toContainText(/65,00\s€ · Virement/);
  // Les dates à encaisser : sous « Voir plus » sur téléphone ; sur ordinateur, autant que la carte
  // en contient, « Toutes les dates » montrant les autres (03/11).
  const showPaymentDates = async () => {
    if (isPhone(page)) await price.getByRole("button", { name: "Voir plus" }).click();
    else await price.getByRole("button", { name: "Toutes les dates" }).click();
  };
  await showPaymentDates();
  const row = price.getByRole("listitem").filter({ hasText: when });
  await expect(row).toContainText("Pas encore payée");
  await row.getByRole("button", { name: `Marquer payée : ${when}` }).click();
  await expect(row).toContainText(/Payée le .* · 65,00\s€/);

  // Comptabilité : le paiement de cette date, en virement (le mode de la séance).
  await page.goto("/coach/comptabilite");
  // Les 5 derniers paiements s'affichent ; les autres derrière « Voir les N paiements » (D-130).
  const more = page.getByRole("button", { name: /^Voir les \d+ paiements$/ });
  if ((await more.count()) > 0) await more.click();
  const payment = page
    .getByRole("list", { name: "Liste des paiements" })
    .getByRole("listitem")
    .filter({ hasText: `Coaching force · ${dayText}` });
  await expect(payment).toContainText("Nadia El Amrani");
  await expect(payment).toContainText("Virement");
  await expect(payment).toContainText(/65,00\s€/);

  // Marquée par erreur : « Annuler » retire le paiement.
  await page.goto(`/coach/o/${ORG_A}/agenda/seances/ca000000-0000-4000-8000-000000000201`);
  await showPaymentDates();
  await row.getByRole("button", { name: `Annuler le paiement : ${when}` }).click();
  await expect(row).toContainText("Pas encore payée");
  // L'écran change avant la réponse du serveur (affichage optimiste) : on attend sa confirmation, sinon
  // la fin du test peut couper la demande et laisser le paiement (recette du 11/11).
  await expect(page.getByText("Paiement annulé.")).toBeVisible();
});

// TVA de la séance (D-163, demande d'Antonino du 11/11) : l'app calcule avec le taux choisi dans la
// séance, et le paiement noté en la marquant payée reprend ce taux. Titre en « Coaching force » : le
// test « À encaisser » (accounting.spec) laisse ces séances de côté.
test("une séance à 21 % : le prix HTVA plus la TVA, et le paiement garde ce taux", async ({
  page,
}, testInfo) => {
  test.skip(isPhone(page), "Crée une séance et un paiement de test : un seul projet.");
  const title = `Coaching force TVA ${unique(testInfo)}`;
  const date = pastMonday(2);
  const dayText = longDay.format(new Date(`${date}T00:00:00Z`));
  const when = `${capitalize(dayText)} · 06:00`;
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda?date=${date}`);
  const dialog = await openNewSession(page);
  await dialog.getByLabel("Titre").fill(title);
  await setWhen(dialog, date, "06:00", "07:00");
  await chooseAthlete(dialog, "Nadia El Amrani");
  await dialog.getByLabel(/^Prix de la séance/).fill("65");
  // Par virement : la TVA s'ajoute au prix (règle de Gianluca).
  await dialog.getByLabel(/^Appliquer la TVA/).check();
  await expect(dialog.getByLabel("Taux de TVA")).toHaveValue("21");
  await expect(dialog.getByLabel(/^TVA comprise dans le prix/)).not.toBeChecked();
  await expect(
    dialog.getByText(/65,00\s€ HTVA : le sportif paie 78,65\s€, TVA de 21 % comprise\./),
  ).toBeVisible();
  await submitNewSession(dialog);
  await expect(page.getByText("Séance créée.")).toBeVisible();

  await page.goto(`/coach/o/${ORG_A}/agenda?vue=jour&date=${date}`);
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  const price = page.getByRole("region", { name: "Prix et paiements" });
  await expect(price).toContainText(/65,00\s€ HTVA · 78,65\s€ TVAC \(21 %\)/);
  const row = price.getByRole("listitem").filter({ hasText: when });
  await row.getByRole("button", { name: `Marquer payée : ${when}` }).click();
  await expect(row).toContainText(/Payée le .* · 78,65\s€/);

  // Comptabilité : le paiement garde la TVA de la séance.
  await page.goto("/coach/comptabilite");
  const more = page.getByRole("button", { name: /^Voir les \d+ paiements$/ });
  if ((await more.count()) > 0) await more.click();
  const payment = page
    .getByRole("list", { name: "Liste des paiements" })
    .getByRole("listitem")
    .filter({ hasText: title });
  await expect(payment).toContainText(/65,00\s€ HTVA \(TVA 21 %\)/);
  await expect(payment).toContainText(/78,65\s€/);

  // Rangement : le paiement s'annule, puis la séance se supprime.
  await page.goto(`/coach/o/${ORG_A}/agenda?vue=jour&date=${date}`);
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await price
    .getByRole("listitem")
    .filter({ hasText: when })
    .getByRole("button", {
      name: `Annuler le paiement : ${when}`,
    })
    .click();
  await expect(price.getByRole("listitem").filter({ hasText: when })).toContainText(
    "Pas encore payée",
  );
  // Confirmation du serveur avant de supprimer la séance (le paiement resterait sinon).
  await expect(page.getByText("Paiement annulé.")).toBeVisible();
  await deleteOpenSession(page, title);
});

test("la vue Liste de l'Agenda montre les séances jour par jour, avec ses filtres (remplace la page Séances)", async ({
  page,
}) => {
  await loginAsCoachA(page);
  // « Voir tout » des Séances à venir du tableau de bord ouvre la vue Liste.
  await page
    .getByRole("region", { name: "Séances à venir" })
    .getByRole("link", { name: "Voir tout" })
    .click();
  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG_A}/agenda\\?vue=liste$`));
  const list = page.getByRole("region", { name: /^Séances du / });
  // « Piste du mercredi » (collective, chaque semaine, sans fin) est toujours dans les 4 semaines.
  await expect(list.getByRole("link", { name: /Piste du mercredi/ }).first()).toBeVisible();
  await setAgendaFilter(page, "Collectives", false);
  await expect(page).toHaveURL(/vue=liste&type=individuelles/);
  await expect(list.getByRole("link", { name: /Piste du mercredi/ })).toHaveCount(0);
  // L'ancienne page Séances n'existe plus, ni dans le menu.
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Séances", exact: true }),
  ).toHaveCount(0);
});

test("le coach A ne voit ni ne modifie de séance de l'organisation B", async ({ page }) => {
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/agenda/seances/${SESSION_OF_B}`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await page.goto(`/coach/o/${ORG_B}/agenda/seances/${SESSION_OF_B}/modifier`);
  await expect(page).toHaveURL(/\/acces-refuse$/);
});
