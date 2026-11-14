import { describe, expect, it } from "vitest";

import { oneRepMax } from "@/domain/training/aims";
import { fichesPdf } from "@/domain/training/pdf-fiches";
import {
  addSession,
  blankSession,
  duplicateSession,
  duplicateWeekTo,
} from "@/domain/training/plan-edit";
import { programDraftSchema, type Week } from "@/domain/training/program-plan";
import { validateForPublish, type PublishContext } from "@/domain/training/program-publication";
import { parseProgramSession } from "@/domain/training/program-session";
import {
  defaultWeekIndex,
  firstFreeMonday,
  periodsOverlap,
  programTiming,
} from "@/domain/training/program-status";
import {
  draftFromPublication,
  resizePlan,
  sessionsPerWeekFor,
} from "@/domain/training/program-upgrade";
import type { PublishedSession, SessionDraft } from "@/domain/training/session-v2";
import { quickFill } from "@/domain/training/strength-edit";
import { findCoachMeeting, meetingResolver } from "@/features/agenda/coach-meeting";
import { createProgramInputSchema } from "@/features/programs/schemas";

import { draft, hyroxSession, runningSession, strengthSession } from "./fixtures/program-v2";
import { demoProgram } from "./pdf-fixtures";

// Revue MVP du 13/11 : les règles corrigées (C1, C2, C5, C6, C12, C14, C15, C23, C24, B1 à B5),
// testées une par une.

const COACH = "ca000000-0000-4000-8000-000000000206";
const EXERCISE = "8a5f1c3e-3a4b-5c6d-8e9f-0a1b2c3d4e5f";
// La séance telle que figée dans une publication (la clé n'y est pas : elle va dans sa ligne).
const published = (session: SessionDraft): PublishedSession => {
  const rest: Partial<SessionDraft> = { ...session };
  delete rest.key;
  return { schemaVersion: 2, ...(rest as Omit<SessionDraft, "key">) };
};

describe("C1 : jusqu'à 14 séances par semaine dès la création", () => {
  const input = {
    athleteId: "ab000000-0000-4000-8000-000000000001",
    title: "Prépa double séance",
    discipline: "running",
    aimDefaults: { running: "pace", strength: "kg" },
    startDate: "2026-11-16",
    weeksCount: 8,
    phases: [],
    scheduling: "fixed",
    start: { kind: "blank" },
  } as const;
  it("accepte un programme à 10 séances par semaine (D-164)", () => {
    expect(createProgramInputSchema.safeParse({ ...input, sessionsPerWeek: 10 }).success).toBe(
      true,
    );
  });
  it("refuse au-delà de 14", () => {
    expect(createProgramInputSchema.safeParse({ ...input, sessionsPerWeek: 15 }).success).toBe(
      false,
    );
  });
  // D-177 : un modèle Coory hybride (course et musculation) donne un programme « Hybride ».
  it("accepte un programme hybride", () => {
    expect(
      createProgramInputSchema.safeParse({ ...input, sessionsPerWeek: 4, discipline: "hybrid" })
        .success,
    ).toBe(true);
  });
});

describe("C2 : une séance v2 publiée n'est jamais écartée par les plafonds de la v1", () => {
  it("échauffement de 250 caractères", () => {
    const session = strengthSession(EXERCISE, {
      content: {
        discipline: "strength",
        warmup: "Mobilité ".repeat(28).trim().slice(0, 250),
        items: [
          {
            id: "x1",
            kind: "exercise",
            name: "Back squat",
            loadMode: "kg",
            sets: [{ type: "normal", repsMin: 5, kg: 60 }],
          },
        ],
      },
    });
    expect(session.content.discipline === "strength" && session.content.warmup?.length).toBe(250);
    expect(parseProgramSession(published(session))).not.toBeNull();
  });
  it("11 exercices avec une consigne (22 lignes dans une étape)", () => {
    const session = strengthSession(EXERCISE, {
      content: {
        discipline: "strength",
        items: Array.from({ length: 11 }, (_, i) => ({
          id: `x${i}`,
          kind: "exercise" as const,
          name: `Exercice ${i + 1}`,
          loadMode: "kg" as const,
          sets: [{ type: "normal" as const, repsMin: 10 }],
          cue: "Dos droit, gainage serré",
        })),
      },
    });
    const display = parseProgramSession(published(session));
    expect(display).not.toBeNull();
    expect(display?.steps[0]?.lines).toHaveLength(22);
  });
  it("course de 31 étapes", () => {
    const session = runningSession({
      content: {
        discipline: "running",
        items: Array.from({ length: 31 }, (_, i) => ({
          id: `s${i}`,
          kind: "step" as const,
          role: "run" as const,
          measure: { type: "time" as const, seconds: 60 },
        })),
      },
    });
    expect(parseProgramSession(published(session))?.steps).toHaveLength(31);
  });
  it("Hyrox : un bloc de 11 lignes en 3 tours", () => {
    const session = hyroxSession({
      content: {
        discipline: "hyrox",
        items: [
          {
            id: "b1",
            kind: "block",
            format: "circuit",
            rounds: 3,
            loads: "coach",
            lines: Array.from({ length: 11 }, (_, i) => ({
              id: `l${i}`,
              kind: "run" as const,
              meters: 200,
            })),
          },
        ],
      },
    });
    const display = parseProgramSession(published(session));
    expect(display?.steps[0]?.repeat?.lines).toHaveLength(11);
  });
});

