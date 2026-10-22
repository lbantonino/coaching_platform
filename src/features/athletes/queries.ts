import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type {
  AthleteLevel,
  AthleteListFilter,
  AthleteStatus,
  ContactChannel,
  TrainingPlace,
} from "./schemas";

export type AthleteListItem = {
  id: string;
  displayName: string;
  email: string | null;
  status: AthleteStatus;
  hasAccount: boolean;
  hasPendingInvite: boolean;
};

const DEFAULT_FILTER: AthleteListFilter = { status: "active", q: "" };

// Sportifs d'une organisation. À appeler APRÈS requireOrgAccess(organizationId) ;
// la RLS filtre de toute façon les fiches des autres organisations.
// La recherche texte est faite ici côté serveur, en mémoire : volumes de l'ordre de quelques dizaines
// de sportifs par coach. À remplacer par une recherche en base paginée si les volumes grandissent.
export async function listAthletes(
  organizationId: string,
  filter: AthleteListFilter = DEFAULT_FILTER,
): Promise<AthleteListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("athlete_profiles")
    .select(
      "id, first_name, display_name, email, status, athlete_user_id, athlete_invites ( status, expires_at )",
    )
    .eq("organization_id", organizationId)
    .order("display_name");
  if (filter.status !== "all") query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw new Error("Lecture des sportifs impossible.");

  const now = new Date();
  return (data ?? [])
    .map((row) => ({
      id: row.id,
      // display_name est calculé par la base (prénom + nom) : jamais vide, le repli ne sert qu'au typage.
      displayName: row.display_name ?? row.first_name,
      email: row.email,
      // La contrainte CHECK en base garantit active | paused | archived.
      status: row.status as AthleteStatus,
      hasAccount: row.athlete_user_id !== null,
      hasPendingInvite: row.athlete_invites.some(
        (invite) => invite.status === "pending" && new Date(invite.expires_at) > now,
      ),
    }))
    .filter(
      (athlete) =>
        !filter.q ||
        athlete.displayName.toLowerCase().includes(filter.q) ||
        (athlete.email ?? "").toLowerCase().includes(filter.q),
    );
}

export type AthleteDetail = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  preferredContact: ContactChannel | null;
  level: AthleteLevel | null;
  experience: string | null;
  trainingPlaces: TrainingPlace[];
  equipment: string | null;
  status: AthleteStatus;
  hasAccount: boolean;
  createdAt: string;
};

// Fiche d'un sportif dans une organisation dont l'accès a DÉJÀ été vérifié.
// null si l'ID est invalide ou appartient à une autre organisation (même réponse : pas de fuite).
export async function getAthlete(
  organizationId: string,
  athleteId: string,
): Promise<AthleteDetail | null> {
  if (!z.uuid().safeParse(athleteId).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_profiles")
    .select(
      "id, first_name, last_name, display_name, email, phone, preferred_contact, level, experience, training_places, equipment, status, athlete_user_id, created_at",
    )
    .eq("id", athleteId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw new Error("Lecture de la fiche impossible.");
  if (!data) return null;

  return {
    id: data.id,
    displayName: data.display_name ?? data.first_name,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    // Les contraintes CHECK en base garantissent ces listes fermées.
    preferredContact: data.preferred_contact as ContactChannel | null,
    level: data.level as AthleteLevel | null,
    experience: data.experience,
    trainingPlaces: data.training_places as TrainingPlace[],
    equipment: data.equipment,
    status: data.status as AthleteStatus,
    hasAccount: data.athlete_user_id !== null,
    createdAt: data.created_at,
  };
}
