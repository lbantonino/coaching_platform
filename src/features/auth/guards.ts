import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import {
  getCoachMemberships,
  requireUser,
  type CoachMembership,
  type CurrentUser,
  type SupabaseServerClient,
} from "./session";

// Garde-fous serveur (P1-04). À appeler en tête de chaque page, Server Action ou Route Handler
// protégé : le proxy ne fait qu'une redirection optimiste, la RLS reste la dernière défense.

export const ACCESS_DENIED_PATH = "/acces-refuse";

type CoachContext = { user: CurrentUser; memberships: CoachMembership[] };
type OrgContext = { user: CurrentUser; membership: CoachMembership };

// Membre actif d'au moins une organisation (rôle owner ou coach).
export async function requireCoach(): Promise<CoachContext> {
  const user = await requireUser();
  const memberships = await getCoachMemberships(user.id);
  if (memberships.length === 0) redirect(ACCESS_DENIED_PATH);
  return { user, memberships };
}

const organizationIdSchema = z.uuid();

// Accès à UNE organisation précise. L'identifiant vient souvent de l'URL ou d'un formulaire :
// il est validé, puis l'appartenance est vérifiée côté serveur. Une organisation inconnue et une
// organisation d'un autre tenant donnent la même réponse, pour ne pas révéler son existence.
export async function requireOrgAccess(
  organizationId: string,
  options: { role?: CoachMembership["role"] } = {},
): Promise<OrgContext> {
  const { user, memberships } = await requireCoach();

  const parsed = organizationIdSchema.safeParse(organizationId);
  const membership = parsed.success
    ? memberships.find((m) => m.organizationId === parsed.data)
    : undefined;

  if (!membership) redirect(ACCESS_DENIED_PATH);
  if (options.role && membership.role !== options.role) redirect(ACCESS_DENIED_PATH);

  return { user, membership };
}

async function isPlatformAdmin(client?: SupabaseServerClient): Promise<boolean> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.rpc("current_user_is_platform_admin");
  if (error) throw new Error("Vérification du rôle administrateur impossible.");
  return data === true;
}

// Administrateur de la plateforme. Ne donne AUCUN accès aux données des organisations (docs/02 §6).
export async function requirePlatformAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!(await isPlatformAdmin())) redirect(ACCESS_DENIED_PATH);
  return user;
}

// Espace d'arrivée après connexion, selon les rôles réellement détenus.
export async function getHomePath(userId: string, client?: SupabaseServerClient): Promise<string> {
  if ((await getCoachMemberships(userId, client)).length > 0) return "/coach";
  if (await isPlatformAdmin(client)) return "/admin";
  return ACCESS_DENIED_PATH;
}