describe("C5 : « Dupliquer vers… » ne copie pas les rendez-vous du coach", () => {
  const coach = { coachSessionId: COACH, date: "2026-10-27", time: "07:00" };
  it("en jours fixes, la copie garde le jour et l'heure du rendez-vous, sans le rendez-vous", () => {
    const plan = draft({
      phases: [],
      weeks: [
        {
          index: 1,
          light: false,
          scheduling: "fixed",
          sessions: [runningSession({ key: "a", withCoach: coach, moment: "morning" })],
        },
        { index: 2, light: false, scheduling: "ordered", sessions: [] },
      ],
    });
    const result = duplicateWeekTo(plan, 1, [2]);
    const copy = result.weeks[1]?.sessions[0];
    expect(copy?.withCoach).toBeUndefined();
    expect(copy?.fixedDay).toBe("tue");
    expect(copy?.fixedTime).toBe("07:00");
    expect(programDraftSchema.safeParse(result).success).toBe(true);
  });
  it("dans l'ordre, la copie perd aussi son moment (sinon le brouillon serait refusé)", () => {
    const plan = draft({
      phases: [],
      weeks: [
        {
          index: 1,
          light: false,
          scheduling: "ordered",
          sessions: [runningSession({ key: "a", withCoach: coach, moment: "evening" })],
        },
        { index: 2, light: false, scheduling: "ordered", sessions: [] },
      ],
    });
    const result = duplicateWeekTo(plan, 1, [2]);
    const copy = result.weeks[1]?.sessions[0];
    expect(copy?.withCoach).toBeUndefined();
    expect(copy?.moment).toBeUndefined();
    expect(programDraftSchema.safeParse(result).success).toBe(true);
  });
  it("copier un programme (resizePlan) ne garde aucun rendez-vous", () => {
    const plan = draft({
      phases: [],
      weeks: [
        {
          index: 1,
          light: false,
          scheduling: "ordered",
          sessions: [runningSession({ key: "a", withCoach: coach, moment: "evening" })],
        },
      ],
    });
    const resized = resizePlan(plan, 1, { vmaKmh: null, hrMax: null });
    expect(resized.weeks[0]?.sessions[0]?.withCoach).toBeUndefined();
    expect(programDraftSchema.safeParse({ ...plan, ...resized }).success).toBe(true);
  });
});

describe("C6 : la saisie rapide en secondes sur un exercice en % du max", () => {
  it("passe l'exercice en kg, sans % ni RIR", () => {
    const exercise = {
      id: "x1",
      kind: "exercise" as const,
      name: "Gainage",
      loadMode: "pct" as const,
      sets: [{ type: "normal" as const, repsMin: 8, pct: 70, rir: 2 }],
    };
    const filled = quickFill(exercise, { count: 3, seconds: 30 });
    expect(filled.loadMode).toBe("kg");
    expect(filled.sets).toHaveLength(3);
    expect(filled.sets.every((set) => set.seconds === 30)).toBe(true);
    expect(filled.sets.some((set) => set.pct !== undefined || set.rir !== undefined)).toBe(false);
  });
});

