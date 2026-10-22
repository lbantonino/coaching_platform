import { Badge } from "@/components/ui/badge";
import { disciplineLabels, disciplineTones } from "@/domain/training/discipline";
import { goalDiscipline, type GoalType } from "@/features/goals/schemas";

// Pastille colorée de la discipline d'un objectif (D-23). Rien pour un objectif personnel.
export function GoalDisciplineBadge({ type }: { type: GoalType }) {
  const discipline = goalDiscipline(type);
  return discipline ? (
    <Badge tone={disciplineTones[discipline]}>{disciplineLabels[discipline]}</Badge>
  ) : null;
}
