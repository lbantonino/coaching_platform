import { describe, expect, it } from "vitest";

import { sessionCards, viewStepCards } from "@/domain/training/session-cards";
import type {
  HyroxContent,
  RunningContent,
  SessionContent,
  StrengthContent,
} from "@/domain/training/session-v2";
import { exerciseLine } from "@/domain/training/session-view";

// Séances en cartes (test d'Antonino et de Gianluca sur iPhone, 15/11/2026) : une carte par étape, une
// grande carte pour ce qui se répète ; le nom en gras, le volume en haut à droite, la ligne dessous, le
// repos dessous ; jamais de RIR ; les kilos si le max est connu, sinon « % du max ».

const ID = "3f6c1a52-8b2d-4c4e-9a7b-1d2e3f4a5b6c";
const strength = (content: Partial<StrengthContent>): SessionContent =>
  ({ discipline: "strength", items: [], ...content }) as StrengthContent;
const normal = (set: Record<string, number>, times = 1) =>
  Array.from({ length: times }, () => ({ type: "normal" as const, ...set }));

describe("musculation : une carte par exercice", () => {
  it("séries toutes pareilles : « 4 séries », la ligne, le repos ; ni RIR ni %", () => {
    const cards = sessionCards(
      strength({
        warmup: "Vélo et mobilité des hanches",
        cooldown: "Étirements doux",
        items: [
          {
            id: "e1",
            kind: "exercise",
            exerciseId: ID,
            name: "Soulevé de terre (barre)",
            loadMode: "pct",
            sets: normal({ repsMin: 5, pct: 70, kg: 70, rir: 2 }, 4),
            restSec: 180,
          },
        ],
      }),
    );
    expect(cards).toEqual([
      {
        kind: "card",
        role: "warmup",
        title: "Échauffement",
        lines: ["Vélo et mobilité des hanches"],
        sub: [],
        path: ["warmup"],
      },
      {
        kind: "card",
        role: "work",
        title: "Soulevé de terre (barre)",
        aside: "4 séries",
        lines: ["5 répétitions · 70 kg"],
        sub: ["Repos 3:00"],
        path: ["e1"],
        exerciseId: ID,
      },
      {
        kind: "card",
        role: "cooldown",
        title: "Retour au calme",
        lines: ["Étirements doux"],
        sub: [],
        path: ["cooldown"],
      },
    ]);
  });

  it("% du max sans max connu, plage de répétitions, tenue en secondes, une seule répétition", () => {
    const [pct, timed, single] = sessionCards(
      strength({
        items: [
          {
            id: "a",
            kind: "exercise",
            name: "Squat avant",
            loadMode: "pct",
            sets: normal({ repsMin: 8, repsMax: 10, pct: 65 }, 3),
          },
          {
            id: "b",
            kind: "exercise",
            name: "Planche",
            loadMode: "kg",
            sets: normal({ seconds: 30, secondsMax: 45 }, 2),
          },
          {
            id: "c",
            kind: "exercise",
            name: "Soulevé de terre",
            loadMode: "kg",
            sets: normal({ repsMin: 1, kg: 140 }),
          },
        ],
      }),
    );
    expect(pct).toMatchObject({ aside: "3 séries", lines: ["8 à 10 répétitions · 65 % du max"] });
    expect(timed).toMatchObject({ aside: "2 séries", lines: ["30 à 45 s"] });
    expect(single).toMatchObject({ aside: "1 série", lines: ["1 répétition · 140 kg"] });
  });

  it("pyramide : une ligne par série ; séries d'échauffement à part ; tempo et consigne dessous", () => {
    const [pyramid, warm] = sessionCards(
      strength({
        items: [
          {
            id: "p",
            kind: "exercise",
            name: "Leg press",
            loadMode: "kg",
            sets: [
              { type: "normal", repsMin: 12, kg: 100 },
              { type: "normal", repsMin: 10, kg: 120 },
              { type: "normal", repsMin: 8, kg: 140 },
            ],
            restSec: 90,
            tempo: "3-1-1",
            cue: "Pieds largeur des hanches",
          },
          {
            id: "w",
            kind: "exercise",
            name: "Développé couché (barre)",
            loadMode: "kg",
            sets: [
              ...Array.from({ length: 2 }, () => ({
                type: "warmup" as const,
                repsMin: 10,
                kg: 40,
              })),
              ...normal({ repsMin: 6, kg: 60 }, 4),
            ],
          },
        ],
      }),
    );
    expect(pyramid).toMatchObject({
      aside: "3 séries",
      lines: [
        "Série 1 · 12 répétitions · 100 kg",
        "Série 2 · 10 répétitions · 120 kg",
        "Série 3 · 8 répétitions · 140 kg",
      ],
      sub: ["Repos 1:30", "Tempo 3-1-1", "Pieds largeur des hanches"],
    });
    expect(warm).toMatchObject({
      aside: "4 séries",
      lines: ["Échauffement : 2 × 10 répétitions · 40 kg", "6 répétitions · 60 kg"],
    });
  });

  it("superset et EMOM : une grande carte, une petite par exercice, le repos en bas", () => {
    const [superset, emom] = sessionCards(
      strength({
        items: [
          {
            id: "s1",
            kind: "superset",
            rounds: 3,
            restSec: 90,
            exercises: [
              {
                id: "t",
                kind: "exercise",
                name: "Tractions",
                loadMode: "kg",
                sets: normal({ repsMin: 8 }, 3),
              },
              {
                id: "d",
                kind: "exercise",
                name: "Dips",
                loadMode: "kg",
                sets: normal({ repsMin: 10 }, 3),
              },
            ],
          },
          {
            id: "m1",
            kind: "emom",
            minutes: 12,
            workSec: 40,
            exercises: [
              {
                id: "k",
                kind: "exercise",
                name: "Kettlebell swing",
                loadMode: "kg",
                sets: normal({ repsMin: 15, kg: 16 }),
              },
            ],
          },
        ],
      }),
    );
    expect(superset).toEqual({
      kind: "group",
      title: "Superset",
      aside: "3 tours",
      footer: "Repos 1:30 après chaque tour",
      path: ["s1"],
      cards: [
        {
          kind: "card",
          role: "work",
          title: "Tractions",
          lines: ["8 répétitions"],
          sub: [],
          path: ["s1", "t"],
        },
        {
          kind: "card",
          role: "work",
          title: "Dips",
          lines: ["10 répétitions"],
          sub: [],
          path: ["s1", "d"],
        },
      ],
    });
    expect(emom).toMatchObject({
      kind: "group",
      title: "EMOM",
      aside: "12 min",
      footer: "Chaque minute : 40 s de travail, puis repos",
      cards: [{ title: "Kettlebell swing", lines: ["15 répétitions · 16 kg"] }],
    });
  });
});

