import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { CoachProof, ConsentAction, ConsentSource } from "./schemas";

export type ConsentEvent = {
  id: string;
  action: ConsentAction;
  source: ConsentSource;
  proof: CoachProof | null;
  recordedAt: string;
};

// Journal des accords d'un sportif (le plus récent d'abord), pour une organisation DÉJÀ vérifiée.
export async function listConsentEvents(
  organizationId: string,
  athleteId: string,
): Promise<ConsentEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_consents")
    .select("id, action, source, coach_proof, recorded_at")
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .order("recorded_at", { ascending: false });

  if (error) throw new Error("Lecture du journal des accords impossible.");

  return (data ?? []).map((row) => ({
    id: row.id,
    // Les contraintes CHECK en base garantissent ces valeurs.
    action: row.action as ConsentAction,
    source: row.source as ConsentSource,
    proof: row.coach_proof as CoachProof | null,
    recordedAt: row.recorded_at,
  }));
}

export type OwnHealthConsent = {
  athleteId: string;
  organizationName: string;
  consentAt: string | null;
  healthConstraints: string | null;
};

// Espace sportif : l'accord en cours et ce que le coach a noté, pour chaque organisation qui le suit.
// La RLS ne laisse lire au sportif que SA fiche.
export async function getOwnHealthConsents(userId: string): Promise<OwnHealthConsent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("id, health_consent_at, health_constraints, organizations ( name )")
    .eq("athlete_user_id", userId)
    .neq("status", "archived");

  if (error) throw new Error("Lecture de l'accord impossible.");

  return (data ?? []).map((row) => ({
    athleteId: row.id,
    organizationName: row.organizations.name,
    consentAt: row.health_consent_at,
    healthConstraints: row.health_constraints,
  }));
}
