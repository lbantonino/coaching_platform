import "server-only";

import { z } from "zod";

import type { Discipline } from "@/domain/training/discipline";
import { defaultHyroxDivision, type AthleteSex } from "@/domain/training/hyrox-official";
import type { HyroxDivision } from "@/domain/training/program-plan";
import { createClient } from "@/lib/supabase/server";

import { listTemplates } from "./templates";

// Données de l'assistant « Créer un programme » (02, D-157) : les sportifs de l'organisation (DÉJÀ
// vérifiée par l'appelant), ce qu'il faut pour pré-choisir la façon de viser (WIZ-F06 : allure si la
// VMA est connue, sinon zones de FC ; % du max si des maxima sont reliés à un exercice, sinon kg) et
// la division Hyrox, leurs anciens programmes (« Copier un programme précédent ») et les modèles de
// programme (« Partir d'un modèle »).

// Début proposé (le prochain lundi) : règle du domaine, gardée ici pour les pages de l'assistant.
export { nextMonday } from "@/domain/training/program-status";

export type WizardProgram = {
  id: string;
  title: string;
  weeksCount: number;
  startDate: string;
  status: "draft" | "published" | "archived";
  publicationNumber: number | null;
};

export type WizardAthlete = {
  id: string;
  name: string;
  firstName: string;
  photoPath: string | null;
  programType: Discipline | null;
  sessionsPerWeek: number | null;
  hasVma: boolean;
  hasHrMax: boolean;
  hasLinkedMaxes: boolean;
  defaultDivision: HyroxDivision | null;
  programs: WizardProgram[];
};

export type WizardTemplate = {
  id: string;
  title: string;
  source: "coory" | "mine";
  discipline: Discipline;
  weeksCount: number;
  // Rythme du modèle (C15) : l'assistant le reprend quand on part de ce modèle.
  sessionsPerWeek: number | null;
  detail: string;
};

export type WizardData = { athletes: WizardAthlete[]; templates: WizardTemplate[] };

const DISCIPLINE = z.enum(["running", "strength", "hyrox", "hybrid"]);
const CATEGORY = z.enum(["open", "pro", "doubles", "relay"]);

export async function loadWizardData(organizationId: string): Promise<WizardData> {
  const supabase = await createClient();
  const [profiles, metrics, goals, programs, templates] = await Promise.all([
    supabase
      .from("athlete_profiles")
      .select(
        "id, first_name, display_name, photo_path, program_type, sex, sessions_per_week, status",
      )
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .order("first_name"),
    supabase
      .from("athlete_reference_metrics")
      .select("athlete_id, kind, exercise_id")
      .eq("organization_id", organizationId)
      .in("kind", ["pace_vma", "hr_max", "strength_load"]),
    supabase
      .from("athlete_goals")
      .select("athlete_id, hyrox_category, priority, created_at")
      .eq("organization_id", organizationId)
      .eq("goal_type", "hyrox")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("programs")
      .select(
        "id, athlete_id, title, weeks_count, start_date, status, program_publications!programs_active_publication_fkey ( number )",
      )
      .eq("organization_id", organizationId)
      // Archivés compris : un ancien programme se copie toujours (phase 4).
      .order("start_date", { ascending: false }),
    listTemplates(organizationId, { kind: "program" }),
  ]);
  if (profiles.error || metrics.error || goals.error || programs.error) {
    throw new Error("Lecture des sportifs impossible.");
  }

  const has = (
    athleteId: string,
    test: (row: { kind: string; exercise_id: string | null }) => boolean,
  ) => (metrics.data ?? []).some((row) => row.athlete_id === athleteId && test(row));

  const athletes: WizardAthlete[] = (profiles.data ?? []).map((profile) => {
    const athleteGoals = (goals.data ?? []).filter((goal) => goal.athlete_id === profile.id);
    const goal =
      athleteGoals.find((row) => row.priority === "main" && row.hyrox_category) ??
      athleteGoals.find((row) => row.hyrox_category);
    const category = CATEGORY.safeParse(goal?.hyrox_category).data ?? null;
    return {
      id: profile.id,
      name: profile.display_name ?? profile.first_name,
      firstName: profile.first_name,
      photoPath: profile.photo_path,
      programType: DISCIPLINE.safeParse(profile.program_type).data ?? null,
      sessionsPerWeek: profile.sessions_per_week,
      hasVma: has(profile.id, (row) => row.kind === "pace_vma"),
      hasHrMax: has(profile.id, (row) => row.kind === "hr_max"),
      hasLinkedMaxes: has(
        profile.id,
        (row) => row.kind === "strength_load" && row.exercise_id !== null,
      ),
      defaultDivision: defaultHyroxDivision(category, (profile.sex ?? null) as AthleteSex),
      programs: (programs.data ?? [])
        .filter((program) => program.athlete_id === profile.id)
        .map((program) => ({
          id: program.id,
          title: program.title,
          weeksCount: program.weeks_count,
          startDate: program.start_date,
          status: program.status as WizardProgram["status"],
          publicationNumber: program.program_publications?.number ?? null,
        })),
    };
  });

  return {
    athletes,
    templates: templates.map((template) => ({
      id: template.id,
      title: template.title,
      source: template.source,
      discipline: template.discipline,
      weeksCount: template.weeksCount ?? 1,
      sessionsPerWeek: template.sessionsPerWeek,
      detail: template.detail,
    })),
  };
}