describe("course : les étapes et « Répéter »", () => {
  it("allure sans unité, zone de FC, récupération avec son nom dessous", () => {
    const content: RunningContent = {
      discipline: "running",
      items: [
        {
          id: "w",
          kind: "step",
          role: "warmup",
          measure: { type: "time", seconds: 900 },
          target: { kind: "pace", fromSecPerKm: 360, toSecPerKm: 360 },
          note: "Footing facile",
        },
        {
          id: "r1",
          kind: "repeat",
          times: 8,
          steps: [
            {
              id: "run",
              kind: "step",
              role: "run",
              measure: { type: "distance", meters: 400 },
              target: { kind: "pace", fromSecPerKm: 245, toSecPerKm: 255 },
            },
            {
              id: "rec",
              kind: "step",
              role: "recovery",
              label: "Trot léger",
              measure: { type: "time", seconds: 60 },
            },
          ],
        },
        {
          id: "c",
          kind: "step",
          role: "cooldown",
          measure: { type: "time", seconds: 600 },
          target: { kind: "hr", zone: 2, bpmFrom: 129, bpmTo: 142 },
        },
      ],
    };
    expect(sessionCards(content)).toEqual([
      {
        kind: "card",
        role: "warmup",
        title: "Échauffement",
        lines: ["15 min · @6:00"],
        sub: ["Footing facile"],
        path: ["w"],
      },
      {
        kind: "group",
        title: "Répéter",
        aside: "8 fois",
        path: ["r1"],
        cards: [
          {
            kind: "card",
            role: "work",
            title: "Course",
            lines: ["400 m · @4:05–4:15"],
            sub: [],
            path: ["r1", "run"],
          },
          {
            kind: "card",
            role: "rest",
            title: "Récupération",
            lines: ["1 min"],
            sub: ["Trot léger"],
            path: ["r1", "rec"],
          },
        ],
      },
      {
        kind: "card",
        role: "cooldown",
        title: "Retour au calme",
        lines: ["10 min · zone 2 · 129–142 bpm"],
        sub: [],
        path: ["c"],
      },
    ]);
  });
});

