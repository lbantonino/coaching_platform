import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import { FEATURES } from "@/config/features";
import { createClient } from "@/lib/supabase/server";

import {
  getAthleteLinks,
  getCoachMemberships,
  requireUser,
  type AthleteLink,
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

type AthleteContext = { user: CurrentUser; links: AthleteLink[] };

// Sportif dont la fiche est liée à ce compte (invitation acceptée) dans au moins une organisation.
export async function requireAthlete(): Promise<AthleteContext> {
  const user = await requireUser();
  const links = await getAthleteLinks(user.id);
  if (links.length === 0) redirect(ACCESS_DENIED_PATH);
  return { user, links };
}

// Type de compte choisi à l'inscription libre (D-30), ou null si le compte n'a pas été finalisé.
async function getSignupKind(
  userId: string,
  client?: SupabaseServerClient,
): Promise<"coach" | "athlete" | null> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase
    .from("account_signups")
    .select("kind")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.kind === "coach" || data?.kind === "athlete" ? data.kind : null;
}

// Espace d'arrivée après connexion, selon les rôles réellement détenus. Un compte tout juste créé
// (inscription ou Google / Facebook / Apple) sans rôle termine son inscription sur « Bienvenue ».
// MVP espace coach seul (D-167) : un compte sportif n'a pas encore d'espace, il arrive sur « Accès
// refusé ».
export async function getHomePath(userId: string, client?: SupabaseServerClient): Promise<string> {
  if ((await getCoachMemberships(userId, client)).length > 0) return "/coach";
  const athleteHome = FEATURES.athleteSpace ? "/app" : ACCESS_DENIED_PATH;
  if ((await getAthleteLinks(userId, client)).length > 0) return athleteHome;
  if (await isPlatformAdmin(client)) return "/admin";
  const kind = await getSignupKind(userId, client);
  if (kind === "athlete") return athleteHome;
  return kind === "coach" ? ACCESS_DENIED_PATH : "/bienvenue";
}

// Compte sportif (fiche liée ou inscription « sportif ») : pendant le MVP coach seul (D-167), la page
// « Accès refusé » lui dit que son espace n'existe pas encore.
export async function isAthleteAccount(userId: string): Promise<boolean> {
  if ((await getAthleteLinks(userId)).length > 0) return true;
  return (await getSignupKind(userId)) === "athlete";
}

// Espace sportif : fiche liée par un coach, ou sportif inscrit seul qui attend l'invitation d'un coach.
export async function requireAthleteAccount(): Promise<AthleteContext & { waiting: boolean }> {
  const user = await requireUser();
  const links = await getAthleteLinks(user.id);
  if (links.length > 0) return { user, links, waiting: false };
  if ((await getSignupKind(user.id)) === "athlete") return { user, links, waiting: true };
  redirect(ACCESS_DENIED_PATH);
}
