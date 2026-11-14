import { formatRaceTime } from "@/features/records/schemas";

import type { GoalEntry } from "./queries";
import type { GoalFormInput } from "./schemas";

// « Modifier l'objectif » pré-rempli depuis l'objectif enregistré : la fenêtre de la fiche et
// l'Assistant IA (lot 5, qui fusionne ses changements dans ces valeurs) partagent cette règle.
export function goalFormValues(goal: GoalEntry): GoalFormInput {
  return {
    goalType: goal.type,
    priority: goal.priority,
    targetDate: goal.targetDate ?? "",
    targetTime: goal.targetTimeSeconds ? formatRaceTime(goal.targetTimeSeconds) : "",
    isCompetition: goal.competitionName !== null,
    competitionName: goal.competitionName ?? "",
    competitionLocation: goal.competitionLocation ?? "",
    hyroxCategory: goal.hyroxCategory ?? "",
    description: goal.description ?? "",
  };
}
