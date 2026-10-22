"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { getAthlete } from "./queries";
import { athleteUpdateSchema, availabilitySchema, newAthleteSchema } from "./schemas";

export type NewAthleteState = {
  error: string | null;
  values: { firstName: string; lastName: string; email: string; phone: string };
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
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
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
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
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

// Saisie telle que reçue du formulaire (chaînes brutes), renvoyée en cas d'erreur.
export type AthleteFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  preferredContact: string;
  level: string;
  experience: string;
  trainingPlaces: string[];
  equipment: string;
};

// `values` : saisie renvoyée en cas d'erreur, car React 19 vide le formulaire après chaque envoi.
// `attempt` augmente à chaque réponse : le formulaire est reconstruit avec ces valeurs (listes
// déroulantes et cases comprises, que la remise à zéro de React ne mettrait pas à jour sinon).
export type UpdateAthleteState = {
  error: string | null;
  saved: boolean;
  attempt: number;
  values: AthleteFormValues | null;
};

// Modification d'une fiche : identité, contact, statut et profil sportif.
// Archiver = statut « archived » : rien n'est effacé.
export async function updateAthlete(
  organizationId: string,
  athleteId: string,
  previous: UpdateAthleteState,
  formData: FormData,
): Promise<UpdateAthleteState> {
  const { membership } = await requireOrgAccess(organizationId);
  const current = await getAthlete(membership.organizationId, athleteId);
  if (!current)
    return {
      error: "Sportif introuvable.",
      saved: false,
      attempt: previous.attempt + 1,
      values: null,
    };

  const values: AthleteFormValues = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    status: String(formData.get("status") ?? ""),
    preferredContact: String(formData.get("preferredContact") ?? ""),
    level: String(formData.get("level") ?? ""),
    experience: String(formData.get("experience") ?? ""),
    // Plusieurs cases cochées portent le même nom : getAll les récupère toutes.
    trainingPlaces: formData.getAll("trainingPlaces").map(String),
    equipment: String(formData.get("equipment") ?? ""),
  };
  const parsed = athleteUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
      saved: false,
      attempt: previous.attempt + 1,
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
      attempt: previous.attempt + 1,
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete_profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      status: parsed.data.status,
      preferred_contact: parsed.data.preferredContact,
      level: parsed.data.level,
      experience: parsed.data.experience,
      training_places: parsed.data.trainingPlaces,
      equipment: parsed.data.equipment,
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
      attempt: previous.attempt + 1,
      values,
    };
  }

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs`, "layout");
  return { error: null, saved: true, attempt: previous.attempt + 1, values: null };
}

// Saisie brute des disponibilités, renvoyée en cas d'erreur.
export type AvailabilityFormValues = {
  sessionsPerWeek: string;
  maxSessionMinutes: string;
  availableDays: string[];
  scheduleConstraints: string;
  healthConstraints: string;
};

export type UpdateAvailabilityState = {
  error: string | null;
  saved: boolean;
  attempt: number;
  values: AvailabilityFormValues | null;
};

// Disponibilités, contraintes d'organisation et, SEULEMENT si un accord est en cours, contraintes physiques.
export async function updateAvailability(
  organizationId: string,
  athleteId: string,
  previous: UpdateAvailabilityState,
  formData: FormData,
): Promise<UpdateAvailabilityState> {
  const { membership } = await requireOrgAccess(organizationId);
  const current = await getAthlete(membership.organizationId, athleteId);
  const attempt = previous.attempt + 1;
  if (!current) return { error: "Sportif introuvable.", saved: false, attempt, values: null };

  const values: AvailabilityFormValues = {
    sessionsPerWeek: String(formData.get("sessionsPerWeek") ?? ""),
    maxSessionMinutes: String(formData.get("maxSessionMinutes") ?? ""),
    availableDays: formData.getAll("availableDays").map(String),
    scheduleConstraints: String(formData.get("scheduleConstraints") ?? ""),
    healthConstraints: String(formData.get("healthConstraints") ?? ""),
  };
  const parsed = availabilitySchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
      saved: false,
      attempt,
      values,
    };
  }

  // Sans accord en cours (jamais donné, ou retiré entre-temps par le sportif), on ne touche pas aux
  // contraintes physiques. La base le refuserait de toute façon.
  const hasConsent = current.healthConsentAt !== null;
  if (!hasConsent && parsed.data.healthConstraints !== null) {
    return {
      error: "L'accord du sportif est nécessaire pour noter des contraintes physiques.",
      saved: false,
      attempt,
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete_profiles")
    .update({
      sessions_per_week: parsed.data.sessionsPerWeek,
      max_session_minutes: parsed.data.maxSessionMinutes,
      available_days: parsed.data.availableDays,
      schedule_constraints: parsed.data.scheduleConstraints,
      ...(hasConsent ? { health_constraints: parsed.data.healthConstraints } : {}),
    })
    .eq("id", current.id)
    .eq("organization_id", membership.organizationId);

  if (error) {
    return {
      error: "Les disponibilités n'ont pas pu être enregistrées. Réessaie.",
      saved: false,
      attempt,
      values,
    };
  }

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${current.id}`);
  return { error: null, saved: true, attempt, values: null };
}
