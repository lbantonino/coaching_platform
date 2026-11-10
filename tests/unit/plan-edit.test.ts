import { describe, expect, it } from "vitest";

import {
  addPhase,
  addSession,
  addWeek,
  duplicateSession,
  duplicateWeekTo,
  findSession,
  moveSession,
  removePhase,
  removeSession,
  removeWeek,
  sessionKeys,
} from "@/domain/training/plan-edit";
import { programDraftSchema } from "@/domain/training/program-plan";

import { draft, runningSession } from "./fixtures/program-v2";

describe("opérations de l'éditeur sur les semaines", () => {
  it("ajoute une semaine vide à la fin, avec l'organisation de la précédente", () => {
    const plan = addWeek(draft());
    expect(plan.weeks).toHaveLength(4);
    expect(plan.weeks[3]).toEqual({ index: 4, light: false, scheduling: "ordered", sessions: [] });
  });
  it("retire une semaine : les suivantes remontent, les phases suivent", () => {
    const plan = removeWeek(draft(), 1);
    expect(plan.weeks.map((week) => week.index)).toEqual([1, 2]);
    expect(plan.phases).toEqual([
      { id: "p1", name: "Base", weekFrom: 1, weekTo: 1 },
      { id: "p2", name: "Spécifique", weekFrom: 2, weekTo: 2 },
    ]);
    expect(programDraftSchema.safeParse(plan).success).toBe(true);
  });
  it("duplique une semaine vers d'autres, avec de nouvelles clés", () => {
    const plan = duplicateWeekTo(draft(), 1, [2, 3]);
    expect(plan.weeks[2]?.sessions.map((s) => s.title)).toEqual([
      "Endurance rapide",
      "Circuit Hyrox",
    ]);
    expect(sessionKeys(plan).size).toBe(6);
    expect(programDraftSchema.safeParse(plan).success).toBe(true);
  });
});

describe("opérations de l'éditeur sur les séances", () => {
  it("ajoute, déplace, duplique et retire une séance", () => {
    const { plan: added, key } = addSession(draft(), 3, runningSession());
    expect(added.weeks[2]?.sessions).toHaveLength(1);
    expect(key).not.toBe("s-run");
    const moved = moveSession(draft(), 1, "w1-hyr", -1);
    expect(moved.weeks[0]?.sessions.map((s) => s.key)).toEqual(["w1-hyr", "w1-run"]);
    expect(moveSession(draft(), 1, "w1-run", -1)).toEqual(draft());
    const { plan: copied, key: copy } = duplicateSession(draft(), 1, "w1-run");
    expect(copied.weeks[0]?.sessions.map((s) => s.key)).toEqual(["w1-run", copy, "w1-hyr"]);
    expect(removeSession(draft(), 1, "w1-hyr").weeks[0]?.sessions).toHaveLength(1);
    expect(findSession(draft(), "w2-run")?.week.index).toBe(2);
  });
  it("une copie de séance ne garde pas le rendez-vous du coach", () => {
    const base = draft();
    const first = base.weeks[0]?.sessions[0];
    if (first)
      first.withCoach = {
        coachSessionId: "ca000000-0000-4000-8000-000000000002",
        date: "2026-10-31",
      };
    const { plan, key } = duplicateSession(base, 1, "w1-run");
    expect(plan.weeks[0]?.sessions.find((s) => s.key === key)?.withCoach).toBeUndefined();
  });
});

describe("opérations de l'éditeur sur les phases", () => {
  it("ajoute une phase après la dernière, jusqu'à la fin du programme", () => {
    const plan = addPhase(
      { ...draft(), phases: [{ id: "p1", name: "Base", weekFrom: 1, weekTo: 1 }] },
      "Spécifique",
    );
    expect(plan.phases[1]).toMatchObject({ name: "Spécifique", weekFrom: 2, weekTo: 3 });
    expect(addPhase(draft(), "Affûtage")).toEqual(draft());
  });
  it("retirer une phase garde les phases contiguës", () => {
    const three = {
      ...draft(),
      phases: [
        { id: "a", name: "Base", weekFrom: 1, weekTo: 1 },
        { id: "b", name: "Spécifique", weekFrom: 2, weekTo: 2 },
        { id: "c", name: "Affûtage", weekFrom: 3, weekTo: 3 },
      ],
    };
    const plan = removePhase(three, "b");
    expect(plan.phases).toEqual([
      { id: "a", name: "Base", weekFrom: 1, weekTo: 2 },
      { id: "c", name: "Affûtage", weekFrom: 3, weekTo: 3 },
    ]);
    expect(programDraftSchema.safeParse(plan).success).toBe(true);
  });
});
