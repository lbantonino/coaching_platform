import "server-only";

import { z } from "zod";

import type { Discipline } from "@/domain/training/discipline";
import { HYROX_DIVISIONS, type HyroxDivision } from "@/domain/training/program-plan";
import { parseProgramSession, type ProgramSessionContent } from "@/domain/training/program-session";
import { weekdayOf } from "@/domain/training/scheduling";
import {
  publishedSessionSchema,
  type PublishedSession,
  type Weekday,
} from "@/domain/training/session-v2";
import { sessionHeadline } from "@/domain/training/session-view";
import {
  pickCurrentProgram,
  programListStatus,
  type ProgramListStatus,
} from "@/domain/training/program-status";
import { addDays } from "@/features/agenda/items";
import { formatDayMonth, todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

// Programme publié d'un sportif (D-46, tranche 1) : ce que le sportif suit, lu depuis la publication
// ACTIVE (version figée), jamais depuis un brouillon. Une séance n'a pas de jour : une semaine (lundi →
// dimanche, calculée depuis la date de début) et un numéro de séance.

export type ProgramSessionCard = {
  id: string;
  // Clé de la séance dans le programme (la même dans le brouillon : « Modifier la séance »).
  key: string;
  weekIndex: number;
  slotIndex: number;
  content: ProgramSessionContent;
  // Résumé d'une ligne (« 65 min · zone 2 », « 5 × 2 min · ≈ 45 min ») et jour : fixé (jours fixes)
  // ou celui du rendez-vous du coach ; null en « dans l'ordre ».
  headline: string;
  day: Weekday | null;
  time: string | null;
  coachDate: string | null;
  // La séance structurée (v2) telle que publiée ; null pour une publication v1 (texte). Sert aux
  // fiches PDF (séries, charges, repos).
  published: PublishedSession | null;
};

export type ProgramWeek = {
  index: number;
  // Phase de la semaine (« Préparation », « Allègement »…), si le coach l'a nommée.
  label: string | null;
  light: boolean;
  // Jours fixés par le coach (03b) ; sinon « dans l'ordre », le sportif choisit ses jours.
  fixed: boolean;
  monday: string;
  sunday: string;
  sessions: ProgramSessionCard[];
};

export type AthleteProgram = {
  id: string;
  title: string;
  goal: string | null;
  startDate: string;
  weeksCount: number;
  publicationNumber: number;
  publishedAt: string;
  discipline: Discipline | null;
  // Séances par semaine prévues à la création (v2) ; null en v1.
  sessionsPerWeek: number | null;
  // Objectif de course du programme (« HYROX Gand · 13 déc. · Open Femmes »).
  race: { name: string; date: string | null; division: HyroxDivision | null } | null;
  // Coach qui a créé le programme (signature des conseils sur la page d'une séance).
  createdBy: string | null;
  weeks: ProgramWeek[];
};

const snapshotSchema = z.object({
  discipline: z.enum(["running", "strength", "hyrox", "hybrid"]).optional(),
  sessionsPerWeek: z.number().int().optional(),
  goal: z
    .object({
      raceName: z.string().optional(),
      raceDate: z.string().optional(),
      hyroxDivision: z.enum(HYROX_DIVISIONS).optional(),
    })
    .optional(),
  weeks: z
    .array(
      z.object({
        index: z.number().int(),
        label: z.string().nullable().optional(),
        light: z.boolean().optional(),
        scheduling: z.enum(["ordered", "fixed"]).optional(),
      }),
    )
    .optional(),
});

// Programme publié du sportif, dans une organisation DÉJÀ vérifiée (requireOrgAccess) ; null s'il n'y
// en a pas. Depuis C-8 (09/11/2026), un sportif peut en avoir un « En cours » et un « À venir » : on
// montre celui en cours, sinon le prochain. Les séances illisibles (contenu mal formé) sont écartées
// plutôt qu'affichées de travers ; la v1 (texte) et la v2 (structurée) se lisent toutes les deux.
export async function getAthleteProgram(
  organizationId: string,
  athleteId: string,
  today: string = todayIsoInBrussels(),
): Promise<AthleteProgram | null> {
  const supabase = await createClient();
  const { data: programs, error } = await supabase
    .from("programs")
    .select(
      "id, title, goal, start_date, weeks_count, created_by, active_publication_id, program_publications!programs_active_publication_fkey ( id, number, published_at, snapshot_json )",
    )
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .eq("status", "published");
  if (error) throw new Error("Lecture du programme impossible.");
  const program = pickCurrentProgram(
    (programs ?? []).map((row) => ({
      ...row,
      startDate: row.start_date,
      weeksCount: row.weeks_count,
    })),
    today,
  );
  const publication = program?.program_publications;
  if (!program || !publication) return null;
  return readPublication(supabase, organizationId, program, publication);
}

type ProgramRow = {
  id: string;
  title: string;
  goal: string | null;
  start_date: string;
  weeks_count: number;
  created_by: string | null;
};
type PublicationRow = { id: string; number: number; published_at: string; snapshot_json: unknown };

// Le programme tel que publié (version figée) : semaines, phases, séances v1 et v2.
async function readPublication(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  program: ProgramRow,
  publication: PublicationRow,
): Promise<AthleteProgram> {
  const { data: rows, error: sessionsError } = await supabase
    .from("publication_sessions")
    .select("id, source_session_key, week_index, slot_index, session_json")
    .eq("organization_id", organizationId)
    .eq("publication_id", publication.id)
    .order("week_index")
    .order("slot_index");
  if (sessionsError) throw new Error("Lecture des séances du programme impossible.");

  const snapshot = snapshotSchema.safeParse(publication.snapshot_json).data;
  const labels = new Map((snapshot?.weeks ?? []).map((week) => [week.index, week.label ?? null]));
  const lightWeeks = new Set(
    (snapshot?.weeks ?? []).filter((week) => week.light).map((week) => week.index),
  );
  const scheduling = new Map((snapshot?.weeks ?? []).map((week) => [week.index, week.scheduling]));
  const weeks: ProgramWeek[] = Array.from({ length: program.weeks_count }, (_, i) => {
    const monday = addDays(program.start_date, 7 * i);
    return {
      index: i + 1,
      label: labels.get(i + 1) ?? null,
      light: lightWeeks.has(i + 1),
      fixed: scheduling.get(i + 1) === "fixed",
      monday,
      sunday: addDays(monday, 6),
      sessions: [],
    };
  });
  for (const row of rows ?? []) {
    const content = parseProgramSession(row.session_json);
    const week = weeks[row.week_index - 1];
    if (content && week) {
      // v2 : le jour, le rendez-vous et le résumé viennent de la séance structurée.
      const v2 = publishedSessionSchema.safeParse(row.session_json);
      const session = v2.success ? v2.data : null;
      week.sessions.push({
        id: row.id,
        key: row.source_session_key,
        weekIndex: row.week_index,
        slotIndex: row.slot_index,
        content,
        headline: session ? sessionHeadline(session) : `${content.durationMinutes} min`,
        day: session?.withCoach ? weekdayOf(session.withCoach.date) : (session?.fixedDay ?? null),
        time: session?.withCoach?.time ?? session?.fixedTime ?? null,
        coachDate: session?.withCoach?.date ?? null,
        published: session,
      });
    }
  }

  return {
    id: program.id,
    title: program.title,
    goal: program.goal,
    startDate: program.start_date,
    weeksCount: program.weeks_count,
    publicationNumber: publication.number,
    publishedAt: publication.published_at,
    discipline: snapshot?.discipline ?? null,
    sessionsPerWeek: snapshot?.sessionsPerWeek ?? null,
    race: snapshot?.goal?.raceName
      ? {
          name: snapshot.goal.raceName,
          date: snapshot.goal.raceDate ?? null,
          division: snapshot.goal.hyroxDivision ?? null,
        }
      : null,
    createdBy: program.created_by,
    weeks,
  };
}

// Un programme PUBLIÉ précis de l'organisation (PDF de la phase 5), avec le nom de son sportif ; null
// s'il n'existe pas, n'est pas de cette organisation ou n'a jamais été publié (le PDF se tire de la
// version publiée, jamais du brouillon).
export async function getPublishedProgram(
  organizationId: string,
  programId: string,
): Promise<{ program: AthleteProgram; athleteName: string } | null> {
  if (!z.uuid().safeParse(programId).success) return null;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("programs")
    .select(
      "id, title, goal, start_date, weeks_count, created_by, athlete_id, program_publications!programs_active_publication_fkey ( id, number, published_at, snapshot_json )",
    )
    .eq("organization_id", organizationId)
    .eq("id", programId)
    .maybeSingle();
  if (error) throw new Error("Lecture du programme impossible.");
  const publication = row?.program_publications;
  if (!row || !publication) return null;
  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select("display_name")
    .eq("organization_id", organizationId)
    .eq("id", row.athlete_id)
    .maybeSingle();
  const program = await readPublication(supabase, organizationId, row, publication);
  return { program, athleteName: athlete?.display_name ?? "Sportif" };
}

export type ActiveProgram = {
  id: string;
  title: string;
  athleteId: string;
  athleteName: string;
  photoPath: string | null;
  startDate: string;
  weeksCount: number;
};

// Programmes publiés de l'organisation (DÉJÀ vérifiée), pour la carte « Programmes en cours » du
// tableau de bord ; sportifs archivés exclus. Un seul par sportif : celui en cours, sinon le prochain.
export async function listActivePrograms(
  organizationId: string,
  today: string = todayIsoInBrussels(),
): Promise<ActiveProgram[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select(
      "id, title, start_date, weeks_count, athlete_id, athlete_profiles!inner ( first_name, display_name, photo_path, status )",
    )
    .eq("organization_id", organizationId)
    .eq("status", "published")
    .neq("athlete_profiles.status", "archived")
    // Ordre STABLE (09/11/2026) : à date de début égale, le premier créé d'abord. Sans départage, la
    // base rendait les égalités dans un ordre quelconque, et la carte changeait d'un affichage à
    // l'autre (les programmes de démo commencent tous le même lundi).
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error("Lecture des programmes impossible.");
  const byAthlete = new Map<string, typeof data>();
  for (const row of data ?? [])
    byAthlete.set(row.athlete_id, [...(byAthlete.get(row.athlete_id) ?? []), row]);
  const shown = new Set(
    [...byAthlete.values()].flatMap((rows) => {
      const picked = pickCurrentProgram(
        rows.map((row) => ({ id: row.id, startDate: row.start_date, weeksCount: row.weeks_count })),
        today,
      );
      return picked ? [picked.id] : [];
    }),
  );
  return (data ?? [])
    .filter((row) => shown.has(row.id))
    .map((row) => ({
      id: row.id,
      title: row.title,
      athleteId: row.athlete_id,
      // display_name est calculé par la base : jamais vide, le repli ne sert qu'au typage.
      athleteName: row.athlete_profiles.display_name ?? row.athlete_profiles.first_name,
      photoPath: row.athlete_profiles.photo_path,
      startDate: row.start_date,
      weeksCount: row.weeks_count,
    }));
}

// Semaine en cours d'un programme (1 à n), bornée : avant le début, 1 ; après la fin, n.
export function currentWeekIndex(startDate: string, weeksCount: number, today: string): number {
  const days = Math.floor((Date.parse(today) - Date.parse(startDate)) / 86_400_000);
  return Math.min(Math.max(Math.floor(days / 7) + 1, 1), weeksCount);
}

// ---------------------------------------------------------------------------
// Page Programmes, onglet Programmes (01) : tous les programmes de l'organisation (DÉJÀ vérifiée).
// ---------------------------------------------------------------------------
export type ProgramListItem = {
  id: string;
  title: string;
  discipline: "running" | "strength" | "hyrox" | "hybrid" | null;
  athleteId: string;
  athleteName: string;
  photoPath: string | null;
  startDate: string;
  weeksCount: number;
  status: ProgramListStatus;
  publicationNumber: number | null;
  // Le brouillon est plus récent que la version publiée.
  hasUnpublishedChanges: boolean;
  // Semaine en cours (1 à N) d'un programme en cours.
  currentWeek: number | null;
  // Séances de la version publiée, ou prévues par le brouillon (semaines × séances par semaine).
  sessionsTotal: number | null;
  // « HYROX Gand · 13 déc. » (objectif de course du brouillon), ou l'objectif écrit d'avant l'éditeur.
  goalLine: string | null;
  updatedAt: string;
};

const raceGoalSchema = z.object({
  raceName: z.string().optional(),
  raceDate: z.string().optional(),
});

export type ProgramListFilters = {
  status?: ProgramListStatus | "all";
  // « Tous » sans filtre de statut : avec les archivés aussi (onglet « Archivés », phase 4).
  includeArchived?: boolean;
  discipline?: "running" | "strength" | "hyrox" | "hybrid";
  athleteId?: string;
  search?: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export async function listPrograms(
  organizationId: string,
  filters: ProgramListFilters = {},
  today: string = todayIsoInBrussels(),
): Promise<ProgramListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("programs")
    .select(
      "id, title, goal, discipline, athlete_id, start_date, weeks_count, status, updated_at, athlete_profiles!inner ( first_name, display_name, photo_path, program_type ), program_drafts ( revision, sessionsPerWeek:draft_json->sessionsPerWeek, raceGoal:draft_json->goal ), program_publications!programs_active_publication_fkey ( number, source_revision, publication_sessions ( count ) )",
    )
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true });
  if (filters.athleteId && z.uuid().safeParse(filters.athleteId).success) {
    query = query.eq("athlete_id", filters.athleteId);
  }
  if (filters.discipline) query = query.eq("discipline", filters.discipline);
  const { data, error } = await query;
  if (error) throw new Error("Lecture des programmes impossible.");

  const search = filters.search ? normalize(filters.search.trim()) : "";
  return (data ?? [])
    .map((row) => {
      const status = programListStatus(
        {
          status: row.status as "draft" | "published" | "archived",
          startDate: row.start_date,
          weeksCount: row.weeks_count,
        },
        today,
      );
      const publication = row.program_publications;
      const draft = Array.isArray(row.program_drafts)
        ? (row.program_drafts[0] ?? null)
        : row.program_drafts;
      const athleteName = row.athlete_profiles.display_name ?? row.athlete_profiles.first_name;
      // Séances : celles de la version publiée ; pour un brouillon, le plan (semaines × séances voulues).
      const published = publication?.publication_sessions?.[0]?.count;
      const perWeek = typeof draft?.sessionsPerWeek === "number" ? draft.sessionsPerWeek : null;
      const race = raceGoalSchema.safeParse(draft?.raceGoal).data;
      return {
        id: row.id,
        title: row.title,
        // Programme publié avant l'éditeur : pas de discipline enregistrée, celle du sportif.
        discipline: (row.discipline ??
          row.athlete_profiles.program_type) as ProgramListItem["discipline"],
        athleteId: row.athlete_id,
        athleteName,
        photoPath: row.athlete_profiles.photo_path,
        startDate: row.start_date,
        weeksCount: row.weeks_count,
        status,
        publicationNumber: publication?.number ?? null,
        hasUnpublishedChanges:
          publication !== null && draft !== null && publication.source_revision !== draft.revision,
        currentWeek:
          status === "current" ? currentWeekIndex(row.start_date, row.weeks_count, today) : null,
        sessionsTotal:
          typeof published === "number" && published > 0
            ? published
            : perWeek !== null
              ? perWeek * row.weeks_count
              : null,
        goalLine: race?.raceName
          ? [race.raceName, race.raceDate ? formatDayMonth(race.raceDate) : null]
              .filter(Boolean)
              .join(" · ")
          : row.goal,
        updatedAt: row.updated_at,
      };
    })
    .filter((item) =>
      filters.status && filters.status !== "all"
        ? item.status === filters.status
        : filters.includeArchived || item.status !== "archived",
    )
    .filter((item) =>
      search
        ? normalize(item.title).includes(search) || normalize(item.athleteName).includes(search)
        : true,
    );
}

// Programmes d'un sportif (organisation DÉJÀ vérifiée), du plus récent au plus ancien, archivés
// compris (phase 4 : un ancien programme archivé reste un programme à copier) : l'onglet Programme y
// cherche un brouillon jamais publié et un programme à copier.
export async function listAthleteProgramRows(
  organizationId: string,
  athleteId: string,
): Promise<{ id: string; title: string; status: "draft" | "published" | "archived" }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select("id, title, status, updated_at")
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Lecture des programmes du sportif impossible.");
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status === "draft" ? "draft" : row.status === "archived" ? "archived" : "published",
  }));
}
