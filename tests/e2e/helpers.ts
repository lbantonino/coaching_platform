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

// Ouvre un onglet de la fiche sportif (Vue d'ensemble, Profil, Objectifs, Disponibilités, Repères).
export async function openAthleteTab(page: Page, label: string) {
  const tab = page
    .getByRole("navigation", { name: "Sections de la fiche" })
    .getByRole("link", { name: label, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-current", "page");
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

export async function logoutCoach(page: Page) {
  await openCoachMenuIfNeeded(page);
  await page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }).click();
}

// Déconnexion du sportif : barre latérale sur ordinateur ; sur téléphone, onglet « Profil » de la
// barre du bas (comme dans le prototype).
export async function logoutAthlete(page: Page) {
  if (isPhone(page)) {
    await page
      .getByRole("navigation", { name: "Navigation du sportif" })
      .getByRole("link", { name: "Profil" })
      .click();
  }
  await page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }).click();
}
