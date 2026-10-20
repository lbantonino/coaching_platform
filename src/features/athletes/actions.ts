"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { getAthlete } from "./queries";
import { athleteUpdateSchema, newAthleteSchema } from "./schemas";

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

// `values` : saisie renvoyée en cas d'erreur, car React 19 vide le formulaire après chaque envoi.
export type UpdateAthleteState = {
  error: string | null;
  saved: boolean;
  values: { displayName: string; email: string; phone: string; status: string } | null;
};

// Modification d'une fiche (nom, contact, statut). Archiver = statut « archived » : rien n'est effacé.
export async function updateAthlete(
  organizationId: string,
  athleteId: string,
  _previous: UpdateAthleteState,
  formData: FormData,
): Promise<UpdateAthleteState> {
  const { membership } = await requireOrgAccess(organizationId);
  const current = await getAthlete(membership.organizationId, athleteId);
  if (!current) return { error: "Sportif introuvable.", saved: false, values: null };

  const values = {
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    status: String(formData.get("status") ?? ""),
  };
  const parsed = athleteUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
      saved: false,
      values,
    };
  }

  // Une fois le compte activé, l'e-mail est l'identifiant de connexion du sportif : il ne se change
  // pas depuis la fiche du coach (sinon la fiche et le compte ne correspondraient plus).
  const emailChanged =
    (parsed.data.email ?? "").toLowerCase() !== (current.email ?? "").toLowerCase();
  if (current.hasAccount && emailChanged) {
    return {
      error: "Le sportif a activé son compte : son adresse e-mail ne peut plus être modifiée ici.",
      saved: false,
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete_profiles")
    .update({
      display_name: parsed.data.displayName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      status: parsed.data.status,
    })
    .eq("id", current.id)
    .eq("organization_id", membership.organizationId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Un sportif de ton organisation utilise déjà cette adresse e-mail."
          : "Les modifications n'ont pas pu être enregistrées. Réessaie.",
      saved: false,
      values,
    };
  }

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs`, "layout");
  return { error: null, saved: true, values: null };
}
