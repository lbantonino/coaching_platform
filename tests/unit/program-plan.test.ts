import { describe, expect, it } from "vitest";

import {
  planFromDraft,
  programDraftSchema,
  programPlanSchema,
} from "@/domain/training/program-plan";
import { sessionDraftSchema } from "@/domain/training/session-v2";

import { draft, hyroxSession, runningSession, strengthSession } from "./fixtures/program-v2";

const EXERCISE = "8a5f1c3e-3a4b-5c6d-8e9f-0a1b2c3d4e5f";

describe("schéma d'une séance v2", () => {
  it("accepte les trois éditeurs : Running, Musculation, Hyrox", () => {
    expect(sessionDraftSchema.safeParse(runningSession()).success).toBe(true);
    expect(sessionDraftSchema.safeParse(strengthSession(EXERCISE)).success).toBe(true);
    expect(sessionDraftSchema.safeParse(hyroxSession()).success).toBe(true);
  });
  it("refuse une plage d'allure à l'envers et une zone de FC inconnue", () => {
    const backwards = runningSession();
    const first =
      backwards.content.discipline === "running" ? backwards.content.items[0] : undefined;
    if (first?.kind === "step") first.target = { kind: "pace", fromSecPerKm: 400, toSecPerKm: 300 };
    expect(sessionDraftSchema.safeParse(backwards).success).toBe(false);

    const zone = runningSession();
    const last = zone.content.discipline === "running" ? zone.content.items[2] : undefined;
    if (last?.kind === "step") last.target = { kind: "hr", zone: 6 };
    expect(sessionDraftSchema.safeParse(zone).success).toBe(false);
  });
  it("en % du max, chaque série normale a son % ; en kg, aucun %", () => {
    const session = strengthSession(EXERCISE);
    const exercise =
      session.content.discipline === "strength" ? session.content.items[0] : undefined;
    if (exercise?.kind === "exercise") exercise.loadMode = "kg";
    expect(sessionDraftSchema.safeParse(session).success).toBe(false);
  });
  it("une séance hybride n'accepte que des blocs texte (éditeur non dessiné)", () => {
    const hybrid = {
      ...runningSession(),
      content: { ...runningSession().content, discipline: "hybrid" },
    };
    expect(sessionDraftSchema.safeParse(hybrid).success).toBe(false);
  });
});

describe("schéma du brouillon d'un programme", () => {
  it("accepte un brouillon complet (phases, semaines, objectif)", () => {
    expect(programDraftSchema.safeParse(draft()).success).toBe(true);
  });
  it("un programme commence un lundi (C-9)", () => {
    expect(programDraftSchema.safeParse(draft({ startDate: "2026-10-28" })).success).toBe(false);
  });
  it("refuse des phases qui se chevauchent ou laissent un trou (BR-17)", () => {
    const overlap = draft({
      phases: [
        { id: "p1", name: "Base", weekFrom: 1, weekTo: 2 },
        { id: "p2", name: "Spécifique", weekFrom: 2, weekTo: 3 },
      ],
    });
    expect(programDraftSchema.safeParse(overlap).success).toBe(false);
    const gap = draft({
      phases: [
        { id: "p1", name: "Base", weekFrom: 1, weekTo: 1 },
        { id: "p2", name: "Spécifique", weekFrom: 3, weekTo: 3 },
      ],
    });
    expect(programDraftSchema.safeParse(gap).success).toBe(false);
  });
  it("refuse un jour fixe dans une semaine « dans l'ordre » et une séance en double", () => {
    const base = draft();
    const fixedInOrdered = draft({
      weeks: base.weeks.map((week, i) =>
        i === 1
          ? { ...week, sessions: [runningSession({ key: "w2-run", fixedDay: "tue" })] }
          : week,
      ),
    });
    expect(programDraftSchema.safeParse(fixedInOrdered).success).toBe(false);
    const duplicate = draft({
      weeks: base.weeks.map((week, i) =>
        i === 1 ? { ...week, sessions: [runningSession({ key: "w1-run" })] } : week,
      ),
    });
    expect(programDraftSchema.safeParse(duplicate).success).toBe(false);
  });
});

describe("planFromDraft (enregistrer comme modèle)", () => {
  it("garde le plan, sans dates, sans objectif ni rendez-vous du coach", () => {
    const withCoach = draft();
    const first = withCoach.weeks[0]?.sessions[0];
    if (first)
      first.withCoach = {
        coachSessionId: "ca000000-0000-4000-8000-000000000002",
        date: "2026-10-27",
      };
    const plan = planFromDraft(withCoach);
    const parsed = programPlanSchema.parse(JSON.parse(JSON.stringify(plan)));
    expect(parsed).not.toHaveProperty("startDate");
    expect(parsed).not.toHaveProperty("goal");
    expect(parsed.weeks[0]?.sessions[0]?.withCoach).toBeUndefined();
    expect(parsed.weeks).toHaveLength(3);
  });
});
