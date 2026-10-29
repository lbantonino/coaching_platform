"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { listAthletes } from "@/features/athletes/queries";
import { getDefaultVatRate } from "@/features/coach/legal-queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { coveredByPackage } from "@/domain/billing/payments";
import { dayLabel } from "@/features/agenda/calendar";
import { listPackageCovers } from "@/features/billing/payment-queries";
import { createClient } from "@/lib/supabase/server";
import { todayIsoInBrussels } from "@/lib/format";

import { getSession } from "./queries";
import { occursOn, parseSessionForm, sessionAmountCents, type SessionFormInput } from "./schemas";

// `attempt` change à CHAQUE réponse : le formulaire est reconstruit avec la saisie renvoyée
// (React 19 remet sinon les menus déroulants et les cases à leur valeur de départ).
export type SessionFormState = {
  error: string | null;
  attempt: number;
  values: SessionFormInput | null;
  // Création depuis la fenêtre « Nouvelle séance » (champ « stay ») : la séance créée, sans changer de
  // page, et le nom du nouveau sportif dont la fiche minimale vient d'être créée.
  created?: { id: string; title: string; newAthleteName: string | null } | null;
};

function readForm(formData: FormData, kind: string): SessionFormInput {
  const field = (name: string) => String(formData.get(name) ?? "");
  return {
    kind,
    title: field("title"),
    discipline: field("discipline"),
    location: field("location"),
    startsOn: field("startsOn"),
    startTime: field("startTime"),
    durationMinutes: field("durationMinutes"),
    repeatsWeekly: formData.get("repeatsWeekly") === "on",
    endsOn: field("endsOn"),
    athleteId: field("athleteId"),
    athleteIds: formData.getAll("athleteIds").map(String),
    newClient: formData.get("newClient") === "on",
    newAthleteName: field("newAthleteName"),
    notes: field("notes"),
    price: field("price"),
    vatIncluded: formData.get("vatIncluded") === "on",
    paymentMethod: field("paymentMethod"),
  };
}

// Les sportifs choisis doivent être des fiches NON archivées de cette organisation (jamais le navigateur).
async function allBelongToOrg(organizationId: string, athleteIds: string[]): Promise<boolean> {
  if (athleteIds.length === 0) return true;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .in("id", athleteIds);
  return !error && (data ?? []).length === athleteIds.length;
}

