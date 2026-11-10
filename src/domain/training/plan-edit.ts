import type { Phase, ProgramPlan, Week } from "./program-plan";
import type { SessionBody, SessionDraft } from "./session-v2";

// Opérations de l'éditeur de programme (03, D-157) sur le plan (semaines, phases, séances) : règles
// PURES, testées par Vitest. Chacune renvoie un nouveau plan, sans modifier l'ancien (l'éditeur garde
// l'historique simple : enregistrement automatique du nouveau plan).

type Plan = Pick<ProgramPlan, "weeks" | "phases">;

// Identifiant local court, unique dans le programme (clé d'une séance, d'une phase).
export function localId(prefix: string, taken: ReadonlySet<string> = new Set()): string {
  for (;;) {
    const id = `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    if (!taken.has(id)) return id;
  }
}

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
            sessions: from.sessions.map((session) => copySession(session, taken)),
          }
        : week,
    ),
  };
}

// ---------------------------------------------------------------------------
// Séances
// ---------------------------------------------------------------------------
export function addSession<T extends Plan>(
  plan: T,
  weekIndex: number,
  body: SessionBody,
): {
  plan: T;
  key: string;
} {
  const key = localId("s", sessionKeys(plan));
  const session: SessionDraft = { ...body, key, athleteCanMove: false };
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

// Dupliquer une séance : la copie arrive juste après l'originale, dans la même semaine.
export function duplicateSession<T extends Plan>(
  plan: T,
  weekIndex: number,
  key: string,
): { plan: T; key: string | null } {
  const taken = sessionKeys(plan);
  let created: string | null = null;
  const next = updateWeek(plan, weekIndex, (week) => {
    const at = week.sessions.findIndex((session) => session.key === key);
    const original = week.sessions[at];
    if (!original) return week;
    const copy = copySession({ ...original, withCoach: undefined }, taken);
    created = copy.key;
    const sessions = [...week.sessions];
    sessions.splice(at + 1, 0, copy);
    return { ...week, sessions };
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

// Séance vide d'une discipline (« Ajouter une séance ») : valide pour le schéma, à compléter dans
// l'éditeur de séance (04 à 06).
export function blankSession(discipline: "running" | "strength" | "hyrox"): SessionBody {
  switch (discipline) {
    case "running":
      return {
        title: "Nouvelle séance",
        sessionType: "Endurance",
        durationMinutes: 45,
        content: {
          discipline: "running",
          items: [
            { id: "e1", kind: "step", role: "run", measure: { type: "time", seconds: 2700 } },
          ],
        },
      };
    case "strength":
      return {
        title: "Nouvelle séance",
        sessionType: "Force",
        durationMinutes: 60,
        content: {
          discipline: "strength",
          items: [
            {
              id: "x1",
              kind: "exercise",
              name: "Exercice à choisir",
              loadMode: "kg",
              sets: [{ type: "normal", repsMin: 10 }],
            },
          ],
        },
      };
    case "hyrox":
      return {
        title: "Nouvelle séance",
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
