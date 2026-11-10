"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Discipline } from "@/domain/training/discipline";
import {
  planFromDraft,
  programDraftSchema,
  programPlanSchema,
  type Phase,
  type ProgramDraft,
  type Week,
} from "@/domain/training/program-plan";
import { buildPublication } from "@/domain/training/program-publication";
import { resizePlan } from "@/domain/training/program-upgrade";
import { sessionBodySchema } from "@/domain/training/session-v2";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

import { loadAthleteContext, loadDraft } from "./drafts";
import { checkPublication } from "./publish-check";
import { createProgramInputSchema, templateKindSchema, type CreateProgramInput } from "./schemas";
import { getProgramTemplate, getSessionTemplate } from "./templates";

// Actions des programmes (D-155). Chaque action revérifie l'identité, l'organisation et la propriété
// (requireOrgAccess), valide ses entrées avec Zod, puis écrit par les fonctions SQL contrôlées
// (programmes) ou sous RLS (modèles). Erreurs typées, sans jamais révéler une autre organisation.

export type ProgramErrorCode =
  "INVALID" | "REVISION_CONFLICT" | "OVERLAP" | "ARCHIVED" | "NOT_FOUND" | "FAILED";

export type ActionFailure = {
  ok: false;
  code: ProgramErrorCode;
  message: string;
  issues?: string[];
};
export type ActionResult<T extends object = object> = ({ ok: true } & T) | ActionFailure;

const fail = (code: ProgramErrorCode, message: string, issues?: string[]): ActionFailure => ({
  ok: false,
  code,
  message,
  ...(issues ? { issues } : {}),
});

const invalid = (error: z.ZodError) =>
  fail(
    "INVALID",
    "Certaines informations ne sont pas valides.",
    error.issues.map((issue) => issue.message),
  );

// Codes des fonctions SQL (migration 20261109120100) -> erreurs de l'application.
function fromDatabase(error: { code?: string } | null): ActionFailure {
  switch (error?.code) {
    case "CY409":
      return fail(
        "REVISION_CONFLICT",
        "Le programme a été modifié ailleurs. Recharge la page pour reprendre la dernière version.",
      );
    case "CY410":
      return fail("ARCHIVED", "Ce programme est archivé.");
    case "23P01":
      return fail("OVERLAP", "Les dates chevauchent un autre programme publié de ce sportif.");
    case "P0002":
    case "42501":
      return fail("NOT_FOUND", "Programme introuvable.");
    case "23514":
    case "22023":
      return fail("INVALID", "Certaines informations ne sont pas valides.");
    default:
      return fail("FAILED", "L'enregistrement n'a pas abouti. Réessaie.");
  }
}

const programsPath = (organizationId: string) => `/coach/o/${organizationId}/programmes`;

function revalidateProgram(organizationId: string, athleteId?: string) {
  revalidatePath(programsPath(organizationId), "layout");
  if (athleteId) revalidatePath(`/coach/o/${organizationId}/sportifs/${athleteId}`);
  revalidatePath("/coach");
}

const shortId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;

// Un document déjà validé par Zod, passé tel quel à la base (colonne jsonb).
const toJson = (value: unknown) => value as NonNullable<Json>;

