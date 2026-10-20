import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
};

export type CoachMembership = {
  organizationId: string;
  organizationName: string;
  role: "owner" | "coach";
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
    .select("organization_id, role, organizations ( name )")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw new Error("Lecture des organisations impossible.");

  return (data ?? []).map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organizations.name,
    // La contrainte CHECK en base garantit 'owner' ou 'coach'.
    role: row.role as CoachMembership["role"],
  }));
}
