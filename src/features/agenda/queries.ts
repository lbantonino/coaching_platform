import "server-only";

import type { Discipline } from "@/domain/training/discipline";
import {
  goalDiscipline,
  goalTypeLabels,
  hyroxCategoryLabels,
  type GoalStatus,
  type GoalType,
  type HyroxCategory,
} from "@/features/goals/schemas";
import { createClient } from "@/lib/supabase/server";

// Une échéance de l'agenda : un objectif DATÉ (compétition ou objectif avec date cible).
// Les séances s'y ajouteront avec les programmes (P4/P5) ; rien n'est inventé en attendant.
export type AgendaEvent = {
  id: string;
  date: string;
  athleteId: string;
  athleteName: string;
  title: string;
  // « Hyrox · Pro · Bruxelles », « Course 10 km · Bruxelles »… ; vide s'il n'y a rien à ajouter.
  detail: string;
  discipline: Discipline | null;
  isMain: boolean;
  achieved: boolean;
  // Une vraie compétition (avec un nom), pas un simple objectif daté.
  isCompetition: boolean;
};

// Échéances de l'organisation (déjà vérifiée par requireOrgAccess) : objectifs en cours ou atteints,
// avec une date, de sportifs non archivés. Un objectif abandonné disparaît de l'agenda.
export async function listAgendaEvents(organizationId: string): Promise<AgendaEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_goals")
    .select(
      "id, goal_type, priority, status, target_date, competition_name, competition_location, hyrox_category, athlete_id, athlete_profiles!inner ( first_name, display_name, status )",
    )
    .eq("organization_id", organizationId)
    .not("target_date", "is", null)
    .in("status", ["active", "achieved"])
    .neq("athlete_profiles.status", "archived")
    .order("target_date", { ascending: true });

  if (error) throw new Error("Lecture de l'agenda impossible.");

  return (data ?? []).flatMap((row) => {
    if (!row.target_date) return [];
    // Les contraintes CHECK en base garantissent ces listes fermées.
    const type = row.goal_type as GoalType;
    const category = row.hyrox_category as HyroxCategory | null;
    // Sans nom de compétition, le titre EST déjà le type : on ne le répète pas dans le détail.
    const detail = [
      row.competition_name ? goalTypeLabels[type] : null,
      category ? hyroxCategoryLabels[category] : null,
      row.competition_location,
    ]
      .filter(Boolean)
      .join(" · ");
    return [
      {
        id: row.id,
        date: row.target_date,
        athleteId: row.athlete_id,
        // display_name est calculé par la base : jamais vide, le repli ne sert qu'au typage.
        athleteName: row.athlete_profiles.display_name ?? row.athlete_profiles.first_name,
        title: row.competition_name ?? goalTypeLabels[type],
        detail,
        discipline: goalDiscipline(type),
        isMain: row.priority === "main",
        isCompetition: row.competition_name !== null,
        achieved: (row.status as GoalStatus) === "achieved",
      },
    ];
  });
}