// ---------------------------------------------------------------------------
// Créer un programme (assistant 02) : brouillon révision 1, depuis zéro, un ancien programme du
// sportif ou un modèle (copie : le modèle ne change jamais, BR-10).
// ---------------------------------------------------------------------------
export async function createProgram(
  organizationId: string,
  input: CreateProgramInput,
): Promise<ActionResult<{ programId: string }>> {
  const { membership } = await requireOrgAccess(organizationId);
  const parsed = createProgramInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const values = parsed.data;
  const orgId = membership.organizationId;
  const supabase = await createClient();

  const athlete = await loadAthleteContext(supabase, orgId, values.athleteId);
  if (!athlete) return fail("NOT_FOUND", "Sportif introuvable.");
  const aims = { vmaKmh: athlete.vmaKmh, hrMax: athlete.hrMax };

  let base: { weeks: Week[]; phases: Phase[] } = { weeks: [], phases: [] };
  let sourceTemplate: { id: string; version: number } | null = null;
  if (values.start.kind === "copy") {
    const source = await loadDraft(supabase, orgId, values.start.programId);
    if (!source?.draft || source.program.athleteId !== values.athleteId) {
      return fail("NOT_FOUND", "Programme à copier introuvable.");
    }
    base = resizePlan(source.draft, values.weeksCount, aims);
  } else if (values.start.kind === "template") {
    const template = await getProgramTemplate(orgId, values.start.templateId);
    if (!template?.plan) return fail("NOT_FOUND", "Modèle introuvable.");
    base = resizePlan(template.plan, values.weeksCount, aims);
    sourceTemplate = { id: template.id, version: template.version };
  } else {
    base = resizePlan({ weeks: [], phases: [] }, values.weeksCount, aims);
  }

  const phases: Phase[] =
    values.phases.length > 0
      ? values.phases.map((phase) => ({ id: shortId("p"), ...phase }))
      : base.phases;
  const weeks: Week[] = base.weeks.map((week) => ({
    ...week,
    scheduling: values.scheduling,
    sessions:
      values.scheduling === "ordered"
        ? week.sessions.map((session) => ({
            ...session,
            fixedDay: undefined,
            fixedTime: undefined,
          }))
        : week.sessions,
  }));

  const draft = programDraftSchema.safeParse({
    schemaVersion: 2,
    title: values.title,
    discipline: values.discipline,
    aimDefaults: values.aimDefaults,
    sessionsPerWeek: values.sessionsPerWeek,
    phases,
    weeks,
    startDate: values.startDate,
    ...(values.goal ? { goal: values.goal } : {}),
  });
  if (!draft.success) return invalid(draft.error);

  const { data: programId, error } = await supabase.rpc("create_program", {
    p_organization_id: orgId,
    p_athlete_id: values.athleteId,
    p_title: draft.data.title,
    p_discipline: draft.data.discipline,
    p_start_date: draft.data.startDate,
    p_weeks_count: draft.data.weeks.length,
    p_draft: draft.data as unknown as Json,
    ...(sourceTemplate
      ? {
          p_source_template_id: sourceTemplate.id,
          p_source_template_version: sourceTemplate.version,
        }
      : {}),
  });
  if (error || !programId) return fromDatabase(error);

  revalidateProgram(orgId, values.athleteId);
  return { ok: true, programId };
}

// ---------------------------------------------------------------------------
// Enregistrer le brouillon (enregistrement automatique de l'éditeur, « Enregistré »).
// expectedRevision = 0 : premier enregistrement d'un brouillon repris de la version publiée.
// ---------------------------------------------------------------------------
export async function saveDraft(
  organizationId: string,
  programId: string,
  expectedRevision: number,
  draft: unknown,
): Promise<ActionResult<{ revision: number }>> {
  await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(programId).success) return fail("NOT_FOUND", "Programme introuvable.");
  if (!z.number().int().min(0).safeParse(expectedRevision).success) {
    return fail("INVALID", "Révision invalide.");
  }
  const parsed = programDraftSchema.safeParse(draft);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data: revision, error } = await supabase.rpc("save_program_draft", {
    p_program_id: programId,
    p_expected_revision: expectedRevision,
    p_title: parsed.data.title,
    p_discipline: parsed.data.discipline,
    p_start_date: parsed.data.startDate,
    p_weeks_count: parsed.data.weeks.length,
    p_draft: parsed.data as unknown as Json,
  });
  if (error || !revision) return fromDatabase(error);
  return { ok: true, revision };
}

