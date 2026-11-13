"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DISCIPLINES, type Discipline } from "@/domain/training/discipline";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { insertAthlete } from "./create-athlete";
import { type NewAthleteFormInput } from "./new-athlete";
import { getAthlete } from "./queries";
import {
  ATHLETE_STATUSES,
  addressSchema,
  athleteUpdateSchema,
  availabilitySchema,
  type AthleteStatus,
} from "./schemas";

// `values` : saisie renvoyée en cas d'erreur (React 19 vide le formulaire après chaque envoi) ;
// `attempt` reconstruit le formulaire avec elle (listes et cases comprises).
export type NewAthleteState = {
  error: string | null;
  attempt: number;
  values: NewAthleteFormInput | null;
};

// Page « Nouveau sportif » (D-54) : toute la fiche en une fois. Server Action liée à une
// organisation (.bind dans la page), appelable directement : l'accès est donc revérifié ici.
// Ordre : la fiche, puis ses notes libres (note privée du coach), son objectif principal, puis
// l'accord santé (fonction SQL journalisée) et les blessures et points d'attention, que la base
// n'accepte qu'avec un accord en cours. Si une étape après la
// fiche échoue, la fiche existe déjà : on y va quand même, en le signalant (?creation=incomplete).
export async function createAthlete(
  organizationId: string,
  previous: NewAthleteState,
  formData: FormData,
): Promise<NewAthleteState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;

  const field = (name: string) => String(formData.get(name) ?? "");
  const values: NewAthleteFormInput = {
    firstName: field("firstName"),
    lastName: field("lastName"),
    sex: field("sex"),
    email: field("email"),
    phone: field("phone"),
    status: field("status") || "active",
    preferredContact: field("preferredContact"),
    level: field("level"),
    experience: field("experience"),
    trainingPlaces: formData.getAll("trainingPlaces").map(String),
    equipment: field("equipment"),
    programType: field("programType"),
    sessionsPerWeek: field("sessionsPerWeek"),
    maxSessionMinutes: field("maxSessionMinutes"),
    availableDays: formData.getAll("availableDays").map(String),
    scheduleConstraints: field("scheduleConstraints"),
    healthConstraints: field("healthConstraints"),
    goalType: field("goalType"),
    goalDate: field("goalDate"),
    competitionName: field("competitionName"),
    healthConsent: formData.get("healthConsent") === "on",
    consentProof: field("consentProof"),
    coachNote: field("coachNote"),
  };
  const fail = (error: string): NewAthleteState => ({
    error,
    attempt: previous.attempt + 1,
    values,
  });

  const created = await insertAthlete(orgId, user.id, values);
  if (!created.ok) return fail(created.error);

  revalidatePath(`/coach/o/${orgId}/sportifs`, "layout");
  redirect(
    `/coach/o/${orgId}/sportifs/${created.id}${created.incomplete ? "?creation=incomplete" : ""}`,
  );
}

// Saisie telle que reçue du formulaire (chaînes brutes), renvoyée en cas d'erreur.
export type AthleteFormValues = {
  firstName: string;
  lastName: string;
  sex: string;
  email: string;
  phone: string;
  status: string;
  preferredContact: string;
  level: string;
  experience: string;
  trainingPlaces: string[];
  equipment: string;
};

// Adresse (D-65), modifiée avec la fiche (onglet Profil).
export type AddressFormValues = {
  addressLine: string;
  postalCode: string;
  city: string;
  country: string;
};

