import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CoachProfile = {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  // Nom affiché : prénom et nom s'ils sont renseignés, sinon le début de l'adresse e-mail.
  displayName: string;
  photoPath: string | null;
};

// Profil du coach connecté (la RLS ne laisse lire que le sien et ceux de ses collègues).
export async function getCoachProfile(user: {
  id: string;
  email: string | null;
}): Promise<CoachProfile> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_profiles")
    .select("first_name, last_name, company_name, photo_path")
    .eq("user_id", user.id)
    .maybeSingle();
  const name = [data?.first_name, data?.last_name].filter(Boolean).join(" ");
  return {
    firstName: data?.first_name ?? null,
    lastName: data?.last_name ?? null,
    companyName: data?.company_name ?? null,
    displayName: name || (user.email?.split("@")[0] ?? "Coach"),
    photoPath: data?.photo_path ?? null,
  };
}
