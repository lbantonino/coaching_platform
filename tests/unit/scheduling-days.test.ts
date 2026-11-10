import { describe, expect, it } from "vitest";

import { programDraftSchema } from "@/domain/training/program-plan";
import {
  applySessionDay,
  applyWeekSchedule,
  setWeekFixed,
  setWeekOrdered,
} from "@/domain/training/scheduling";

import { draft } from "./fixtures/program-v2";

describe("jours fixes (03b)", () => {
  it("fixe les jours d'une semaine, puis revient à l'ordre", () => {
    const base = draft();
    const week = base.weeks[0]!;
    const keys = week.sessions.map((session) => session.key);
    const fixed = setWeekFixed(
      week,
      new Map([
        [keys[0]!, "tue"],
        [keys[1]!, "thu"],
      ]),
    );
    expect(fixed.scheduling).toBe("fixed");
    expect(fixed.sessions.map((session) => session.fixedDay)).toEqual(["tue", "thu"]);
    const plan = { ...base, weeks: [fixed, ...base.weeks.slice(1)] };
    expect(programDraftSchema.safeParse(plan).success).toBe(true);
    const ordered = setWeekOrdered(fixed);
    expect(ordered.sessions.every((session) => session.fixedDay === undefined)).toBe(true);
  });
  it("applique le jour à toute la phase ; une semaine sans la séance en reçoit une copie", () => {
    const base = draft();
    const source = base.weeks[1]!.sessions[0]!;
    const weeks = applySessionDay(
      base.weeks,
      [{ id: "p", name: "Base", weekFrom: 1, weekTo: 3 }],
      2,
      0,
      { day: "wed", time: "18:30", athleteCanMove: true },
      "phase",
      { startDate: base.startDate, today: "2000-01-01" },
    );
    // Chaque semaine a maintenant « la même séance » le mercredi (copiée là où elle manquait).
    for (const week of weeks) {
      const same = week.sessions.find((session) => session.title === source.title);
      expect(same).toMatchObject({ fixedDay: "wed", fixedTime: "18:30", athleteCanMove: true });
      expect(week.scheduling).toBe("fixed");
    }
    const keys = weeks.flatMap((week) => week.sessions.map((session) => session.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(programDraftSchema.safeParse({ ...base, weeks }).success).toBe(true);
  });
  it("ne touche ni aux semaines passées, ni à « sans jour » dans une semaine vide", () => {
    const base = draft();
    const past = applySessionDay(
      base.weeks,
      [],
      2,
      0,
      { day: "fri", athleteCanMove: false },
      "program",
      {
        startDate: base.startDate,
        today: "2100-01-01",
      },
    );
    expect(
      past
        .filter((week) => week.sessions.some((session) => session.fixedDay === "fri"))
        .map((week) => week.index),
    ).toEqual([2]);
    const empty = base.weeks.find((week) => week.sessions.length === 0);
    const noDay = applySessionDay(
      base.weeks,
      [],
      2,
      0,
      { day: null, athleteCanMove: false },
      "program",
    );
    expect(noDay.find((week) => week.index === empty?.index)?.sessions).toHaveLength(0);
  });
  it("retrouve la séance par son nom, même à une autre place (deux pas successifs)", () => {
    const base = draft();
    const empty = base.weeks.find((week) => week.sessions.length === 0)!;
    // 1er pas : la séance 2 de la semaine 1 le dimanche partout (copiée dans la semaine vide).
    const first = applySessionDay(
      base.weeks,
      [],
      1,
      1,
      { day: "sun", athleteCanMove: false },
      "program",
    );
    // 2e pas : la séance 1 de la semaine 1 le lundi partout : la semaine vide en reçoit une copie
    // au lieu de changer le jour de la copie précédente.
    const second = applySessionDay(
      first,
      [],
      1,
      0,
      { day: "mon", athleteCanMove: false },
      "program",
    );
    const filled = second.find((week) => week.index === empty.index)!;
    expect(filled.sessions.map((session) => session.fixedDay)).toEqual(["sun", "mon"]);
    expect(applyWeekSchedule).toBeTypeOf("function");
  });
});
