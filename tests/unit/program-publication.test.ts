import { describe, expect, it } from "vitest";

import { oneRepMax } from "@/domain/training/aims";
import {
  buildPublication,
  validateForPublish,
  type PublishContext,
} from "@/domain/training/program-publication";
import { publishedSessionSchema } from "@/domain/training/session-v2";

import { draft, hyroxSession, runningSession, strengthSession } from "./fixtures/program-v2";

const EXERCISE = "8a5f1c3e-3a4b-5c6d-8e9f-0a1b2c3d4e5f";
const COACH = "ca000000-0000-4000-8000-000000000002";

const context = (overrides: Partial<PublishContext> = {}): PublishContext => ({
  hrMax: 192,
  maxByExercise: new Map([[EXERCISE, oneRepMax(80, 1)!]]),
  hyroxDivision: "women_open",
  sex: "female",
  otherPublished: [],
  availableDays: [],
  coachSessionIds: new Set([COACH]),
  ...overrides,
});

describe("buildPublication (la version figée)", () => {
  it("numérote les séances dans l'ordre des jours et les date en jours fixes", () => {
    const fixed = draft({
      phases: [],
      weeks: [
        {
          index: 2,
          light: false,
          scheduling: "fixed" as const,
          sessions: [
            runningSession({ key: "jeudi", fixedDay: "thu" }),
            runningSession({ key: "mardi", fixedDay: "tue", fixedTime: "07:00" }),
          ],
        },
      ].map((week, i) => ({ ...week, index: i + 1 })),
    });
    const publication = buildPublication(fixed, context());
    expect(
      publication.sessions.map((s) => [s.key, s.slotIndex, s.plannedDate, s.plannedTime]),
    ).toEqual([
      ["mardi", 1, "2026-10-27", "07:00"],
      ["jeudi", 2, "2026-10-29", undefined],
    ]);
  });
  it("une séance avec le coach prend la date et l'heure du rendez-vous, même dans l'ordre", () => {
    const withCoach = draft({
      phases: [],
      weeks: [
        {
          index: 1,
          light: false,
          scheduling: "ordered",
          sessions: [
            runningSession({
              key: "coach",
              withCoach: { coachSessionId: COACH, date: "2026-10-31", time: "10:00" },
            }),
          ],
        },
      ],
    });
    const [session] = buildPublication(withCoach, context()).sessions;
    expect(session).toMatchObject({ plannedDate: "2026-10-31", plannedTime: "10:00" });
  });
  it("fige les kg d'un %, la plage de FC et les charges officielles ; la photo garde les phases", () => {
    const publication = buildPublication(
      draft({
        weeks: [
          {
            index: 1,
            light: false,
            scheduling: "ordered",
            sessions: [strengthSession(EXERCISE), hyroxSession(), runningSession()],
          },
          { index: 2, light: false, scheduling: "ordered", sessions: [] },
          { index: 3, light: false, scheduling: "ordered", sessions: [] },
        ],
      }),
      context(),
    );
    const [strength, hyrox, running] = publication.sessions.map((s) => s.content);
    for (const content of [strength, hyrox, running])
      expect(publishedSessionSchema.safeParse(content).success).toBe(true);

    const squat =
      strength?.content.discipline === "strength" ? strength.content.items[0] : undefined;
    expect(squat?.kind === "exercise" ? squat.sets.map((set) => set.kg) : []).toEqual([20, 56, 56]);
    const sled =
      hyrox?.content.discipline === "hyrox" && hyrox.content.items[0]?.kind === "block"
        ? hyrox.content.items[0].lines[1]
        : undefined;
    expect(sled?.kind === "station" ? sled.loadKg : null).toBe(102);
    const cooldown =
      running?.content.discipline === "running" ? running.content.items[2] : undefined;
    expect(cooldown?.kind === "step" ? cooldown.target : null).toEqual({
      kind: "hr",
      zone: 2,
      bpmFrom: 129,
      bpmTo: 142,
    });

    expect(publication.snapshot).toMatchObject({
      schemaVersion: 2,
      weeksCount: 3,
      weeks: [
        { index: 1, label: "Base" },
        { index: 2, label: "Base" },
        { index: 3, label: "Spécifique" },
      ],
    });
  });
  it("un % avec un max connu prend les kg du max du jour, même si le brouillon gardait d'anciens kg (BR-14)", () => {
    const stale = strengthSession(EXERCISE);
    const content = stale.content.discipline === "strength" ? stale.content : null;
    const squat = content?.items[0];
    if (!content || squat?.kind !== "exercise") throw new Error("fixture");
    const old = {
      ...stale,
      content: {
        ...content,
        items: [
          { ...squat, sets: squat.sets.map((set) => (set.pct ? { ...set, kg: 50 } : set)) },
          ...content.items.slice(1),
        ],
      },
    };
    const publication = buildPublication(
      draft({
        weeks: [{ index: 1, light: false, scheduling: "ordered", sessions: [old] }],
        phases: [],
      }),
      context(),
    );
    const published = publication.sessions[0]?.content.content;
    const first = published?.discipline === "strength" ? published.items[0] : undefined;
    // Max 80 kg : 70 % = 56 kg ; l'échauffement en kg garde ses 20 kg.
    expect(first?.kind === "exercise" ? first.sets.map((set) => set.kg) : []).toEqual([20, 56, 56]);
  });
  it("sans max connu, le % reste sans kg ; sans division, pas de charge officielle", () => {
    const publication = buildPublication(
      draft({
        phases: [],
        weeks: [
          {
            index: 1,
            light: false,
            scheduling: "ordered",
            sessions: [strengthSession(EXERCISE), hyroxSession()],
          },
        ],
      }),
      context({ maxByExercise: new Map(), hyroxDivision: null }),
    );
    const [strength, hyrox] = publication.sessions.map((s) => s.content);
    const squat =
      strength?.content.discipline === "strength" ? strength.content.items[0] : undefined;
    expect(squat?.kind === "exercise" ? squat.sets[1]?.kg : 0).toBeUndefined();
    const sled =
      hyrox?.content.discipline === "hyrox" && hyrox.content.items[0]?.kind === "block"
        ? hyrox.content.items[0].lines[1]
        : undefined;
    expect(sled?.kind === "station" ? sled.loadKg : 0).toBeUndefined();
  });
});