// ---------------------------------------------------------------------------
// Publier (08) : vérifier (bloquant ou avertissement), figer les valeurs, créer la version n + 1.
// ---------------------------------------------------------------------------
export async function publishProgram(
  organizationId: string,
  programId: string,
  expectedRevision: number,
): Promise<ActionResult<{ number: number; warnings: string[] }>> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const supabase = await createClient();
  const loaded = await loadDraft(supabase, orgId, programId);
  if (!loaded) return fail("NOT_FOUND", "Programme introuvable.");
  if (loaded.program.status === "archived") return fail("ARCHIVED", "Ce programme est archivé.");
  if (loaded.revision === 0) return fail("INVALID", "Aucune modification à publier.");
  if (loaded.revision !== expectedRevision) return fromDatabase({ code: "CY409" });
  if (!loaded.draft) return fail("INVALID", "Le brouillon n'est pas lisible.");
  const draft: ProgramDraft = loaded.draft;

  // Les mêmes vérifications que le bandeau de la fiche du sportif (publish-check.ts).
  let checked: Awaited<ReturnType<typeof checkPublication>>;
  try {
    checked = await checkPublication(supabase, orgId, programId, { ...loaded, draft });
  } catch {
    return fail("FAILED", "La vérification n'a pas abouti. Réessaie.");
  }
  if (!checked) return fail("NOT_FOUND", "Sportif introuvable.");
  const { issues, context } = checked;
  const blocking = issues.filter((issue) => issue.level === "blocking");
  if (blocking.length > 0) {
    return fail(
      blocking.some((issue) => issue.code === "overlap") ? "OVERLAP" : "INVALID",
      blocking[0]?.message ?? "Le programme ne peut pas être publié.",
      blocking.map((issue) => issue.message),
    );
  }

  const publication = buildPublication(draft, context);
  const { data: number, error } = await supabase.rpc("publish_program", {
    p_program_id: programId,
    p_expected_revision: expectedRevision,
    p_title: publication.title,
    p_discipline: publication.discipline,
    p_start_date: publication.startDate,
    p_weeks_count: publication.weeksCount,
    p_snapshot: publication.snapshot as unknown as Json,
    p_sessions: publication.sessions as unknown as Json,
  });
  if (error || !number) return fromDatabase(error);

  revalidateProgram(orgId, loaded.program.athleteId);
  return {
    ok: true,
    number,
    warnings: issues.filter((issue) => issue.level === "warning").map((issue) => issue.message),
  };
}

export async function archiveProgram(
  organizationId: string,
  programId: string,
): Promise<ActionResult> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(programId).success) return fail("NOT_FOUND", "Programme introuvable.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_program", { p_program_id: programId });
  if (error) return fromDatabase(error);
  revalidateProgram(membership.organizationId);
  return { ok: true };
}

// « Désarchiver » (phase 4, décision d'Antonino du 10/11) : le programme reprend son état d'avant
// (brouillon, ou publié avec sa version), sauf s'il chevaucherait un autre programme publié (C-8).
export async function unarchiveProgram(
  organizationId: string,
  programId: string,
): Promise<ActionResult<{ status: "draft" | "published" }>> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(programId).success) return fail("NOT_FOUND", "Programme introuvable.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("unarchive_program", { p_program_id: programId });
  if (error) {
    return error.code === "23P01"
      ? fail(
          "OVERLAP",
          "Un autre programme publié de ce sportif occupe déjà ces dates : archive-le ou change ses dates d'abord.",
        )
      : fromDatabase(error);
  }
  revalidateProgram(membership.organizationId);
  return { ok: true, status: data === "draft" ? "draft" : "published" };
}

// « Dupliquer le programme » : un nouveau brouillon pour le même sportif, aux mêmes dates.
export async function duplicateProgram(
  organizationId: string,
  programId: string,
): Promise<ActionResult<{ programId: string }>> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const supabase = await createClient();
  const loaded = await loadDraft(supabase, orgId, programId);
  if (!loaded?.draft) return fail("NOT_FOUND", "Programme introuvable.");
  const title = `${loaded.draft.title} (copie)`.slice(0, 120);
  const draft = { ...loaded.draft, title };
  const { data: newId, error } = await supabase.rpc("create_program", {
    p_organization_id: orgId,
    p_athlete_id: loaded.program.athleteId,
    p_title: title,
    p_discipline: draft.discipline,
    p_start_date: draft.startDate,
    p_weeks_count: draft.weeks.length,
    p_draft: draft as unknown as Json,
  });
  if (error || !newId) return fromDatabase(error);
  revalidateProgram(orgId, loaded.program.athleteId);
  return { ok: true, programId: newId };
}

