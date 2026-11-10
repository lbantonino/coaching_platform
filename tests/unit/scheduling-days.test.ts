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
  it("applique le jour d'une séance à toute la phase, sans toucher aux semaines passées", () => {
    const base = draft();
    const weeks = applySessionDay(
      base.weeks,
      [{ id: "p", name: "Base", weekFrom: 1, weekTo: 3 }],
      2,
      0,
      { day: "wed", time: "18:30", athleteCanMove: true },
      "phase",
      { startDate: base.startDate, today: "2000-01-01" },
    );
    const changed = weeks.filter((week) => week.sessions[0]?.fixedDay === "wed");
    expect(changed.map((week) => week.index)).toEqual(
      base.weeks.filter((week) => week.sessions.length > 0).map((week) => week.index),
    );
    expect(changed[0]?.sessions[0]).toMatchObject({ fixedTime: "18:30", athleteCanMove: true });
    expect(programDraftSchema.safeParse({ ...base, weeks }).success).toBe(true);
    // Semaine passée : le programme a commencé il y a longtemps, seule la semaine source change.
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
      past.filter((week) => week.sessions[0]?.fixedDay === "fri").map((week) => week.index),
    ).toEqual([2]);
    expect(applyWeekSchedule).toBeTypeOf("function");
  });
});
