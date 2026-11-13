import { expect, test, type Page } from "@playwright/test";

import { FEATURES } from "../../src/config/features";
import { fillAthleteName, openAthleteTab } from "./helpers";

// Notifications du coach (D-37) : la cloche compte ce qui attend, la page le range en sections
// (compétitions des sportifs dans les 7 jours, messages non lus, tâches du jour ou en retard,
// séances à encaisser depuis plus d'une semaine (D-90), fiches à compléter), et chaque ligne mène là
// où on s'en occupe. Lignes stables du seed : la Remise en forme du mardi de Sophie, pas payée depuis
// trois semaines, et la fiche de Manon (prénom seul) ; les messages et les tâches bougent avec les
// autres tests.
async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("la cloche mène aux notifications, rangées en sections, et chaque ligne au bon endroit", async ({
  page,
}) => {
  await loginAsCoachA(page);
  // La cloche déplie l'aperçu (02/11) ; « Tout voir » ouvre la page.
  const bell = page.getByRole("button", { name: /^Notifications, \d+ à voir$/ });
  await expect(bell).toBeVisible();
  // Le menu de gauche (ordinateur) affiche le même nombre que la cloche.
  if ((page.viewportSize()?.width ?? 1280) >= 1024) {
    const count = (await bell.getAttribute("aria-label"))?.match(/\d+/)?.[0];
    await expect(
      page
        .getByRole("navigation", { name: "Navigation principale" })
        .getByRole("link", { name: new RegExp(`^Notifications\\s*, ${count} à voir$`) }),
    ).toBeVisible();
  }
  await bell.click();
  await page
    .getByRole("dialog", { name: /^Notifications/ })
    .getByRole("link", { name: "Tout voir" })
    .click();
  await expect(page).toHaveURL(/\/coach\/notifications$/);
  await expect(page.getByRole("heading", { name: "Notifications", level: 1 })).toBeVisible();

  for (const name of [
    "Compétitions dans les 7 jours",
    "Tâches du jour ou en retard",
    "Séances à encaisser",
    "Fiches à compléter",
  ]) {
    await expect(page.getByRole("region", { name })).toBeVisible();
  }
  // MVP espace coach seul (D-167) : pas de section « Messages non lus ».
  await expect(page.getByRole("region", { name: "Messages non lus" })).toHaveCount(0);
  // Chaque séance à encaisser ouvre sa page, sur la date à payer. La Remise en forme du mardi de
  // Sophie y est toujours ; d'autres dates la précèdent selon le temps écoulé depuis la dernière remise
  // à zéro de la base (la graine paie tout jusqu'à 8 jours avant) : on ne suppose pas sa place.
  const unpaid = page.getByRole("region", { name: "Séances à encaisser" });
  const tuesday = unpaid
    .getByRole("link", { name: /Sophie Lambert/ })
    .and(page.locator('a[href*="/agenda/seances/ca000000-0000-4000-8000-00000000020c?date="]'))
    .first();
  await expect(tuesday).toHaveAttribute(
    "href",
    /\/agenda\/seances\/ca000000-0000-4000-8000-00000000020c\?date=\d{4}-\d{2}-\d{2}$/,
  );

  await page
    .getByRole("region", { name: "Fiches à compléter" })
    .getByRole("link", { name: /Manon/ })
    .click();
  await expect(page).toHaveURL(/onglet=profil/);
  await expect(page.getByRole("heading", { name: "Manon", level: 1 })).toBeVisible();
});

