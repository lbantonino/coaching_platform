import { expect, test, type Locator, type Page } from "@playwright/test";

// Agenda interactif (D-35) : un clic sur un créneau vide ouvre « Nouvelle séance » pré-remplie, une
// séance se déplace à la souris (ordinateur) ou par appui long (téléphone), et une séance
// hebdomadaire demande « seulement cette date » ou « toute la série ». Semaines de 2027, une par test
// et une heure par profil (les tests tournent en parallèle sur la même base) : rien ne dépend du jour
// où il tourne. Chaque séance créée est supprimée à la fin.
// Depuis D-78 (01/11), plus d'agenda sur le tableau de bord : ces gestes se testent sur la page Agenda.
const AGENDA = "/coach/o/0a000000-0000-4000-8000-0000000000a1/agenda";

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

// Position verticale de `hour` dans la colonne du jour : la plage visible (06:00 - 22:00 par défaut,
// D-77) est lue dans la grille elle-même, pas supposée.
async function hourOffset(page: Page, date: string, hour: number, height: number) {
  const day = column(page, date);
  const first = Number(await day.getAttribute("data-first-hour"));
  const span = Number(await day.getAttribute("data-span"));
  return ((hour - first) / span) * height;
}

// Clic sur le créneau `hour` du jour `dayLabel` (« Mercredi 3 février »), puis création d'une séance
// collective dans la fenêtre. Renvoie le bloc de la séance dans la grille.
async function createFromSlot(
  page: Page,
  options: { title: string; date: string; dayLabel: string; hour: number; weekly?: boolean },
): Promise<Locator> {
  const slot = page.getByRole("button", { name: `Ajouter une séance le ${options.dayLabel}` });
  const box = await slot.boundingBox();
  await slot.click({
    position: { x: 20, y: (await hourOffset(page, options.date, options.hour, box!.height)) + 3 },
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
// La séance au centre de la grille : près d'un bord, la tenir fait défiler la grille (voulu).
const centre = (block: Locator) =>
  block.evaluate((element) => element.scrollIntoView({ block: "center", inline: "nearest" }));

async function mouseDrag(page: Page, block: Locator, date: string, hour: number) {
  await centre(block);
  const from = (await block.boundingBox())!;
  const to = (await column(page, date).boundingBox())!;
  const start = { x: from.x + 15, y: from.y + 4 };
  const end = { x: to.x + 30, y: to.y + (await hourOffset(page, date, hour, to.height)) + 4 };
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
  await centre(block);
  const from = (await block.boundingBox())!;
  const to = (await column(page, date).boundingBox())!;
  const start = { x: from.x + 15, y: from.y + 4 };
  const end = { x: to.x + 30, y: to.y + (await hourOffset(page, date, hour, to.height)) + 4 };
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
  // Ordinateur : « ••• » puis « Supprimer » ; téléphone : « Supprimer la séance » en bas de page (02/11).
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "Supprimer la séance" }).click();
  } else {
    await page.getByRole("button", { name: "Plus d'actions" }).click();
    await page
      .getByRole("dialog", { name: title })
      .getByRole("button", { name: "Supprimer" })
      .click();
  }
  await page
    .getByRole("dialog", { name: "Supprimer cette séance ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page).toHaveURL(/\/agenda$/);
}

test("un clic sur un créneau vide crée une séance à ce jour et à cette heure, sans quitter l'agenda", async ({
  page,
}, testInfo) => {
  const title = `Créneau ${unique(testInfo)}`;
  const hour = testInfo.project.name === "telephone" ? 15 : 10;
  await loginAsCoachA(page);
  await page.goto(`${AGENDA}?date=2027-03-03`);
  const block = await createFromSlot(page, {
    title,
    date: "2027-03-03",
    dayLabel: "Mercredi 3 mars",
    hour,
  });
  await expect(page).toHaveURL(/\/agenda\?date=2027-03-03$/);

  await block.click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  // Séance unique : la date et l'heure dans la carte de la séance (03/11).
  const hero = page.getByRole("region", { name: "Cette séance" });
  await expect(hero).toContainText("Mercredi 3 mars");
  await expect(hero).toContainText(`${hour}:00`);
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
  await page.goto(`${AGENDA}?date=2027-03-10`);
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
  // Téléphone : la séance peut se trouver sous le bouton rond « + » ; on l'amène au centre.
  await moved.evaluate((element) => element.scrollIntoView({ block: "center", inline: "center" }));
  await moved.click();
  const hero = page.getByRole("region", { name: "Cette séance" });
  await expect(hero).toContainText(phone ? "Mercredi 10 mars" : "Jeudi 11 mars");
  await expect(hero).toContainText(phone ? "12:00" : "14:00");
  await deleteSession(page, title);
});

test("une séance hebdomadaire déplacée : seulement cette date, ou toute la série", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "ordinateur", "glissé à la souris, sur un seul profil");
  const title = `Série ${unique(testInfo)}`;
  await page.setViewportSize({ width: 1440, height: 1100 });
  await loginAsCoachA(page);
  await page.goto(`${AGENDA}?date=2027-02-03`);
  // 08:00 : une série chaque mercredi, sans fin, occuperait aussi les créneaux des autres tests du
  // fichier (mercredis 3 et 10 mars à 10:00), qui tournent en même temps.
  const block = await createFromSlot(page, {
    title,
    date: "2027-02-03",
    dayLabel: "Mercredi 3 février",
    hour: 8,
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
  await page.goto(`${AGENDA}?date=2027-02-10`);
  await expect(inDay("2027-02-10")).toBeVisible();

  // Toute la série, depuis le mercredi 10 : chaque vendredi à 11:00 (loin du bord haut de la zone
  // visible, où le défilement automatique décalerait la cible). La date déjà déplacée reste
  // au jeudi 4.
  await mouseDrag(page, inDay("2027-02-10"), "2027-02-12", 11);
  await menu.getByRole("button", { name: "Toute la série · chaque vendredi à 11:00" }).click();
  await expect(page.getByText("Séance déplacée.")).toBeVisible();
  await expect(inDay("2027-02-12")).toBeVisible();
  await expect(inDay("2027-02-10")).toHaveCount(0);
  await page.goto(`${AGENDA}?date=2027-02-03`);
  await expect(inDay("2027-02-04")).toBeVisible();
  await expect(inDay("2027-02-05")).toHaveCount(0);

  await inDay("2027-02-04").click();
  await expect(page.getByRole("region", { name: "Détails", exact: true })).toContainText(
    "Chaque vendredi à 11:00",
  );
  await deleteSession(page, title);
});

test("l'agenda défile d'un bloc, de minuit à minuit, et une séance se crée avant 06:00", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "ordinateur", "molette de la souris, sur un seul profil");
  await loginAsCoachA(page);
  await page.goto(`${AGENDA}?date=2027-03-03`);
  const grid = page.locator("[data-grid-scroll]");
  // Heure en haut de la zone visible : 06:00 à l'ouverture (réglage « Heures de l'agenda » par défaut).
  const topHour = () =>
    grid.evaluate((element) => {
      const day = element.querySelector<HTMLElement>("[data-gutter]")!;
      return Math.round(element.scrollTop / (day.offsetHeight / 24));
    });
  await expect.poll(topHour).toBe(6);

  // La molette sur le mercredi fait défiler toute la semaine, jusqu'à minuit.
  await column(page, "2027-03-03").hover({ position: { x: 30, y: 300 } });
  await page.mouse.wheel(0, -600);
  await expect.poll(topHour).toBe(0);

  // Un créneau à 02:00 s'ouvre à cette heure.
  const slot = page.getByRole("button", { name: "Ajouter une séance le Mercredi 3 mars" });
  const box = (await slot.boundingBox())!;
  await slot.click({
    position: { x: 30, y: (await hourOffset(page, "2027-03-03", 2, box.height)) + 3 },
  });
  const dialog = page.getByRole("dialog", { name: "Nouvelle séance" });
  await expect(dialog.getByLabel("Heure", { exact: true })).toHaveValue("02:00");
});