describe("validateForPublish (fenêtre 08)", () => {
  it("bloque un programme sans séance et un chevauchement (C-8)", () => {
    const empty = draft({
      phases: [],
      weeks: [{ index: 1, light: false, scheduling: "ordered", sessions: [] }],
    });
    const issues = validateForPublish(
      empty,
      context({ otherPublished: [{ title: "Bloc 1", startDate: "2026-10-19", weeksCount: 4 }] }),
    );
    expect(issues.filter((issue) => issue.level === "blocking").map((issue) => issue.code)).toEqual(
      ["no_session", "overlap"],
    );
  });
  it("n'avertit que pour le reste : semaine vide, % sans max, division inconnue, FC max inconnue, rendez-vous disparu", () => {
    const issues = validateForPublish(
      draft({
        weeks: [
          {
            index: 1,
            light: false,
            scheduling: "ordered",
            sessions: [
              strengthSession(EXERCISE),
              hyroxSession(),
              runningSession({
                withCoach: {
                  coachSessionId: "ca000000-0000-4000-8000-0000000000ff",
                  date: "2026-10-27",
                },
              }),
            ],
          },
          { index: 2, light: false, scheduling: "ordered", sessions: [] },
          { index: 3, light: false, scheduling: "ordered", sessions: [] },
        ],
      }),
      context({ maxByExercise: new Map(), hyroxDivision: null, hrMax: null }),
    );
    expect(issues.every((issue) => issue.level === "warning")).toBe(true);
    expect(new Set(issues.map((issue) => issue.code))).toEqual(
      new Set([
        "empty_week",
        "pct_without_max",
        "official_without_division",
        "hr_without_max",
        "coach_session_missing",
      ]),
    );
  });
  it("TC-07 : deux séances le même jour, c'est un avertissement, jamais un blocage (BR-04)", () => {
    const issues = validateForPublish(
      draft({
        phases: [],
        weeks: [
          {
            index: 1,
            light: false,
            scheduling: "fixed",
            sessions: [
              runningSession({ key: "a", fixedDay: "tue" }),
              runningSession({ key: "b", fixedDay: "tue" }),
            ],
          },
        ],
      }),
      context(),
    );
    // D-164 : plusieurs séances le même jour sont permises ; sans moment, c'est un avertissement.
    const sameDay = issues.filter((issue) => issue.code === "moment_missing");
    expect(sameDay.length).toBeGreaterThan(0);
    expect(sameDay.every((issue) => issue.level === "warning")).toBe(true);
    expect(issues.some((issue) => issue.level === "blocking")).toBe(false);
  });
  it("un programme qui suit le précédent sans le chevaucher passe", () => {
    const next = draft({ startDate: "2026-11-16" });
    const issues = validateForPublish(
      next,
      context({ otherPublished: [{ title: "Bloc 1", startDate: "2026-10-19", weeksCount: 4 }] }),
    );
    expect(issues.some((issue) => issue.code === "overlap")).toBe(false);
  });
});
