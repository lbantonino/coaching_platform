import { describe, expect, it } from "vitest";

import { planExerciseIds } from "@/domain/training/plan-exercises";

import { GENERATED_TEMPLATES } from "../../scripts/modeles-coory/modeles";

// « Séance choisie » modifiable dans le programme (24/11/2026) : la page n'envoie que les fiches de
// Bibliothèque des exercices du programme (exercices seuls, dans un superset ou un EMOM).
describe("exercices d'un programme", () => {
  it("rien pour un programme sans musculation", () => {
    const running = { weeks: [{ sessions: [{ content: { discipline: "running", items: [] } }] }] };
    expect(planExerciseIds(running as never).size).toBe(0);
  });

  it("les exercices seuls et ceux des groupes, une seule fois chacun", () => {
    const plan = {
      weeks: [
        {
          sessions: [
            {
              content: {
                discipline: "strength",
                items: [
                  { kind: "exercise", id: "a", exerciseId: "x1" },
                  {
                    kind: "superset",
                    id: "g",
                    exercises: [{ id: "b", exerciseId: "x2" }, { id: "c" }],
                  },
                  { kind: "emom", id: "e", exercises: [{ id: "d", exerciseId: "x1" }] },
                ],
              },
            },
          ],
        },
      ],
    };
    expect([...planExerciseIds(plan as never)].sort()).toEqual(["x1", "x2"]);
  });

  it("un vrai modèle hybride : des exercices de la Bibliothèque", () => {
    expect(planExerciseIds(GENERATED_TEMPLATES[6]!.plan).size).toBeGreaterThan(0);
  });
});
