import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, openAthleteTab } from "./helpers";

// Notifications du coach (D-37) : la cloche compte ce qui attend, la page le range en sections
// (compétitions des sportifs dans les 7 jours, messages non lus, tâches du jour ou en retard,
// factures en retard, fiches à compléter), et chaque
// ligne mène là où on s'en occupe. Lignes stables du seed : la facture en retard de Sophie et la
// fiche de Manon (prénom seul) ; les messages et les tâches bougent avec les autres tests.
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
    "Messages non lus",
    "Tâches du jour ou en retard",
    "Factures en retard",
    "Fiches à compléter",
  ]) {
    await expect(page.getByRole("region", { name })).toBeVisible();
  }
  const invoices = page.getByRole("region", { name: "Factures en retard" });
  await expect(invoices.getByRole("link", { name: /Sophie Lambert/ })).toHaveAttribute(
    "href",
    "/coach/facturation",
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
  const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
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
  const row = reminders.getByRole("link", { name: new RegExp(`${competition} · ${name}`) });
  await expect(row).toContainText("J-3");
  await row.click();
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
  const invoices = popover.getByRole("region", { name: "Factures en retard" });
  await expect(invoices).toContainText("Sophie Lambert");
  await expect(
    invoices.getByRole("link", { name: /^Voir toutes les factures en retard/ }),
  ).toHaveAttribute("href", "/coach/facturation?statut=en-retard");
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
  // « Voir toutes les factures en retard » : la Facturation, filtre « En retard ».
  await bell.click();
  await popover
    .getByRole("region", { name: "Factures en retard" })
    .getByRole("link", { name: /^Voir toutes les factures en retard/ })
    .click();
  await expect(page).toHaveURL(/\/coach\/facturation\?statut=en-retard/);
  const filters = page.getByRole("navigation", { name: "Filtrer les factures" });
  await expect(filters.getByRole("link", { name: /^En retard/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.getByRole("list", { name: "Liste des factures" })).toContainText(
    "Sophie Lambert",
  );
});

test("Messages : le filtre « Non lues » ne garde que les conversations à lire", async ({
  page,
}) => {
  await loginAsCoachA(page);
  await page.goto("/coach/messages?filtre=non-lus");
  const filters = page.getByRole("navigation", { name: "Filtrer les conversations" });
  await expect(filters.getByRole("link", { name: /^Non lues/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  // Chaque conversation affichée a des messages non lus.
  const rows = page.getByRole("region", { name: "Conversations" }).getByRole("listitem");
  for (const row of await rows.all()) await expect(row).toContainText(/non lu/);
  await filters.getByRole("link", { name: "Toutes" }).click();
  await expect(page).toHaveURL(/\/coach\/messages$/);
});