describe("C12 : plafonds de 14 séances par semaine et 4 par jour", () => {
  const fixedWeek = (sessions: SessionDraft[]): Week => ({
    index: 1,
    light: false,
    scheduling: "fixed",
    sessions,
  });
  it("la copie d'une séance prend le même jour, au premier moment libre", () => {
    const plan = draft({
      phases: [],
      weeks: [fixedWeek([runningSession({ key: "a", fixedDay: "tue" })])],
    });
    const result = duplicateSession(plan, 1, "a");
    const week = result.plan.weeks[0];
    const copy = week?.sessions.find((session) => session.key === result.key);
    expect(copy?.fixedDay).toBe("tue");
    expect(copy?.moment).toBe("evening");
    // L'originale reçoit le matin (fillMoments) : plus d'avertissement « sans moment ».
    expect(week?.sessions.find((session) => session.key === "a")?.moment).toBe("morning");
    expect(programDraftSchema.safeParse(result.plan).success).toBe(true);
  });
  it("un jour plein (4 séances) : la copie reste sans jour", () => {
    const moments = ["morning", "noon", "afternoon", "evening"] as const;
    const plan = draft({
      phases: [],
      weeks: [
        fixedWeek(
          moments.map((moment, i) => runningSession({ key: `s${i}`, fixedDay: "wed", moment })),
        ),
      ],
    });
    const result = duplicateSession(plan, 1, "s0");
    const copy = result.plan.weeks[0]?.sessions.find((session) => session.key === result.key);
    expect(copy?.fixedDay).toBeUndefined();
    expect(copy?.moment).toBeUndefined();
    expect(programDraftSchema.safeParse(result.plan).success).toBe(true);
  });
  it("une semaine de 14 séances n'en reçoit plus (ajout, copie)", () => {
    const sessions = Array.from({ length: 14 }, (_, i) => runningSession({ key: `s${i}` }));
    const plan = draft({
      phases: [],
      weeks: [{ index: 1, light: false, scheduling: "ordered", sessions }],
    });
    expect(duplicateSession(plan, 1, "s0").key).toBeNull();
    const added = addSession(plan, 1, blankSession("running"));
    expect(added.key).toBeNull();
    expect(added.plan).toBe(plan);
  });
  it("un modèle de séance ajouté garde son origine (C23)", () => {
    const template = { id: "c0000000-0000-4000-8000-000000000001", version: 3 };
    const plan = draft({ phases: [] });
    const { plan: next, key } = addSession(plan, 1, blankSession("strength"), {
      sourceTemplate: template,
    });
    const session = next.weeks[0]?.sessions.find((item) => item.key === key);
    expect(session?.sourceTemplate).toEqual(template);
  });
});

describe("C15 : le rythme d'un programme copié ou parti d'un modèle", () => {
  it("reprend celui de la source, sinon celui choisi", () => {
    expect(sessionsPerWeekFor(3, { sessionsPerWeek: 4 })).toBe(4);
    expect(sessionsPerWeekFor(3, null)).toBe(3);
  });
});

describe("C24 et B5 : avertissements de publication", () => {
  const context: PublishContext = {
    hrMax: 192,
    maxByExercise: new Map([[EXERCISE, oneRepMax(80, 1)!]]),
    hyroxDivision: "women_open",
    sex: "female",
    otherPublished: [],
    availableDays: [],
    coachSessionIds: new Set([COACH]),
  };
  it("une séance ajoutée puis jamais remplie est signalée", () => {
    const blank = { ...blankSession("strength"), key: "blank", athleteCanMove: false };
    const issues = validateForPublish(
      draft({
        phases: [],
        weeks: [{ index: 1, light: false, scheduling: "ordered", sessions: [blank] }],
      }),
      context,
    );
    const incomplete = issues.filter((issue) => issue.code === "incomplete_session");
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0]?.level).toBe("warning");
  });
  it("un rendez-vous du coach hors de sa semaine est signalé", () => {
    const issues = validateForPublish(
      draft({
        phases: [],
        startDate: "2026-11-02",
        weeks: [
          {
            index: 1,
            light: false,
            scheduling: "ordered",
            sessions: [
              runningSession({
                key: "a",
                withCoach: { coachSessionId: COACH, date: "2026-10-27", time: "07:00" },
              }),
            ],
          },
        ],
      }),
      context,
    );
    expect(issues.map((issue) => issue.code)).toContain("coach_date_mismatch");
  });
});

