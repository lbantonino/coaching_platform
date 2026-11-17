import { describe, expect, it } from "vitest";

import {
  cardLines,
  detailItems,
  isExercise,
  lineParts,
  shortLine,
  strengthDetailParts,
  strengthShort,
} from "@/domain/training/card-lines";

describe("lignes des cartes de l'agenda (2c)", () => {
  it("raccourcit sans rien perdre", () => {
    expect(shortLine("20 min @6:00 min/km, allure progressive")).toBe("20 min · 6:00 /km");
    expect(shortLine("1:45 min de récupération (trot lent)")).toBe("récup 1:45 (trot lent)");
    expect(shortLine("4 min @4:55 min/km")).toBe("4 min · 4:55 /km");
    // Une simple liste n'est pas coupée (16/11) : la coupure ne retire qu'un commentaire après une mesure.
    expect(shortLine("Hanches, épaules, colonne")).toBe("Hanches, épaules, colonne");
    expect(shortLine("Run 1 km, facile")).toBe("Run 1 km");
    // La récup garde son unité et sa cible (cas d'Antonino du 10/11).
    expect(shortLine("1 min de récupération Z2 · 130-145 bpm")).toBe(
      "récup 1 min · Z2 · 130–145 bpm",
    );
    expect(shortLine("10 min · Z2 · 130-150 bpm")).toBe("10 min · Z2 · 130–150 bpm");
  });
  it("garde le bloc répété ensemble : l'effort puis sa récup", () => {
    expect(
      cardLines({
        steps: [
          { title: "Échauffement", badge: "10 min", lines: ["10 min @6:30–6:40 min/km"] },
          {
            title: "Répéter 4 fois",
            lines: [],
            repeat: {
              times: 4,
              lines: ["3 min @4:50–5:10 min/km", "1 min de récupération Z2 · 130-145 bpm"],
            },
          },
          { title: "Course", lines: ["10 min · Z2 · 130-150 bpm"] },
        ],
      }),
    ).toEqual([
      { kind: "line", text: "10 min · 6:30–6:40 /km" },
      {
        kind: "repeat",
        times: 4,
        lines: ["3 min · 4:50–5:10 /km", "récup 1 min · Z2 · 130–145 bpm"],
      },
      { kind: "line", text: "10 min · Z2 · 130–150 bpm" },
    ]);
  });
  it("Running : en minutes, jamais en heures, même pour une séance écrite en texte", () => {
    expect(
      cardLines({
        discipline: "running",
        steps: [{ title: "Sortie longue", lines: ["1 h 20 @5:45–6:20 min/km"] }],
      }),
    ).toEqual([{ kind: "line", text: "80 min · 5:45–6:20 /km" }]);
  });
  it("découpe une ligne pour le contraste : durée en gras, plage de FC en italique", () => {
    expect(lineParts("récup 1 min · Z2 · 130–145 bpm")).toEqual([
      { text: "récup ", tone: "plain" },
      { text: "1 min", tone: "strong" },
      { text: " · Z2 · ", tone: "plain" },
      { text: "130–145 bpm", tone: "soft" },
    ]);
    expect(lineParts("récup 1:30")).toEqual([
      { text: "récup ", tone: "plain" },
      { text: "1:30", tone: "strong" },
    ]);
    expect(lineParts("800 m @ 4:45–4:55")).toEqual([
      { text: "800 m", tone: "strong" },
      { text: " @ 4:45–4:55", tone: "plain" },
    ]);
  });
  it("Hyrox et musculation : rien ne manque", () => {
    expect(shortLine("Run 1,5 km @5:30 min/km")).toBe("Run 1,5 km · 5:30 /km");
    expect(shortLine("SkiErg 500 m @2:10 min/500 m")).toBe("SkiErg 500 m · 2:10 /500 m");
    expect(
      cardLines({
        discipline: "hyrox",
        steps: [
          {
            title: "AMRAP",
            badge: "AMRAP 20 min",
            lines: ["Run 400 m @5:15 min/km", "Farmers carry 50 m · 2 × 16 kg"],
          },
        ],
      }),
    ).toEqual([
      {
        kind: "group",
        label: "AMRAP 20 min",
        lines: ["Run 400 m · 5:15 /km", "Farmers carry 50 m · 2 × 16 kg"],
      },
    ]);
    expect(shortLine("Burpee broad jumps 40 m")).toBe("Burpee broad jumps 40 m");
    expect(
      cardLines({
        discipline: "hyrox",
        steps: [{ title: "Bloc", lines: ["Burpee broad jumps 40 m"] }],
      }),
    ).toEqual([{ kind: "line", text: "BBJ 40 m" }]);
  });
  it("musculation : la carte la plus courte, le nom et le volume seulement", () => {
    expect(strengthShort("Back squat · 4 × 6 · 40 kg · RIR 2 · repos 2:30")).toBe(
      "Back squat 4 × 6",
    );
    expect(strengthShort("Soulevé de terre roumain · 3 × 8 · 35 kg")).toBe("SDT roumain 3 × 8");
    expect(strengthShort("Leg curl assis · 20-15-10-8")).toBe("Leg curl assis 20-15-10-8");
    expect(strengthShort("Descendre sous la parallèle")).toBeNull();
    expect(
      cardLines({
        discipline: "strength",
        steps: [
          { title: "Échauffement", lines: ["Mobilité hanches et chevilles, 2 tours de 10 squats"] },
          {
            title: "Exercices",
            badge: "2 exercices",
            lines: [
              "Back squat · 4 × 6 · 40 kg · RIR 2 · repos 2:30",
              "Descendre sous la parallèle",
              "Soulevé de terre roumain · 3 × 8 · 35 kg · RIR 2 · repos 2 min",
            ],
          },
          {
            title: "Superset",
            badge: "3 tours",
            lines: ["Repos 1:30 min en fin de tour"],
            repeat: {
              times: 3,
              lines: ["Fentes marchées · 10 · 8 kg", "Hip thrust barre · 12 · 40 kg"],
            },
          },
          {
            title: "EMOM",
            badge: "10 min",
            lines: ["Chaque minute, au début de la minute", "Kettlebell swing · 15 · 16 kg"],
          },
          { title: "Retour au calme", lines: ["Étirements fessiers et ischios, 5 min"] },
        ],
      }),
    ).toEqual([
      { kind: "line", text: "Back squat 4 × 6" },
      { kind: "line", text: "SDT roumain 3 × 8" },
      { kind: "repeat", times: 3, lines: ["Fentes marchées 10", "Hip thrust barre 12"] },
      // Écrit comme « Superset · 3 tours » (16/11) : le nom, puis sa durée.
      { kind: "group", label: "EMOM · 10 min", lines: ["KB swing 15"] },
    ]);
  });
  it("Hyrox et musculation : le mouvement et son volume en gras, l'intensité normale", () => {
    expect(lineParts("Run 1 km @ 6:00", "hyrox")).toEqual([
      { text: "Run 1 km", tone: "strong" },
      { text: " @ 6:00", tone: "plain" },
    ]);
    expect(lineParts("Sled push 50 m · 102 kg", "hyrox")).toEqual([
      { text: "Sled push 50 m", tone: "strong" },
      { text: " · 102 kg", tone: "plain" },
    ]);
    expect(lineParts("Transition 30 s", "hyrox")).toEqual([
      { text: "Transition 30 s", tone: "strong" },
    ]);
    // « Repos 1:30 min entre les tours » (workload des fiches PDF) : la durée seule en gras.
    expect(lineParts("Repos 1:30 min entre les tours", "hyrox")).toEqual([
      { text: "Repos ", tone: "plain" },
      { text: "1:30 min", tone: "strong" },
      { text: " entre les tours", tone: "plain" },
    ]);
    expect(lineParts("Objectif 3 tours", "hyrox")).toEqual([
      { text: "Objectif 3 tours", tone: "plain" },
    ]);
    expect(lineParts("Back squat 4 × 6", "strength")).toEqual([
      { text: "Back squat 4 × 6", tone: "strong" },
    ]);
    // Le Running ne change pas : la durée seule en gras.
    expect(lineParts("Run 1 km @ 6:00", "running")).toEqual([
      { text: "Run 1 km @ 6:00", tone: "plain" },
    ]);
  });
  it("une puce devant chaque exercice, pas devant une récup ou un objectif", () => {
    for (const text of [
      "40 min · Z2 · 135–150 bpm",
      "Run 1 km @ 6:00",
      "BBJ 40 m",
      "Transition 30 s",
      "Back squat 4 × 6",
    ]) {
      expect(isExercise(text)).toBe(true);
    }
    for (const text of ["récup 1:30 (trot)", "repos 2 min", "Objectif 3 tours"]) {
      expect(isExercise(text)).toBe(false);
    }
  });
});

