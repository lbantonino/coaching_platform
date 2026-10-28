"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireCoach, requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { getSettingsData, type SettingsData } from "./settings-data";
import {
  NOTIFICATION_KINDS,
  emailChangeSchema,
  organizationNameSchema,
  parseLegalEntity,
  parsePreferences,
  passwordChangeSchema,
  profileSchema,
  type LegalEntityInput,
  type NotificationKind,
  type PreferencesInput,
  type ProfileInput,
} from "./settings";

// Page Paramètres (D-57). Chaque action revérifie qui appelle (requireCoach / requireOrgAccess) :
// elles sont appelables directement. La base revérifie les formats et les droits (RLS).

// `values` : saisie renvoyée en cas d'erreur ; `attempt` reconstruit le formulaire avec elle.
export type SettingsState<T> = {
  error: string | null;
  saved: boolean;
  attempt: number;
  values: T | null;
  // Message de réussite propre à l'action (ex. « Un lien a été envoyé à … »).
  message?: string;
};

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

// Fenêtre des Paramètres (D-58) : ses données, lues à l'ouverture (et après un changement).
export async function loadSettings(): Promise<SettingsData> {
  const { user, memberships } = await requireCoach();
  return getSettingsData(user, memberships[0]);
}

// --- Profil -------------------------------------------------------------------------------------
export async function updateProfile(
  previous: SettingsState<ProfileInput>,
  formData: FormData,
): Promise<SettingsState<ProfileInput>> {
  const { user } = await requireCoach();
  const values: ProfileInput = {
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    companyName: field(formData, "companyName"),
    phone: field(formData, "phone"),
  };
  const attempt = previous.attempt + 1;
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
      saved: false,
      attempt,
      values,
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("coach_profiles").upsert(
    {
      user_id: user.id,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      company_name: parsed.data.companyName,
      phone: parsed.data.phone,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    return {
      error: "Le profil n'a pas pu être enregistré. Réessaie.",
      saved: false,
      attempt,
      values,
    };
  }
  revalidatePath("/coach", "layout");
  return { error: null, saved: true, attempt, values: null };
}

// Seul le propriétaire renomme l'organisation (la base le vérifie aussi : private.is_org_owner).
export async function renameOrganization(
  organizationId: string,
  previous: SettingsState<{ name: string }>,
  formData: FormData,
): Promise<SettingsState<{ name: string }>> {
  const { membership } = await requireOrgAccess(organizationId);
  const values = { name: field(formData, "organizationName") };
  const attempt = previous.attempt + 1;
  if (membership.role !== "owner") {
    return {
      error: "Seul le propriétaire peut renommer l'organisation.",
      saved: false,
      attempt,
      values,
    };
  }
  const parsed = organizationNameSchema.safeParse(values.name);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Nom invalide.",
      saved: false,
      attempt,
      values,
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ name: parsed.data })
    .eq("id", membership.organizationId)
    .select("id");
  if (error || (data ?? []).length !== 1) {
    return { error: "Le nom n'a pas pu être enregistré. Réessaie.", saved: false, attempt, values };
  }
  revalidatePath("/coach", "layout");
  return { error: null, saved: true, attempt, values: null };
}

// --- Préférences --------------------------------------------------------------------------------
export async function updatePreferences(
  previous: SettingsState<PreferencesInput>,
  formData: FormData,
): Promise<SettingsState<PreferencesInput>> {
  const { user } = await requireCoach();
  const values: PreferencesInput = {
    defaultSessionMinutes: field(formData, "defaultSessionMinutes"),
    defaultLocation: field(formData, "defaultLocation"),
    defaultPrice: field(formData, "defaultPrice"),
    defaultPaymentMethod: field(formData, "defaultPaymentMethod"),
    agendaFirstHour: field(formData, "agendaFirstHour"),
    agendaLastHour: field(formData, "agendaLastHour"),
  };
  const attempt = previous.attempt + 1;
  const parsed = parsePreferences(values);
  if (!parsed.ok) return { error: parsed.error, saved: false, attempt, values };
  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_profiles")
    .upsert({ user_id: user.id, ...parsed.values }, { onConflict: "user_id" });
  if (error) {
    return {
      error: "Les préférences n'ont pas pu être enregistrées. Réessaie.",
      saved: false,
      attempt,
      values,
    };
  }
  revalidatePath("/coach", "layout");
  return { error: null, saved: true, attempt, values: null };
}

// Colonne de la base pour chaque interrupteur (écrite en entier pour que le type soit vérifié).
function notifyColumn(kind: NotificationKind, enabled: boolean) {
  switch (kind) {
    case "competitions":
      return { notify_competitions: enabled };
    case "messages":
      return { notify_messages: enabled };
    case "tasks":
      return { notify_tasks: enabled };
    case "invoices":
      return { notify_invoices: enabled };
    case "profiles":
      return { notify_profiles: enabled };
  }
}