export async function createSession(
  organizationId: string,
  previous: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const input = readForm(formData, String(formData.get("kind") ?? ""));
  const fail = (error: string) => ({ error, attempt: previous.attempt + 1, values: input });

  const parsed = parseSessionForm(input);
  if (!parsed.ok) return fail(parsed.error);
  const people = parsed.values.athlete_id ? [parsed.values.athlete_id] : parsed.athleteIds;
  if (!(await allBelongToOrg(orgId, people)))
    return fail("Sportif introuvable dans ton organisation.");

  const supabase = await createClient();
  // Nouveau sportif (D-35) : sa fiche minimale d'abord (le nom tapé), signalée « à compléter » dans
  // Sportifs ; la séance lui est ensuite rattachée.
  let newAthleteName: string | null = null;
  if (parsed.newAthlete) {
    const { data: athlete, error: athleteError } = await supabase
      .from("athlete_profiles")
      .insert({
        organization_id: orgId,
        first_name: parsed.newAthlete.firstName,
        last_name: parsed.newAthlete.lastName,
        created_by: user.id,
      })
      .select("id, display_name")
      .single();
    if (athleteError || !athlete) return fail("Le nouveau sportif n'a pas pu être créé. Réessaie.");
    parsed.values.athlete_id = athlete.id;
    newAthleteName = athlete.display_name;
    revalidatePath(`/coach/o/${orgId}/sportifs`);
  }

  const { data, error } = await supabase
    .from("coach_sessions")
    .insert({ ...parsed.values, organization_id: orgId, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) {
    // Une fiche ne se supprime pas (on archive) : on le dit plutôt que de la cacher.
    return newAthleteName
      ? {
          ...fail(
            `La fiche de ${newAthleteName} est créée, mais la séance n'a pas pu être enregistrée. Réessaie en choisissant ${newAthleteName} dans la liste.`,
          ),
          values: {
            ...input,
            newClient: false,
            newAthleteName: "",
            athleteId: parsed.values.athlete_id ?? "",
          },
        }
      : fail("La séance n'a pas pu être enregistrée. Réessaie.");
  }

  if (parsed.athleteIds.length > 0) {
    const { error: enrolError } = await supabase.from("coach_session_athletes").insert(
      parsed.athleteIds.map((athleteId) => ({
        session_id: data.id,
        organization_id: orgId,
        athlete_id: athleteId,
        created_by: user.id,
      })),
    );
    // La séance existe : on n'annonce pas un succès complet, le coach réessaie depuis sa page.
    if (enrolError) {
      revalidatePath(`/coach/o/${orgId}/agenda`);
      redirect(`/coach/o/${orgId}/agenda/seances/${data.id}?inscriptions=echec`);
    }
  }

  revalidatePath(`/coach/o/${orgId}/agenda`);
  // Fenêtre « Nouvelle séance » de l'agenda (clic sur un créneau) : on reste sur la page.
  if (formData.get("stay") === "1") {
    revalidatePath("/coach");
    return {
      error: null,
      attempt: previous.attempt + 1,
      values: null,
      created: { id: data.id, title: parsed.values.title, newAthleteName },
    };
  }
  redirect(`/coach/o/${orgId}/agenda/seances/${data.id}`);
}

export async function updateSession(
  organizationId: string,
  sessionId: string,
  previous: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const session = z.uuid().safeParse(sessionId).success ? await getSession(orgId, sessionId) : null;
  if (!session)
    return { error: "Séance introuvable.", attempt: previous.attempt + 1, values: null };

  // Le type et le sportif d'une séance individuelle ne changent pas (droit refusé en base aussi).
  const input = readForm(formData, session.kind);
  if (session.kind === "individual") {
    input.athleteId = session.athletes[0]?.id ?? "";
    input.newClient = false;
  }
  const fail = (error: string) => ({ error, attempt: previous.attempt + 1, values: input });

  const parsed = parseSessionForm(input);
  if (!parsed.ok) return fail(parsed.error);
  if (!(await allBelongToOrg(orgId, parsed.athleteIds))) {
    return fail("Sportif introuvable dans ton organisation.");
  }

  const supabase = await createClient();
  const v = parsed.values;
  // Seulement les colonnes modifiables (le type et le sportif restent ceux de la séance).
  const changes = {
    title: v.title,
    discipline: v.discipline,
    location: v.location,
    starts_on: v.starts_on,
    start_time: v.start_time,
    duration_minutes: v.duration_minutes,
    repeats_weekly: v.repeats_weekly,
    ends_on: v.ends_on,
    notes: v.notes,
    price_cents: v.price_cents,
    price_vat_included: v.price_vat_included,
    payment_method: v.payment_method,
  };
  const { error } = await supabase
    .from("coach_sessions")
    .update(changes)
    .eq("id", session.id)
    .eq("organization_id", orgId);
  if (error) return fail("La séance n'a pas pu être enregistrée. Réessaie.");

  if (session.kind === "group") {
    const before = new Set(session.athletes.map((athlete) => athlete.id));
    const after = new Set(parsed.athleteIds);
    const removed = [...before].filter((id) => !after.has(id));
    const added = [...after].filter((id) => !before.has(id));
    const results = await Promise.all([
      removed.length > 0
        ? supabase
            .from("coach_session_athletes")
            .delete()
            .eq("session_id", session.id)
            .eq("organization_id", orgId)
            .in("athlete_id", removed)
        : null,
      added.length > 0
        ? supabase.from("coach_session_athletes").insert(
            added.map((athleteId) => ({
              session_id: session.id,
              organization_id: orgId,
              athlete_id: athleteId,
              created_by: user.id,
            })),
          )
        : null,
    ]);
    if (results.some((result) => result?.error)) {
      return fail(
        "La séance est enregistrée, mais la liste des inscrits n'a pas pu être mise à jour.",
      );
    }
  }

  revalidatePath(`/coach/o/${orgId}/agenda`);
  redirect(`/coach/o/${orgId}/agenda/seances/${session.id}`);
}

export async function deleteSession(organizationId: string, sessionId: string) {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  if (!z.uuid().safeParse(sessionId).success) return;

  const supabase = await createClient();
  await supabase.from("coach_sessions").delete().eq("id", sessionId).eq("organization_id", orgId);

  revalidatePath(`/coach/o/${orgId}/agenda`);
  redirect(`/coach/o/${orgId}/agenda`);
}

// Glisser-déposer dans l'agenda (D-35). `originalDate` : la date de la série dont vient le bloc.
// Séance unique : elle change de date et d'heure. Séance hebdomadaire : « single » déplace seulement
// cette date (ligne de coach_session_exceptions), « series » décale toute la série (fonction SQL
// move_session_series, en une transaction). Tout est revérifié ici : le navigateur ne décide de rien.
const moveSchema = z.object({
  originalDate: z.iso.date(),
  newDate: z.iso.date().refine((day) => day >= "2000-01-01"),
  // Quart d'heure, comme la grille.
  newTime: z.string().regex(/^([01]\d|2[0-3]):(00|15|30|45)$/),
  scope: z.enum(["single", "series"]),
});

export type MoveSessionInput = z.input<typeof moveSchema> & { sessionId: string };

const DAY_MS = 86_400_000;
const dayGap = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

export async function moveSession(
  organizationId: string,
  input: MoveSessionInput,
): Promise<{ ok: boolean; error?: string }> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const parsed = moveSchema.safeParse(input);
  const session =
    parsed.success && z.uuid().safeParse(input.sessionId).success
      ? await getSession(orgId, input.sessionId)
      : null;
  if (!parsed.success || !session) return { ok: false, error: "Séance introuvable." };
  const { originalDate, newDate, newTime, scope } = parsed.data;

  const [hours, minutes] = newTime.split(":").map(Number);
  if (hours * 60 + minutes + session.durationMinutes > 24 * 60) {
    return { ok: false, error: "La séance finirait après minuit." };
  }
  if (session.repeatsWeekly && !occursOn(session, originalDate)) {
    return { ok: false, error: "Cette date ne fait pas partie de la série." };
  }

  const supabase = await createClient();
  let error;
  if (!session.repeatsWeekly) {
    ({ error } = await supabase
      .from("coach_sessions")
      .update({ starts_on: newDate, start_time: newTime })
      .eq("id", session.id)
      .eq("organization_id", orgId));
  } else if (scope === "series") {
    // Même jour de la semaine visé, au plus près : de -3 à +3 jours (la base refuse au-delà).
    const shift = (((dayGap(originalDate, newDate) % 7) + 10) % 7) - 3;
    ({ error } = await supabase.rpc("move_session_series", {
      p_session_id: session.id,
      p_shift_days: shift,
      p_start_time: newTime,
    }));
  } else if (newDate === originalDate && newTime === session.startTime) {
    // Remise à sa place d'origine : ce n'est plus une date déplacée.
    ({ error } = await supabase
      .from("coach_session_exceptions")
      .delete()
      .eq("session_id", session.id)
      .eq("original_date", originalDate));
  } else if (session.exceptions.some((e) => e.originalDate === originalDate)) {
    // Déjà déplacée : nouvelle place (pas d'upsert, qui réécrirait aussi les colonnes fixes).
    ({ error } = await supabase
      .from("coach_session_exceptions")
      .update({ new_date: newDate, new_start_time: newTime })
      .eq("session_id", session.id)
      .eq("original_date", originalDate));
  } else {
    ({ error } = await supabase.from("coach_session_exceptions").insert({
      session_id: session.id,
      organization_id: orgId,
      original_date: originalDate,
      new_date: newDate,
      new_start_time: newTime,
      created_by: user.id,
    }));
  }
  if (error) return { ok: false, error: "La séance n'a pas pu être déplacée. Réessaie." };

  revalidatePath("/coach");
  revalidatePath(`/coach/o/${orgId}/agenda`);
  revalidatePath(`/coach/o/${orgId}/agenda/seances/${session.id}`);
  return { ok: true };
}

