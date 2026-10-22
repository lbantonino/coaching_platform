import type { Page } from "@playwright/test";

// Remplit prénom et nom de famille à partir d'un nom complet, coupé au premier espace
// (« Camille Test 123 » -> « Camille » + « Test 123 »). Le nom complet affiché reste identique.
export async function fillAthleteName(page: Page, fullName: string) {
  const [firstName, ...rest] = fullName.split(" ");
  await page.getByLabel("Prénom").fill(firstName);
  await page.getByLabel("Nom de famille").fill(rest.join(" "));
}