// ---------------------------------------------------------------------------
// Modèles (D-154) : enregistrer comme modèle, dupliquer un modèle Coory dans Mes modèles, modifier,
// archiver. Jamais d'écriture sur un modèle Coory (RLS).
// ---------------------------------------------------------------------------
const templateTitle = z.string().trim().min(1).max(120);

export async function saveProgramAsTemplate(
  organizationId: string,
  programId: string,
  title: string,
): Promise<ActionResult<{ templateId: string }>> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const name = templateTitle.safeParse(title);
  if (!name.success) return invalid(name.error);
  const supabase = await createClient();
  const loaded = await loadDraft(supabase, orgId, programId);
  if (!loaded?.draft) return fail("NOT_FOUND", "Programme introuvable.");
  const plan = programPlanSchema.safeParse({ ...planFromDraft(loaded.draft), title: name.data });
  if (!plan.success) return invalid(plan.error);

  const { data, error } = await supabase
    .from("program_templates")
    .insert({
      organization_id: orgId,
      origin: "coach",
      title: plan.data.title,
      discipline: plan.data.discipline,
      weeks_count: plan.data.weeks.length,
      sessions_per_week: plan.data.sessionsPerWeek,
      content_json: toJson(plan.data),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return fail("FAILED", "Le modèle n'a pas pu être enregistré. Réessaie.");
  revalidateProgram(orgId);
  return { ok: true, templateId: data.id };
}

export async function saveSessionAsTemplate(
  organizationId: string,
  session: unknown,
  title: string,
): Promise<ActionResult<{ templateId: string }>> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const name = templateTitle.safeParse(title);
  if (!name.success) return invalid(name.error);
  // Seul le contenu de la séance devient un modèle : ni jour, ni rendez-vous, ni identifiant.
  const body = sessionBodySchema.safeParse(session);
  if (!body.success) return invalid(body.error);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_templates")
    .insert({
      organization_id: orgId,
      origin: "coach",
      title: name.data,
      discipline: body.data.content.discipline,
      session_type: body.data.sessionType,
      content_json: toJson({ ...body.data, title: name.data }),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return fail("FAILED", "Le modèle n'a pas pu être enregistré. Réessaie.");
  revalidateProgram(orgId);
  return { ok: true, templateId: data.id };
}

// « Dupliquer dans Mes modèles » (un modèle Coory, ou un des siens).
export async function duplicateTemplate(
  organizationId: string,
  kind: unknown,
  templateId: string,
): Promise<ActionResult<{ templateId: string }>> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const parsedKind = templateKindSchema.safeParse(kind);
  if (!parsedKind.success) return invalid(parsedKind.error);
  const supabase = await createClient();

  if (parsedKind.data === "program") {
    const template = await getProgramTemplate(orgId, templateId);
    if (!template?.plan) return fail("NOT_FOUND", "Modèle introuvable.");
    const { data, error } = await supabase
      .from("program_templates")
      .insert({
        organization_id: orgId,
        origin: "coach",
        title: template.title,
        discipline: template.plan.discipline,
        weeks_count: template.plan.weeks.length,
        sessions_per_week: template.plan.sessionsPerWeek,
        content_json: toJson(template.plan),
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) return fail("FAILED", "Le modèle n'a pas pu être dupliqué. Réessaie.");
    revalidateProgram(orgId);
    return { ok: true, templateId: data.id };
  }

  const template = await getSessionTemplate(orgId, templateId);
  if (!template?.session) return fail("NOT_FOUND", "Modèle introuvable.");
  const { data, error } = await supabase
    .from("session_templates")
    .insert({
      organization_id: orgId,
      origin: "coach",
      title: template.title,
      discipline: template.session.content.discipline,
      session_type: template.session.sessionType,
      content_json: toJson(template.session),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return fail("FAILED", "Le modèle n'a pas pu être dupliqué. Réessaie.");
  revalidateProgram(orgId);
  return { ok: true, templateId: data.id };
}

// Modifier un de Mes modèles. La version attendue évite d'écraser une modification faite ailleurs.
export async function updateTemplate(
  organizationId: string,
  kind: unknown,
  templateId: string,
  expectedVersion: number,
  content: unknown,
): Promise<ActionResult<{ version: number }>> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const parsedKind = templateKindSchema.safeParse(kind);
  if (!parsedKind.success) return invalid(parsedKind.error);
  if (!z.uuid().safeParse(templateId).success) return fail("NOT_FOUND", "Modèle introuvable.");
  if (!z.number().int().min(1).safeParse(expectedVersion).success)
    return fail("INVALID", "Version invalide.");
  const supabase = await createClient();

  let query;
  if (parsedKind.data === "program") {
    const plan = programPlanSchema.safeParse(content);
    if (!plan.success) return invalid(plan.error);
    query = await supabase
      .from("program_templates")
      .update({
        title: plan.data.title,
        discipline: plan.data.discipline,
        weeks_count: plan.data.weeks.length,
        sessions_per_week: plan.data.sessionsPerWeek,
        content_json: toJson(plan.data),
      })
      .eq("id", templateId)
      .eq("organization_id", orgId)
      .eq("version", expectedVersion)
      .select("version");
  } else {
    const body = sessionBodySchema.safeParse(content);
    if (!body.success) return invalid(body.error);
    query = await supabase
      .from("session_templates")
      .update({
        title: body.data.title,
        discipline: body.data.content.discipline,
        session_type: body.data.sessionType,
        content_json: toJson(body.data),
      })
      .eq("id", templateId)
      .eq("organization_id", orgId)
      .eq("version", expectedVersion)
      .select("version");
  }
  const { data, error } = query;
  if (error) return fail("FAILED", "Le modèle n'a pas pu être enregistré. Réessaie.");
  const version = data?.[0]?.version;
  if (version === undefined) {
    return fail("REVISION_CONFLICT", "Ce modèle a été modifié ailleurs, ou n'est pas modifiable.");
  }
  revalidateProgram(orgId);
  return { ok: true, version };
}

export async function archiveTemplate(
  organizationId: string,
  kind: unknown,
  templateId: string,
): Promise<ActionResult> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const parsedKind = templateKindSchema.safeParse(kind);
  if (!parsedKind.success) return invalid(parsedKind.error);
  if (!z.uuid().safeParse(templateId).success) return fail("NOT_FOUND", "Modèle introuvable.");
  const supabase = await createClient();
  const table = parsedKind.data === "program" ? "program_templates" : "session_templates";
  const { data, error } = await supabase
    .from(table)
    .update({ archived_at: new Date().toISOString() })
    .eq("id", templateId)
    .eq("organization_id", orgId)
    .is("archived_at", null)
    .select("id");
  if (error) return fail("FAILED", "Le modèle n'a pas pu être archivé. Réessaie.");
  if (!data?.length) return fail("NOT_FOUND", "Modèle introuvable.");
  revalidateProgram(orgId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Assistant (02), étape 4 : l'aperçu du point de départ, une grille semaines × séances où chaque case
// prend la couleur de la discipline de la séance reprise (vide = « à remplir »). Un plan de
// remplissage, pas un graphique de séance (spécification de l'étape 4).
// ---------------------------------------------------------------------------
const previewInputSchema = z.object({
  start: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("blank") }),
    z.object({ kind: z.literal("copy"), programId: z.uuid() }),
    z.object({ kind: z.literal("template"), templateId: z.uuid() }),
  ]),
  weeksCount: z.number().int().min(1).max(52),
  sessionsPerWeek: z.number().int().min(1).max(7),
});

