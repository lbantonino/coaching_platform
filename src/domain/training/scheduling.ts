import type { Phase, Week } from "./program-plan";
import { WEEKDAYS, type SessionDraft, type Weekday } from "./session-v2";

// Organisation de la semaine (03b « Fixer les jours ») : règles PURES, testées par Vitest.
// « Dans l'ordre, sans jour » : le sportif fait ses séances dans l'ordre, au jour de son choix (BR-02).
// « Jours fixes » : chaque séance a un jour (lun à dim) et une heure facultative ; la numérotation
// suit l'ordre des jours (BR-03). Une séance avec le coach a le jour de son rendez-vous (BR-06).

export const weekdayLabels: Record<Weekday, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mer",
  thu: "Jeu",
  fri: "Ven",
  sat: "Sam",
  sun: "Dim",
};

function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Lundi de la semaine n (1 à N) d'un programme qui commence un lundi.
export function weekMonday(startDate: string, weekIndex: number): string {
  return addDaysIso(startDate, 7 * (weekIndex - 1));
}

export function plannedDate(startDate: string, weekIndex: number, day: Weekday): string {
  return addDaysIso(weekMonday(startDate, weekIndex), WEEKDAYS.indexOf(day));
}

export function weekdayOf(isoDate: string): Weekday {
  // getUTCDay : 0 = dimanche.
  return WEEKDAYS[(new Date(`${isoDate}T00:00:00Z`).getUTCDay() + 6) % 7] as Weekday;
}

// Une semaine est passée quand son dimanche est avant aujourd'hui : on ne la modifie jamais (BR-07).
export function isPastWeek(startDate: string, weekIndex: number, today: string): boolean {
  return addDaysIso(weekMonday(startDate, weekIndex), 6) < today;
}

// Jour réel d'une séance : celui du rendez-vous du coach, sinon le jour fixé, sinon aucun.
export function sessionDay(session: SessionDraft): Weekday | null {
  if (session.withCoach) return weekdayOf(session.withCoach.date);
  return session.fixedDay ?? null;
}

// Les séances dans l'ordre de leur numérotation (Séance 1, 2…). En jours fixes : par jour, puis par
// heure ; les séances « sans jour » viennent après, dans l'ordre choisi par le coach.
export function orderedSessions(week: Week): SessionDraft[] {
  if (week.scheduling === "ordered") return week.sessions;
  const position = (session: SessionDraft) => {
    const day = sessionDay(session);
    return day === null ? WEEKDAYS.length : WEEKDAYS.indexOf(day);
  };
  return week.sessions
    .map((session, index) => ({ session, index }))
    .sort(
      (a, b) =>
        position(a.session) - position(b.session) ||
        (a.session.fixedTime ?? a.session.withCoach?.time ?? "").localeCompare(
          b.session.fixedTime ?? b.session.withCoach?.time ?? "",
        ) ||
        a.index - b.index,
    )
    .map(({ session }) => session);
}

export type ScheduleWarning =
  | { code: "same_day"; day: Weekday; keys: string[] }
  | { code: "unavailable_day"; day: Weekday; key: string };

// Avertissements d'une semaine à jours fixes : deux séances le même jour (BR-04), jour où le sportif
// n'est pas disponible (BR-05). Jamais bloquants.
export function scheduleWarnings(week: Week, availableDays: readonly Weekday[]): ScheduleWarning[] {
  if (week.scheduling !== "fixed") return [];
  const warnings: ScheduleWarning[] = [];
  const byDay = new Map<Weekday, string[]>();
  for (const session of week.sessions) {
    const day = sessionDay(session);
    if (day === null) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), session.key]);
    if (availableDays.length > 0 && !availableDays.includes(day) && !session.withCoach) {
      warnings.push({ code: "unavailable_day", day, key: session.key });
    }
  }
  for (const [day, keys] of byDay) {
    if (keys.length > 1) warnings.push({ code: "same_day", day, keys });
  }
  return warnings;
}

export type ScheduleScope = "week" | "phase" | "program";

// Appliquer l'organisation d'une semaine à cette semaine, à sa phase ou à tout le programme (03b) :
// la séance n de chaque semaine visée reçoit le jour et l'heure de la séance n de la semaine source.
// Les semaines passées ne changent jamais (BR-07) ; une séance avec le coach garde son rendez-vous.
// startDate et today sont absents pour un modèle (pas de dates, donc pas de semaine passée).
export function applyWeekSchedule(
  weeks: Week[],
  phases: Phase[],
  sourceIndex: number,
  scope: ScheduleScope,
  dates?: { startDate: string; today: string },
): Week[] {
  const source = weeks.find((week) => week.index === sourceIndex);
  if (!source) return weeks;
  const phase = phases.find((item) => item.weekFrom <= sourceIndex && sourceIndex <= item.weekTo);
  const inScope = (index: number) =>
    scope === "program" ||
    index === sourceIndex ||
    (scope === "phase" && phase !== undefined && phase.weekFrom <= index && index <= phase.weekTo);

  return weeks.map((week) => {
    if (week.index === sourceIndex || !inScope(week.index)) return week;
    if (dates && isPastWeek(dates.startDate, week.index, dates.today)) return week;
    return {
      ...week,
      scheduling: source.scheduling,
      sessions: week.sessions.map((session, i) => {
        const model = source.sessions[i];
        if (source.scheduling === "ordered" || session.withCoach || !model) {
          return { ...session, fixedDay: undefined, fixedTime: undefined };
        }
        return { ...session, fixedDay: model.fixedDay, fixedTime: model.fixedTime };
      }),
    };
  });
}

