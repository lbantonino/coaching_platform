import { describe, expect, it } from "vitest";

import { parseProgramSession, upgradeV1Session } from "@/domain/training/program-session";
import { buildPublication } from "@/domain/training/program-publication";
import {
  formatClock,
  formatMeters,
  formatSeconds,
  sessionSteps,
} from "@/domain/training/session-view";
import { parseSegment } from "@/features/programs/session-display";

import { draft, hyroxSession, runningSession, strengthSession } from "./fixtures/program-v2";

const EXERCISE = "8a5f1c3e-3a4b-5c6d-8e9f-0a1b2c3d4e5f";

describe("formats d'affichage", () => {
  it("écrit les durées, temps cibles et distances comme les écrans", () => {
    expect(formatSeconds(30)).toBe("30 s");
    expect(formatSeconds(240)).toBe("4 min");
    expect(formatSeconds(105)).toBe("1:45 min");
    expect(formatSeconds(4800)).toBe("1 h 20");
    expect(formatSeconds(3600)).toBe("1 h");
    expect(formatClock(4700)).toBe("1:18:20");
    expect(formatClock(1500)).toBe("25:00");
    expect(formatMeters(1000)).toBe("1 km");
    expect(formatMeters(1500)).toBe("1,5 km");
    expect(formatMeters(800)).toBe("800 m");
  });
});

describe("sessionSteps (une info par ligne, format de la v1)", () => {
  it("Running : étapes et « Répéter N fois », lignes lisibles par la page d'une séance", () => {
    const steps = sessionSteps(runningSession());
    expect(steps[0]).toMatchObject({
      title: "Échauffement",
      badge: "15 min",
      lines: ["15 min @6:15 min/km"],
    });
    expect(steps[1]).toMatchObject({
      title: "Répéter 5 fois",
      badge: "5 × 2 min",
      repeat: {
        times: 5,
        lines: ["Course rapide 2 min @5:00–5:10 min/km", "2 min de récupération (trot)"],
      },
    });
    expect(steps[2]?.lines).toEqual(["10 min · Z2"]);
    // La page d'une séance relit ces lignes comme celles de la v1.
    expect(parseSegment("2 min de récupération (trot)").kind).toBe("recovery");
    expect(parseSegment("15 min @6:15 min/km")).toMatchObject({ kind: "effort", value: "15 min" });
  });
  it("Musculation : échauffement, exercices sur une ligne chacun, superset répété", () => {
    const steps = sessionSteps(strengthSession(EXERCISE));
    expect(steps[0]).toEqual({ title: "Échauffement", lines: ["Mobilité hanches et épaules"] });
    expect(steps[1]?.lines[0]).toBe("Back squat · 2 × 6 · 70 % · RIR 2 · repos 2:30");
    expect(steps[2]).toMatchObject({
      title: "Superset",
      badge: "3 tours",
      lines: ["Repos 1:30 min en fin de tour"],
      repeat: { times: 3, lines: ["Pompes · 12", "Tirage bûcheron unilatéral · 10 · 14 kg"] },
    });
  });
  it("Hyrox : bloc en tours, station avec sa charge une fois figée", () => {
    const publication = buildPublication(
      draft({
        weeks: [{ index: 1, light: false, scheduling: "ordered", sessions: [hyroxSession()] }],
        phases: [],
      }),
      { hrMax: null, maxByExercise: new Map(), hyroxDivision: "women_open", sex: "female" },
    );
    const content = publication.sessions[0]?.content;
    expect(content).toBeDefined();
    const steps = content ? sessionSteps(content) : [];
    expect(steps[0]).toMatchObject({
      title: "Circuit",
      badge: "5 tours",
      lines: ["Repos 1 min entre les tours"],
      repeat: {
        times: 5,
        lines: ["Run 600 m @5:45 min/km", "Sled push 25 m · 102 kg", "Transition 30 s"],
      },
    });
  });
});

describe("parseProgramSession (v1 et v2)", () => {
  it("lit une séance v2 publiée dans la forme des écrans", () => {
    const publication = buildPublication(
      draft({
        weeks: [{ index: 1, light: false, scheduling: "ordered", sessions: [runningSession()] }],
        phases: [],
      }),
      { hrMax: 192, maxByExercise: new Map(), hyroxDivision: null, sex: null },
    );
    const display = parseProgramSession(
      JSON.parse(JSON.stringify(publication.sessions[0]?.content)),
    );
    expect(display).toMatchObject({
      title: "Endurance rapide",
      discipline: "running",
      sessionType: "Fractionné",
      durationMinutes: 45,
      coachTips: "Garde les 2 min de trot vraiment lentes.",
    });
    // FC max connue : la plage en bpm de la zone est figée à la publication.
    expect(display?.steps[2]?.lines).toEqual(["10 min · Z2 · 129-142 bpm"]);
  });
  it("écarte une séance v2 mal formée", () => {
    expect(parseProgramSession({ schemaVersion: 2, title: "Incomplète" })).toBeNull();
  });
  it("reprend une séance v1 sans perte (blocs texte) et la relit à l'identique", () => {
    const v1 = {
      title: "Circuit Hyrox",
      discipline: "hyrox" as const,
      sessionType: "Circuit",
      durationMinutes: 60,
      objective: "Enchaîner course et stations",
      steps: [
        {
          title: "Échauffement",
          badge: "10 min",
          short: "10 min échauffement",
          lines: ["Footing léger"],
        },
        {
          title: "Circuit",
          badge: "3 tours",
          lines: [],
          repeat: { times: 3, lines: ["Run 1 km @5:15 min/km", "Sled push 25 m"] },
        },
      ],
      withCoach: { sessionId: "ca000000-0000-4000-8000-000000000002" },
    };
    const upgraded = upgradeV1Session(v1, "s1-4", {
      coachSessionId: "ca000000-0000-4000-8000-000000000002",
      date: "2026-10-31",
      time: "10:00",
    });
    expect(upgraded.content.discipline).toBe("hyrox");
    const published = { schemaVersion: 2, ...upgraded };
    const display = parseProgramSession(JSON.parse(JSON.stringify(published)));
    expect(display?.steps.map((step) => step.title)).toEqual(["Échauffement", "Circuit"]);
    expect(display?.steps[1]?.repeat).toEqual(v1.steps[1]?.repeat);
    expect(display?.withCoach).toEqual(v1.withCoach);
  });
});