test("une compétition d'un sportif dans les 7 jours devient un rappel dans les notifications", async ({
  page,
}, testInfo) => {
  // Sportif et compétition créés pour ce test (nom unique par exécution et par profil).
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `Rappel ${suffix}`;
  const competition = `Course ${suffix}`;
  // Dans 3 jours À BRUXELLES, comme l'app (en UTC, entre minuit et 1 h, la date de la veille donnait J-2).
  const inThreeDays = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(
    new Date(Date.now() + 3 * 86_400_000),
  );
  await loginAsCoachA(page);
  await page.goto("/coach/o/0a000000-0000-4000-8000-0000000000a1/sportifs/nouveau");
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Enregistrer le sportif" }).click();
  // Le sportif enregistré, on arrive sur sa fiche (D-54).
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await openAthleteTab(page, "Objectifs");
  await page.getByLabel("Type d'objectif", { exact: true }).selectOption({ label: "Course 10 km" });
  await page.getByLabel(/Date cible/).fill(inThreeDays);
  await page.getByLabel("C'est une compétition").check();
  await page.getByLabel("Nom de la compétition").fill(competition);
  await page.getByRole("button", { name: "Ajouter l'objectif" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Objectif ajouté." })).toBeVisible();

  // Rappel dans les notifications (J-3), qui mène à ses objectifs ; jamais dans l'agenda du coach.
  await page.goto("/coach/notifications");
  const reminders = page.getByRole("region", { name: "Compétitions dans les 7 jours" });
  // La ligne (kit « Coory Pages », 03) : le lien, puis le jour et « J-3 » à droite.
  await expect(reminders.getByRole("listitem").filter({ hasText: competition })).toContainText(
    "J-3",
  );
  await reminders.getByRole("link", { name: new RegExp(`${competition} · ${name}`) }).click();
  await expect(page).toHaveURL(/onglet=objectifs/);
});

test("la cloche déplie l'aperçu des notifications, rangé en sections, avec « Voir tout »", async ({
  page,
}) => {
  await loginAsCoachA(page);
  const bell = page.getByRole("button", { name: /^Notifications, \d+ à voir$/ });
  await bell.click();
  await expect(bell).toHaveAttribute("aria-expanded", "true");
  const popover = page.getByRole("dialog", { name: /^Notifications/ });
  // Les vraies données, en sections (les autres tests lisent des messages et cochent des tâches en
  // parallèle : on vérifie les sections qui ne bougent pas). Chaque section a son « Voir tout ».
  const unpaid = popover.getByRole("region", { name: "Séances à encaisser" });
  await expect(unpaid).toContainText("Sophie Lambert");
  await expect(
    unpaid.getByRole("link", { name: /^Voir toutes les séances à encaisser/ }),
  ).toHaveAttribute("href", "/coach/comptabilite?liste=a-encaisser");
  // Fiches à compléter : 3 au plus (les plus récentes, les autres tests en créent), puis « Voir tout ».
  const profiles = popover
    .getByRole("region", { name: "Fiches à compléter" })
    .getByText(/^À compléter :/);
  await expect(profiles.first()).toBeVisible();
  expect(await profiles.count()).toBeLessThanOrEqual(3);
  // Échap le ferme, la page n'a pas changé.
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
  await expect(page).toHaveURL(/\/coach$/);
  // « Voir toutes les fiches à compléter » : la liste des sportifs filtrée.
  await bell.click();
  await popover
    .getByRole("region", { name: "Fiches à compléter" })
    .getByRole("link", { name: /^Voir toutes les fiches à compléter/ })
    .click();
  await expect(page).toHaveURL(/\/sportifs\?fiche=a-completer$/);
  await expect(popover).toBeHidden();
  // « Voir toutes les séances à encaisser » : la Comptabilité, liste « À encaisser ».
  await bell.click();
  await popover
    .getByRole("region", { name: "Séances à encaisser" })
    .getByRole("link", { name: /^Voir toutes les séances à encaisser/ })
    .click();
  await expect(page).toHaveURL(/\/coach\/comptabilite\?liste=a-encaisser$/);
  await expect(
    page.getByRole("navigation", { name: "Liste affichée" }).getByRole("link", {
      name: /^À encaisser/,
    }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("list", { name: "Séances à encaisser" })).toContainText(
    "Sophie Lambert",
  );
});

test("Messages : le filtre « Non lues » ne garde que les conversations à lire", async ({
  page,
}) => {
  test.skip(!FEATURES.messages, "MVP espace coach seul (D-167) : messagerie masquée.");
  await loginAsCoachA(page);
  await page.goto("/coach/messages?filtre=non-lus");
  const filters = page.getByRole("navigation", { name: "Filtrer les conversations" });
  await expect(filters.getByRole("link", { name: /^Non lues/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // Chaque conversation affichée a des messages non lus.
  const rows = page.getByRole("region", { name: "Conversations" }).getByRole("listitem");
  for (const row of await rows.all()) await expect(row).toContainText(/non lu/);
  await filters.getByRole("link", { name: "Toutes" }).click();
  await expect(page).toHaveURL(/\/coach\/messages$/);
});