describe("Hyrox : un bloc simple = une carte ; un circuit = une grande carte", () => {
  it("chaque station sur sa carte, la transition en gris, le repos entre les tours en bas", () => {
    const content: HyroxContent = {
      discipline: "hyrox",
      items: [
        {
          id: "b0",
          kind: "block",
          format: "simple",
          title: "Échauffement",
          loads: "coach",
          lines: [{ id: "l0", kind: "erg", machine: "rowing", meters: 1000 }],
        },
        {
          id: "b1",
          kind: "block",
          format: "circuit",
          rounds: 3,
          restSec: 90,
          loads: "coach",
          lines: [
            { id: "l1", kind: "run", meters: 1000, paceSecPerKm: 330 },
            { id: "l2", kind: "station", station: "sled_push", meters: 50, loadSource: "coach" },
            {
              id: "l3",
              kind: "station",
              station: "wall_balls",
              reps: 20,
              loadKg: 6,
              loadSource: "coach",
            },
            { id: "l4", kind: "transition", seconds: 30 },
            { id: "l5", kind: "exercise", exerciseId: ID, name: "Kettlebell swing", reps: 12 },
          ],
        },
      ],
    };
    const [warmup, circuit] = sessionCards(content);
    expect(warmup).toEqual({
      kind: "card",
      role: "warmup",
      title: "Échauffement",
      lines: ["Rameur 1 km"],
      sub: [],
      path: ["b0"],
    });
    expect(circuit).toEqual({
      kind: "group",
      title: "Circuit",
      aside: "3 tours",
      footer: "Repos 1:30 entre les tours",
      path: ["b1"],
      cards: [
        {
          kind: "card",
          role: "work",
          title: "Course",
          lines: ["1 km · @5:30"],
          sub: [],
          path: ["b1", "l1"],
        },
        {
          kind: "card",
          role: "work",
          title: "Sled push",
          lines: ["50 m"],
          sub: [],
          path: ["b1", "l2"],
        },
        {
          kind: "card",
          role: "work",
          title: "Wall balls",
          lines: ["20 répétitions · 6 kg"],
          sub: [],
          path: ["b1", "l3"],
        },
        {
          kind: "card",
          role: "rest",
          title: "Transition",
          lines: ["0:30"],
          sub: [],
          path: ["b1", "l4"],
        },
        {
          kind: "card",
          role: "work",
          title: "Kettlebell swing",
          lines: ["12 répétitions"],
          sub: [],
          path: ["b1", "l5"],
          exerciseId: ID,
        },
      ],
    });
  });
});