export type StartPreview = { weeks: (Discipline | null)[][]; filled: number };

export async function previewStart(
  organizationId: string,
  input: z.input<typeof previewInputSchema>,
): Promise<ActionResult<StartPreview>> {
  const { membership } = await requireOrgAccess(organizationId);
  const parsed = previewInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { start, weeksCount, sessionsPerWeek } = parsed.data;
  const orgId = membership.organizationId;

  let source: Week[] = [];
  if (start.kind === "copy") {
    const supabase = await createClient();
    const loaded = await loadDraft(supabase, orgId, start.programId);
    if (!loaded?.draft) return fail("NOT_FOUND", "Programme introuvable.");
    source = loaded.draft.weeks;
  } else if (start.kind === "template") {
    const template = await getProgramTemplate(orgId, start.templateId);
    if (!template?.plan) return fail("NOT_FOUND", "Modèle introuvable.");
    source = template.plan.weeks;
  }

  let filled = 0;
  const weeks = Array.from({ length: weeksCount }, (_, i) => {
    const sessions = source[i]?.sessions ?? [];
    const cells: (Discipline | null)[] = sessions.map((session) => session.content.discipline);
    filled += cells.length;
    while (cells.length < sessionsPerWeek) cells.push(null);
    return cells;
  });
  return { ok: true, weeks, filled };
}

