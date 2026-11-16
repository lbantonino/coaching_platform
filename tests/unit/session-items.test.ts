import { describe, expect, it } from "vitest";

import {
  canDuplicateAt,
  canRemoveAt,
  duplicateAt,
  removeAt,
} from "@/domain/training/session-items";
import type {
  HyroxContent,
  RunningContent,
  StrengthContent,
  StrengthExercise,
} from "@/domain/training/session-v2";

// « ⋯ » des cartes de la page du programme (D-187) : Dupliquer et Supprimer une étape, par son chemin
// ([id] ou [id du groupe, id de l'étape]), avec les mêmes règles que l'éditeur de séance.

const exercise = (id: string, name: string): StrengthExercise => ({
  id,
  kind: "exercise",
  name,
  loadMode: "kg",
  sets: [{ type: "normal", repsMin: 8, kg: 40 }],
});
const strength: StrengthContent = {
  discipline: "strength",
  warmup: "Vélo",
  items: [
    exercise("a", "Squat"),
    {
      id: "s",
      kind: "superset",
      rounds: 3,
      restSec: 90,
      exercises: [exercise("t", "Tractions"), exercise("d", "Dips")],
    },
  ],
};

describe("musculation", () => {
  it("dupliquer un exercice : la copie juste après, un nouvel identifiant", () => {
    const next = duplicateAt(strength, ["a"]) as StrengthContent;
    expect(next.items.map((item) => item.kind)).toEqual(["exercise", "exercise", "superset"]);
    const copy = next.items[1] as StrengthExercise;
    expect(copy).toMatchObject({ name: "Squat", sets: [{ repsMin: 8, kg: 40 }] });
    expect(copy.id).not.toBe("a");
  });

  it("dans un superset : dupliquer ajoute un exercice ; en retirer un sur deux le dissout", () => {
    const more = duplicateAt(strength, ["s", "t"]) as StrengthContent;
    const superset = more.items[1];
    expect(superset?.kind === "superset" && superset.exercises.map((x) => x.name)).toEqual([
      "Tractions",
      "Tractions",
      "Dips",
    ]);
    const less = removeAt(strength, ["s", "d"]) as StrengthContent;
    expect(less.items).toEqual([
      exercise("a", "Squat"),
      { ...exercise("t", "Tractions"), restSec: 90 },
    ]);
  });

  it("l'échauffement se retire mais ne se duplique pas ; la séance garde au moins un élément", () => {
    expect((removeAt(strength, ["warmup"]) as StrengthContent).warmup).toBeUndefined();
    expect(canDuplicateAt(strength, ["warmup"])).toBe(false);
    const alone: StrengthContent = { discipline: "strength", items: [exercise("a", "Squat")] };
    expect(canRemoveAt(alone, ["a"])).toBe(false);
    expect(removeAt(alone, ["a"])).toBe(alone);
    expect(canRemoveAt(strength, ["a"])).toBe(true);
  });
});

describe("course", () => {
  const running: RunningContent = {
    discipline: "running",
    items: [
      {
        id: "r",
        kind: "repeat",
        times: 8,
        steps: [
          { id: "run", kind: "step", role: "run", measure: { type: "distance", meters: 400 } },
          { id: "rec", kind: "step", role: "recovery", measure: { type: "time", seconds: 60 } },
        ],
      },
    ],
  };

  it("une étape de « Répéter » se duplique dedans ; le bloc entier aussi, avec de nouveaux identifiants", () => {
    const inner = duplicateAt(running, ["r", "run"]) as RunningContent;
    const repeat = inner.items[0];
    expect(repeat?.kind === "repeat" && repeat.steps.map((step) => step.role)).toEqual([
      "run",
      "run",
      "recovery",
    ]);
    const whole = duplicateAt(running, ["r"]) as RunningContent;
    const ids = whole.items.flatMap((item) =>
      item.kind === "repeat" ? [item.id, ...item.steps.map((step) => step.id)] : [item.id],
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(whole.items).toHaveLength(2);
  });

  it("retirer la dernière étape de l'unique bloc : refusé", () => {
    const single = removeAt(running, ["r", "rec"]) as RunningContent;
    expect(canRemoveAt(single, ["r", "run"])).toBe(false);
  });
});

describe("relecture : une ligne d'un bloc texte répété (séance v1 convertie)", () => {
  it("« Supprimer » n'est pas proposé : rien ne changerait", () => {
    const converted: RunningContent = {
      discipline: "running",
      items: [
        {
          id: "t1",
          kind: "text",
          title: "Bloc principal",
          lines: [],
          repeat: { times: 5, lines: ["4 min vite", "1:45 min trot"] },
        },
      ],
    };
    expect(canRemoveAt(converted, ["t1", "0"])).toBe(false);
    expect(removeAt(converted, ["t1", "0"])).toBe(converted);
    expect(canDuplicateAt(converted, ["t1", "0"])).toBe(false);
  });
});

describe("Hyrox", () => {
  const hyrox: HyroxContent = {
    discipline: "hyrox",
    items: [
      {
        id: "b",
        kind: "block",
        format: "circuit",
        rounds: 3,
        loads: "coach",
        lines: [
          { id: "l1", kind: "run", meters: 1000 },
          { id: "l2", kind: "transition", seconds: 30 },
        ],
      },
    ],
  };

  it("une ligne d'un circuit se duplique et se retire ; le bloc entier se duplique", () => {
    const more = duplicateAt(hyrox, ["b", "l1"]) as HyroxContent;
    const block = more.items[0];
    expect(block?.kind === "block" && block.lines.map((line) => line.kind)).toEqual([
      "run",
      "run",
      "transition",
    ]);
    const less = removeAt(hyrox, ["b", "l2"]) as HyroxContent;
    expect(less.items[0]?.kind === "block" && less.items[0].lines).toHaveLength(1);
    expect((duplicateAt(hyrox, ["b"]) as HyroxContent).items).toHaveLength(2);
  });
});