describe("Hyrox : un bloc simple écrit ses lignes comme les cartes", () => {
  it("« Course 1 km · @6:00 », jamais « Run … min/km »", () => {
    const [warmup] = sessionCards({
      discipline: "hyrox",
      items: [
        {
          id: "b",
          kind: "block",
          format: "simple",
          title: "Échauffement",
          loads: "coach",
          lines: [
            { id: "l", kind: "run", meters: 1000, paceSecPerKm: 360 },
            { id: "m", kind: "station", station: "wall_balls", reps: 10, loadSource: "coach" },
          ],
        },
      ],
    });
    expect(warmup).toMatchObject({ lines: ["Course 1 km · @6:00", "Wall balls 10 répétitions"] });
  });
});

describe("relecture : Hyrox ne perd rien de l'ancien affichage", () => {
  it("bloc simple : temps cible des lignes, limite du bloc, exercice lié ; AMRAP renommé garde son format", () => {
    const [simple, single, finisher] = sessionCards({
      discipline: "hyrox",
      items: [
        {
          id: "b1",
          kind: "block",
          format: "simple",
          title: "Échauffement",
          timeCapSec: 900,
          loads: "coach",
          lines: [{ id: "l1", kind: "run", meters: 1000, targetSec: 360 }],
        },
        {
          id: "b2",
          kind: "block",
          format: "simple",
          title: "Gainage",
          loads: "coach",
          lines: [{ id: "l2", kind: "exercise", exerciseId: ID, name: "Planche", reps: 3 }],
        },
        {
          id: "b3",
          kind: "block",
          format: "amrap",
          title: "Finisher",
          timeCapSec: 1500,
          loads: "coach",
          lines: [
            { id: "l3", kind: "station", station: "wall_balls", reps: 15, loadSource: "coach" },
          ],
        },
      ],
    });
    expect(simple).toMatchObject({
      lines: ["Course 1 km · Temps cible 6:00"],
      sub: ["Limite 15:00"],
    });
    expect(single).toMatchObject({ exerciseId: ID });
    expect(finisher).toMatchObject({ kind: "group", title: "Finisher", aside: "AMRAP 25 min" });
  });
});

describe("séance v1 (texte) : les mêmes cartes", () => {
  it("un bloc répété devient une grande carte ; l'échauffement reste neutre", () => {
    expect(
      viewStepCards([
        { title: "Échauffement", badge: "10 min", lines: ["Footing facile"] },
        {
          title: "Fractionné",
          lines: ["Récupération en trottinant"],
          repeat: { times: 6, lines: ["400 m vite", "200 m trot"] },
        },
      ]),
    ).toEqual([
      {
        kind: "card",
        role: "warmup",
        title: "Échauffement",
        aside: "10 min",
        lines: ["Footing facile"],
        sub: [],
        path: ["0"],
      },
      {
        kind: "group",
        title: "Fractionné",
        aside: "6 fois",
        footer: "Récupération en trottinant",
        path: ["1"],
        cards: [
          { kind: "card", role: "work", title: "400 m vite", lines: [], sub: [], path: ["1", "0"] },
          { kind: "card", role: "work", title: "200 m trot", lines: [], sub: [], path: ["1", "1"] },
        ],
      },
    ]);
  });
});

describe("séance v1 : pas de doublon", () => {
  it("le volume en haut à droite disparaît quand la ligne commence déjà par lui", () => {
    const [warmup] = viewStepCards([
      {
        title: "Échauffement",
        badge: "20 min",
        lines: ["20 min @6:00 min/km, allure progressive"],
      },
    ]);
    expect(warmup).toEqual({
      kind: "card",
      role: "warmup",
      title: "Échauffement",
      lines: ["20 min @6:00 min/km, allure progressive"],
      sub: [],
      path: ["0"],
    });
  });
});

describe("plus de RIR nulle part", () => {
  it("la ligne d'un exercice (agenda, PDF, assistant) ne dit plus « RIR »", () => {
    const line = exerciseLine({
      id: "x",
      kind: "exercise",
      name: "Back squat",
      loadMode: "kg",
      sets: normal({ repsMin: 6, kg: 60, rir: 2 }, 4),
      restSec: 150,
    });
    expect(line).toBe("Back squat · 4 × 6 · 60 kg · repos 2:30");
  });
});