// Séance « dure » pour la proposition de jours : tout sauf l'endurance, la récupération et la mobilité.
const EASY_TYPE = /endurance|récup|recup|mobilit|footing|easy/i;
export function isHardSession(session: SessionDraft): boolean {
  return !EASY_TYPE.test(session.sessionType);
}

// Proposition automatique des jours d'une semaine (03b, « proposition ») : les rendez-vous du coach
// gardent leur jour ; les autres séances se répartissent sur les jours disponibles du sportif (tous
// s'il n'en a pas indiqué), en évitant de mettre deux séances le même jour et deux séances dures de
// suite. Le coach corrige ensuite. Déterministe : mêmes données, même proposition.
export function proposeWeekDays(
  sessions: SessionDraft[],
  availableDays: readonly Weekday[],
): Map<string, Weekday> {
  const result = new Map<string, Weekday>();
  const candidates = availableDays.length > 0 ? [...availableDays] : [...WEEKDAYS];
  const used = new Map<number, boolean>(); // jour (0 à 6) -> séance dure ?
  for (const session of sessions) {
    if (!session.withCoach) continue;
    const day = weekdayOf(session.withCoach.date);
    result.set(session.key, day);
    used.set(WEEKDAYS.indexOf(day), isHardSession(session));
  }

  const free = sessions.filter((session) => !session.withCoach);
  free.forEach((session, i) => {
    const hard = isHardSession(session);
    const ideal = Math.round((i * 7) / Math.max(free.length, 1));
    let best: { day: number; score: number } | null = null;
    for (const name of candidates) {
      const day = WEEKDAYS.indexOf(name);
      const nextToHard = used.get(day - 1) === true || used.get(day + 1) === true;
      const score =
        (used.has(day) ? 100 : 0) + (hard && nextToHard ? 10 : 0) + Math.abs(day - ideal);
      if (!best || score < best.score) best = { day, score };
    }
    if (best) {
      result.set(session.key, WEEKDAYS[best.day] as Weekday);
      used.set(best.day, (used.get(best.day) ?? false) || hard);
    }
  });
  return result;
}

// « Appliquer ce jour à » (03b, choix du jour d'une séance) : la séance à la position `slot` (ordre
// du coach dans la semaine source) reçoit ce jour et cette heure (ou « sans jour ») dans chaque semaine
// visée. Une semaine visée passe en jours fixes, ses autres séances gardent leur jour. Les semaines
// passées (BR-07) et les séances avec le coach (BR-06) ne changent pas.
export function applySessionDay(
  weeks: Week[],
  phases: Phase[],
  sourceIndex: number,
  slot: number,
  choice: { day: Weekday | null; time?: string; athleteCanMove: boolean },
  scope: ScheduleScope,
  dates?: { startDate: string; today: string },
): Week[] {
  const phase = phases.find((item) => item.weekFrom <= sourceIndex && sourceIndex <= item.weekTo);
  const inScope = (index: number) =>
    index === sourceIndex ||
    scope === "program" ||
    (scope === "phase" && phase !== undefined && phase.weekFrom <= index && index <= phase.weekTo);
  return weeks.map((week) => {
    if (!inScope(week.index)) return week;
    if (week.index !== sourceIndex && dates && isPastWeek(dates.startDate, week.index, dates.today))
      return week;
    const target = week.sessions[slot];
    if (!target || target.withCoach) return week;
    return {
      ...week,
      scheduling: "fixed",
      sessions: week.sessions.map((session, i) =>
        i === slot
          ? {
              ...session,
              fixedDay: choice.day ?? undefined,
              fixedTime: choice.day && choice.time ? choice.time : undefined,
              athleteCanMove: choice.athleteCanMove,
            }
          : session,
      ),
    };
  });
}

// « Dans l'ordre » : la semaine perd ses jours (les rendez-vous du coach restent).
export function setWeekOrdered(week: Week): Week {
  return {
    ...week,
    scheduling: "ordered",
    sessions: week.sessions.map((session) => ({
      ...session,
      fixedDay: undefined,
      fixedTime: undefined,
    })),
  };
}

// « Fixer les jours » : la semaine passe en jours fixes avec les jours choisis (proposition corrigée).
export function setWeekFixed(week: Week, days: ReadonlyMap<string, Weekday>): Week {
  return {
    ...week,
    scheduling: "fixed",
    sessions: week.sessions.map((session) =>
      session.withCoach
        ? session
        : {
            ...session,
            fixedDay: days.get(session.key),
            fixedTime: days.get(session.key) ? session.fixedTime : undefined,
          },
    ),
  };
}
