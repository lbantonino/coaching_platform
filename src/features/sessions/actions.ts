"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { getSession } from "./queries";
import { parseSessionForm, type SessionFormInput } from "./schemas";

// `attempt` change à CHAQUE réponse : le formulaire est reconstruit avec la saisie renvoyée
// (React 19 remet sinon les menus déroulants et les cases à leur valeur de départ).
export type SessionFormState = {
  error: string | null;
  attempt: number;
  values: SessionFormInput | null;
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
    notes: field("notes"),
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
  const { data, error } = await supabase
    .from("coach_sessions")
    .insert({ ...parsed.values, organization_id: orgId, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) return fail("La séance n'a pas pu être enregistrée. Réessaie.");

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
  if (session.kind === "individual") input.athleteId = session.athletes[0]?.id ?? "";
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
