"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { FEATURES, NOT_AVAILABLE_TEXT } from "@/config/features";
import { fieldErrors } from "@/features/auth/field-errors";
import { requireOrgAccess } from "@/features/auth/guards";
import { newPasswordSchema } from "@/features/auth/schemas";
import { getCurrentUser } from "@/features/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { getInviteTarget, getPublicInvitation } from "./queries";
import {
  generateInvitationToken,
  hashInvitationToken,
  INVITATION_VALIDITY_DAYS,
  invitationTokenSchema,
} from "./token";

// ---------------------------------------------------------------------------
// Côté coach
// ---------------------------------------------------------------------------

export type CreateInvitationState = {
  error: string | null;
  link: string | null;
  expiresAt: string | null;
};

// Génère un lien d'invitation. Le lien n'est affiché qu'UNE fois : seule son empreinte est stockée.
// Générer un nouveau lien révoque le précédent.
export async function createInvitation(
  organizationId: string,
  athleteId: string,
): Promise<CreateInvitationState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  // MVP espace coach seul (D-167) : l'action reste appelable directement, elle refuse donc aussi.
  if (!FEATURES.invitations) return { error: NOT_AVAILABLE_TEXT, link: null, expiresAt: null };
  const origin = (await headers()).get("origin");
  if (!origin) return { error: "Requête invalide. Recharge la page.", link: null, expiresAt: null };
  return inviteOne(membership.organizationId, user.id, athleteId, origin);
}

// Invitation groupée (liste des sportifs, maquette du 03/11/2026) : un lien par sportif coché, avec
// les mêmes règles qu'une invitation seule (e-mail obligatoire, pas de compte déjà activé). Le coach
// copie ensuite chaque lien : Coory n'envoie pas d'e-mail pour l'instant.
export type BulkInvitation = { athleteId: string; name: string } & CreateInvitationState;

export async function createInvitations(
  organizationId: string,
  athleteIds: string[],
): Promise<BulkInvitation[]> {
  const { user, membership } = await requireOrgAccess(organizationId);
  if (!FEATURES.invitations) return [];
  const origin = (await headers()).get("origin");
  const ids = [...new Set(athleteIds)].slice(0, 100);
  const results: BulkInvitation[] = [];
  for (const athleteId of ids) {
    const target = await getInviteTarget(membership.organizationId, athleteId);
    if (!target) continue;
    const state = origin
      ? await inviteOne(membership.organizationId, user.id, athleteId, origin)
      : { error: "Requête invalide. Recharge la page.", link: null, expiresAt: null };
    results.push({ athleteId, name: target.displayName, ...state });
  }
  return results;
}

