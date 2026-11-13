import "server-only";

import { z } from "zod";

import { oneRepMax, type OneRepMax } from "@/domain/training/aims";
import type { Discipline } from "@/domain/training/discipline";
import { defaultHyroxDivision, type AthleteSex } from "@/domain/training/hyrox-official";
import { paceToSpeedKmh } from "@/domain/training/pace";
import {
  programDraftSchema,
  type HyroxDivision,
  type ProgramDraft,
} from "@/domain/training/program-plan";
import type { AimContext } from "@/domain/training/program-publication";
import { draftFromPublication, type CoachSessionSlot } from "@/domain/training/program-upgrade";
import { meetingResolver } from "@/features/agenda/coach-meeting";
import { listSessions } from "@/features/sessions/queries";
import { WEEKDAYS, type Weekday } from "@/domain/training/session-v2";
import { createClient } from "@/lib/supabase/server";

// Lectures de l'éditeur de programmes (D-155) : le brouillon, et ce qu'on sait du sportif pour
// calculer les valeurs (D-153). Organisation DÉJÀ vérifiée par l'appelant (requireOrgAccess) ; la RLS
// reste la dernière défense.

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type AthleteContext = {
  id: string;
  firstName: string;
  displayName: string;
  sex: AthleteSex;
  availableDays: Weekday[];
  vmaKmh: number | null;
  hrMax: number | null;
  maxByExercise: Map<string, OneRepMax>;
  hyroxCategory: "open" | "pro" | "doubles" | "relay" | null;
  // Division pré-remplie (assistant, étape 2) quand l'objectif et le sexe suffisent.
  defaultHyroxDivision: HyroxDivision | null;
};

const latestFirst = { ascending: false } as const;

// Ce qu'on sait du sportif : sexe, jours disponibles, VMA, FC max, max par exercice, catégorie Hyrox.
export async function loadAthleteContext(
  supabase: Supabase,
  organizationId: string,
  athleteId: string,
): Promise<AthleteContext | null> {
  const [profile, metrics, goals] = await Promise.all([
    supabase
      .from("athlete_profiles")
      .select("id, first_name, display_name, sex, available_days")
      .eq("organization_id", organizationId)
      .eq("id", athleteId)
      .maybeSingle(),
    supabase
      .from("athlete_reference_metrics")
      .select("kind, pace_min_sec_per_km, bpm, load_kg, reps, exercise_id, measured_on, created_at")
      .eq("organization_id", organizationId)
      .eq("athlete_id", athleteId)
      .in("kind", ["pace_vma", "hr_max", "strength_load"])
      .order("measured_on", latestFirst)
      .order("created_at", latestFirst),
    supabase
      .from("athlete_goals")
      .select("hyrox_category, priority, status, created_at")
      .eq("organization_id", organizationId)
      .eq("athlete_id", athleteId)
      .eq("goal_type", "hyrox")
      .eq("status", "active")
      .order("created_at", latestFirst),
  ]);
  if (profile.error || metrics.error || goals.error)
    throw new Error("Lecture du sportif impossible.");
  if (!profile.data) return null;

  // Le repère le plus récent fait foi (historique immuable, une nouvelle valeur = une nouvelle ligne).
  const rows = metrics.data ?? [];
  const vma = rows.find((row) => row.kind === "pace_vma" && row.pace_min_sec_per_km !== null);
  const hrMax = rows.find((row) => row.kind === "hr_max" && row.bpm !== null);
  const maxByExercise = new Map<string, OneRepMax>();
  for (const row of rows) {
    if (row.kind !== "strength_load" || !row.exercise_id || row.load_kg === null) continue;
    if (maxByExercise.has(row.exercise_id)) continue;
    const max = oneRepMax(Number(row.load_kg), row.reps);
    if (max) maxByExercise.set(row.exercise_id, max);
  }
  const goal =
    (goals.data ?? []).find((row) => row.priority === "main" && row.hyrox_category) ??
    (goals.data ?? []).find((row) => row.hyrox_category);
  const hyroxCategory = (goal?.hyrox_category ?? null) as AthleteContext["hyroxCategory"];
  const sex = (profile.data.sex ?? null) as AthleteSex;

  return {
    id: profile.data.id,
    firstName: profile.data.first_name,
    displayName: profile.data.display_name ?? profile.data.first_name,
    sex,
    availableDays: (profile.data.available_days ?? []).filter((day): day is Weekday =>
      (WEEKDAYS as readonly string[]).includes(day),
    ),
    vmaKmh: vma?.pace_min_sec_per_km ? paceToSpeedKmh(vma.pace_min_sec_per_km) : null,
    hrMax: hrMax?.bpm ?? null,
    maxByExercise,
    hyroxCategory,
    defaultHyroxDivision: defaultHyroxDivision(hyroxCategory, sex),
  };
}

