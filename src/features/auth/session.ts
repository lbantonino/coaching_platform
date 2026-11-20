import "server-only";

import { redirect } from "next/navigation";

import { currencyOf, type Currency } from "@/domain/billing/money";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
};

export type CoachMembership = {
  organizationId: string;
  organizationName: string;
  role: "owner" | "coach";
  // Pays et devise de l'organisation (D-69) : chaque écran d'argent les lit ici.
  country: string;
  currency: Currency;
  // Plus de taux de TVA de l'organisation (D-163) : chaque paiement, dépense ou séance a le sien.
};

// Utilisateur connecté, vérifié côté serveur (getClaims valide le jeton). null si non connecté.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
}

// Session ouverte par un lien de réinitialisation du mot de passe depuis moins d'une heure (le jeton
// porte la méthode « recovery »). Une session ordinaire (connexion par mot de passe, Google) ne
// suffit PAS pour choisir un nouveau mot de passe sans l'ancien : un ordinateur resté connecté ne
// permet pas de prendre le compte (revue de sécurité du 13/11/2026). null sinon.
const RECOVERY_WINDOW_SECONDS = 60 * 60;
export async function getRecoveryUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const now = Date.now() / 1000;
  const amr = data.claims.amr ?? [];
  const user = {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
  const recovered = amr.some((entry) =>
    typeof entry === "string"
      ? entry === "recovery"
      : entry.method === "recovery" && now - entry.timestamp < RECOVERY_WINDOW_SECONDS,
  );
  if (recovered) return user;

  // Lien du modèle Coory (D-197) : le jeton vérifié par verifyOtp ouvre une session « otp », pas
  // « recovery » (incident du 20/11/2026 : refusée, la page renvoyait vers « lien invalide »). Elle ne
  // vaut session de récupération que si elle a été ouverte APRÈS une demande « Mot de passe oublié »
  // (recovery_sent_at) et dans l'heure : une connexion ordinaire n'a jamais la méthode « otp ».
  const otp = amr.find(
    (entry) =>
      typeof entry !== "string" &&
      entry.method === "otp" &&
      now - entry.timestamp < RECOVERY_WINDOW_SECONDS,
  );
  if (!otp || typeof otp === "string") return null;
  const { data: current } = await supabase.auth.getUser();
  const sentAt = current.user?.recovery_sent_at
    ? Date.parse(current.user.recovery_sent_at) / 1000
    : null;
  const afterRequest =
    sentAt !== null &&
    sentAt <= otp.timestamp + 1 &&
    otp.timestamp - sentAt < RECOVERY_WINDOW_SECONDS;
  return afterRequest ? user : null;
}

// À appeler en tête de toute page ou action réservée aux utilisateurs connectés.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Organisations dont l'utilisateur est membre actif. La RLS limite déjà la lecture à ses propres
// organisations ; le filtre sur user_id écarte les autres membres de ces organisations.
// `client` permet de réutiliser une session tout juste ouverte (connexion) dans la même requête.
export async function getCoachMemberships(
  userId: string,
  client?: SupabaseServerClient,
): Promise<CoachMembership[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations ( name, country, currency )")
    .eq("user_id", userId)
    .eq("status", "active")
    // Ordre stable : la première organisation (celle qu'utilisent le menu et les pages) est la plus
    // ancienne, pas celle que la base renvoie au hasard.
    .order("created_at", { ascending: true });

  if (error) throw new Error("Lecture des organisations impossible.");

  return (data ?? []).map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organizations.name,
    // La contrainte CHECK en base garantit 'owner' ou 'coach'.
    role: row.role as CoachMembership["role"],
    country: row.organizations.country,
    currency: currencyOf(row.organizations.currency),
  }));
}

export type AthleteLink = {
  athleteId: string;
  organizationId: string;
  organizationName: string;
  // Identité de la fiche, pour la carte du menu de l'espace sportif.
  displayName: string | null;
  sex: string | null;
  photoPath: string | null;
};

// Fiches sportifs liées au compte connecté (une par organisation qui le suit).
// La RLS ne laisse lire au sportif que SA fiche et le nom de SON organisation.
export async function getAthleteLinks(
  userId: string,
  client?: SupabaseServerClient,
): Promise<AthleteLink[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("id, organization_id, display_name, sex, photo_path, organizations ( name )")
    .eq("athlete_user_id", userId)
    .neq("status", "archived");

  if (error) throw new Error("Lecture de l'espace sportif impossible.");

  return (data ?? []).map((row) => ({
    athleteId: row.id,
    organizationId: row.organization_id,
    organizationName: row.organizations.name,
    displayName: row.display_name,
    sex: row.sex,
    photoPath: row.photo_path,
  }));
}