// Un interrupteur de la cloche : enregistré tout de suite (pas de bouton « Enregistrer »).
export async function setNotificationPreference(
  kind: NotificationKind,
  enabled: boolean,
): Promise<{ ok: boolean }> {
  const { user } = await requireCoach();
  if (!(NOTIFICATION_KINDS as readonly string[]).includes(kind) || typeof enabled !== "boolean") {
    return { ok: false };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_profiles")
    .upsert({ user_id: user.id, ...notifyColumn(kind, enabled) }, { onConflict: "user_id" });
  revalidatePath("/coach", "layout");
  return { ok: !error };
}

// --- Structures légales -------------------------------------------------------------------------
function readLegalEntity(formData: FormData): LegalEntityInput {
  return {
    name: field(formData, "name"),
    legalForm: field(formData, "legalForm"),
    enterpriseNumber: field(formData, "enterpriseNumber"),
    vatStatus: field(formData, "vatStatus"),
    addressLine: field(formData, "addressLine"),
    postalCode: field(formData, "postalCode"),
    city: field(formData, "city"),
    country: field(formData, "country"),
    iban: field(formData, "iban"),
    bic: field(formData, "bic"),
    billingEmail: field(formData, "billingEmail"),
    invoicePrefix: field(formData, "invoicePrefix"),
    legalMentions: field(formData, "legalMentions"),
    isDefault: formData.get("isDefault") === "on",
  };
}

// Création (entityId = null) ou modification d'une structure. Par défaut : les autres ne le sont
// plus (l'index unique en base n'en accepte qu'une). La première structure l'est d'office.
export async function saveLegalEntity(
  organizationId: string,
  entityId: string | null,
  previous: SettingsState<LegalEntityInput>,
  formData: FormData,
): Promise<SettingsState<LegalEntityInput>> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const values = readLegalEntity(formData);
  const attempt = previous.attempt + 1;
  const fail = (error: string) => ({ error, saved: false, attempt, values });
  if (entityId !== null && !z.uuid().safeParse(entityId).success)
    return fail("Structure introuvable.");
  const parsed = parseLegalEntity(values);
  if (!parsed.ok) return fail(parsed.error);

  const supabase = await createClient();
  const { count } = await supabase
    .from("organization_legal_entities")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);
  const isDefault = parsed.values.is_default || (entityId === null && (count ?? 0) === 0);
  if (isDefault) {
    const reset = await supabase
      .from("organization_legal_entities")
      .update({ is_default: false })
      .eq("organization_id", orgId)
      .eq("is_default", true);
    if (reset.error) return fail("La structure n'a pas pu être enregistrée. Réessaie.");
  }
  const row = { ...parsed.values, is_default: isDefault };
  const { error } =
    entityId === null
      ? await supabase
          .from("organization_legal_entities")
          .insert({ ...row, organization_id: orgId, created_by: user.id })
      : await supabase
          .from("organization_legal_entities")
          .update(row)
          .eq("id", entityId)
          .eq("organization_id", orgId);
  if (error) return fail("La structure n'a pas pu être enregistrée. Réessaie.");
  revalidatePath("/coach/profil");
  return { error: null, saved: true, attempt, values: null };
}

export async function deleteLegalEntity(organizationId: string, entityId: string): Promise<void> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(entityId).success) return;
  const supabase = await createClient();
  await supabase
    .from("organization_legal_entities")
    .delete()
    .eq("id", entityId)
    .eq("organization_id", membership.organizationId);
  revalidatePath("/coach/profil");
}

// --- Sécurité -----------------------------------------------------------------------------------
// Nouvelle adresse : Supabase envoie un lien de confirmation ; rien ne change avant le clic.
export async function changeEmail(
  previous: SettingsState<{ email: string }>,
  formData: FormData,
): Promise<SettingsState<{ email: string }>> {
  const { user } = await requireCoach();
  const values = { email: field(formData, "email").trim() };
  const attempt = previous.attempt + 1;
  const parsed = emailChangeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Adresse invalide.",
      saved: false,
      attempt,
      values,
    };
  }
  if (parsed.data.email.toLowerCase() === (user.email ?? "").toLowerCase()) {
    return { error: "C'est déjà ton adresse actuelle.", saved: false, attempt, values };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
  if (error) {
    return {
      error: "Le changement n'a pas pu être demandé (adresse déjà utilisée ?). Réessaie.",
      saved: false,
      attempt,
      values,
    };
  }
  return {
    error: null,
    saved: true,
    attempt,
    values: null,
    message: `Un lien de confirmation a été envoyé à ${parsed.data.email}. Ton adresse change dès que tu cliques dessus.`,
  };
}

// Mot de passe : on revérifie l'actuel avant d'accepter le nouveau (une session ouverte ne suffit pas).
export async function changePassword(
  previous: SettingsState<null>,
  formData: FormData,
): Promise<SettingsState<null>> {
  const { user } = await requireCoach();
  const attempt = previous.attempt + 1;
  const parsed = passwordChangeSchema.safeParse({
    current: field(formData, "current"),
    password: field(formData, "password"),
    confirmation: field(formData, "confirmation"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
      saved: false,
      attempt,
      values: null,
    };
  }
  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: parsed.data.current,
  });
  if (check.error) {
    return { error: "Mot de passe actuel incorrect.", saved: false, attempt, values: null };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      error: "Le mot de passe n'a pas pu être changé. Réessaie.",
      saved: false,
      attempt,
      values: null,
    };
  }
  return { error: null, saved: true, attempt, values: null, message: "Mot de passe changé." };
}

// Déconnecte tous les appareils, celui-ci compris (après confirmation dans la page).
export async function signOutEverywhere(): Promise<void> {
  await requireCoach();
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}
