"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCoach, requireOrgAccess } from "@/features/auth/guards";
import { isCurrency, parseExchangeRate } from "@/domain/billing/money";
import { isCountryCode } from "@/domain/geo/countries";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { getSettingsData, type SettingsData } from "./settings-data";
import {
  NOTIFICATION_KINDS,
  emailChangeSchema,
  organizationNameSchema,
  parsePreferences,
  parseVatSetting,
  passwordChangeSchema,
  profileSchema,
  type NotificationKind,
  type PreferencesInput,
  type ProfileInput,
  type VatSettingInput,
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

// Pays de l'organisation (D-69) : propriétaire seulement (même règle que le nom). Il décide du nom
// des moyens de paiement et du pays proposé par défaut ; la devise, elle, ne change pas ici.
export async function setOrganizationCountry(
  organizationId: string,
  country: string,
): Promise<{ ok: boolean; error: string | null }> {
  const { membership } = await requireOrgAccess(organizationId);
  if (membership.role !== "owner") {
    return { ok: false, error: "Seul le propriétaire peut changer le pays." };
  }
  if (!isCountryCode(country)) return { ok: false, error: "Pays invalide." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ country })
    .eq("id", membership.organizationId)
    .select("id");
  if (error || (data ?? []).length !== 1) {
    return { ok: false, error: "Le pays n'a pas pu être enregistré. Réessaie." };
  }
  revalidatePath("/coach", "layout");
  return { ok: true, error: null };
}

// Taux de TVA de l'organisation (D-90) : propriétaire seulement, comme le pays. Il vaut pour les
// nouveaux paiements ; ceux déjà notés gardent leur taux.
export async function setOrganizationVatRate(
  organizationId: string,
  previous: SettingsState<VatSettingInput>,
  formData: FormData,
): Promise<SettingsState<VatSettingInput>> {
  const { membership } = await requireOrgAccess(organizationId);
  const values: VatSettingInput = {
    vatEnabled: formData.get("vatEnabled") === "on",
    vatRate: field(formData, "vatRate"),
  };
  const attempt = previous.attempt + 1;
  const fail = (error: string) => ({ error, saved: false, attempt, values });
  if (membership.role !== "owner") return fail("Seul le propriétaire peut changer la TVA.");
  const parsed = parseVatSetting(values);
  if (!parsed.ok) return fail(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ vat_rate: parsed.vatRate })
    .eq("id", membership.organizationId)
    .select("id");
  if (error || (data ?? []).length !== 1) {
    return fail("La TVA n'a pas pu être enregistrée. Réessaie.");
  }
  revalidatePath("/coach", "layout");
  return { error: null, saved: true, attempt, values: null };
}

// Changement de devise (D-70, déménagement) : ce que le changement va convertir, et ce qui reste dans
// l'ancienne devise. Mêmes critères que la fonction de la base (séances qui ont encore des dates).
export type CurrencyChangePreview = {
  sessions: number;
  payments: number;
};

export async function previewCurrencyChange(
  organizationId: string,
): Promise<CurrencyChangePreview | null> {
  const { membership } = await requireOrgAccess(organizationId);
  if (membership.role !== "owner") return null;
  const orgId = membership.organizationId;
  const today = todayIsoInBrussels();
  const supabase = await createClient();
  const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count: value, error } = await query;
    if (error) throw new Error("Lecture de l'aperçu impossible.");
    return value ?? 0;
  };
  const head = { count: "exact", head: true } as const;
  const [repeating, single, payments] = await Promise.all([
    count(
      supabase
        .from("coach_sessions")
        .select("id", head)
        .eq("organization_id", orgId)
        .eq("currency", membership.currency)
        .not("price_cents", "is", null)
        .eq("repeats_weekly", true)
        .or(`ends_on.is.null,ends_on.gte.${today}`),
    ),
    count(
      supabase
        .from("coach_sessions")
        .select("id", head)
        .eq("organization_id", orgId)
        .eq("currency", membership.currency)
        .not("price_cents", "is", null)
        .eq("repeats_weekly", false)
        .gte("starts_on", today),
    ),
    count(
      supabase
        .from("athlete_payments")
        .select("id", head)
        .eq("organization_id", orgId)
        .eq("currency", membership.currency),
    ),
  ]);
  return { sessions: repeating + single, payments };
}

export async function changeOrganizationCurrency(
  organizationId: string,
  currency: string,
  rateText: string,
): Promise<{ ok: boolean; error: string | null }> {
  const { membership } = await requireOrgAccess(organizationId);
  if (membership.role !== "owner") {
    return { ok: false, error: "Seul le propriétaire peut changer la devise." };
  }
  if (!isCurrency(currency)) return { ok: false, error: "Choisis la nouvelle devise." };
  if (currency === membership.currency) {
    return { ok: false, error: "C'est déjà la devise de ton organisation." };
  }
  const rate = parseExchangeRate(rateText);
  if (rate === null) {
    return { ok: false, error: "Taux invalide : un nombre plus grand que 0 (ex. 0,94)." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("change_organization_currency", {
    p_organization_id: membership.organizationId,
    p_currency: currency,
    p_rate: rate,
  });
  if (error) return { ok: false, error: "La devise n'a pas pu être changée. Réessaie." };
  revalidatePath("/coach", "layout");
  return { ok: true, error: null };
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
    case "unpaid":
      return { notify_unpaid: enabled };
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
