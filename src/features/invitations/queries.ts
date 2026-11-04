import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { hashInvitationToken } from "./token";

export type InviteTarget = {
  athleteId: string;
  displayName: string;
  // Page « Inviter » (kit « Coory Pages », D-119) : prénom (« Inviter Sophie » sur téléphone, texte
  // prérempli des messages), photo, sexe (« invitée » / « invité ») et téléphone (WhatsApp, SMS).
  firstName: string;
  photoPath: string | null;
  sex: "female" | "male" | null;
  phone: string | null;
  email: string | null;
  hasAccount: boolean;
  pendingInvite: { expiresAt: string; expired: boolean } | null;
};

// Fiche à inviter, dans une organisation dont l'accès a DÉJÀ été vérifié (requireOrgAccess).
// null si l'ID est invalide ou n'appartient pas à cette organisation (même réponse : pas de fuite).
export async function getInviteTarget(
  organizationId: string,
  athleteId: string,
): Promise<InviteTarget | null> {
  if (!z.uuid().safeParse(athleteId).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_profiles")
    .select(
      "id, first_name, display_name, email, phone, sex, photo_path, athlete_user_id, athlete_invites ( status, expires_at )",
    )
    .eq("id", athleteId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw new Error("Lecture de la fiche impossible.");
  if (!data) return null;

  const pending = data.athlete_invites.find((invite) => invite.status === "pending");
  return {
    athleteId: data.id,
    displayName: data.display_name ?? data.first_name,
    firstName: data.first_name,
    photoPath: data.photo_path,
    sex: data.sex === "female" || data.sex === "male" ? data.sex : null,
    phone: data.phone,
    email: data.email,
    hasAccount: data.athlete_user_id !== null,
    pendingInvite: pending
      ? { expiresAt: pending.expires_at, expired: new Date(pending.expires_at) <= new Date() }
      : null,
  };
}

export type PublicInvitation = {
  organizationName: string;
  athleteName: string;
  email: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
};

// Lecture par la personne qui détient le lien (page publique). Passe par une fonction SQL qui ne
// renvoie que l'invitation correspondant à l'empreinte du jeton.
export async function getPublicInvitation(token: string): Promise<PublicInvitation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invitation", {
    p_token_hash: hashInvitationToken(token),
  });
  if (error) throw new Error("Lecture de l'invitation impossible.");

  const row = data?.[0];
  if (!row) return null;
  return {
    organizationName: row.organization_name,
    athleteName: row.athlete_name,
    email: row.email,
    status: row.invite_status as PublicInvitation["status"],
    expiresAt: row.expires_at,
  };
}