// ---------------------------------------------------------------------------
// « Nouveau modèle » (onglet Modèles, [P] accepté le 09/11/2026) : l'assistant sans sportif ni dates,
// qui crée un de Mes modèles (vide, ou copie d'un autre modèle) puis l'ouvre dans l'éditeur.
// ---------------------------------------------------------------------------
const createTemplateInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  discipline: z.enum(["running", "strength", "hyrox"]),
  aimDefaults: z.object({ running: z.enum(["pace", "hr"]), strength: z.enum(["kg", "pct"]) }),
  weeksCount: z.number().int().min(1).max(52),
  sessionsPerWeek: z.number().int().min(1).max(7),
  phases: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(40),
        weekFrom: z.number().int().min(1),
        weekTo: z.number().int().min(1),
      }),
    )
    .max(12),
  scheduling: z.enum(["ordered", "fixed"]),
  start: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("blank") }),
    z.object({ kind: z.literal("template"), templateId: z.uuid() }),
  ]),
});

export async function createProgramTemplate(
  organizationId: string,
  input: z.input<typeof createTemplateInputSchema>,
): Promise<ActionResult<{ templateId: string }>> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const parsed = createTemplateInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const values = parsed.data;

  let base: { weeks: Week[]; phases: Phase[] } = resizePlan(
    { weeks: [], phases: [] },
    values.weeksCount,
    { vmaKmh: null, hrMax: null },
  );
  if (values.start.kind === "template") {
    const template = await getProgramTemplate(orgId, values.start.templateId);
    if (!template?.plan) return fail("NOT_FOUND", "Modèle introuvable.");
    base = resizePlan(template.plan, values.weeksCount, { vmaKmh: null, hrMax: null });
  }
  const plan = programPlanSchema.safeParse({
    schemaVersion: 2,
    title: values.title,
    discipline: values.discipline,
    aimDefaults: values.aimDefaults,
    sessionsPerWeek: values.sessionsPerWeek,
    phases:
      values.phases.length > 0
        ? values.phases.map((phase) => ({ id: shortId("p"), ...phase }))
        : base.phases,
    weeks: base.weeks.map((week) => ({
      ...week,
      scheduling: values.scheduling,
      sessions:
        values.scheduling === "ordered"
          ? week.sessions.map((session) => ({
              ...session,
              fixedDay: undefined,
              fixedTime: undefined,
            }))
          : week.sessions,
    })),
  });
  if (!plan.success) return invalid(plan.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_templates")
    .insert({
      organization_id: orgId,
      origin: "coach",
      title: plan.data.title,
      discipline: plan.data.discipline,
      weeks_count: plan.data.weeks.length,
      sessions_per_week: plan.data.sessionsPerWeek,
      content_json: toJson(plan.data),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return fail("FAILED", "Le modèle n'a pas pu être créé. Réessaie.");
  revalidateProgram(orgId);
  return { ok: true, templateId: data.id };
}
