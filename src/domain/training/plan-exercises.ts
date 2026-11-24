import type { SessionContent } from "./session-v2";

// Les exercices de la Bibliothèque cités par un programme ou un modèle (exercices seuls, et ceux d'un
// superset ou d'un EMOM). La page du programme n'envoie au navigateur que leurs fiches, pour régler
// une étape depuis la « Séance choisie » (24/11/2026). Règle pure.
export function planExerciseIds(plan: {
  weeks: readonly { sessions: readonly { content: SessionContent }[] }[];
}): Set<string> {
  const ids = new Set<string>();
  for (const week of plan.weeks) {
    for (const session of week.sessions) {
      if (session.content.discipline !== "strength") continue;
      for (const item of session.content.items) {
        if (item.kind === "exercise" && item.exerciseId) ids.add(item.exerciseId);
        if (item.kind === "superset" || item.kind === "emom") {
          for (const exercise of item.exercises)
            if (exercise.exerciseId) ids.add(exercise.exerciseId);
        }
      }
    }
  }
  return ids;
}