export function aimContext(athlete: AthleteContext, draft: ProgramDraft): AimContext {
  return {
    hrMax: athlete.hrMax,
    maxByExercise: athlete.maxByExercise,
    hyroxDivision: draft.goal?.hyroxDivision ?? athlete.defaultHyroxDivision,
    sex: athlete.sex,
  };
}

// Séances encadrées de l'organisation (dater une séance « avec le coach »).
export async function listCoachSessionSlots(
  supabase: Supabase,
  organizationId: string,
): Promise<CoachSessionSlot[]> {
  const { data, error } = await supabase
    .from("coach_sessions")
    .select("id, starts_on, start_time")
    .eq("organization_id", organizationId);
  if (error) throw new Error("Lecture des séances encadrées impossible.");
  return (data ?? []).map((row) => ({
    id: row.id,
    startsOn: row.starts_on,
    startTime: row.start_time,
  }));
}

export type ProgramRow = {
  id: string;
  organizationId: string;
  athleteId: string;
  title: string;
  goal: string | null;
  discipline: Discipline | null;
  startDate: string;
  weeksCount: number;
  status: "draft" | "published" | "archived";
  activePublicationId: string | null;
};

export type LoadedDraft = {
  program: ProgramRow;
  draft: ProgramDraft | null;
  // 0 = brouillon pas encore enregistré (repris de la version publiée) : le premier enregistrement
  // le crée (save_program_draft avec la révision 0).
  revision: number;
  activePublication: {
    id: string;
    number: number;
    sourceRevision: number | null;
    publishedAt: string;
  } | null;
  // « Modifications non publiées » : le brouillon est plus récent que la version active.
  hasUnpublishedChanges: boolean;
};

const DISCIPLINE = z.enum(["running", "strength", "hyrox", "hybrid"]);

