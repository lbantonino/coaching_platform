import { describe, expect, it } from "vitest";

import {
  addPhase,
  addSession,
  addWeek,
  blankSession,
  duplicateSession,
  duplicateWeekTo,
  findSession,
  moveSession,
  moveSessionTo,
  phaseRangeBounds,
  renamePhase,
  setPhaseRange,
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

describe("séance vide et façon de viser du programme (BR-12)", () => {
  it("Running en zones de FC : la première étape vise la Z2 ; à l'allure : sans cible", () => {
    const hr = blankSession("running", { running: "hr", strength: "kg" });
    const first = hr.content.discipline === "running" ? hr.content.items[0] : undefined;
    expect(first?.kind === "step" ? first.target : null).toEqual({ kind: "hr", zone: 2 });
    const pace = blankSession("running", { running: "pace", strength: "kg" });
    const step = pace.content.discipline === "running" ? pace.content.items[0] : undefined;
    expect(step?.kind === "step" ? step.target : "absent").toBeUndefined();
  });
  it("Musculation en % du max : l'exercice part en % (70 %)", () => {
    const pct = blankSession("strength", { running: "pace", strength: "pct" });
    const exercise = pct.content.discipline === "strength" ? pct.content.items[0] : undefined;
    expect(exercise?.kind === "exercise" ? [exercise.loadMode, exercise.sets[0]?.pct] : []).toEqual(
      ["pct", 70],
    );
  });
});

// 12 semaines, sans séance : assez pour les phases de TC-05.
const twelve = () =>
  draft({
    phases: [],
    weeks: Array.from({ length: 12 }, (_, i) => ({
      index: i + 1,
      light: false,
      scheduling: "ordered" as const,
      sessions: [],
    })),
  });

describe("phases : semaines d'une phase (TC-05)", () => {
  it("TC-05 : créer une phase S5–9, la renommer, la supprimer ; les semaines restent", () => {
    const base = { ...twelve(), phases: [{ id: "a", name: "Base", weekFrom: 1, weekTo: 4 }] };
    const added = addPhase(base, "Spécifique");
    const id = added.phases[1]?.id ?? "";
    expect(added.phases[1]).toMatchObject({ weekFrom: 5, weekTo: 12 });
    const ranged = setPhaseRange(added, id, 5, 9);
    expect(ranged.phases[1]).toMatchObject({ name: "Spécifique", weekFrom: 5, weekTo: 9 });
    const renamed = renamePhase(ranged, id, "Bloc 2");
    expect(renamed.phases[1]?.name).toBe("Bloc 2");
    const removed = removePhase(renamed, id);
    expect(removed.phases).toEqual([{ id: "a", name: "Base", weekFrom: 1, weekTo: 4 }]);
    expect(removed.weeks).toHaveLength(12);
    expect(programDraftSchema.safeParse(removed).success).toBe(true);
  });
  it("déplacer une limite déplace celle de la phase voisine, qui garde au moins une semaine", () => {
    const three = {
      ...twelve(),
      phases: [
        { id: "a", name: "Base", weekFrom: 1, weekTo: 4 },
        { id: "b", name: "Spécifique", weekFrom: 5, weekTo: 8 },
        { id: "c", name: "Affûtage", weekFrom: 9, weekTo: 12 },
      ],
    };
    expect(phaseRangeBounds(three, "b")).toEqual({ minFrom: 2, maxTo: 11 });
    expect(setPhaseRange(three, "b", 3, 10).phases).toEqual([
      { id: "a", name: "Base", weekFrom: 1, weekTo: 2 },
      { id: "b", name: "Spécifique", weekFrom: 3, weekTo: 10 },
      { id: "c", name: "Affûtage", weekFrom: 11, weekTo: 12 },
    ]);
    // Au-delà des bornes : ramené dans les bornes.
    expect(setPhaseRange(three, "b", 1, 12).phases.map((p) => [p.weekFrom, p.weekTo])).toEqual([
      [1, 1],
      [2, 11],
      [12, 12],
    ]);
    expect(programDraftSchema.safeParse(setPhaseRange(three, "b", 3, 10)).success).toBe(true);
  });
});

describe("séances : glisser une séance (EDT-F06)", () => {
  it("déplace la séance d'une place à une autre ; hors limites, rien ne bouge", () => {
    const plan = draft();
    const moved = moveSessionTo(plan, 1, 0, 1);
    expect(moved.weeks[0]?.sessions.map((s) => s.key)).toEqual(["w1-hyr", "w1-run"]);
    expect(moveSessionTo(plan, 1, 0, 5)).toBe(plan);
    expect(moveSessionTo(plan, 1, 1, 1)).toBe(plan);
  });
});
