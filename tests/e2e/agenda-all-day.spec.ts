import { spawnSync } from "node:child_process";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { isPhone } from "./helpers";

// Séances « Jour entier » qu'on glisse d'un jour à l'autre dans leur rangée (D-208). Séances posées en
// SQL (base locale), titres marqués pour le nettoyage ; semaines d'août 2027 (rien ne dépend du jour).
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";
const AGENDA = `/coach/o/${ORG_A}/agenda`;

async function loginAsCoachA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

function sql(query: string): string {
  const result = spawnSync(
    "docker",
    ["exec", "-i", "supabase_db_coaching-platform", "psql", "-U", "postgres", "-tA", "-q"],
    { input: query, encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

function allDaySession(title: string, date: string, weekly = false): string {
  return sql(`
    insert into public.coach_sessions
      (organization_id, kind, title, starts_on, start_time, duration_minutes, all_day, repeats_weekly, created_by)
    select '${ORG_A}', 'group', '${title}', '${date}', '00:00', 60, true, ${weekly}, id
    from auth.users where email = 'coach-a@example.test'
    returning id;`);
}

const cell = (page: Page, date: string) => page.locator(`[data-all-day-date="${date}"]`);

// Glisser à la souris, du milieu de la puce au milieu de la case visée.
async function drag(page: Page, chip: Locator, to: Locator) {
  const from = (await chip.boundingBox())!;
  const target = (await to.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(
      from.x +
        from.width / 2 +
        ((target.x + target.width / 2 - from.x - from.width / 2) * step) / 12,
      from.y +
        from.height / 2 +
        ((target.y + target.height / 2 - from.y - from.height / 2) * step) / 12,
    );
  }
  await page.mouse.up();
}

test("une séance « Jour entier » se glisse d'un jour à l'autre dans sa rangée", async ({
  page,
}, testInfo) => {
  test.skip(isPhone(page), "Glissé à la souris : ordinateur.");
  const title = `Stage ${testInfo.project.name}-${Date.now()}`;
  const id = allDaySession(title, "2027-08-04");
  try {
    await loginAsCoachA(page);
    await page.goto(`${AGENDA}?vue=semaine&date=2027-08-04`);
    const chip = cell(page, "2027-08-04").getByRole("link", { name: new RegExp(title) });
    await expect(chip).toBeVisible();
    await drag(page, chip, cell(page, "2027-08-06"));
    await expect(page.getByText("Séance déplacée.")).toBeVisible();
    await expect(
      cell(page, "2027-08-06").getByRole("link", { name: new RegExp(title) }),
    ).toBeVisible();
    await expect(
      cell(page, "2027-08-04").getByRole("link", { name: new RegExp(title) }),
    ).toHaveCount(0);
    expect(
      sql(`select starts_on || ' ' || start_time from public.coach_sessions where id = '${id}';`),
    ).toBe("2027-08-06 00:00:00");
  } finally {
    sql(`delete from public.coach_sessions where id = '${id}';`);
  }
});

test("une série « Jour entier » demande : seulement cette date, ou toute la série, toute la journée", async ({
  page,
}, testInfo) => {
  test.skip(isPhone(page), "Glissé à la souris : ordinateur.");
  const title = `Stage série ${testInfo.project.name}-${Date.now()}`;
  const id = allDaySession(title, "2027-08-11", true);
  try {
    await loginAsCoachA(page);
    await page.goto(`${AGENDA}?vue=semaine&date=2027-08-11`);
    const chip = cell(page, "2027-08-11").getByRole("link", { name: new RegExp(title) });
    await drag(page, chip, cell(page, "2027-08-12"));
    const menu = page.getByRole("dialog", { name: `Déplacer « ${title} »` });
    await expect(
      menu.getByRole("button", { name: "Toute la série · chaque jeudi, toute la journée" }),
    ).toBeVisible();
    await menu.getByRole("button", { name: /^Seulement le / }).click();
    await expect(page.getByText("Séance déplacée.")).toBeVisible();
    await expect(
      cell(page, "2027-08-12").getByRole("link", { name: new RegExp(title) }),
    ).toBeVisible();
  } finally {
    sql(`delete from public.coach_sessions where id = '${id}';`);
  }
});
