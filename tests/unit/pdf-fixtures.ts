// Programme de démonstration pour les tests des PDF (phase 5) : trois séances v2 typiques (Running,
// Musculation avec superset et EMOM, Hyrox en circuit) répétées chaque semaine, charges qui montent,
// une semaine allégée, une course. Construit avec les vrais schémas et les vraies vues.
import type { PdfProgramInput, PdfWeekInput } from "@/domain/training/pdf-agenda";
import { sessionToDisplay } from "@/domain/training/program-session";
import { publishedSessionSchema, type PublishedSession } from "@/domain/training/session-v2";
import { sessionHeadline } from "@/domain/training/session-view";

export function running(minutes: number): PublishedSession {
  return publishedSessionSchema.parse({
    schemaVersion: 2,
    title: "Fractionné",
    sessionType: "Fractionné",
    durationMinutes: minutes,
    athleteCanMove: false,
    fixedDay: "thu",
    content: {
      discipline: "running",
      items: [
        {
          id: "s1",
          kind: "step",
          role: "warmup",
          measure: { type: "time", seconds: 900 },
          target: { kind: "hr", zone: 2, bpmFrom: 135, bpmTo: 150 },
        },
        {
          id: "r1",
          kind: "repeat",
          times: 5,
          steps: [
            {
              id: "s2",
              kind: "step",
              role: "run",
              measure: { type: "distance", meters: 800 },
              target: { kind: "pace", fromSecPerKm: 270, toSecPerKm: 280 },
            },
            { id: "s3", kind: "step", role: "recovery", measure: { type: "time", seconds: 90 } },
          ],
        },
        { id: "s4", kind: "step", role: "cooldown", measure: { type: "time", seconds: 600 } },
      ],
    },
  });
}

export function strength(squatKg: number, sets = 4): PublishedSession {
  const exercise = (id: string, name: string, kg: number, reps: number, count: number) => ({
    id,
    kind: "exercise" as const,
    name,
    loadMode: "kg" as const,
    sets: Array.from({ length: count }, () => ({
      type: "normal" as const,
      repsMin: reps,
      kg,
      rir: 2,
    })),
    restSec: 150,
  });
  return publishedSessionSchema.parse({
    schemaVersion: 2,
    title: "Force bas du corps",
    sessionType: "Force",
    durationMinutes: 60,
    athleteCanMove: false,
    fixedDay: "wed",
    coachTip: "Garde 2 répétitions en réserve.",
    content: {
      discipline: "strength",
      warmup: "Mobilité hanches et chevilles",
      cooldown: "Étirements, 5 min",
      items: [
        exercise("e1", "Back squat", squatKg, 6, sets),
        exercise("e2", "Soulevé de terre roumain", squatKg - 5, 8, 3),
        {
          id: "ss",
          kind: "superset",
          rounds: 3,
          restSec: 90,
          exercises: [
            { ...exercise("e3", "Fentes marchées", 8, 10, 1), restSec: undefined },
            { ...exercise("e4", "Hip thrust barre", squatKg, 12, 1), restSec: undefined },
          ],
        },
        {
          id: "em",
          kind: "emom",
          minutes: 10,
          workSec: 20,
          exercises: [{ ...exercise("e5", "Kettlebell swing", 16, 15, 1), restSec: undefined }],
        },
      ],
    },
  });
}

export function hyrox(rounds: number): PublishedSession {
  return publishedSessionSchema.parse({
    schemaVersion: 2,
    title: "Circuit stations",
    sessionType: "Circuit",
    durationMinutes: 43,
    athleteCanMove: false,
    fixedDay: "tue",
    content: {
      discipline: "hyrox",
      items: [
        {
          id: "b1",
          kind: "block",
          format: "simple",
          title: "Échauffement",
          loads: "coach",
          lines: [{ id: "l1", kind: "run", meters: 1000, paceSecPerKm: 360 }],
        },
        {
          id: "b2",
          kind: "block",
          format: "circuit",
          rounds,
          restSec: 90,
          loads: "coach",
          lines: [
            { id: "l2", kind: "run", meters: 1000, paceSecPerKm: 330 },
            {
              id: "l3",
              kind: "station",
              station: "sled_push",
              meters: 50,
              loadSource: "official",
              loadKg: 102,
            },
            {
              id: "l4",
              kind: "station",
              station: "burpee_broad_jumps",
              meters: 40,
              loadSource: "coach",
            },
            { id: "l5", kind: "erg", machine: "skierg", meters: 500, pacePer500m: 130 },
            { id: "l6", kind: "transition", seconds: 30 },
          ],
        },
      ],
    },
  });
}

const add = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const card = (published: PublishedSession) => ({
  content: sessionToDisplay(published),
  headline: sessionHeadline(published),
  day: published.fixedDay ?? null,
  time: published.fixedTime ?? null,
  coachDate: published.withCoach?.date ?? null,
  published,
});

// `weeks` semaines à partir du lundi 9 novembre 2026 ; la semaine 4 est allégée ; course le samedi
// de la dernière semaine.
export function demoProgram(weeks = 6, today = "2026-11-10"): PdfProgramInput {
  const start = "2026-11-09";
  const list: PdfWeekInput[] = Array.from({ length: weeks }, (_, i) => {
    const monday = add(start, 7 * i);
    const light = i === 3;
    return {
      index: i + 1,
      label: i < weeks / 2 ? "Base" : "Spécifique",
      light,
      monday,
      sunday: add(monday, 6),
      fixed: true,
      sessions: [
        card(hyrox(light ? 2 : 3 + (i % 2))),
        card(strength(40 + 2.5 * i, light ? 3 : 4)),
        card(running(50)),
      ],
    };
  });
  return {
    title: "Prépa test",
    discipline: "hybrid",
    athleteName: "Anaïs Test",
    coachName: "Coach Test",
    version: 1,
    startDate: start,
    weeksCount: weeks,
    sessionsPerWeek: 3,
    race: { name: "HYROX Test", date: add(start, 7 * (weeks - 1) + 5) },
    today,
    weeks: list,
  };
}

// Un programme sans fiche ni allure (D-211) : une course en v1 par semaine (pas de version
// structurée, donc pas d'allure à reprendre) ; son PDF est l'agenda seul.
export function programWithoutFiches(weeks = 3): PdfProgramInput {
  const program = demoProgram(weeks);
  const content = sessionToDisplay(running(40));
  for (const week of program.weeks)
    week.sessions = [
      { content, headline: "40 min", day: null, time: null, coachDate: null, published: null },
    ];
  return program;
}
