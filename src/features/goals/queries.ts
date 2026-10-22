import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { GoalPriority, GoalStatus, GoalType, HyroxCategory } from "./schemas";

export type GoalEntry = {
  id: string;
  type: GoalType;
  description: string | null;
  targetDate: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  competitionName: string | null;
  competitionLocation: string | null;
  hyroxCategory: HyroxCategory | null;
};

export type AthleteGoals = {
  // En cours : le principal d'abord, puis par date (les objectifs sans date à la fin).
  current: GoalEntry[];
  // Atteints ou abandonnés : l'historique, du plus récent au plus ancien.
  past: GoalEntry[];
};

// Objectifs d'un sportif, dans une organisation dont l'accès a DÉJÀ été vérifié (requireOrgAccess).
export async function listGoals(organizationId: string, athleteId: string): Promise<AthleteGoals> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_goals")
    .select(
      "id, goal_type, description, target_date, priority, status, competition_name, competition_location, hyrox_category, updated_at",
    )
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .order("target_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error("Lecture des objectifs impossible.");

  const goals = (data ?? []).map((row) => ({
    entry: {
      id: row.id,
      // Les contraintes CHECK en base garantissent ces listes fermées.
      type: row.goal_type as GoalType,
      description: row.description,
      targetDate: row.target_date,
      priority: row.priority as GoalPriority,
      status: row.status as GoalStatus,
      competitionName: row.competition_name,
      competitionLocation: row.competition_location,
      hyroxCategory: row.hyrox_category as HyroxCategory | null,
    } satisfies GoalEntry,
    updatedAt: row.updated_at,
  }));

  const current = goals
    .filter(({ entry }) => entry.status === "active")
    .map(({ entry }) => entry)
    .sort((a, b) => Number(b.priority === "main") - Number(a.priority === "main"));
  const past = goals
    .filter(({ entry }) => entry.status !== "active")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(({ entry }) => entry);

  return { current, past };
}
