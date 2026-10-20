"use server";

import { redirect } from "next/navigation";

import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { newAthleteSchema } from "./schemas";

export type NewAthleteState = {
  error: string | null;
  values: { displayName: string; email: string; phone: string };
};

// Server Action liée à une organisation (organizationId est fixé côté serveur par .bind dans la page).
// Elle reste appelable directement : l'accès à l'organisation est donc revérifié ici.
export async function createAthlete(
  organizationId: string,
  _previous: NewAthleteState,
  formData: FormData,
): Promise<NewAthleteState> {
  const { user, membership } = await requireOrgAccess(organizationId);

  const values = {
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };

  const parsed = newAthleteSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide.", values };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("athlete_profiles").insert({
    organization_id: membership.organizationId,
    display_name: parsed.data.displayName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    created_by: user.id,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "Un sportif de ton organisation utilise déjà cette adresse e-mail."
        : "Le sportif n'a pas pu être enregistré. Réessaie.";
    return { error: message, values };
  }

  redirect(`/coach/o/${membership.organizationId}/sportifs`);
}
