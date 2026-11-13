import { localId } from "./local-id";
import type { AimDefaults, Phase, ProgramPlan, Week } from "./program-plan";
import { copyPlacement, detachCoach, fillMoments } from "./scheduling";
import { MAX_SESSIONS_PER_WEEK, type SessionBody, type SessionDraft } from "./session-v2";

export { localId };

// Opérations de l'éditeur de programme (03, D-157) sur le plan (semaines, phases, séances) : règles
// PURES, testées par Vitest. Chacune renvoie un nouveau plan, sans modifier l'ancien (l'éditeur garde
// l'historique simple : enregistrement automatique du nouveau plan).

type Plan = Pick<ProgramPlan, "weeks" | "phases">;

export function sessionKeys(plan: Plan): Set<string> {
  return new Set(plan.weeks.flatMap((week) => week.sessions.map((session) => session.key)));
}

const updateWeek = <T extends Plan>(plan: T, index: number, change: (week: Week) => Week): T => ({
  ...plan,
  weeks: plan.weeks.map((week) => (week.index === index ? change(week) : week)),
});

// ---------------------------------------------------------------------------
// Semaines
// ---------------------------------------------------------------------------
export function addWeek<T extends Plan>(plan: T): T {
  const last = plan.weeks[plan.weeks.length - 1];
  return {
    ...plan,
    weeks: [
      ...plan.weeks,
      {
        index: plan.weeks.length + 1,
        light: false,
        scheduling: last?.scheduling ?? "ordered",
        sessions: [],
      },
    ],
  };
}

// Retirer une semaine : les suivantes remontent d'un cran, les phases suivent (une phase vidée disparaît).
export function removeWeek<T extends Plan>(plan: T, index: number): T {
  if (plan.weeks.length <= 1) return plan;
  const weeks = plan.weeks
    .filter((week) => week.index !== index)
    .map((week, i) => ({ ...week, index: i + 1 }));
  const phases = plan.phases
    .map((phase) => ({
      ...phase,
      weekFrom: phase.weekFrom > index ? phase.weekFrom - 1 : phase.weekFrom,
      weekTo: phase.weekTo >= index ? phase.weekTo - 1 : phase.weekTo,
    }))
    .filter((phase) => phase.weekTo >= phase.weekFrom);
  return { ...plan, weeks, phases };
}

export function setWeekLight<T extends Plan>(plan: T, index: number, light: boolean): T {
  return updateWeek(plan, index, (week) => ({ ...week, light }));
}

// Copie d'une séance, avec une nouvelle clé (une séance n'existe qu'une fois dans le programme).
function copySession(session: SessionDraft, taken: Set<string>): SessionDraft {
  const key = localId("s", taken);
  taken.add(key);
  return { ...session, key };
}

// « Dupliquer vers… » : les séances de la semaine source REMPLACENT celles des semaines choisies.
// Les rendez-vous du coach ne se copient pas (revue MVP du 13/11, C5) : ils sont datés dans la semaine
// source ; la copie garde leur jour en jours fixes (detachCoach).
export function duplicateWeekTo<T extends Plan>(plan: T, source: number, targets: number[]): T {
  const from = plan.weeks.find((week) => week.index === source);
  if (!from) return plan;
  const taken = sessionKeys(plan);
  return {
    ...plan,
    weeks: plan.weeks.map((week) =>
      targets.includes(week.index) && week.index !== source
        ? {
            ...week,
            scheduling: from.scheduling,
            sessions: from.sessions.map((session) =>
              copySession(detachCoach(session, from.scheduling), taken),
            ),
          }
        : week,
    ),
  };
}

// Une semaine pleine (14 séances, D-164) n'en reçoit plus : le brouillon serait refusé.
export function weekIsFull(plan: Plan, weekIndex: number): boolean {
  const week = plan.weeks.find((item) => item.index === weekIndex);
  return (week?.sessions.length ?? 0) >= MAX_SESSIONS_PER_WEEK;
}

// ---------------------------------------------------------------------------
// Séances
// ---------------------------------------------------------------------------
// Ajouter une séance à une semaine ; key = null si la semaine est pleine (rien n'est ajouté).
// `extra` : ce que la séance garde en plus de son contenu (modèle d'origine, C23).
export function addSession<T extends Plan>(
  plan: T,
  weekIndex: number,
  body: SessionBody,
  extra: Pick<SessionDraft, "sourceTemplate"> = {},
): {
  plan: T;
  key: string | null;
} {
  if (weekIsFull(plan, weekIndex)) return { plan, key: null };
  const key = localId("s", sessionKeys(plan));
  const session: SessionDraft = {
    ...body,
    key,
    athleteCanMove: false,
    ...(extra.sourceTemplate ? { sourceTemplate: extra.sourceTemplate } : {}),
  };
  return {
    plan: updateWeek(plan, weekIndex, (week) => ({
      ...week,
      sessions: [...week.sessions, session],
    })),
    key,
  };
}

