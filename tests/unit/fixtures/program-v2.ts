import type { ProgramDraft } from "@/domain/training/program-plan";
import type { SessionDraft } from "@/domain/training/session-v2";

// Données de test des programmes v2 (D-155), inventées, dans l'esprit des maquettes.

// « Endurance rapide » (maquette 04) : 15 min + 5 × (2 min + 2 min) + 10 min.
export function runningSession(overrides: Partial<SessionDraft> = {}): SessionDraft {
  return {
    key: "s-run",
    title: "Endurance rapide",
    sessionType: "Fractionné",
    durationMinutes: 45,
    objective: "Tenir l'allure 10 km sur des efforts courts",
    coachTip: "Garde les 2 min de trot vraiment lentes.",
    athleteCanMove: false,
    content: {
      discipline: "running",
      items: [
        {
          id: "e1",
          kind: "step",
          role: "warmup",
          measure: { type: "time", seconds: 900 },
          target: { kind: "pace", fromSecPerKm: 375, toSecPerKm: 375 },
        },
        {
          id: "r1",
          kind: "repeat",
          times: 5,
          steps: [
            {
              id: "r1a",
              kind: "step",
              role: "run",
              label: "Course rapide",
              measure: { type: "time", seconds: 120 },
              target: { kind: "pace", fromSecPerKm: 300, toSecPerKm: 310 },
            },
            {
              id: "r1b",
              kind: "step",
              role: "recovery",
              label: "Trot",
              measure: { type: "time", seconds: 120 },
            },
          ],
        },
        {
          id: "c1",
          kind: "step",
          role: "cooldown",
          measure: { type: "time", seconds: 600 },
          target: { kind: "hr", zone: 2 },
        },
      ],
    },
    ...overrides,
  };
}

// « Full Body A » (maquette 05) : un exercice en %, un superset.
export function strengthSession(
  exerciseId: string,
  overrides: Partial<SessionDraft> = {},
): SessionDraft {
  return {
    key: "s-str",
    title: "Full Body A",
    sessionType: "Force",
    durationMinutes: 60,
    athleteCanMove: false,
    content: {
      discipline: "strength",
      warmup: "Mobilité hanches et épaules",
      items: [
        {
          id: "x1",
          kind: "exercise",
          exerciseId,
          name: "Back squat",
          loadMode: "pct",
          sets: [
            { type: "warmup", repsMin: 10, kg: 20 },
            { type: "normal", repsMin: 6, pct: 70, rir: 2 },
            { type: "normal", repsMin: 6, pct: 70, rir: 2 },
          ],
          restSec: 150,
        },
        {
          id: "ss1",
          kind: "superset",
          rounds: 3,
          restSec: 90,
          exercises: [
            {
              id: "x2",
              kind: "exercise",
              name: "Pompes",
              loadMode: "kg",
              sets: [{ type: "normal", repsMin: 12 }],
            },
            {
              id: "x3",
              kind: "exercise",
              name: "Tirage bûcheron unilatéral",
              loadMode: "kg",
              sets: [{ type: "normal", repsMin: 10, kg: 14 }],
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

// « Circuit Hyrox » (maquette 06) : 5 tours, charges officielles.
export function hyroxSession(overrides: Partial<SessionDraft> = {}): SessionDraft {
  return {
    key: "s-hyr",
    title: "Circuit Hyrox",
    sessionType: "Circuit",
    durationMinutes: 58,
    athleteCanMove: false,
    content: {
      discipline: "hyrox",
      items: [
        {
          id: "b1",
          kind: "block",
          format: "circuit",
          rounds: 5,
          restSec: 60,
          loads: "official",
          lines: [
            { id: "l1", kind: "run", meters: 600, paceSecPerKm: 345 },
            { id: "l2", kind: "station", station: "sled_push", meters: 25, loadSource: "official" },
            { id: "l3", kind: "transition", seconds: 30 },
          ],
        },
      ],
    },
    ...overrides,
  };
}

export function draft(overrides: Partial<ProgramDraft> = {}): ProgramDraft {
  return {
    schemaVersion: 2,
    title: "Prépa HYROX Gand",
    discipline: "hyrox",
    aimDefaults: { running: "pace", strength: "kg" },
    sessionsPerWeek: 3,
    phases: [
      { id: "p1", name: "Base", weekFrom: 1, weekTo: 2 },
      { id: "p2", name: "Spécifique", weekFrom: 3, weekTo: 3 },
    ],
    weeks: [
      {
        index: 1,
        light: false,
        scheduling: "ordered",
        sessions: [runningSession({ key: "w1-run" }), hyroxSession({ key: "w1-hyr" })],
      },
      {
        index: 2,
        light: false,
        scheduling: "ordered",
        sessions: [runningSession({ key: "w2-run" })],
      },
      { index: 3, light: true, scheduling: "ordered", sessions: [] },
    ],
    startDate: "2026-10-26",
    goal: { raceName: "HYROX Gand", raceDate: "2027-01-17", hyroxDivision: "women_open" },
    ...overrides,
  };
}
