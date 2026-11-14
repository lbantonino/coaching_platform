import "server-only";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { CoachSession } from "./queries";
import { newlyAddedAthletes, parseSessionForm, type SessionFormInput } from "./schemas";

// Cœurs des actions de l'agenda, SANS redirection : les actions « Modifier la séance » et
// « Supprimer » les appellent puis redirigent ; l'Assistant IA (lot 4, D-183) les appelle depuis
// executeAssistantAction, après requireOrgAccess. Jamais dans un fichier « use server » (chaque export
// y deviendrait appelable depuis le navigateur).

export function readForm(formData: FormData, kind: string): SessionFormInput {
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
    applyVat: formData.get("applyVat") === "on",
    vatRate: field("vatRate"),
    vatIncluded: formData.get("vatIncluded") === "on",
    paymentMethod: field("paymentMethod"),
  };
}

// Les sportifs choisis doivent être des fiches NON archivées de cette organisation (jamais le navigateur).
export async function allBelongToOrg(
  organizationId: string,
  athleteIds: string[],
): Promise<boolean> {
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

// « Modifier la séance » : toute la séance (toute la série si elle se répète), d'après le formulaire
// complet. Le type et le sportif d'une séance individuelle ne changent pas.
export async function saveSessionChanges(
  orgId: string,
  userId: string,
  session: CoachSession,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string; values: SessionFormInput }> {
  // Le type et le sportif d'une séance individuelle ne changent pas (droit refusé en base aussi).
  const input = readForm(formData, session.kind);
  if (session.kind === "individual") {
    input.athleteId = session.athletes[0]?.id ?? "";
    input.newClient = false;
  }
  const fail = (error: string) => ({ ok: false as const, error, values: input });

  const parsed = parseSessionForm(input);
  if (!parsed.ok) return fail(parsed.error);
  const enrolled = session.athletes.map((athlete) => athlete.id);
  if (!(await allBelongToOrg(orgId, newlyAddedAthletes(enrolled, parsed.athleteIds)))) {
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
    vat_rate: v.vat_rate,
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
              created_by: userId,
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
  return { ok: true };
}

// « Supprimer » : la séance et toutes ses dates ; les paiements déjà notés restent (la base retire
// seulement leur lien). `ok` : une séance de l'organisation a bien été supprimée.
export async function removeCoachSession(
  orgId: string,
  sessionId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("organization_id", orgId)
    .select("id");
  revalidatePath(`/coach/o/${orgId}/agenda`);
  return { ok: !error && (data ?? []).length > 0 };
}