// Glissé horizontal du doigt (Chromium : événements tactiles du protocole DevTools), au milieu de
// l'agenda (ou de `target`).
async function swipe(page: Page, direction: "suivant" | "précédent", target?: Locator) {
  // L'agenda affiché (pas la copie cachée du chargement progressif), amené dans l'écran.
  const board =
    target ?? page.locator("[data-grid-scroll], ol.grid-cols-7").filter({ visible: true }).first();
  await expect(board).toBeVisible();
  await board.scrollIntoViewIfNeeded();
  const box = (await board.boundingBox())!;
  const y = Math.round(box.y + Math.min(box.height / 2, 200));
  // Dans la zone des jours (à droite de la marge des heures, 40 px).
  const [from, to] =
    direction === "suivant"
      ? [box.x + box.width - 20, box.x + 60]
      : [box.x + 60, box.x + box.width - 20];
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from, y }] });
  for (let step = 1; step <= 10; step += 1) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: from + ((to - from) * step) / 10, y }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test("téléphone : les jours défilent au doigt d'une semaine à l'autre sans recharger ; le mois change de page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "telephone", "geste tactile, sur téléphone");
  await loginAsCoachA(page);
  // Le premier jour visible de la grille (la zone des jours défile horizontalement, 01/11).
  const days = page.locator("[data-grid-x]");
  const firstDay = () =>
    days.evaluate(
      (element) =>
        [...element.querySelectorAll<HTMLElement>("[data-day-col]")].find(
          (column) => column.offsetLeft + column.offsetWidth / 2 > element.scrollLeft,
        )?.dataset.date ?? "",
    );

  // Jour : on glisse au jour suivant puis on revient, sans changer de page.
  await page.goto(`${AGENDA}?vue=jour&date=2027-03-03`);
  await expect.poll(firstDay).toBe("2027-03-03");
  await swipe(page, "suivant");
  await expect.poll(async () => (await firstDay()) > "2027-03-03").toBe(true);
  const after = await firstDay();
  await swipe(page, "précédent");
  await expect.poll(async () => (await firstDay()) < after).toBe(true);
  await expect(page).toHaveURL(/vue=jour&date=2027-03-03$/);

  // 3 jours : depuis le lundi, on passe à la semaine précédente en glissant, sans recharger.
  await page.goto(`${AGENDA}?date=2027-03-08`);
  await expect.poll(firstDay).toBe("2027-03-08");
  await swipe(page, "précédent");
  await expect.poll(async () => (await firstDay()) < "2027-03-08").toBe(true);
  await expect(page).toHaveURL(/agenda\?date=2027-03-08$/);
  // Au bout des 9 semaines chargées (4 avant, 4 après), un glissé de plus ouvre les précédentes.
  // (attendre la fin de l'élan du glissé précédent, qui déplacerait sinon la grille après coup)
  await page.waitForTimeout(1200);
  await days.evaluate((element) => element.scrollTo({ left: 0 }));
  await page.waitForTimeout(400);
  await expect.poll(() => days.evaluate((element) => element.scrollLeft)).toBe(0);
  await swipe(page, "précédent");
  // La vue est toujours écrite dans l'adresse (24/11 : sinon, celle retenue sur l'appareil reprendrait).
  await expect(page).toHaveURL(/agenda\?vue=semaine&date=2027-02-05$/);

  // Mois : le glissé ouvre le mois suivant.
  await page.goto(`${AGENDA}?vue=mois&date=2027-03-01`);
  await swipe(page, "suivant");
  await expect(page).toHaveURL(/vue=mois&date=2027-04-01/);
});