// Sportifs proposés dans la fenêtre « Nouvelle séance » (ouverte depuis n'importe quelle page) : les
// fiches non archivées de l'organisation, lues à l'ouverture.
export async function listSessionAthletes(
  organizationId: string,
): Promise<{ id: string; name: string }[]> {
  const { membership } = await requireOrgAccess(organizationId);
  const athletes = await listAthletes(membership.organizationId, { status: "all", q: "" });
  return athletes
    .filter((athlete) => athlete.status !== "archived")
    .map((athlete) => ({ id: athlete.id, name: athlete.displayName }));
}

// « Payée » (D-52) : le coach note qu'une date de la séance a été payée. C'est un VRAI paiement reçu
// (athlete_payments), daté d'aujourd'hui : il compte dans « Encaissé cette semaine » et dans la
// Comptabilité. Montant, TVA et mode viennent de la séance, jamais du navigateur. Une seule fois par
// date (index unique en base) : un double clic ne crée pas deux paiements.
const sessionDateSchema = z.iso.date().refine((day) => day >= "2000-01-01");

function revalidatePayments(orgId: string, sessionId: string) {
  revalidatePath("/coach");
  revalidatePath("/coach/comptabilite");
  revalidatePath(`/coach/o/${orgId}/agenda/seances/${sessionId}`);
}