// Le brouillon d'un programme de l'organisation ; null si le programme n'existe pas (ou est d'une
// autre organisation : même réponse). S'il n'a pas encore de brouillon, il est repris de la version
// publiée, SANS rien écrire (pas d'écriture pendant une lecture).
export async function loadDraft(
  supabase: Supabase,
  organizationId: string,
  programId: string,
): Promise<LoadedDraft | null> {
  if (!z.uuid().safeParse(programId).success) return null;
  const { data: row, error } = await supabase
    .from("programs")
    .select(
      "id, organization_id, athlete_id, title, goal, discipline, start_date, weeks_count, status, active_publication_id, program_drafts ( revision, draft_json ), program_publications!programs_active_publication_fkey ( id, number, source_revision, published_at, snapshot_json )",
    )
    .eq("organization_id", organizationId)
    .eq("id", programId)
    .maybeSingle();
  if (error) throw new Error("Lecture du programme impossible.");
  if (!row) return null;

  const program: ProgramRow = {
    id: row.id,
    organizationId: row.organization_id,
    athleteId: row.athlete_id,
    title: row.title,
    goal: row.goal,
    discipline: DISCIPLINE.safeParse(row.discipline).data ?? null,
    startDate: row.start_date,
    weeksCount: row.weeks_count,
    status: row.status as ProgramRow["status"],
    activePublicationId: row.active_publication_id,
  };
  const publication = row.program_publications;
  const activePublication = publication
    ? {
        id: publication.id,
        number: publication.number,
        sourceRevision: publication.source_revision,
        publishedAt: publication.published_at,
      }
    : null;

  // Un brouillon par programme (clé primaire) : objet ou tableau d'un élément selon le client.
  const stored = Array.isArray(row.program_drafts) ? row.program_drafts[0] : row.program_drafts;
  if (stored) {
    const parsed = programDraftSchema.safeParse(stored.draft_json);
    return {
      program,
      draft: parsed.success ? parsed.data : null,
      revision: stored.revision,
      activePublication,
      hasUnpublishedChanges:
        activePublication !== null && activePublication.sourceRevision !== stored.revision,
    };
  }

  if (!publication)
    return { program, draft: null, revision: 0, activePublication, hasUnpublishedChanges: false };

  const [sessions, agenda] = await Promise.all([
    supabase
      .from("publication_sessions")
      .select("source_session_key, week_index, slot_index, session_json")
      .eq("organization_id", organizationId)
      .eq("publication_id", publication.id),
    listSessions(organizationId),
  ]);
  if (sessions.error) throw new Error("Lecture des séances du programme impossible.");
  const draft = draftFromPublication({
    program: {
      title: program.title,
      goal: program.goal,
      discipline: program.discipline,
      startDate: program.startDate,
      weeksCount: program.weeksCount,
    },
    snapshot: publication.snapshot_json,
    sessions: (sessions.data ?? []).map((session) => ({
      key: session.source_session_key,
      weekIndex: session.week_index,
      slotIndex: session.slot_index,
      json: session.session_json,
    })),
    coachSessions: agenda.map((session) => ({
      id: session.id,
      startsOn: session.startsOn,
      startTime: session.startTime,
    })),
    // Le vrai rendez-vous de chaque semaine, lu dans l'agenda (revue MVP du 13/11, B5).
    meetingIn: meetingResolver(agenda),
  });
  return { program, draft, revision: 0, activePublication, hasUnpublishedChanges: false };
}

// Max du sportif par exercice, avec la date du repère (« Max de Lucas : 20 kg, repère du 12 oct. ») :
// le repère le plus récent relié à chaque exercice (éditeur Musculation, % du max).
export async function loadStrengthMaxes(
  supabase: Supabase,
  organizationId: string,
  athleteId: string,
): Promise<Record<string, OneRepMax & { date: string }>> {
  const { data, error } = await supabase
    .from("athlete_reference_metrics")
    .select("load_kg, reps, exercise_id, measured_on, created_at")
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .eq("kind", "strength_load")
    .not("exercise_id", "is", null)
    .order("measured_on", latestFirst)
    .order("created_at", latestFirst);
  if (error) throw new Error("Lecture des repères impossible.");
  const maxes: Record<string, OneRepMax & { date: string }> = {};
  for (const row of data ?? []) {
    if (!row.exercise_id || row.load_kg === null || maxes[row.exercise_id]) continue;
    const max = oneRepMax(Number(row.load_kg), row.reps);
    if (max) maxes[row.exercise_id] = { ...max, date: row.measured_on };
  }
  return maxes;
}

// Clés des séances du brouillon d'un programme (onglet Programme du sportif : « Modifier la séance »
// ouvre directement l'éditeur d'une séance qui existe encore dans le brouillon).
export async function draftSessionKeys(
  supabase: Supabase,
  organizationId: string,
  programId: string,
): Promise<string[]> {
  const loaded = await loadDraft(supabase, organizationId, programId);
  return loaded?.draft ? loaded.draft.weeks.flatMap((week) => week.sessions.map((s) => s.key)) : [];
}
