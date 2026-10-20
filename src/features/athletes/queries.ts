import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { AthleteStatus } from "./schemas";

export type AthleteListItem = {
  id: string;
  displayName: string;
  email: string | null;
  status: AthleteStatus;
  hasAccount: boolean;
};

// Sportifs d'une organisation. À appeler APRÈS requireOrgAccess(organizationId) ;
// la RLS filtre de toute façon les fiches des autres organisations.
export async function listAthletes(organizationId: string): Promise<AthleteListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("id, display_name, email, status, athlete_user_id")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("display_name");

  if (error) throw new Error("Lecture des sportifs impossible.");

  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    // La contrainte CHECK en base garantit active | paused | archived.
    status: row.status as AthleteStatus,
    hasAccount: row.athlete_user_id !== null,
  }));
}
