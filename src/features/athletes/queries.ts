import "server-only";

import { z } from "zod";

import type { Discipline } from "@/domain/training/discipline";
import { goalDiscipline, type GoalType } from "@/features/goals/schemas";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { missingProfileInfo } from "./completeness";
import type {
  AthleteLevel,
  AthleteListFilter,
  AthleteStatus,
  ContactChannel,
  Sex,
  TrainingPlace,
  WeekDay,
} from "./schemas";

export type AthleteListItem = {
  id: string;
  displayName: string;
  email: string | null;
  status: AthleteStatus;
  hasAccount: boolean;
  hasPendingInvite: boolean;
  sex: Sex | null;
  // Chemin de la photo de profil dans le stockage privé (D-28), servie par /photos.
  photoPath: string | null;
  // Discipline de l'objectif principal en cours : couleur de l'avatar dans la liste (D-24).
  mainDiscipline: Discipline | null;
  // Fiche « à compléter » (D-35) : ce qui manque encore (vide si la fiche est complète).
  missingInfo: string[];
  level: AthleteLevel | null;
  createdAt: string;
  // Objectif principal en cours (type, ou nom de la compétition) et prochaine compétition à venir.
  mainGoal: { type: GoalType; competitionName: string | null } | null;
  nextCompetition: { name: string; date: string } | null;
};

const DEFAULT_FILTER: AthleteListFilter = { status: "active", q: "" };

type GoalRow = {
  goal_type: string;
  priority: string;
  status: string;
  target_date: string | null;
  competition_name: string | null;
};

function mainGoalDiscipline(goals: GoalRow[]) {
  const main = goals.find((goal) => goal.priority === "main" && goal.status === "active");
  // La contrainte CHECK en base garantit la liste des types d'objectif.
  return main ? goalDiscipline(main.goal_type as GoalType) : null;
}

// Prochaine compétition en cours, à partir d'aujourd'hui (la plus proche).
function nextCompetition(goals: GoalRow[], today: string) {
  const next = goals
    .filter(
      (g) => g.status === "active" && g.competition_name && g.target_date && g.target_date >= today,
    )
    .sort((a, b) => (a.target_date ?? "").localeCompare(b.target_date ?? ""))[0];
  return next ? { name: next.competition_name ?? "", date: next.target_date ?? "" } : null;
}

// Sportifs d'une organisation. À appeler APRÈS requireOrgAccess(organizationId) ;
// la RLS filtre de toute façon les fiches des autres organisations.
// La recherche texte est faite ici côté serveur, en mémoire : volumes de l'ordre de quelques dizaines
// de sportifs par coach. À remplacer par une recherche en base paginée si les volumes grandissent.
export async function listAthletes(
  organizationId: string,
  filter: AthleteListFilter = DEFAULT_FILTER,
): Promise<AthleteListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("athlete_profiles")
    .select(
      "id, first_name, last_name, display_name, email, phone, status, sex, photo_path, level, created_at, athlete_user_id, athlete_invites ( status, expires_at ), athlete_goals ( goal_type, priority, status, target_date, competition_name )",
    )
    .eq("organization_id", organizationId)
    .order("display_name");
  if (filter.status !== "all") query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw new Error("Lecture des sportifs impossible.");

  const now = new Date();
  const today = todayIsoInBrussels();
  return (data ?? [])
    .map((row) => {
      const main = row.athlete_goals.find((g) => g.priority === "main" && g.status === "active");
      return {
        id: row.id,
        // display_name est calculé par la base (prénom + nom) : jamais vide, le repli ne sert qu'au typage.
        displayName: row.display_name ?? row.first_name,
        email: row.email,
        // La contrainte CHECK en base garantit active | paused | archived.
        status: row.status as AthleteStatus,
        hasAccount: row.athlete_user_id !== null,
        hasPendingInvite: row.athlete_invites.some(
          (invite) => invite.status === "pending" && new Date(invite.expires_at) > now,
        ),
        sex: row.sex as Sex | null,
        photoPath: row.photo_path,
        mainDiscipline: mainGoalDiscipline(row.athlete_goals),
        missingInfo: missingProfileInfo({
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
        }),
        // Les contraintes CHECK en base garantissent ces listes fermées.
        level: row.level as AthleteLevel | null,
        createdAt: row.created_at,
        mainGoal: main
          ? { type: main.goal_type as GoalType, competitionName: main.competition_name }
          : null,
        nextCompetition: nextCompetition(row.athlete_goals, today),
      };
    })
    .filter(
      (athlete) =>
        !filter.q ||
        athlete.displayName.toLowerCase().includes(filter.q) ||
        (athlete.email ?? "").toLowerCase().includes(filter.q),
    );
}

export type AthleteDetail = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string | null;
  sex: Sex | null;
  // Chemin de la photo de profil dans le stockage privé (D-28), servie par /photos.
  photoPath: string | null;
  email: string | null;
  phone: string | null;
  preferredContact: ContactChannel | null;
  level: AthleteLevel | null;
  experience: string | null;
  trainingPlaces: TrainingPlace[];
  equipment: string | null;
  sessionsPerWeek: number | null;
  availableDays: WeekDay[];
  maxSessionMinutes: number | null;
  scheduleConstraints: string | null;
  // Donnée de santé : n'existe que pendant qu'un accord est en cours (healthConsentAt non nul).
  healthConstraints: string | null;
  healthConsentAt: string | null;
  status: AthleteStatus;
  hasAccount: boolean;
  createdAt: string;
};

// Fiche d'un sportif dans une organisation dont l'accès a DÉJÀ été vérifié.
// null si l'ID est invalide ou appartient à une autre organisation (même réponse : pas de fuite).
export async function getAthlete(
  organizationId: string,
  athleteId: string,
): Promise<AthleteDetail | null> {
  if (!z.uuid().safeParse(athleteId).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_profiles")
    .select(
      "id, first_name, last_name, sex, photo_path, display_name, email, phone, preferred_contact, level, experience, training_places, equipment, sessions_per_week, available_days, max_session_minutes, schedule_constraints, health_constraints, health_consent_at, status, athlete_user_id, created_at",
    )
    .eq("id", athleteId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw new Error("Lecture de la fiche impossible.");
  if (!data) return null;

  return {
    id: data.id,
    displayName: data.display_name ?? data.first_name,
    firstName: data.first_name,
    lastName: data.last_name,
    sex: data.sex as Sex | null,
    photoPath: data.photo_path,
    email: data.email,
    phone: data.phone,
    // Les contraintes CHECK en base garantissent ces listes fermées.
    preferredContact: data.preferred_contact as ContactChannel | null,
    level: data.level as AthleteLevel | null,
    experience: data.experience,
    trainingPlaces: data.training_places as TrainingPlace[],
    equipment: data.equipment,
    sessionsPerWeek: data.sessions_per_week,
    availableDays: data.available_days as WeekDay[],
    maxSessionMinutes: data.max_session_minutes,
    scheduleConstraints: data.schedule_constraints,
    healthConstraints: data.health_constraints,
    healthConsentAt: data.health_consent_at,
    status: data.status as AthleteStatus,
    hasAccount: data.athlete_user_id !== null,
    createdAt: data.created_at,
  };
}
