import { programDraftSchema, type ProgramDraft, type Week } from "@/domain/training/program-plan";
import { sessionsPerWeekFor } from "@/domain/training/program-upgrade";
import type { SessionDraft } from "@/domain/training/session-v2";
import { createProgramInputSchema, type CreateProgramInput } from "@/features/programs/schemas";

// Créer un programme avec l'Assistant IA (lot 3a) : règles PURES, testées par Vitest. Le résultat est
// toujours un BROUILLON, créé par la même logique que l'assistant « Créer un programme »
// (createProgramInputSchema, createProgram) et vérifié par le même schéma que l'éditeur
// (programDraftSchema). Un programme écrit par l'assistant décrit chaque séance UNE fois (`ref`) et
// la place semaine par semaine : réponse compacte, moins chère et moins longue.

type Params = Record<string, unknown>;
type CustomSession = Record<string, unknown> & { ref: string };
type CustomWeek = { index: number; light?: boolean; seances: string[] };

const AIMS = { running: "pace", strength: "kg" } as const;
// Sportif d'une carte liée, encore à créer : un identifiant de forme valide le temps de vérifier.
const PENDING_ATHLETE = "00000000-0000-4000-8000-000000000000";

const athleteIdOf = (ref: unknown) =>
  ref && typeof ref === "object" && "athleteId" in ref ? String(ref.athleteId) : PENDING_ATHLETE;

// Les réponses de l'assistant de création, telles que createProgram les attend.
export function toCreateProgramInput(params: Params, athleteId: string): CreateProgramInput {
  return {
    athleteId,
    title: String(params.title ?? ""),
    discipline: params.discipline as CreateProgramInput["discipline"],
    ...(params.goal ? { goal: params.goal as CreateProgramInput["goal"] } : {}),
    aimDefaults: (params.aimDefaults as CreateProgramInput["aimDefaults"]) ?? AIMS,
    startDate: String(params.startDate ?? ""),
    weeksCount: Number(params.weeksCount),
    sessionsPerWeek: Number(params.sessionsPerWeek),
    phases: (params.phases as CreateProgramInput["phases"]) ?? [],
    scheduling: params.scheduling as CreateProgramInput["scheduling"],
    start: params.start as CreateProgramInput["start"],
  };
}

// Les semaines d'un programme écrit : chaque référence devient une séance (clé stable
// « w<semaine>-s<n> »), sans jour en mode « dans l'ordre » ; une semaine non décrite reste vide.
export function buildCustomWeeks(
  params: Params,
): { ok: true; weeks: Week[] } | { ok: false; error: string } {
  // Relecture n°2 : rien d'ignoré en silence (semaine hors du programme, doublons), pour que la carte
  // compte exactement ce que « Valider » crée.
  const written = (params.seances as CustomSession[] | undefined) ?? [];
  const sessions = new Map<string, CustomSession>();
  for (const session of written) {
    if (sessions.has(session.ref)) {
      return { ok: false, error: `Séance « ${session.ref} » : décrite deux fois dans seances.` };
    }
    sessions.set(session.ref, session);
  }
  const plan = (params.semaines as CustomWeek[] | undefined) ?? [];
  const weeksCount = Number(params.weeksCount);
  const seen = new Set<number>();
  for (const week of plan) {
    if (week.index < 1 || week.index > weeksCount) {
      return {
        ok: false,
        error: `Semaine ${week.index} : le programme n'a que ${weeksCount} semaine${weeksCount > 1 ? "s" : ""}.`,
      };
    }
    if (seen.has(week.index)) {
      return { ok: false, error: `Semaine ${week.index} : décrite deux fois dans semaines.` };
    }
    seen.add(week.index);
  }
  const fixed = params.scheduling === "fixed";
  const weeks: Week[] = [];
  for (let index = 1; index <= weeksCount; index++) {
    const week = plan.find((item) => item.index === index);
    const placed: SessionDraft[] = [];
    for (const [n, ref] of (week?.seances ?? []).entries()) {
      const session = sessions.get(ref);
      if (!session) {
        return {
          ok: false,
          error: `Semaine ${index} : la séance « ${ref} » n'est pas décrite dans seances.`,
        };
      }
      const { ref: _ref, fixedDay, fixedTime, moment, ...body } = session;
      void _ref;
      placed.push({
        ...(body as Omit<SessionDraft, "key" | "athleteCanMove">),
        key: `w${index}-s${n + 1}`,
        athleteCanMove: false,
        ...(fixed ? { fixedDay, fixedTime, moment } : {}),
      } as SessionDraft);
    }
    weeks.push({
      index,
      light: week?.light === true,
      scheduling: fixed ? "fixed" : "ordered",
      sessions: placed,
    });
  }
  return { ok: true, weeks };
}

const issueText = (issue: { path: PropertyKey[]; message: string } | undefined) =>
  issue ? `${issue.path.length > 0 ? `${issue.path.join(".")} : ` : ""}${issue.message}` : "";

// Erreur que l'assistant de création ou l'éditeur renverrait pour ce programme, ou null.
export function programRuleError(params: Params): string | null {
  const start = String(params.startDate ?? "");
  if (new Date(`${start}T00:00:00Z`).getUTCDay() !== 1) return "Un programme commence un lundi.";
  const input = createProgramInputSchema.safeParse(
    toCreateProgramInput(params, athleteIdOf(params.athlete)),
  );
  if (!input.success) return issueText(input.error.issues[0]);
  // Même sans séances écrites (modèle, copie, vide) : les phases passent par le schéma de l'éditeur,
  // sinon la carte échouerait au clic (relecture n°1).
  const built = buildCustomWeeks(params);
  if (!built.ok) return built.error;
  const draft = programDraftSchema.safeParse({
    schemaVersion: 2,
    title: input.data.title,
    discipline: input.data.discipline,
    aimDefaults: input.data.aimDefaults,
    sessionsPerWeek: input.data.sessionsPerWeek,
    phases: input.data.phases.map((phase, i) => ({ id: `p-${i + 1}`, ...phase })),
    weeks: built.weeks,
    startDate: input.data.startDate,
    ...(input.data.goal ? { goal: input.data.goal } : {}),
  });
  return draft.success ? null : issueText(draft.error.issues[0]);
}

// Exécution d'un programme écrit : le brouillon que createProgram vient d'enregistrer (départ vide)
// reçoit les semaines écrites, sans rien changer d'autre (phases, titre, dates, objectif).
export function customDraftFrom(
  created: ProgramDraft,
  params: Params,
): { ok: true; draft: ProgramDraft } | { ok: false; error: string } {
  const built = buildCustomWeeks(params);
  if (!built.ok) return built;
  return { ok: true, draft: { ...created, weeks: built.weeks } };
}

// Depuis un modèle ou une copie, createProgram garde le rythme de la source : la carte affiche donc
// celui-là (relecture n°3).
export function withSourceRhythm<T extends Params>(
  params: T,
  source: { sessionsPerWeek: number } | null,
): T {
  return { ...params, sessionsPerWeek: sessionsPerWeekFor(Number(params.sessionsPerWeek), source) };
}

// Nombre de séances réellement placées dans un programme écrit (pour la carte).
export function placedSessions(params: Params): number {
  const built = buildCustomWeeks(params);
  return built.ok ? built.weeks.reduce((total, week) => total + week.sessions.length, 0) : 0;
}
