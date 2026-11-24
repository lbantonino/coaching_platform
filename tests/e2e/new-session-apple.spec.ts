import { expect, test, type Page } from "@playwright/test";

import { isPhone } from "./helpers";
import {
  chooseAthlete,
  chooseNewAthlete,
  chooseRecurrence,
  setRepeatEnd,
  setWhen,
  submitNewSession,
} from "./new-session";

// « Nouvelle séance » façon Calendrier d'Apple (D-204, maquette validée le 24/11/2026). Ordinateur :
// bulle accrochée au créneau, séance provisoire dans la grille, menus du Mac, récurrence
// personnalisée. Téléphone : feuille façon iPhone, « Toutes les 2 semaines », séance sans titre =
// nom du sportif. Dates de 2027 (rien ne dépend du jour) ; titres et noms marqués pour le nettoyage.
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const AGENDA = `/coach/o/${ORG_A}/agenda`;

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

const column = (page: Page, date: string) => page.locator(`[data-drop-date="${date}"]`);

test("ordinateur : la bulle s'accroche au créneau, la grille suit la saisie et la récurrence personnalisée crée les bonnes dates", async ({
  page,
}, testInfo) => {
  test.skip(isPhone(page), "La bulle du Mac est celle de l'ordinateur.");
  const title = `Bulle ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await loginAsCoachA(page);
  await page.goto(`${AGENDA}?vue=semaine&date=2027-04-07`);

  // Clic sur le mercredi 7 avril à 11:00 (plage visible lue dans la grille).
  const day = column(page, "2027-04-07");
  const first = Number(await day.getAttribute("data-first-hour"));
  const span = Number(await day.getAttribute("data-span"));
  const slot = page.getByRole("button", { name: "Ajouter une séance le Mercredi 7 avril" });
  await slot.scrollIntoViewIfNeeded();
  const box = (await slot.boundingBox())!;
  await slot.click({ position: { x: 20, y: ((11 - first) / span) * box.height + 3 } });

  const dialog = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(dialog.getByLabel("Heure de début")).toHaveValue("11:00");
  // La bulle est à côté du créneau, pas centrée ; la séance provisoire est posée dans la grille.
  const bubble = (await dialog.boundingBox())!;
  expect(bubble.x >= box.x + box.width - 1 || bubble.x + bubble.width <= box.x + 1).toBe(true);
  await expect(day.getByText("Nouvelle séance", { exact: true })).toBeVisible();
  await dialog.getByLabel("Titre").fill(title);
  await expect(day.getByText(title, { exact: true })).toBeVisible();

  // Personnalisé : chaque semaine, le mercredi ET le jeudi, jusqu'au 15 avril.
  await dialog.getByRole("button", { name: /^Récurrence :/ }).click();
  await dialog.getByRole("menuitemradio", { name: "Personnalisé…" }).click();
  await dialog.getByRole("button", { name: "jeudi" }).click();
  await expect(dialog).toContainText("La séance aura lieu chaque semaine le mercredi et le jeudi.");
  await dialog.getByRole("button", { name: "Retour" }).click();
  await expect(dialog.getByRole("button", { name: "Récurrence : Personnalisé" })).toBeVisible();
  await dialog.getByRole("button", { name: /^Fin de la répétition :/ }).click();
  await dialog.getByRole("menuitemradio", { name: "À une date" }).click();
  await dialog.getByLabel("Date de fin de la répétition").fill("2027-04-15");
  // Séance individuelle : le sportif se choisit dans le menu, et son nom sert de titre par défaut.
  await chooseAthlete(dialog, "Nadia El Amrani");
  await expect(dialog.getByLabel("Titre")).toHaveValue(title);
  await dialog.getByLabel("Titre").fill("");
  await expect(dialog.getByLabel("Titre")).toHaveAttribute("placeholder", "Nadia El Amrani");
  await dialog.getByLabel("Titre").fill(title);
  // Collective (le mois nomme ses séances par leur titre) : un inscrit, coché dans la bulle.
  await dialog.getByRole("radio", { name: "Collective" }).click();
  await dialog.getByRole("button", { name: "Thomas Peeters" }).click();
  await expect(dialog.getByRole("group", { name: "Sportifs inscrits : 1 inscrit" })).toBeVisible();
  await submitNewSession(dialog);
  await expect(page.getByText("Séance créée.")).toBeVisible();
  await expect(dialog).toBeHidden();

  // Avril 2027 : les mercredis 7 et 14, les jeudis 8 et 15.
  await page.goto(`${AGENDA}?vue=mois&date=2027-04-01`);
  const month = page.getByRole("region", { name: "Avril 2027" });
  await expect(month.getByRole("link", { name: new RegExp(title) })).toHaveCount(4);
});

test("téléphone : feuille façon iPhone, toutes les 2 semaines, et sans titre la séance prend le nom du sportif", async ({
  page,
}) => {
  test.skip(!isPhone(page), "La feuille façon iPhone est celle du téléphone.");
  // Un seul mot : le prénom ; les chiffres marquent la donnée pour le nettoyage de fin de suite.
  const name = `Essai${Date.now()}`;
  await loginAsCoachA(page);
  await page.goto(`${AGENDA}?vue=semaine&date=2027-05-05`);
  await page.getByRole("button", { name: "Nouvelle séance" }).filter({ visible: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nouvelle séance" });

  await setWhen(dialog, "2027-05-05", "06:30", "07:15");
  await expect(dialog.getByText("Durée : 45 min")).toBeVisible();
  await chooseRecurrence(dialog, "Toutes les 2 semaines");
  await setRepeatEnd(dialog, "2027-06-02");
  await expect(dialog).toContainText(/toutes les 2 semaines le mercredi/i);
  await chooseNewAthlete(dialog, name);
  // Sans titre : le nom du sportif (montré en exemple dans le champ).
  await expect(dialog.getByLabel("Titre")).toHaveAttribute("placeholder", name);
  await submitNewSession(dialog);
  await expect(
    page.getByText(`Séance créée. Fiche de ${name} ajoutée à tes sportifs, à compléter.`),
  ).toBeVisible();

  // Mai 2027 : le 5 et le 19, pas le 12 ni le 26 ; puis le 2 juin (fin de la répétition). La case
  // d'un jour nomme ses séances (« 5 : 1 séance · Essai… »).
  await page.goto(`${AGENDA}?vue=mois&date=2027-05-01`);
  const may = page.getByRole("region", { name: "Mai 2027" });
  const dayWith = (day: number) =>
    may.getByRole("link", { name: new RegExp(`^${day} : .*${name}`) });
  await expect(dayWith(5)).toHaveCount(1);
  await expect(dayWith(19)).toHaveCount(1);
  await expect(dayWith(12)).toHaveCount(0);
  await expect(dayWith(26)).toHaveCount(0);
  await expect(may.getByRole("link", { name: new RegExp(`^2 : .*${name}`) })).toHaveCount(1);
});

test("« Jour entier » : sans heure, dans la rangée du haut de la grille, et « Toute la journée » sur sa page", async ({
  page,
}, testInfo) => {
  const title = `Stage ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const date = isPhone(page) ? "2027-06-12" : "2027-06-19";
  await loginAsCoachA(page);
  await page.goto(`${AGENDA}?vue=semaine&date=${date}`);
  await page.getByRole("button", { name: "Nouvelle séance" }).filter({ visible: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nouvelle séance" });
  await dialog.getByRole("radio", { name: "Collective" }).click();
  await dialog.getByLabel("Titre").fill(title);
  await dialog.getByLabel("Date de début").fill(date);
  await dialog.getByRole("switch", { name: "Jour entier" }).click();
  await expect(dialog.getByLabel("Heure de début")).toHaveCount(0);
  await expect(dialog.getByLabel("Heure de fin")).toHaveCount(0);
  await submitNewSession(dialog);
  await expect(page.getByText("Séance créée.")).toBeVisible();
  await expect(dialog).toBeHidden();

  // La rangée « Jour entier », au-dessus des heures ; pas de bloc dans la colonne des heures.
  await expect(column(page, date).getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
  await page
    .getByRole("link", { name: new RegExp(title) })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Cette séance" }).getByText("Toute la journée"),
  ).toBeVisible();
});
