import { expect, test, type Page } from "@playwright/test";

import { chooseAthleteFilter, fillAthleteName, goToCoachSection, isPhone } from "./helpers";

const DEMO_PASSWORD = "demo-coach-local";
// Identifiants fixes du seed (supabase/seed.sql).
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const ORG_B = "0b000000-0000-4000-8000-0000000000b1";

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("le coach ajoute un sportif depuis son espace et le retrouve dans la liste", async ({
  page,
}, testInfo) => {
  // Nom et e-mail uniques par exécution et par profil : les tests ne se gênent pas entre eux.
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `Camille Test ${suffix}`;
  const email = `camille-${suffix}@example.test`;

  await loginAsCoachA(page);
  await goToCoachSection(page, "Sportifs");
  await expect(page.getByRole("heading", { name: "Sportifs" })).toBeVisible();

  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nouveau sportif" })).toBeVisible();

  // Prénom manquant : erreur claire, rien n'est enregistré.
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Le prénom est obligatoire." }),
  ).toBeVisible();

  await fillAthleteName(page, name);
  await page.getByLabel(/Adresse e-mail/).fill(email);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();

  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG_A}/sportifs$`));
  const list = page.getByRole("list", { name: "Liste des sportifs" });
  await expect(list.getByText(name)).toBeVisible();
  // L'e-mail n'est plus affiché sur la ligne (prototype) : la recherche le retrouve.
  await page.getByLabel("Rechercher un sportif").fill(email);
  await page.getByLabel("Rechercher un sportif").press("Enter");
  await expect(list.getByText(name)).toBeVisible();

  // Même e-mail une seconde fois : refusé avec un message compréhensible.
  await page.getByRole("link", { name: "Nouveau sportif", exact: true }).click();
  await fillAthleteName(page, `${name} bis`);
  await page.getByLabel(/Adresse e-mail/).fill(email.toUpperCase());
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "utilise déjà cette adresse e-mail" }),
  ).toBeVisible();
});

test("le coach A ne peut pas ouvrir les sportifs de l'organisation B en changeant l'URL", async ({
  page,
}) => {
  await loginAsCoachA(page);

  await page.goto(`/coach/o/${ORG_B}/sportifs`);
  await expect(page).toHaveURL(/\/acces-refuse$/);

  await page.goto(`/coach/o/${ORG_B}/sportifs/nouveau`);
  await expect(page).toHaveURL(/\/acces-refuse$/);

  await page.goto("/coach/o/pas-un-identifiant/sportifs");
  await expect(page).toHaveURL(/\/acces-refuse$/);
});

test("la liste montre l'accès de chaque sportif par une icône, et se filtre par type de programme", async ({
  page,
}) => {
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/sportifs`);
  const list = page.getByRole("list", { name: "Liste des sportifs" });
  // Plus de libellés « Compte activé / Invitation en attente / Sans compte » (demande d'Antonino).
  await expect(list.getByText(/Compte activé|Invitation en attente|Sans compte/)).toHaveCount(0);

  // Thomas a activé son compte : on peut lui écrire, plus besoin de l'inviter. Téléphone (carte
  // compacte, 28/10) : l'icône « Écrire » et « Inviter » sont seulement dans le menu « ••• ».
  const phone = isPhone(page);
  const reachable = (link: ReturnType<Page["getByRole"]>) =>
    phone ? expect(link).toHaveCount(0) : expect(link).toBeVisible();
  const thomas = list.getByRole("listitem").filter({ hasText: "Thomas Peeters" });
  await reachable(thomas.getByRole("link", { name: "Écrire à Thomas Peeters" }));
  await expect(thomas.getByRole("link", { name: "Inviter Thomas Peeters" })).toHaveCount(0);
  // Inès et Nadia aussi (jeu de démo cohérent avec les Messages, demande d'Antonino du 24/10).
  for (const name of ["Inès Benali", "Nadia El Amrani"]) {
    const row = list.getByRole("listitem").filter({ hasText: name });
    await reachable(row.getByRole("link", { name: `Écrire à ${name}` }));
    await expect(row.getByRole("link", { name: `Inviter ${name}` })).toHaveCount(0);
  }
  // Lucas a une invitation en attente : l'icône le signale, pas d'icône message, « Inviter » reste.
  const lucas = list.getByRole("listitem").filter({ hasText: "Lucas Janssens" });
  await expect(lucas.getByText("Invitation envoyée")).toBeAttached();
  await expect(lucas.getByRole("link", { name: "Écrire à Lucas Janssens" })).toHaveCount(0);
  await reachable(lucas.getByRole("link", { name: "Inviter Lucas Janssens" }));

  // Menu « ••• » : toutes les actions de la ligne ; « Écrire » ou « Inviter » selon le compte.
  await thomas.getByRole("button", { name: "Actions pour Thomas Peeters" }).click();
  const actions = page.getByRole("dialog", { name: "Thomas Peeters" });
  for (const label of [
    "Changer le statut",
    "Changer le type de programme",
    "Modifier l'objectif",
    "Modifier la fiche",
    "Écrire un message",
  ]) {
    await expect(actions.getByRole("button", { name: label })).toBeVisible();
  }
  await expect(actions.getByRole("button", { name: "Inviter dans son espace" })).toHaveCount(0);
  await actions.getByRole("button", { name: "Changer le statut" }).click();
  const status = page.getByRole("dialog", { name: "Statut de Thomas Peeters" });
  await expect(status.getByRole("button", { name: "Actif" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  // Flèche de retour : on revient au menu « ••• » (demande d'Antonino), sans rien changer.
  await status.getByRole("button", { name: "Retour" }).click();
  await actions.getByRole("button", { name: "Changer le type de programme" }).click();
  const program = page.getByRole("dialog", { name: "Programme de Thomas Peeters" });
  await expect(program.getByRole("button", { name: "Running" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await program.getByRole("button", { name: "Retour" }).click();
  await expect(actions.getByRole("button", { name: "Modifier la fiche" })).toBeVisible();
  await actions.getByRole("button", { name: "Fermer" }).click();
  await lucas.getByRole("button", { name: "Actions pour Lucas Janssens" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Lucas Janssens" })
      .getByRole("button", { name: "Inviter dans son espace" }),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "Lucas Janssens" })
    .getByRole("button", { name: "Fermer" })
    .click();

  // Type de programme (D-40), indépendant de l'objectif : Lucas prépare un Hyrox en programme hybride.
  await chooseAthleteFilter(page, "Type de programme", "Hybride");
  await expect(page).toHaveURL(/discipline=hybride/);
  await expect(list.getByText("Lucas Janssens")).toBeVisible();
  await expect(list.getByText("Inès Benali")).toHaveCount(0);
});

test("le statut et le type de programme se changent d'un appui sur leur pastille, ou pour plusieurs sportifs", async ({
  page,
}, testInfo) => {
  // Sportif créé pour ce test (nom unique par exécution et par profil) : les tests ne se gênent pas.
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `Alex Statut ${suffix}`;
  await loginAsCoachA(page);
  await page.goto(`/coach/o/${ORG_A}/sportifs/nouveau`);
  await fillAthleteName(page, name);
  await page.getByRole("button", { name: "Ajouter le sportif" }).click();
  await expect(page).toHaveURL(new RegExp(`/coach/o/${ORG_A}/sportifs$`));

  await page.goto(`/coach/o/${ORG_A}/sportifs?q=${encodeURIComponent(suffix)}`);
  const row = page
    .getByRole("list", { name: "Liste des sportifs" })
    .getByRole("listitem")
    .filter({ hasText: name });

  // Ordinateur : la pastille ouvre le choix. Téléphone : les pastilles ne sont que des repères
  // (un appui sur la carte ouvre la fiche) ; on passe par « ••• » (demande d'Antonino du 26/10).
  const phone = isPhone(page);
  const openChoice = async (kind: "statut" | "type", pill: string) => {
    if (!phone) return row.getByRole("button", { name: pill }).click();
    await row.getByRole("button", { name: `Actions pour ${name}` }).click();
    await page
      .getByRole("dialog", { name })
      .getByRole("button", {
        name: kind === "statut" ? "Changer le statut" : "Changer le type de programme",
      })
      .click();
  };
  const shows = (label: string, pill: RegExp) =>
    phone
      ? row.getByText(label, { exact: true }).filter({ visible: true })
      : row.getByRole("button", { name: pill });

  // Statut : le choix s'ouvre, le statut en cours est coché.
  await openChoice("statut", `Statut : Actif. Changer le statut de ${name}`);
  const statusMenu = page.getByRole("dialog", { name: `Statut de ${name}` });
  await expect(statusMenu.getByRole("button", { name: "Actif" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await statusMenu.getByRole("button", { name: "En pause" }).click();
  await expect(page.getByText(`Statut de ${name} : en pause.`)).toBeVisible();
  await expect(shows("En pause", /^Statut : En pause/)).toBeVisible();

  // Type de programme : pas encore choisi, puis Hybride.
  await openChoice("type", `Choisir le programme de ${name}`);
  await page
    .getByRole("dialog", { name: `Programme de ${name}` })
    .getByRole("button", { name: "Hybride" })
    .click();
  await expect(page.getByText(`Programme de ${name} : Hybride.`)).toBeVisible();
  await expect(shows("Hybride", /^Programme : Hybride/)).toBeVisible();

  // Actions groupées : cocher le sportif fait apparaître la barre ; il passe en « Archivé ».
  await row.getByRole("checkbox", { name: `Sélectionner ${name}` }).check({ force: true });
  const bar = page.getByRole("region", { name: "Actions sur la sélection" });
  await expect(bar).toContainText("1 sélectionné");
  await bar.getByRole("button", { name: "Statut" }).click();
  await page
    .getByRole("dialog", { name: `Statut de ${name}` })
    .getByRole("button", { name: "Archivé" })
    .click();
  await expect(shows("Archivé", /^Statut : Archivé/)).toBeVisible();
  await page.reload();
  await expect(shows("Archivé", /^Statut : Archivé/)).toBeVisible();
  await expect(shows("Hybride", /^Programme : Hybride/)).toBeVisible();

  // Téléphone : un appui sur la carte (ici sur sa pastille de statut) ouvre la fiche.
  if (phone) {
    // Toucher à l'endroit de la pastille : c'est la carte (lien de la fiche) qui reçoit l'appui.
    const pill = await row
      .getByText("Archivé", { exact: true })
      .filter({ visible: true })
      .boundingBox();
    await page.mouse.click(pill!.x + pill!.width / 2, pill!.y + pill!.height / 2);
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  }
});
