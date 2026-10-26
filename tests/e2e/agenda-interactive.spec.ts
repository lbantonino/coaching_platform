import { expect, test, type Locator, type Page } from "@playwright/test";

// Agenda interactif (D-35) : un clic sur un créneau vide ouvre « Nouvelle séance » pré-remplie, une
// séance se déplace à la souris (ordinateur) ou par appui long (téléphone), et une séance
// hebdomadaire demande « seulement cette date » ou « toute la série ». Semaines de 2027, une par test
// et une heure par profil (les tests tournent en parallèle sur la même base) : rien ne dépend du jour
// où il tourne. Chaque séance créée est supprimée à la fin.
const FIRST_HOUR = 6; // grille 06:00 - 22:00 de ces semaines (seed)
const SPAN = 16;

const unique = (testInfo: { project: { name: string } }) =>
  `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

const column = (page: Page, date: string) => page.locator(`[data-drop-date="${date}"]`);

// Clic sur le créneau `hour` du jour `dayLabel` (« Mercredi 3 février »), puis création d'une séance
// collective dans la fenêtre. Renvoie le bloc de la séance dans la grille.
async function createFromSlot(
  page: Page,
  options: { title: string; date: string; dayLabel: string; hour: number; weekly?: boolean },
): Promise<Locator> {
  const slot = page.getByRole("button", { name: `Ajouter une séance le ${options.dayLabel}` });
  const box = await slot.boundingBox();
  await slot.click({
    position: { x: 20, y: ((options.hour - FIRST_HOUR) / SPAN) * box!.height + 3 },
  });
  const dialog = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Heure", { exact: true })).toHaveValue(
    `${String(options.hour).padStart(2, "0")}:00`,
  );
  await expect(dialog.getByLabel(/Première séance|^Date$/)).toHaveValue(options.date);
  // Individuelle est proposée d'abord (D-35) ; ces tests créent une séance collective.
  await expect(dialog.getByRole("radio", { name: "Individuelle" })).toBeChecked();
  await dialog.getByText("Collective", { exact: true }).click();
  await dialog.getByLabel("Titre").fill(options.title);
  if (options.weekly) await dialog.getByLabel(/Chaque semaine/).check();
  await dialog.getByRole("button", { name: "Créer la séance" }).click();
  await expect(page.getByText("Séance créée.")).toBeVisible();
  await expect(dialog).toBeHidden();
  const block = column(page, options.date).getByRole("link", { name: new RegExp(options.title) });
  await expect(block).toBeVisible();
  return block;
}

// Glisser à la souris : le haut du bloc arrive à `hour` dans la colonne du jour `date`.
async function mouseDrag(page: Page, block: Locator, date: string, hour: number) {
  const from = (await block.boundingBox())!;
  const to = (await column(page, date).boundingBox())!;
  const start = { x: from.x + 15, y: from.y + 4 };
  const end = { x: to.x + 30, y: to.y + ((hour - FIRST_HOUR) / SPAN) * to.height + 4 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let step = 1; step <= 15; step += 1) {
    await page.mouse.move(
      start.x + ((end.x - start.x) * step) / 15,
      start.y + ((end.y - start.y) * step) / 15,
    );
  }
  await page.mouse.up();
}

// Appui long puis glissé au doigt (Chromium : événements tactiles du protocole DevTools).
async function touchDrag(page: Page, block: Locator, date: string, hour: number) {
  const from = (await block.boundingBox())!;
  const to = (await column(page, date).boundingBox())!;
  const start = { x: from.x + 15, y: from.y + 4 };
  const end = { x: to.x + 30, y: to.y + ((hour - FIRST_HOUR) / SPAN) * to.height + 4 };
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", point?: { x: number; y: number }) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: point ? [point] : [] });
  await touch("touchStart", start);
  await page.waitForTimeout(700); // appui long : la séance se soulève
  for (let step = 1; step <= 12; step += 1) {
    await touch("touchMove", {
      x: start.x + ((end.x - start.x) * step) / 12,
      y: start.y + ((end.y - start.y) * step) / 12,
    });
  }
  await touch("touchEnd");
}

async function deleteSession(page: Page, title: string) {
  await page.getByRole("button", { name: "Plus d'actions" }).click();
  await page
    .getByRole("dialog", { name: title })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page
    .getByRole("dialog", { name: "Supprimer cette séance ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page).toHaveURL(/\/agenda$/);
}

test("un clic sur un créneau vide crée une séance à ce jour et à cette heure, sans quitter le tableau de bord", async ({
  page,
}, testInfo) => {
  const title = `Créneau ${unique(testInfo)}`;
  const hour = testInfo.project.name === "telephone" ? 15 : 10;
  await loginAsCoachA(page);
  await page.goto("/coach?date=2027-03-03");
  const block = await createFromSlot(page, {
    title,
    date: "2027-03-03",
    dayLabel: "Mercredi 3 mars",
    hour,
  });
  await expect(page).toHaveURL(/\/coach\?date=2027-03-03$/);

  await block.click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Détails", exact: true })).toContainText(
    `Le 3 mars 2027 à ${hour}:00 · 1 h`,
  );
  await deleteSession(page, title);
});

test("une séance se déplace à la souris, ou au doigt après un appui long", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "telephone";
  const title = `Glissée ${unique(testInfo)}`;
  // Ordinateur : un écran assez haut pour voir toute la grille. Téléphone : son propre écran.
  if (!phone) await page.setViewportSize({ width: 1440, height: 1100 });
  await loginAsCoachA(page);
  await page.goto("/coach?date=2027-03-10");
  const block = await createFromSlot(page, {
    title,
    date: "2027-03-10",
    dayLabel: "Mercredi 10 mars",
    hour: phone ? 15 : 10,
  });

  // Ordinateur : vers le jeudi 11 à 14:00. Téléphone : le même jour à 12:00 (colonne visible).
  const target = phone ? "2027-03-10" : "2027-03-11";
  await page
    .locator("#agenda-title")
    .evaluate((title) => title.closest("section")?.scrollIntoView({ block: "start" }));
  if (phone) await touchDrag(page, block, target, 12);
  else await mouseDrag(page, block, target, 14);
  await expect(page.getByText("Séance déplacée.")).toBeVisible();

  const moved = column(page, target).getByRole("link", { name: new RegExp(title) });
  await expect(moved).toBeVisible();
  await moved.click();
  await expect(page.getByRole("region", { name: "Détails", exact: true })).toContainText(
    phone ? "Le 10 mars 2027 à 12:00" : "Le 11 mars 2027 à 14:00",
  );
  await deleteSession(page, title);
});

test("une séance hebdomadaire déplacée : seulement cette date, ou toute la série", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "ordinateur", "glissé à la souris, sur un seul profil");
  const title = `Série ${unique(testInfo)}`;
  await page.setViewportSize({ width: 1440, height: 1100 });
  await loginAsCoachA(page);
  await page.goto("/coach?date=2027-02-03");
  const block = await createFromSlot(page, {
    title,
    date: "2027-02-03",
    dayLabel: "Mercredi 3 février",
    hour: 10,
    weekly: true,
  });
  const inDay = (date: string) => column(page, date).getByRole("link", { name: new RegExp(title) });

  // Seulement le mercredi 3 : il passe au jeudi 4 à 14:00 ; le mercredi 10 ne bouge pas.
  await mouseDrag(page, block, "2027-02-04", 14);
  const menu = page.getByRole("dialog", { name: `Déplacer « ${title} »` });
  await menu.getByRole("button", { name: "Seulement le mercredi 3 février" }).click();
  await expect(page.getByText("Séance déplacée.")).toBeVisible();
  await expect(inDay("2027-02-04")).toBeVisible();
  await expect(inDay("2027-02-03")).toHaveCount(0);
  await page.goto("/coach?date=2027-02-10");
  await expect(inDay("2027-02-10")).toBeVisible();

  // Toute la série, depuis le mercredi 10 : chaque vendredi à 11:00 (loin du bord haut de la zone
  // visible, où le défilement automatique décalerait la cible). La date déjà déplacée reste
  // au jeudi 4.
  await mouseDrag(page, inDay("2027-02-10"), "2027-02-12", 11);
  await menu.getByRole("button", { name: "Toute la série · chaque vendredi à 11:00" }).click();
  await expect(page.getByText("Séance déplacée.")).toBeVisible();
  await expect(inDay("2027-02-12")).toBeVisible();
  await expect(inDay("2027-02-10")).toHaveCount(0);
  await page.goto("/coach?date=2027-02-03");
  await expect(inDay("2027-02-04")).toBeVisible();
  await expect(inDay("2027-02-05")).toHaveCount(0);

  await inDay("2027-02-04").click();
  await expect(page.getByRole("region", { name: "Détails", exact: true })).toContainText(
    "Chaque vendredi à 11:00",
  );
  await deleteSession(page, title);
});
