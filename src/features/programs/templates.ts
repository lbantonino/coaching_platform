import "server-only";

import { z } from "zod";

import type { Discipline } from "@/domain/training/discipline";
import { programPlanSchema, type ProgramPlan } from "@/domain/training/program-plan";
import { sessionBodySchema, type SessionBody } from "@/domain/training/session-v2";
import { createClient } from "@/lib/supabase/server";

import type { TemplateKind } from "./schemas";

// Modèles de programmes et de séances (D-154) : « Modèles Coory » (sans organisation, lecture seule)
// et « Mes modèles » (ceux de l'organisation). Organisation DÉJÀ vérifiée par l'appelant.

export type TemplateSource = "coory" | "mine";

export type TemplateCard = {
  kind: TemplateKind;
  id: string;
  source: TemplateSource;
  title: string;
  discipline: Discipline;
  // Programme : « 12 semaines · 4 séances » ; séance : son type (« Sortie longue »).
  weeksCount: number | null;
  sessionsPerWeek: number | null;
  sessionType: string | null;
  version: number;
  updatedAt: string;
};

export type TemplateFilters = {
  source?: TemplateSource | "all";
  kind?: TemplateKind | "all";
  discipline?: Discipline;
  search?: string;
};

const DISCIPLINE = z.enum(["running", "strength", "hyrox", "hybrid"]);

// Recherche simple, sans tenir compte des accents ni de la casse.
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export async function listTemplates(
  organizationId: string,
  filters: TemplateFilters = {},
): Promise<TemplateCard[]> {
  const supabase = await createClient();
  const kind = filters.kind ?? "all";
  const visible = `organization_id.is.null,organization_id.eq.${organizationId}`;
  const [programs, sessions] = await Promise.all([
    kind === "session"
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("program_templates")
          .select(
            "id, organization_id, title, discipline, weeks_count, sessions_per_week, version, updated_at",
          )
          .or(visible)
          .is("archived_at", null),
    kind === "program"
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("session_templates")
          .select("id, organization_id, title, discipline, session_type, version, updated_at")
          .or(visible)
          .is("archived_at", null),
  ]);
  if (programs.error || sessions.error) throw new Error("Lecture des modèles impossible.");

  const cards: TemplateCard[] = [
    ...(programs.data ?? []).map((row) => ({
      kind: "program" as const,
      id: row.id,
      source: (row.organization_id === null ? "coory" : "mine") as TemplateSource,
      title: row.title,
      discipline: DISCIPLINE.parse(row.discipline),
      weeksCount: row.weeks_count,
      sessionsPerWeek: row.sessions_per_week,
      sessionType: null,
      version: row.version,
      updatedAt: row.updated_at,
    })),
    ...(sessions.data ?? []).map((row) => ({
      kind: "session" as const,
      id: row.id,
      source: (row.organization_id === null ? "coory" : "mine") as TemplateSource,
      title: row.title,
      discipline: DISCIPLINE.parse(row.discipline),
      weeksCount: null,
      sessionsPerWeek: null,
      sessionType: row.session_type,
      version: row.version,
      updatedAt: row.updated_at,
    })),
  ];
  const search = filters.search ? normalize(filters.search.trim()) : "";
  return cards
    .filter((card) =>
      filters.source && filters.source !== "all" ? card.source === filters.source : true,
    )
    .filter((card) => (filters.discipline ? card.discipline === filters.discipline : true))
    .filter((card) => (search ? normalize(card.title).includes(search) : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export type ProgramTemplate = {
  id: string;
  source: TemplateSource;
  title: string;
  version: number;
  plan: ProgramPlan | null;
};

export type SessionTemplate = {
  id: string;
  source: TemplateSource;
  title: string;
  version: number;
  session: SessionBody | null;
};

// Un modèle de programme lisible par l'organisation ; null s'il n'existe pas, est archivé ou
// appartient à une autre organisation (même réponse).
export async function getProgramTemplate(
  organizationId: string,
  templateId: string,
): Promise<ProgramTemplate | null> {
  if (!z.uuid().safeParse(templateId).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_templates")
    .select("id, organization_id, title, version, content_json")
    .eq("id", templateId)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw new Error("Lecture du modèle impossible.");
  if (!data) return null;
  const plan = programPlanSchema.safeParse(data.content_json);
  return {
    id: data.id,
    source: data.organization_id === null ? "coory" : "mine",
    title: data.title,
    version: data.version,
    plan: plan.success ? plan.data : null,
  };
}

export async function getSessionTemplate(
  organizationId: string,
  templateId: string,
): Promise<SessionTemplate | null> {
  if (!z.uuid().safeParse(templateId).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_templates")
    .select("id, organization_id, title, version, content_json")
    .eq("id", templateId)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw new Error("Lecture du modèle impossible.");
  if (!data) return null;
  const session = sessionBodySchema.safeParse(data.content_json);
  return {
    id: data.id,
    source: data.organization_id === null ? "coory" : "mine",
    title: data.title,
    version: data.version,
    session: session.success ? session.data : null,
  };
}