describe("détail d'une séance (panneau de l'éditeur)", () => {
  it("musculation : le nom, les séries × répétitions et le repos en gras", () => {
    expect(strengthDetailParts("Back squat · 4 × 6 · 40 kg · RIR 2 · repos 2:30")).toEqual([
      { text: "Back squat", tone: "strong" },
      { text: " · ", tone: "plain" },
      { text: "4 × 6", tone: "strong" },
      { text: " · ", tone: "plain" },
      { text: "40 kg", tone: "plain" },
      { text: " · ", tone: "plain" },
      { text: "RIR 2", tone: "plain" },
      { text: " · ", tone: "plain" },
      { text: "repos 2:30", tone: "strong" },
    ]);
    expect(strengthDetailParts("Descendre sous la parallèle")).toBeNull();
  });

  it("une info par ligne, noms entiers ; la consigne et le repos du tour complètent l'exercice", () => {
    expect(
      detailItems(
        {
          title: "Circuit",
          badge: "3 tours",
          lines: ["Repos 1:30 min entre les tours"],
          repeat: { times: 3, lines: ["Run 1 km @5:30 min/km", "Burpee broad jumps 40 m"] },
        },
        "hyrox",
      ),
    ).toEqual([
      { text: "Run 1 km · 5:30 /km", exercise: true, parts: null },
      { text: "Burpee broad jumps 40 m", exercise: true, parts: null },
      { text: "Repos 1:30 min entre les tours", exercise: false, parts: null },
    ]);
    const strength = detailItems(
      {
        title: "Exercices",
        lines: ["Back squat · 4 × 6 · 40 kg · repos 2:30", "Descendre sous la parallèle"],
      },
      "strength",
    );
    expect(strength.map((item) => item.exercise)).toEqual([true, false]);
    expect(strength[1]!.parts).toEqual([{ text: "Descendre sous la parallèle", tone: "plain" }]);
    expect(
      detailItems({ title: "Échauffement", lines: ["Mobilité"] }, "strength")[0]!.exercise,
    ).toBe(true);
    expect(
      detailItems({ title: "Course", lines: ["1:45 min de récupération (trot lent)"] }, "running"),
    ).toEqual([{ text: "récup 1:45 (trot lent)", exercise: false, parts: null }]);
  });
});
