import { expect, type Locator } from "@playwright/test";

// Fenêtre « Nouvelle séance » façon Calendrier d'Apple (D-204) : les gestes des tests, au même endroit.
// Feuille du téléphone (et fenêtre centrée de l'ordinateur) : ✕ « Annuler », ✓ « Créer la séance » ;
// bulle accrochée au créneau de l'agenda (ordinateur) : « Ajouter ». Les listes (récurrence, sportif,
// discipline) s'ouvrent dans la fenêtre, comme sur l'iPhone, et se referment au choix.

// Début, puis fin (la durée suit) : « 2027-01-06 », « 19:00 », « 20:30 ».
export async function setWhen(dialog: Locator, date: string, start: string, end: string) {
  await dialog.getByLabel("Date de début").fill(date);
  await dialog.getByLabel("Heure de début").fill(start);
  await dialog.getByLabel("Heure de fin").fill(end);
}

// « Chaque semaine », « Toutes les 2 semaines »…
export async function chooseRecurrence(dialog: Locator, label: string) {
  await dialog.getByRole("button", { name: /^Récurrence :/ }).click();
  await dialog
    .getByRole("menu", { name: "Récurrence" })
    .getByRole("menuitemradio", { name: label, exact: true })
    .click();
  await expect(dialog.getByRole("button", { name: `Récurrence : ${label}` })).toBeVisible();
}

export async function setRepeatEnd(dialog: Locator, date: string) {
  await dialog.getByRole("button", { name: /^Fin de la répétition :/ }).click();
  await dialog.getByLabel("Date de fin de la répétition").fill(date);
  await dialog.getByRole("button", { name: "Retour" }).click();
}

export async function chooseAthlete(dialog: Locator, name: string) {
  await dialog.getByRole("button", { name: /^Sportif :/ }).click();
  await dialog
    .getByRole("menu", { name: "Sportif" })
    .getByRole("menuitemradio", { name, exact: true })
    .click();
  await expect(dialog.getByRole("button", { name: `Sportif : ${name}` })).toBeVisible();
}

export async function chooseNewAthlete(dialog: Locator, name: string) {
  await dialog.getByRole("button", { name: /^Sportif :/ }).click();
  await dialog
    .getByRole("menu", { name: "Sportif" })
    .getByRole("menuitemradio", { name: "Nouveau sportif" })
    .click();
  await dialog.getByLabel("Nom du nouveau sportif").fill(name);
}

export async function enrollAthletes(dialog: Locator, names: string[]) {
  await dialog.getByRole("button", { name: /^Sportifs inscrits :/ }).click();
  const list = dialog.getByRole("menu", { name: "Sportifs inscrits" });
  for (const name of names) {
    await list.getByRole("menuitemcheckbox", { name, exact: true }).click();
  }
  await dialog.getByRole("button", { name: "OK", exact: true }).click();
}

export async function chooseDiscipline(dialog: Locator, label: string) {
  await dialog.getByRole("button", { name: /^Discipline :/ }).click();
  await dialog
    .getByRole("menu", { name: "Discipline" })
    .getByRole("menuitemradio", { name: label, exact: true })
    .click();
}

// ✓ de la feuille ou « Ajouter » de la bulle.
export async function submitNewSession(dialog: Locator) {
  await dialog.getByRole("button", { name: /^(Créer la séance|Ajouter)$/ }).click();
}

// Alerte (D-205) : « 15 min avant », « Le jour même (09:00) »…
export async function chooseAlert(dialog: Locator, label: string) {
  await dialog.getByRole("button", { name: /^Alerte :/ }).click();
  await dialog
    .getByRole("menu", { name: "Alerte" })
    .getByRole("menuitemradio", { name: label, exact: true })
    .click();
  await expect(dialog.getByRole("button", { name: `Alerte : ${label}` })).toBeVisible();
}