export async function markSessionPaid(
  organizationId: string,
  sessionId: string,
  sessionDate: string,
): Promise<{ ok: boolean }> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const session =
    z.uuid().safeParse(sessionId).success && sessionDateSchema.safeParse(sessionDate).success
      ? await getSession(orgId, sessionId)
      : null;
  if (!session || session.priceCents === null || !session.paymentMethod) return { ok: false };
  if (!occursOn(session, sessionDate)) return { ok: false };
  // Date comprise dans un forfait déjà payé par le sportif : jamais payée une deuxième fois.
  const athleteId = session.kind === "individual" ? (session.athletes[0]?.id ?? null) : null;
  if (coveredByPackage(await listPackageCovers(orgId), athleteId, sessionDate))
    return { ok: false };

  const vatRate = await getDefaultVatRate(orgId);
  const supabase = await createClient();
  const { error } = await supabase.from("athlete_payments").insert({
    organization_id: orgId,
    athlete_id: athleteId,
    received_on: todayIsoInBrussels(),
    amount_cents: sessionAmountCents({ ...session, priceCents: session.priceCents }, vatRate),
    vat_rate: vatRate,
    method: session.paymentMethod,
    label: `${session.title} · ${dayLabel(sessionDate)}`.slice(0, 120),
    session_id: session.id,
    session_date: sessionDate,
    created_by: user.id,
  });
  revalidatePayments(orgId, session.id);
  // Doublon (déjà payée, double appui) : l'index unique refuse la ligne ; la date est bien payée.
  return { ok: !error || error.code === "23505" };
}

// Payée par erreur : le paiement de cette date est supprimé.
export async function unmarkSessionPaid(
  organizationId: string,
  sessionId: string,
  sessionDate: string,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  if (!z.uuid().safeParse(sessionId).success || !sessionDateSchema.safeParse(sessionDate).success) {
    return { ok: false };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete_payments")
    .delete()
    .eq("organization_id", orgId)
    .eq("session_id", sessionId)
    .eq("session_date", sessionDate);
  revalidatePayments(orgId, sessionId);
  return { ok: !error };
}
