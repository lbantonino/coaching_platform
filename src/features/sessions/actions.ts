"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { listAthletes } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { getSession } from "./queries";
import { occursOn, parseSessionForm, type SessionFormInput } from "./schemas";

// `attempt` change à CHAQUE réponse : le formulaire est reconstruit avec la saisie renvoyée
// (React 19 remet sinon les menus déroulants et les cases à leur valeur de départ).
export type SessionFormState = {
  error: string | null;
  attempt: number;
  values: SessionFormInput | null;
  // Création depuis la fenêtre de l'agenda (champ « stay ») : la séance créée, sans changer de page.
  created?: { id: string; title: string } | null;
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
    prospectName: field("prospectName"),
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
  // Fenêtre « Nouvelle séance » de l'agenda (clic sur un créneau) : on reste sur la page.
  if (formData.get("stay") === "1") {
    revalidatePath("/coach");
    return {
      error: null,
      attempt: previous.attempt + 1,
      values: null,
      created: { id: data.id, title: parsed.values.title },
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

  // Le type ne change pas, ni le sportif une fois rattaché (refusé en base aussi). Une séance d'un
  // nouveau client (sans sportif) peut, elle, être rattachée à sa fiche une fois créée.
  const input = readForm(formData, session.kind);
  const attached = session.athletes[0]?.id;
  if (session.kind === "individual" && attached) {
    input.athleteId = attached;
    input.newClient = false;
  }
  const fail = (error: string) => ({ error, attempt: previous.attempt + 1, values: input });

  const parsed = parseSessionForm(input);
  if (!parsed.ok) return fail(parsed.error);
  const linking = session.kind === "individual" && !attached ? parsed.values.athlete_id : null;
  if (!(await allBelongToOrg(orgId, linking ? [linking] : parsed.athleteIds))) {
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
    // Nouveau client : son nom, ou son rattachement à une fiche (une seule fois).
    ...(session.kind === "individual" && !attached
      ? { athlete_id: v.athlete_id, prospect_name: v.prospect_name }
      : {}),
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
