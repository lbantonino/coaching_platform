import { expect, type Page } from "@playwright/test";

// Remplit prénom et nom de famille à partir d'un nom complet, coupé au premier espace
// (« Camille Test 123 » -> « Camille » + « Test 123 »). Le nom complet affiché reste identique.
// Par le rôle « champ de texte » : seul le vrai champ répond, pas un autre élément de la page (ou de
// la page précédente, gardée cachée par Next) dont le nom contiendrait aussi ces mots.
export async function fillAthleteName(page: Page, fullName: string) {
  const [firstName, ...rest] = fullName.split(" ");
  await page.getByRole("textbox", { name: /^Prénom/ }).fill(firstName);
  await page.getByRole("textbox", { name: /^Nom de famille/ }).fill(rest.join(" "));
}

// Onglets de la fiche sportif (maquette du 03/11/2026) : une barre sur ordinateur ; sur téléphone, un
// sélecteur « Vue d'ensemble 1 / 10 » qui déplie les onglets.
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function expectAthleteTab(page: Page, label: string) {
  if (isPhone(page)) {
    await expect(
      page.getByRole("button", {
        name: new RegExp(`^Section de la fiche : ${escapeRegExp(label)},`),
      }),
    ).toBeVisible();
    return;
  }
  await expect(
    page
      .getByRole("navigation", { name: "Sections de la fiche" })
      .getByRole("link", { name: label, exact: true }),
  ).toHaveAttribute("aria-current", "page");
}

// Ouvre un onglet de la fiche sportif (Vue d'ensemble, Profil, Objectifs, Disponibilités, Repères…).
export async function openAthleteTab(page: Page, label: string) {
  if (isPhone(page)) {
    await page.getByRole("button", { name: /^Section de la fiche : / }).click();
  }
  await page
    .getByRole("navigation", { name: "Sections de la fiche" })
    .getByRole("link", { name: label, exact: true })
    .click();
  await expectAthleteTab(page, label);
}

// Navigation de l'espace coach : barre latérale sur ordinateur, menu hamburger sur téléphone.
// Le bouton du menu s'affiche avec la session (derrière Suspense) : on décide d'après la largeur
// d'écran (seuil lg de Tailwind, 1024 px, prompt Claude Design §1) et on laisse Playwright attendre.
function isPhone(page: Page) {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

async function openCoachMenuIfNeeded(page: Page) {
  if (isPhone(page)) {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  }
}

export async function goToCoachSection(page: Page, name: string) {
  await openCoachMenuIfNeeded(page);
  // Dans la navigation seulement : les pages ont aussi des liens du même nom (« Agenda » d'une carte).
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name, exact: true })
    .filter({ visible: true })
    .click();
}

// « Se déconnecter » est dans le menu du compte, en bas du menu de gauche (D-38).
async function logoutFromSettingsMenu(page: Page) {
  await page
    .getByRole("button", { name: /^Menu du compte/ })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("group", { name: "Menu du compte" })
    .getByRole("button", { name: "Se déconnecter" })
    .click();
}

export async function logoutCoach(page: Page) {
  await openCoachMenuIfNeeded(page);
  await logoutFromSettingsMenu(page);
}

// Déconnexion du sportif : menu du compte de la barre latérale sur ordinateur ; sur téléphone, onglet
// « Profil » de la barre du bas (comme dans le prototype).
export async function logoutAthlete(page: Page) {
  if (!isPhone(page)) return logoutFromSettingsMenu(page);
  await page
    .getByRole("navigation", { name: "Navigation du sportif" })
    .getByRole("link", { name: "Profil" })
    .click();
  await page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }).click();
}

// Filtres de la liste des sportifs (maquette du 03/11/2026) : menus déroulants « Statut » et
// « Programme » (bouton « Statut : Tous (18) »), sur ordinateur comme sur téléphone.
export async function chooseAthleteFilter(
  page: Page,
  group: "Statut" | "Programme",
  label: string,
) {
  // « Programme : Tous » (le menu), pas « Programme : Hyrox. Changer le programme de … » (une ligne).
  await page.getByRole("button", { name: new RegExp(`^${group} : [^.]+$`) }).click();
  await page
    .getByRole("listbox", { name: group })
    .getByRole("option", { name: new RegExp(`^${label}`) })
    .click();
}

// Page Agenda façon Google Agenda (D-78). Ordinateur : « Semaine ▾ » au centre de la barre ouvre le
// menu des vues. Téléphone : « 3 jours ▾ » ouvre la feuille « Vue et filtres ».
export async function chooseAgendaView(
  page: Page,
  label: "Jour" | "3 jours" | "Semaine" | "Mois" | "Liste",
) {
  await page.getByRole("button", { name: /^Vue : / }).click();
  if (isPhone(page)) {
    await page
      .getByRole("dialog", { name: "Vue et filtres" })
      .getByRole("link", { name: label, exact: true })
      .click();
    return;
  }
  await page
    .getByRole("menu", { name: "Vue de l'agenda" })
    .getByRole("menuitemradio", { name: new RegExp(`^${label}`) })
    .click();
}

// Cases « Individuelles » / « Collectives » de l'Agenda : dans le panneau (ordinateur), dans la
// feuille « Vue et filtres » (téléphone, qui se referme ensuite).
export async function setAgendaFilter(
  page: Page,
  label: "Individuelles" | "Collectives",
  checked: boolean,
) {
  const scope = isPhone(page)
    ? (await page.getByRole("button", { name: /^Vue : / }).click(),
      page.getByRole("dialog", { name: "Vue et filtres" }))
    : page.getByRole("complementary", { name: "Agenda : navigation et filtres" });
  const box = scope.getByRole("checkbox", { name: label });
  if (checked) await box.check();
  else await box.uncheck();
}

export { isPhone };
