import "server-only";

import { z } from "zod";

import type { Discipline } from "@/domain/training/discipline";
import { programPlanSchema, type ProgramPlan } from "@/domain/training/program-plan";
import { sessionBodySchema, type SessionBody } from "@/domain/training/session-v2";
import { sessionHeadline } from "@/domain/training/session-view";
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
  // Ligne sous le titre : « 12 sem. · 4 séances / sem. » ; séance : « 60 min · zone 2 ».
  detail: string;
  // Pied de carte : les phases d'un programme (« Base · Spécifique · Affûtage »), sinon la source
  // (« Fourni par Coory ») ou l'usage d'un de Mes modèles (« Utilisé 3 fois »).
  footer: string;
  weeksCount: number | null;
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

const usedLabel = (count: number) => (count === 0 ? "Pas encore utilisé" : `Utilisé ${count} fois`);

// Tous les modèles lisibles par l'organisation (Coory et les siens), filtres appliqués ensuite par
// la page (les compteurs de la barre de filtres portent sur l'ensemble).
export async function listTemplates(
  organizationId: string,
  filters: TemplateFilters = {},
): Promise<TemplateCard[]> {
  const supabase = await createClient();
  const kind = filters.kind ?? "all";
  const visible = `organization_id.is.null,organization_id.eq.${organizationId}`;
  const [programs, sessions, uses] = await Promise.all([
    kind === "session"
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("program_templates")
          .select(
            "id, organization_id, title, discipline, weeks_count, sessions_per_week, version, updated_at, content_json",
          )
          .or(visible)
          .is("archived_at", null),
    kind === "program"
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("session_templates")
          .select(
            "id, organization_id, title, discipline, session_type, version, updated_at, content_json",
          )
          .or(visible)
          .is("archived_at", null),
    // Programmes de l'organisation copiés d'un modèle : « Utilisé N fois ».
    supabase
      .from("programs")
      .select("source_template_id")
      .eq("organization_id", organizationId)
      .not("source_template_id", "is", null),
  ]);
  if (programs.error || sessions.error || uses.error)
    throw new Error("Lecture des modèles impossible.");

  const useCount = new Map<string, number>();
  for (const row of uses.data ?? []) {
    if (row.source_template_id)
      useCount.set(row.source_template_id, (useCount.get(row.source_template_id) ?? 0) + 1);
  }

  const cards: TemplateCard[] = [
    ...(programs.data ?? []).map((row) => {
      const source: TemplateSource = row.organization_id === null ? "coory" : "mine";
      const plan = programPlanSchema.safeParse(row.content_json).data;
      const phases = plan?.phases.map((phase) => phase.name) ?? [];
      return {
        kind: "program" as const,
        id: row.id,
        source,
        title: row.title,
        discipline: DISCIPLINE.parse(row.discipline),
        detail: `${row.weeks_count} sem. · ${row.sessions_per_week} séance${row.sessions_per_week > 1 ? "s" : ""} / sem.`,
        footer:
          phases.length > 0
            ? phases.join(" · ")
            : source === "coory"
              ? "Fourni par Coory"
              : usedLabel(useCount.get(row.id) ?? 0),
        weeksCount: row.weeks_count,
        version: row.version,
        updatedAt: row.updated_at,
      };
    }),
    ...(sessions.data ?? []).map((row) => {
      const source: TemplateSource = row.organization_id === null ? "coory" : "mine";
      const body = sessionBodySchema.safeParse(row.content_json).data;
      return {
        kind: "session" as const,
        id: row.id,
        source,
        title: row.title,
        discipline: DISCIPLINE.parse(row.discipline),
        detail: body ? sessionHeadline(body) : row.session_type,
        // L'usage d'un modèle de séance n'est pas encore compté : on dit d'où il vient.
        footer: source === "coory" ? "Fourni par Coory" : "Créé par toi",
        weeksCount: null,
        version: row.version,
        updatedAt: row.updated_at,
      };
    }),
  ];
  const search = filters.search ? normalize(filters.search.trim()) : "";
  return (
    cards
      .filter((card) =>
        filters.source && filters.source !== "all" ? card.source === filters.source : true,
      )
      .filter((card) => (filters.discipline ? card.discipline === filters.discipline : true))
      .filter((card) => (search ? normalize(card.title).includes(search) : true))
      // Coory d'abord (comme la maquette), puis les plus récents.
      .sort(
        (a, b) =>
          Number(a.source === "mine") - Number(b.source === "mine") ||
          Number(a.kind === "session") - Number(b.kind === "session") ||
          b.updatedAt.localeCompare(a.updatedAt),
      )
  );
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

export type SessionTemplateChoice = {
  id: string;
  source: TemplateSource;
  title: string;
  discipline: Discipline;
  detail: string;
  body: SessionBody;
};

// « Depuis un modèle » (éditeur de programme) : les modèles de séance lisibles, avec leur contenu
// (copié tel quel dans la semaine). Une discipline donnée : ses modèles d'abord, Coory avant Mes modèles.
export async function listSessionTemplateChoices(
  organizationId: string,
  discipline: Discipline | null,
): Promise<SessionTemplateChoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_templates")
    .select("id, organization_id, title, discipline, updated_at, content_json")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .is("archived_at", null);
  if (error) throw new Error("Lecture des modèles impossible.");
  return (data ?? [])
    .flatMap((row) => {
      const body = sessionBodySchema.safeParse(row.content_json);
      if (!body.success) return [];
      return [
        {
          id: row.id,
          source: (row.organization_id === null ? "coory" : "mine") as TemplateSource,
          title: row.title,
          discipline: DISCIPLINE.parse(row.discipline),
          detail: sessionHeadline(body.data),
          body: body.data,
          updatedAt: row.updated_at,
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(a.discipline !== discipline) - Number(b.discipline !== discipline) ||
        Number(a.source === "mine") - Number(b.source === "mine") ||
        b.updatedAt.localeCompare(a.updatedAt),
    )
    .map((choice) => ({
      id: choice.id,
      source: choice.source,
      title: choice.title,
      discipline: choice.discipline,
      detail: choice.detail,
      body: choice.body,
    }));
}