describe("B1, B2, B8 : programme en cours, à venir ou terminé", () => {
  const program = { startDate: "2026-10-26", weeksCount: 12 };
  it("dit où en est un programme publié", () => {
    expect(programTiming(program, "2026-10-25")).toBe("upcoming");
    expect(programTiming(program, "2026-10-26")).toBe("current");
    expect(programTiming(program, "2027-01-17")).toBe("current");
    expect(programTiming(program, "2027-01-18")).toBe("finished");
  });
  it("montre la même semaine par défaut : en cours, sinon la 1, sinon la dernière", () => {
    expect(defaultWeekIndex(program.startDate, program.weeksCount, "2026-11-13")).toBe(3);
    expect(defaultWeekIndex(program.startDate, program.weeksCount, "2026-10-01")).toBe(1);
    expect(defaultWeekIndex(program.startDate, program.weeksCount, "2027-03-01")).toBe(12);
  });
  it("propose de commencer après le dernier programme publié, sans le chevaucher", () => {
    expect(firstFreeMonday([program], "2026-11-16")).toBe("2027-01-18");
    expect(firstFreeMonday([{ startDate: "2026-01-05", weeksCount: 4 }], "2026-11-16")).toBe(
      "2026-11-16",
    );
    expect(periodsOverlap({ startDate: "2027-01-18", weeksCount: 6 }, program)).toBe(false);
    expect(periodsOverlap({ startDate: "2027-01-11", weeksCount: 6 }, program)).toBe(true);
  });
});

describe("B3, B4 : le vrai rendez-vous du coach, lu dans l'agenda", () => {
  const weekly = {
    id: COACH,
    startsOn: "2026-10-20",
    startTime: "07:00:00",
    repeatsWeekly: true,
    endsOn: null,
  };
  const week = { monday: "2026-10-26", sunday: "2026-11-01" };
  it("trouve la date de la semaine (v1 : sans date figée)", () => {
    expect(findCoachMeeting(weekly, week, null)).toEqual({
      status: "ok",
      date: "2026-10-27",
      time: "07:00",
      moved: false,
    });
  });
  it("suit une date déplacée (v2 : date figée à la publication)", () => {
    const moved = {
      ...weekly,
      exceptions: [{ originalDate: "2026-10-27", newDate: "2026-10-29", newStartTime: "18:00" }],
    };
    expect(findCoachMeeting(moved, week, "2026-10-27")).toEqual({
      status: "ok",
      date: "2026-10-29",
      time: "18:00",
      moved: true,
    });
  });
  it("dit qu'il est supprimé, ou absent cette semaine-là", () => {
    expect(findCoachMeeting(undefined, week, "2026-10-27")).toEqual({ status: "deleted" });
    expect(findCoachMeeting({ ...weekly, endsOn: "2026-10-21" }, week, null)).toEqual({
      status: "absent",
    });
  });
  it("B5 : la reprise d'un programme v1 n'invente pas de rendez-vous", () => {
    const v1 = {
      title: "Renfo",
      discipline: "strength",
      sessionType: "Force",
      durationMinutes: 60,
      steps: [{ title: "Bloc", lines: ["Squat"] }],
      withCoach: { sessionId: COACH },
    };
    const source = {
      program: {
        title: "Bloc",
        goal: null,
        discipline: null,
        startDate: "2026-10-26",
        weeksCount: 2,
      },
      snapshot: {},
      sessions: [
        { key: "a", weekIndex: 1, slotIndex: 1, json: v1 },
        { key: "b", weekIndex: 2, slotIndex: 1, json: v1 },
      ],
      coachSessions: [{ id: COACH, startsOn: "2026-10-27", startTime: "07:00:00" }],
      // Une séance ponctuelle, le 27 octobre seulement.
      meetingIn: meetingResolver([{ ...weekly, startsOn: "2026-10-27", repeatsWeekly: false }]),
    };
    const result = draftFromPublication(source);
    expect(result?.weeks[0]?.sessions[0]?.withCoach).toEqual({
      coachSessionId: COACH,
      date: "2026-10-27",
      time: "07:00",
    });
    expect(result?.weeks[1]?.sessions[0]?.withCoach).toBeUndefined();
  });
});

describe("C14 : un EMOM tenu se lit en secondes dans le PDF des fiches", () => {
  it("« 30 s », jamais « 30 s répét. »", () => {
    const program = demoProgram(6);
    for (const week of program.weeks) {
      for (const session of week.sessions) {
        const content = session.published?.content;
        if (content?.discipline !== "strength") continue;
        for (const item of content.items) {
          if (item.kind !== "emom") continue;
          item.exercises = item.exercises.map((exercise) => ({
            ...exercise,
            loadMode: "kg" as const,
            sets: [{ type: "normal" as const, seconds: 30 }],
          }));
        }
      }
    }
    const page = fichesPdf(program).pages.find((item) => item.kind === "fiche");
    const table =
      page?.kind === "fiche" ? page.sections.find((section) => section.kind === "table") : null;
    const emom =
      table?.kind === "table" ? table.rows.find((row) => row.kind === "span") : undefined;
    expect(emom).toMatchObject({ text: "EMOM 10 min · 30 s · 20 s de travail · 40 s de repos" });
  });
});