// `values` : saisie renvoyée en cas d'erreur, car React 19 vide le formulaire après chaque envoi.
// `attempt` augmente à chaque réponse : le formulaire est reconstruit avec ces valeurs (listes
// déroulantes et cases comprises, que la remise à zéro de React ne mettrait pas à jour sinon).
export type UpdateAthleteState = {
  error: string | null;
  saved: boolean;
  attempt: number;
  values: (AthleteFormValues & AddressFormValues) | null;
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

  const values: AthleteFormValues & AddressFormValues = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    sex: String(formData.get("sex") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    status: String(formData.get("status") ?? ""),
    preferredContact: String(formData.get("preferredContact") ?? ""),
    level: String(formData.get("level") ?? ""),
    experience: String(formData.get("experience") ?? ""),
    // Plusieurs cases cochées portent le même nom : getAll les récupère toutes.
    trainingPlaces: formData.getAll("trainingPlaces").map(String),
    equipment: String(formData.get("equipment") ?? ""),
    addressLine: String(formData.get("addressLine") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? "BE"),
  };
  const parsed = athleteUpdateSchema.safeParse(values);
  const address = addressSchema.safeParse(values);
  if (!parsed.success || !address.success) {
    return {
      error: (parsed.error ?? address.error)?.issues[0]?.message ?? "Formulaire invalide.",
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
      sex: parsed.data.sex,
      email: parsed.data.email,
      phone: parsed.data.phone,
      status: parsed.data.status,
      preferred_contact: parsed.data.preferredContact,
      level: parsed.data.level,
      experience: parsed.data.experience,
      training_places: parsed.data.trainingPlaces,
      equipment: parsed.data.equipment,
      address_line: address.data.addressLine,
      postal_code: address.data.postalCode,
      city: address.data.city,
      country: address.data.country,
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

// Statut et type de programme depuis la liste des sportifs (demande d'Antonino du 24/10, D-40) :
// pour une ligne (pastille ou menu « ••• ») ou pour plusieurs sportifs cochés à la fois.
// Archiver n'efface rien et se défait de la même façon. Les identifiants viennent du navigateur :
// la mise à jour est limitée à l'organisation du coach (et la RLS le garantit aussi).
const athleteIdsSchema = z.array(z.uuid()).min(1).max(200);
const statusSchema = z.enum(ATHLETE_STATUSES);
const programTypeSchema = z.enum(DISCIPLINES);

export type BulkResult = { ok: boolean; error: string | null };

async function updateAthletes(
  organizationId: string,
  athleteIds: unknown,
  changes: { status: AthleteStatus } | { program_type: Discipline },
): Promise<BulkResult> {
  const { membership } = await requireOrgAccess(organizationId);
  const ids = athleteIdsSchema.safeParse(athleteIds);
  if (!ids.success) return { ok: false, error: "Aucun sportif sélectionné." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_profiles")
    .update(changes)
    .in("id", ids.data)
    .eq("organization_id", membership.organizationId)
    .select("id");
  if (error) return { ok: false, error: "La modification n'a pas pu être enregistrée. Réessaie." };
  if ((data ?? []).length !== ids.data.length) return { ok: false, error: "Sportif introuvable." };

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs`, "layout");
  return { ok: true, error: null };
}

export async function setAthletesStatus(
  organizationId: string,
  athleteIds: string[],
  status: string,
): Promise<BulkResult> {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Statut invalide." };
  return updateAthletes(organizationId, athleteIds, { status: parsed.data });
}

export async function setAthletesProgramType(
  organizationId: string,
  athleteIds: string[],
  programType: string,
): Promise<BulkResult> {
  const parsed = programTypeSchema.safeParse(programType);
  if (!parsed.success) return { ok: false, error: "Type de programme invalide." };
  return updateAthletes(organizationId, athleteIds, { program_type: parsed.data });
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

// Disponibilités et contraintes d'organisation. Les blessures et points d'attention (donnée de santé)
// ont leur propre bloc et leur propre action, dans l'onglet Notes (D-56) : ce formulaire n'y touche pas.
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete_profiles")
    .update({
      sessions_per_week: parsed.data.sessionsPerWeek,
      max_session_minutes: parsed.data.maxSessionMinutes,
      available_days: parsed.data.availableDays,
      schedule_constraints: parsed.data.scheduleConstraints,
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

// Blessures et points d'attention (D-56) : donnée de santé, enregistrée SEULEMENT pendant un accord
// en cours du sportif (la base le refuse aussi). Vider le champ efface ce qui était noté.
export type HealthNotesState = {
  error: string | null;
  saved: boolean;
  attempt: number;
  value: string | null;
};

export async function updateHealthNotes(
  organizationId: string,
  athleteId: string,
  previous: HealthNotesState,
  formData: FormData,
): Promise<HealthNotesState> {
  const { membership } = await requireOrgAccess(organizationId);
  const current = await getAthlete(membership.organizationId, athleteId);
  const attempt = previous.attempt + 1;
  const raw = String(formData.get("healthConstraints") ?? "");
  const fail = (error: string): HealthNotesState => ({ error, saved: false, attempt, value: raw });
  if (!current) return fail("Sportif introuvable.");
  if (current.healthConsentAt === null) {
    return fail(
      "L'accord du sportif est nécessaire pour noter des blessures ou points d'attention.",
    );
  }
  const parsed = availabilitySchema.shape.healthConstraints.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Saisie invalide.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete_profiles")
    .update({ health_constraints: parsed.data })
    .eq("id", current.id)
    .eq("organization_id", membership.organizationId);
  if (error)
    return fail("Les blessures et points d'attention n'ont pas pu être enregistrés. Réessaie.");

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${current.id}`);
  return { error: null, saved: true, attempt, value: null };
}