export function moveSession<T extends Plan>(
  plan: T,
  weekIndex: number,
  key: string,
  direction: -1 | 1,
): T {
  return updateWeek(plan, weekIndex, (week) => {
    const from = week.sessions.findIndex((session) => session.key === key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= week.sessions.length) return week;
    const sessions = [...week.sessions];
    const [moved] = sessions.splice(from, 1);
    if (moved) sessions.splice(to, 0, moved);
    return { ...week, sessions };
  });
}

// Glisser une séance (EDT-F06) : de la place `from` à la place `to` de sa semaine.
export function moveSessionTo<T extends Plan>(
  plan: T,
  weekIndex: number,
  from: number,
  to: number,
): T {
  const week = plan.weeks.find((item) => item.index === weekIndex);
  if (!week || from === to || from < 0 || to < 0) return plan;
  if (from >= week.sessions.length || to >= week.sessions.length) return plan;
  return updateWeek(plan, weekIndex, (current) => {
    const sessions = [...current.sessions];
    const [moved] = sessions.splice(from, 1);
    if (moved) sessions.splice(to, 0, moved);
    return { ...current, sessions };
  });
}

// Dupliquer une séance : la copie arrive juste après l'originale, dans la même semaine, sans le
// rendez-vous du coach. En jours fixes, elle prend le même jour avec le premier moment libre ; si ce
// jour a déjà 4 séances, elle reste sans jour (C12). Semaine pleine (14) : rien n'est copié.
export function duplicateSession<T extends Plan>(
  plan: T,
  weekIndex: number,
  key: string,
): { plan: T; key: string | null } {
  if (weekIsFull(plan, weekIndex)) return { plan, key: null };
  const taken = sessionKeys(plan);
  let created: string | null = null;
  const next = updateWeek(plan, weekIndex, (week) => {
    const at = week.sessions.findIndex((session) => session.key === key);
    const original = week.sessions[at];
    if (!original) return week;
    const copy = copySession(
      { ...original, withCoach: undefined, ...copyPlacement(week, original) },
      taken,
    );
    created = copy.key;
    const sessions = [...week.sessions];
    sessions.splice(at + 1, 0, copy);
    return fillMoments({ ...week, sessions });
  });
  return { plan: next, key: created };
}

export function removeSession<T extends Plan>(plan: T, weekIndex: number, key: string): T {
  return updateWeek(plan, weekIndex, (week) => ({
    ...week,
    sessions: week.sessions.filter((session) => session.key !== key),
  }));
}

export function replaceSession<T extends Plan>(plan: T, session: SessionDraft): T {
  return {
    ...plan,
    weeks: plan.weeks.map((week) => ({
      ...week,
      sessions: week.sessions.map((current) => (current.key === session.key ? session : current)),
    })),
  };
}

