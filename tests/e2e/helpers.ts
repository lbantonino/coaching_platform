import { expect, type Page } from "@playwright/test";

// Remplit prénom et nom de famille à partir d'un nom complet, coupé au premier espace
// (« Camille Test 123 » -> « Camille » + « Test 123 »). Le nom complet affiché reste identique.
export async function fillAthleteName(page: Page, fullName: string) {
  const [firstName, ...rest] = fullName.split(" ");
  await page.getByLabel("Prénom").fill(firstName);
  await page.getByLabel("Nom de famille").fill(rest.join(" "));
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
// d'écran (seuil md de Tailwind) et on laisse Playwright attendre le bouton.
async function openCoachMenuIfNeeded(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  }
}

export async function goToCoachSection(page: Page, name: string) {
  await openCoachMenuIfNeeded(page);
  await page.getByRole("link", { name, exact: true }).filter({ visible: true }).click();
}

export async function logoutCoach(page: Page) {
  await openCoachMenuIfNeeded(page);
  await page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }).click();
}