// Aujourd'hui à Bruxelles (AAAA-MM-JJ) et la veille : la vue 3 jours s'ouvre sur la veille.
const brussels = (offset = 0) => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(
    new Date(),
  );
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

test("téléphone : « Aujourd'hui » ramène à la date du jour, et le petit calendrier glisse d'un mois à l'autre", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "telephone", "feuille et gestes du téléphone");
  await loginAsCoachA(page);
  const days = page.locator("[data-grid-x]");
  const firstDay = () =>
    days.evaluate(
      (element) =>
        [...element.querySelectorAll<HTMLElement>("[data-day-col]")].find(
          (column) => column.offsetLeft + column.offsetWidth / 2 > element.scrollLeft,
        )?.dataset.date ?? "",
    );
  const today = async () => {
    await page.getByRole("button", { name: /Vue et filtres/ }).click();
    await page
      .getByRole("dialog", { name: "Vue et filtres" })
      .getByRole("link", { name: /Aujourd'hui/ })
      .click();
  };

  // Dans les semaines chargées : la grille glisse jusqu'à la veille (aujourd'hui au milieu), même page.
  const later = brussels(14);
  await page.goto(`${AGENDA}?date=${later}`);
  await expect.poll(firstDay).toBe(later);
  await today();
  await expect.poll(firstDay).toBe(brussels(-1));
  await expect(page).toHaveURL(new RegExp(`date=${later}$`));

  // Hors des semaines chargées : la vue se rouvre à la date du jour.
  await page.goto(`${AGENDA}?vue=jour&date=2027-06-15`);
  await expect.poll(firstDay).toBe("2027-06-15");
  await today();
  await expect(page).toHaveURL(/agenda\?vue=jour$/);
  await expect.poll(firstDay).toBe(brussels());

  // Le mois déplié : glisser le petit calendrier change de mois, sans ouvrir le jour touché.
  await page.goto(`${AGENDA}?vue=jour&date=2027-03-03`);
  await page.locator("[data-bar-title] button").click();
  const calendar = page.getByRole("group", { name: /^Calendrier, / });
  await expect(calendar).toHaveAccessibleName("Calendrier, mars 2027");
  await swipe(page, "suivant", calendar);
  await expect(calendar).toHaveAccessibleName("Calendrier, avril 2027");
  await swipe(page, "précédent", calendar);
  await swipe(page, "précédent", calendar);
  await expect(calendar).toHaveAccessibleName("Calendrier, février 2027");
  await expect(page).toHaveURL(/vue=jour&date=2027-03-03$/);
  // Les mois vont jusqu'à décembre dans quatre ans.
  await expect(
    page.getByText(String(Number(brussels().slice(0, 4)) + 4), { exact: true }).first(),
  ).toBeAttached();
});