export function findSession(
  plan: Plan,
  key: string,
): { week: Week; session: SessionDraft; position: number } | null {
  for (const week of plan.weeks) {
    const position = week.sessions.findIndex((session) => session.key === key);
    const session = week.sessions[position];
    if (session) return { week, session, position };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Phases (contiguës, une semaine dans une seule phase : BR-17)
// ---------------------------------------------------------------------------
// Nouvelle phase sur les semaines qui suivent la dernière phase (jusqu'à la fin du programme).
export function addPhase<T extends Plan>(plan: T, name: string): T {
  const last = [...plan.phases].sort((a, b) => a.weekTo - b.weekTo)[plan.phases.length - 1];
  const from = last ? last.weekTo + 1 : 1;
  if (from > plan.weeks.length) return plan;
  const phase: Phase = {
    id: localId("p", new Set(plan.phases.map((item) => item.id))),
    name,
    weekFrom: from,
    weekTo: plan.weeks.length,
  };
  return { ...plan, phases: [...plan.phases, phase] };
}

export function renamePhase<T extends Plan>(plan: T, id: string, name: string): T {
  return {
    ...plan,
    phases: plan.phases.map((phase) => (phase.id === id ? { ...phase, name } : phase)),
  };
}

// Semaines d'une phase (« Modifier les semaines ») : une phase voisine collée suit la limite déplacée
// (les phases restent contiguës) et garde au moins une semaine ; sans voisine, jusqu'au bout du
// programme. Renvoie les bornes permises pour le début et la fin.
function neighbours(plan: Plan, id: string) {
  const sorted = [...plan.phases].sort((a, b) => a.weekFrom - b.weekFrom);
  const at = sorted.findIndex((phase) => phase.id === id);
  return { phase: sorted[at], previous: at > 0 ? sorted[at - 1] : undefined, next: sorted[at + 1] };
}

export function phaseRangeBounds(plan: Plan, id: string): { minFrom: number; maxTo: number } {
  const { previous, next } = neighbours(plan, id);
  return {
    minFrom: previous ? previous.weekFrom + 1 : 1,
    maxTo: next ? next.weekTo - 1 : plan.weeks.length,
  };
}

export function setPhaseRange<T extends Plan>(plan: T, id: string, from: number, to: number): T {
  const { phase, previous, next } = neighbours(plan, id);
  if (!phase) return plan;
  const { minFrom, maxTo } = phaseRangeBounds(plan, id);
  const weekFrom = Math.min(Math.max(from, minFrom), maxTo);
  const weekTo = Math.min(Math.max(to, weekFrom), maxTo);
  // Une voisine collée (ou qui déborderait) suit la nouvelle limite.
  const previousTo =
    previous && (previous.weekTo === phase.weekFrom - 1 || previous.weekTo >= weekFrom)
      ? weekFrom - 1
      : undefined;
  const nextFrom =
    next && (next.weekFrom === phase.weekTo + 1 || next.weekFrom <= weekTo)
      ? weekTo + 1
      : undefined;
  return {
    ...plan,
    phases: plan.phases.map((item) => {
      if (item.id === id) return { ...item, weekFrom, weekTo };
      if (item.id === previous?.id && previousTo !== undefined)
        return { ...item, weekTo: previousTo };
      if (item.id === next?.id && nextFrom !== undefined) return { ...item, weekFrom: nextFrom };
      return item;
    }),
  };
}

// Retirer une phase : ses semaines restent, sans phase ; les phases restent contiguës, donc seule la
// première ou la dernière peut partir sans trou, sinon la précédente reprend ses semaines.
export function removePhase<T extends Plan>(plan: T, id: string): T {
  const sorted = [...plan.phases].sort((a, b) => a.weekFrom - b.weekFrom);
  const at = sorted.findIndex((phase) => phase.id === id);
  if (at < 0) return plan;
  const removed = sorted[at] as Phase;
  const rest = sorted.filter((phase) => phase.id !== id);
  const isEdge = at === 0 || at === sorted.length - 1;
  return {
    ...plan,
    phases: isEdge
      ? rest
      : rest.map((phase) =>
          phase.weekTo === removed.weekFrom - 1 ? { ...phase, weekTo: removed.weekTo } : phase,
        ),
  };
}

// Ce qu'une séance vide porte tant que le coach ne l'a pas complétée (avertissement de publication,
// revue MVP du 13/11, C24).
export const BLANK_SESSION_TITLE = "Nouvelle séance";
export const BLANK_EXERCISE_NAME = "Exercice à choisir";

// Séance vide d'une discipline (« Ajouter une séance ») : valide pour le schéma, à compléter dans
// l'éditeur de séance (04 à 06). Elle suit la façon de viser par défaut du programme (BR-12) :
// Running en zones de FC (Z2, les bpm se calculent depuis la FC max), Musculation en % du max (70 %).
export function blankSession(
  discipline: "running" | "strength" | "hyrox",
  aims: AimDefaults = { running: "pace", strength: "kg" },
): SessionBody {
  switch (discipline) {
    case "running":
      return {
        title: BLANK_SESSION_TITLE,
        sessionType: "Endurance",
        durationMinutes: 45,
        content: {
          discipline: "running",
          items: [
            {
              id: "e1",
              kind: "step",
              role: "run",
              measure: { type: "time", seconds: 2700 },
              ...(aims.running === "hr" ? { target: { kind: "hr" as const, zone: 2 } } : {}),
            },
          ],
        },
      };
    case "strength":
      return {
        title: BLANK_SESSION_TITLE,
        sessionType: "Force",
        durationMinutes: 60,
        content: {
          discipline: "strength",
          items: [
            {
              id: "x1",
              kind: "exercise",
              name: BLANK_EXERCISE_NAME,
              loadMode: aims.strength,
              sets: [
                { type: "normal", repsMin: 10, ...(aims.strength === "pct" ? { pct: 70 } : {}) },
              ],
            },
          ],
        },
      };
    case "hyrox":
      return {
        title: BLANK_SESSION_TITLE,
        sessionType: "Circuit",
        durationMinutes: 60,
        content: {
          discipline: "hyrox",
          items: [
            {
              id: "b1",
              kind: "block",
              format: "simple",
              title: "Échauffement",
              loads: "coach",
              lines: [{ id: "l1", kind: "run", meters: 1000 }],
            },
          ],
        },
      };
  }
}
