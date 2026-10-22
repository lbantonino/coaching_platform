import { expect, test, type Page } from "@playwright/test";

import { fillAthleteName, openAthleteTab } from "./helpers";

// Repères datés (P2-03) : allures, FC, charges ; historique ; correction d'une mesure erronée.
async function openNewAthleteProfile(page: Page, name: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByRole("link", { name: /Organisation Démo A/ }).click();
  await page.getByRole("link", { name: "Ajouter un sportif" }).click();
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
  await openAthleteTab(page, "Repères");
  await expect(page.getByRole("heading", { name: "Allures & repères" })).toBeVisible();
}

async function addMeasure(
  page: Page,
  kind: string,
  fill: (page: Page) => Promise<void>,
  date?: string,
) {
  await page.getByLabel("Type de repère").selectOption({ label: kind });
  await fill(page);
  if (date) await page.getByLabel("Date de la mesure").fill(date);
  await page.getByRole("button", { name: "Ajouter la mesure" }).click();
}

test("le coach enregistre des repères datés et conserve l'historique", async ({
  page,
}, testInfo) => {
  const name = `Repères ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await openNewAthleteProfile(page, name);
  const current = page.getByRole("list", { name: "Repères actuels" });
  const saved = page.getByRole("status").filter({ hasText: "Mesure ajoutée." });

  // Plage d'allure des PDF de référence.
  await addMeasure(page, "Endurance (zone 2)", (p) =>
    p.getByLabel("Allure (min/km)").fill("6:40-7:15"),
  );
  await expect(saved).toBeVisible();
  await expect(current.getByText("6:40–7:15 min/km")).toBeVisible();

  // Saisie ambiguë : erreur claire ET la saisie reste affichée pour être corrigée.
  await addMeasure(page, "Allure 5 km", (p) => p.getByLabel("Allure (min/km)").fill("4:5"));
  await expect(page.getByRole("alert").filter({ hasText: "4:05 ou 4:50" })).toBeVisible();
  await expect(page.getByLabel("Allure (min/km)")).toHaveValue("4:5");

  // Deux mesures datées du même repère : la plus récente fait foi, l'ancienne reste dans l'historique.
  await addMeasure(
    page,
    "Allure 5 km",
    (p) => p.getByLabel("Allure (min/km)").fill("4:55"),
    "2026-09-01",
  );
  await expect(saved).toBeVisible();
  await addMeasure(page, "Allure 5 km", (p) => p.getByLabel("Allure (min/km)").fill("4:45"));
  await expect(current.getByText("4:45 min/km")).toBeVisible();
  await expect(current.getByText("4:55 min/km")).toHaveCount(0);

  // FC et charge de référence.
  await addMeasure(page, "FC max", (p) => p.getByLabel("Fréquence cardiaque (bpm)").fill("192"));
  await expect(current.getByText("192 bpm")).toBeVisible();
  await addMeasure(page, "Charge de référence", async (p) => {
    await p.getByLabel("Exercice").fill("Squat");
    await p.getByLabel("Charge (kg)").fill("102,5");
    await p.getByLabel(/Répétitions/).fill("5");
  });
  await expect(current.getByText("102,5 kg × 5")).toBeVisible();

  // Historique : 5 mesures ; suppression d'une mesure erronée.
  await page.getByText("Historique et corrections (5 mesures)").click();
  const history = page.getByRole("list", { name: "Historique des repères" });
  await expect(history.getByRole("listitem")).toHaveCount(5);
  await history.getByRole("button", { name: /Supprimer la mesure FC max/ }).click();
  await expect(current.getByText("192 bpm")).toHaveCount(0);
  await expect(page.getByText("Historique et corrections (4 mesures)")).toBeVisible();
});

test("le graphique montre l'évolution d'un repère dès deux mesures", async ({ page }, testInfo) => {
  const name = `Courbe ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await openNewAthleteProfile(page, name);
  const evolution = page.getByRole("region", { name: "Évolution" });
  const squat = (load: string) => async (p: Page) => {
    await p.getByLabel("Exercice").fill("Squat");
    await p.getByLabel("Charge (kg)").fill(load);
  };

  // Une seule mesure : pas de courbe, une explication.
  await addMeasure(page, "Charge de référence", squat("100"), "2026-09-01");
  await expect(evolution.getByRole("status")).toContainText("au moins deux mesures");

  // Deux mesures à des dates différentes : la courbe apparaît avec le progrès en mots.
  await addMeasure(page, "Charge de référence", squat("110"));
  await expect(evolution.getByText("10 kg de plus depuis le 1 septembre 2026")).toBeVisible();

  // Au clavier : chaque mesure s'affiche, comme au survol.
  await evolution.getByRole("group", { name: /Évolution : Squat/ }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(evolution.getByText("1 septembre 2026 · Test")).toBeVisible();

  // Les valeurs restent lisibles sans graphique, dans un tableau.
  await evolution.getByText("Voir les valeurs en tableau").click();
  const table = evolution.getByRole("table", { name: "Mesures : Squat" });
  await expect(table.getByRole("row")).toHaveCount(3);
  await expect(table.getByRole("cell", { name: "100 kg" })).toBeVisible();
});

test("une erreur de saisie sur la fiche conserve les autres champs saisis", async ({
  page,
}, testInfo) => {
  const name = `Saisie ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await openNewAthleteProfile(page, name);
  await openAthleteTab(page, "Profil");

  await fillAthleteName(page, `${name} renommé`);
  await page.getByLabel("Téléphone").fill("appelle-moi");
  await page.getByLabel("Niveau").selectOption({ label: "Confirmé" });
  await page.getByText("Domicile", { exact: true }).click();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Numéro de téléphone invalide" }),
  ).toBeVisible();
  // Les listes déroulantes et les cases cochées gardent aussi la saisie.
  await expect(page.getByLabel("Niveau")).toHaveValue("advanced");
  await expect(page.getByLabel("Domicile")).toBeChecked();
  await expect(page.getByLabel("Prénom")).toHaveValue("Saisie");
  await expect(page.getByLabel("Nom de famille")).toHaveValue(
    `${name.slice("Saisie ".length)} renommé`,
  );
  await expect(page.getByLabel("Téléphone")).toHaveValue("appelle-moi");
});

test("le coach calcule les allures depuis un test de Cooper et valide avant enregistrement", async ({
  page,
}, testInfo) => {
  const name = `Cooper ${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await openNewAthleteProfile(page, name);
  const current = page.getByRole("list", { name: "Repères actuels" });

  await page.getByText("Calculer les allures depuis un test").click();

  // Test de 5 km mal saisi : erreur et enregistrement impossible.
  await page.getByText("5 km", { exact: true }).click();
  await page.getByLabel("Temps sur 5 km").fill("22:3");
  await expect(page.getByRole("alert").filter({ hasText: "Temps invalide" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enregistrer ces allures" })).toBeDisabled();

  // Cooper 3000 m : aperçu en direct (VMA 15 km/h).
  await page.getByText("Cooper (12 min)").click();
  await page.getByLabel("Distance parcourue en 12 min (m)").fill("3000");
  await expect(page.getByText("15 km/h", { exact: true })).toBeVisible();
  await expect(page.getByText("5:20–6:09 min/km")).toBeVisible();

  // Le coach décoche une zone, puis valide.
  await page.getByRole("checkbox", { name: /Allure marathon/ }).uncheck();
  await page.getByRole("button", { name: "Enregistrer ces allures" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Allures enregistrées" })).toBeVisible();

  // Le formulaire repart de zéro (pas de double enregistrement).
  await expect(page.getByLabel("Distance parcourue en 12 min (m)")).toHaveValue("");

  await expect(current.getByText("15 km/h")).toBeVisible();
  await expect(current.getByText("5:20–6:09 min/km")).toBeVisible();
  await expect(current.getByText("4:13 min/km")).toBeVisible();
  await expect(current.getByText("Allure marathon")).toHaveCount(0);

  // L'origine du calcul est tracée dans l'historique.
  await page.getByText(/Historique et corrections \(6 mesures\)/).click();
  await expect(
    page
      .getByRole("list", { name: "Historique des repères" })
      .getByText(/Test de Cooper : 3000 m en 12 min/)
      .first(),
  ).toBeVisible();
});