async function inviteOne(
  organizationId: string,
  userId: string,
  athleteId: string,
  origin: string,
): Promise<CreateInvitationState> {
  const target = await getInviteTarget(organizationId, athleteId);

  if (!target) return { error: "Sportif introuvable.", link: null, expiresAt: null };
  if (target.hasAccount) {
    return { error: "Ce sportif a déjà activé son compte.", link: null, expiresAt: null };
  }
  if (!target.email) {
    return {
      error:
        "Ajoute d'abord une adresse e-mail à la fiche : elle servira d'identifiant au sportif.",
      link: null,
      expiresAt: null,
    };
  }

  const supabase = await createClient();

  // Une seule invitation en attente par fiche : l'ancienne est révoquée.
  const { error: revokeError } = await supabase
    .from("athlete_invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("athlete_id", target.athleteId)
    .eq("status", "pending");
  if (revokeError)
    return { error: "Impossible de remplacer l'ancien lien.", link: null, expiresAt: null };

  const token = generateInvitationToken();
  const expiresAt = new Date(
    Date.now() + INVITATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("athlete_invites").insert({
    organization_id: organizationId,
    athlete_id: target.athleteId,
    token_hash: hashInvitationToken(token),
    expires_at: expiresAt,
    created_by: userId,
  });
  if (error)
    return { error: "Le lien n'a pas pu être créé. Réessaie.", link: null, expiresAt: null };

  return { error: null, link: `${origin}/invitation/${token}`, expiresAt };
}

export async function revokeInvitation(organizationId: string, athleteId: string) {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(athleteId).success) return;
  const supabase = await createClient();
  await supabase
    .from("athlete_invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("athlete_id", athleteId)
    .eq("organization_id", membership.organizationId)
    .eq("status", "pending");
  redirect(`/coach/o/${membership.organizationId}/sportifs/${athleteId}/inviter`);
}

// ---------------------------------------------------------------------------
// Côté sportif
// ---------------------------------------------------------------------------

export type AcceptInvitationState = {
  // Erreur générale (bandeau) ; erreurs de saisie sous les champs (password, confirmation, adult).
  error: string | null;
  fields: Record<string, string>;
};

const acceptErrors: Record<string, string> = {
  invitation_invalide: "Ce lien n'est plus valable. Demande un nouveau lien à ton coach.",
  invitation_expiree: "Ce lien a expiré. Demande un nouveau lien à ton coach.",
  age_non_confirme: "Tu dois confirmer avoir 18 ans ou plus.",
  email_different:
    "Tu es connecté avec un compte dont l'e-mail ne correspond pas à cette invitation. Déconnecte-toi puis rouvre le lien.",
  fiche_deja_liee: "Cette fiche est déjà liée à un autre compte. Contacte ton coach.",
};

// Fonction interne (non exportée) : n'est pas un point d'entrée public.
async function linkInvitation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: string,
): Promise<AcceptInvitationState> {
  const { error } = await supabase.rpc("accept_invitation", {
    p_token_hash: hashInvitationToken(token),
    p_adult_confirmed: true,
  });
  if (error) {
    return {
      fields: {},
      error: acceptErrors[error.message] ?? "L'invitation n'a pas pu être acceptée. Réessaie.",
    };
  }
  redirect("/app");
}

// Acceptation : crée le compte si besoin (le sportif choisit son mot de passe), puis lie la fiche.
export async function acceptInvitation(
  token: string,
  _previous: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  if (!FEATURES.invitations) return { error: NOT_AVAILABLE_TEXT, fields: {} };
  if (!invitationTokenSchema.safeParse(token).success) {
    return { error: acceptErrors.invitation_invalide, fields: {} };
  }
  // Mineurs non pris en charge tant que le cadre légal n'est pas validé (OPEN-11).
  if (formData.get("adult") !== "on") {
    return { error: null, fields: { adult: acceptErrors.age_non_confirme } };
  }

  const invitation = await getPublicInvitation(token);
  if (!invitation || invitation.status !== "pending" || !invitation.email) {
    return {
      fields: {},
      error:
        invitation?.status === "expired"
          ? acceptErrors.invitation_expiree
          : acceptErrors.invitation_invalide,
    };
  }

  const supabase = await createClient();

  // Déjà connecté (ex. sportif suivi par une autre organisation) : on lie directement.
  if (await getCurrentUser()) return linkInvitation(supabase, token);

  // Nouveau compte : mot de passe choisi par le sportif, e-mail imposé par la fiche du coach.
  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmation: String(formData.get("confirmation") ?? ""),
  });
  if (!parsed.success) return { error: null, fields: fieldErrors(parsed.error) };

  // Procédure de confiance : l'inscription libre est fermée, seul le serveur crée ce compte,
  // et uniquement pour l'e-mail d'une invitation valide.
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password: parsed.data.password,
    email_confirm: true,
    // Compte créé par le serveur pour une invitation valide : pas de code d'accès (D-140).
    app_metadata: { coory_invited: true },
  });
  if (createError) {
    const exists = createError.code === "email_exists" || createError.status === 422;
    return {
      fields: {},
      error: exists
        ? "Un compte existe déjà avec cet e-mail : connecte-toi, puis rouvre ce lien pour accepter."
        : "Le compte n'a pas pu être créé. Réessaie.",
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password: parsed.data.password,
  });
  if (signInError)
    return {
      error: "Compte créé, mais connexion impossible. Connecte-toi puis rouvre le lien.",
      fields: {},
    };

  return linkInvitation(supabase, token);
}
