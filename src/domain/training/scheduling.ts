import { localId } from "./local-id";
import type { Phase, Week } from "./program-plan";
import {
  MAX_SESSIONS_PER_DAY,
  MAX_SESSIONS_PER_WEEK,
  SESSION_MOMENTS,
  WEEKDAYS,
  type SessionDraft,
  type SessionMoment,
  type Weekday,
} from "./session-v2";

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

// Moment d'une heure (« 07:00 » -> matin) : avant midi, midi à 14 h, l'après-midi jusqu'à 18 h, le soir.
export function momentFromTime(time: string | undefined): SessionMoment | null {
  if (!time) return null;
  const hour = Number(time.slice(0, 2));
  return hour < 12 ? "morning" : hour < 14 ? "noon" : hour < 18 ? "afternoon" : "evening";
}

// Moment d'une séance (D-164) : celui choisi par le coach, sinon celui de son heure, sinon aucun.
export function sessionMoment(session: SessionDraft): SessionMoment | null {
  return session.moment ?? momentFromTime(session.withCoach?.time ?? session.fixedTime);
}

const momentRank = (session: SessionDraft) => {
  const moment = sessionMoment(session);
  return moment === null ? SESSION_MOMENTS.length : SESSION_MOMENTS.indexOf(moment);
};

// Les séances dans l'ordre de leur numérotation (Séance 1, 2…). En jours fixes : par jour, puis par
// moment (matin, midi, après-midi, soir), puis par heure ; les séances « sans jour » viennent après,
// dans l'ordre choisi par le coach.
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
        momentRank(a.session) - momentRank(b.session) ||
        (a.session.fixedTime ?? a.session.withCoach?.time ?? "").localeCompare(
          b.session.fixedTime ?? b.session.withCoach?.time ?? "",
        ) ||
        a.index - b.index,
    )
    .map(({ session }) => session);
}

// Les séances d'un jour (jours fixes), dans l'ordre ; `except` : la séance qu'on est en train de placer.
export function sessionsOnDay(week: Week, day: Weekday, except?: string): SessionDraft[] {
  return orderedSessions(week).filter(
    (session) => session.key !== except && sessionDay(session) === day,
  );
}

// Un jour peut recevoir encore une séance (4 au plus, D-164).
export function dayHasRoom(week: Week, day: Weekday, except?: string): boolean {
  return sessionsOnDay(week, day, except).length < MAX_SESSIONS_PER_DAY;
}

// Moments proposés pour n séances le même jour : 2 = matin et soir, 3 = matin, midi et soir, 4 = tous.
function momentsFor(count: number): SessionMoment[] {
  if (count <= 2) return ["morning", "evening"];
  if (count === 3) return ["morning", "noon", "evening"];
  return [...SESSION_MOMENTS];
}

// Le moment proposé pour une séance ajoutée à un jour qui en a déjà (null si le jour est vide). Les
// séances déjà là sans moment gardent les premiers moments libres (comme fillMoments) : une séance
// ajoutée à un jour d'une seule séance passe donc au soir, l'autre restant le matin.
export function suggestedMoment(week: Week, day: Weekday, except?: string): SessionMoment | null {
  const others = sessionsOnDay(week, day, except);
  if (others.length === 0) return null;
  const preferred = momentsFor(others.length + 1);
  const order = [...preferred, ...SESSION_MOMENTS.filter((moment) => !preferred.includes(moment))];
  const taken = new Set(others.map(sessionMoment).filter((moment) => moment !== null));
  const free = order.filter((moment) => !taken.has(moment));
  const waiting = others.filter((session) => sessionMoment(session) === null).length;
  return free[waiting] ?? free[0] ?? null;
}

// Plusieurs séances le même jour (D-164) : celles qui n'ont pas de moment en reçoivent un, libre et
// dans l'ordre de la journée (matin d'abord). Un jour d'une seule séance ne change pas.
export function fillMoments(week: Week): Week {
  if (week.scheduling !== "fixed") return week;
  const byDay = new Map<Weekday, SessionDraft[]>();
  for (const session of orderedSessions(week)) {
    const day = sessionDay(session);
    if (day) byDay.set(day, [...(byDay.get(day) ?? []), session]);
  }
  const assigned = new Map<string, SessionMoment>();
  for (const group of byDay.values()) {
    if (group.length < 2) continue;
    const taken = new Set(group.map(sessionMoment).filter((moment) => moment !== null));
    const free = [
      ...momentsFor(group.length),
      ...SESSION_MOMENTS.filter((moment) => !momentsFor(group.length).includes(moment)),
    ].filter((moment) => !taken.has(moment));
    for (const session of group) {
      if (sessionMoment(session) !== null) continue;
      const moment = free.shift();
      if (moment) assigned.set(session.key, moment);
    }
  }
  if (assigned.size === 0) return week;
  return {
    ...week,
    sessions: week.sessions.map((session) =>
      assigned.has(session.key) ? { ...session, moment: assigned.get(session.key) } : session,
    ),
  };
}

export type ScheduleWarning =
  | { code: "moment_missing"; day: Weekday; keys: string[] }
  | { code: "unavailable_day"; day: Weekday; key: string };

// Avertissements d'une semaine à jours fixes : plusieurs séances le même jour sans moment (BR-04,
// D-164 : plusieurs séances par jour sont normales, mais chacune dit son moment), jour où le sportif
// n'est pas disponible (BR-05). Jamais bloquants.
export function scheduleWarnings(week: Week, availableDays: readonly Weekday[]): ScheduleWarning[] {
  if (week.scheduling !== "fixed") return [];
  const warnings: ScheduleWarning[] = [];
  const byDay = new Map<Weekday, SessionDraft[]>();
  for (const session of week.sessions) {
    const day = sessionDay(session);
    if (day === null) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), session]);
    if (availableDays.length > 0 && !availableDays.includes(day) && !session.withCoach) {
      warnings.push({ code: "unavailable_day", day, key: session.key });
    }
  }
  for (const [day, sessions] of byDay) {
    if (sessions.length > 1 && sessions.some((session) => sessionMoment(session) === null)) {
      warnings.push({ code: "moment_missing", day, keys: sessions.map((session) => session.key) });
    }
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
          return { ...session, fixedDay: undefined, fixedTime: undefined, moment: undefined };
        }
        return {
          ...session,
          fixedDay: model.fixedDay,
          fixedTime: model.fixedTime,
          moment: model.moment,
        };
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
  const count = new Map<number, number>(); // jour (0 à 6) -> séances déjà posées (4 au plus, D-164)
  for (const session of sessions) {
    if (!session.withCoach) continue;
    const day = weekdayOf(session.withCoach.date);
    result.set(session.key, day);
    used.set(WEEKDAYS.indexOf(day), isHardSession(session));
    count.set(WEEKDAYS.indexOf(day), (count.get(WEEKDAYS.indexOf(day)) ?? 0) + 1);
  }

  const free = sessions.filter((session) => !session.withCoach);
  free.forEach((session, i) => {
    const hard = isHardSession(session);
    const ideal = Math.round((i * 7) / Math.max(free.length, 1));
    let best: { day: number; score: number } | null = null;
    for (const name of candidates) {
      const day = WEEKDAYS.indexOf(name);
      if ((count.get(day) ?? 0) >= MAX_SESSIONS_PER_DAY) continue;
      const nextToHard = used.get(day - 1) === true || used.get(day + 1) === true;
      const score =
        (used.has(day) ? 100 : 0) + (hard && nextToHard ? 10 : 0) + Math.abs(day - ideal);
      if (!best || score < best.score) best = { day, score };
    }
    if (best) {
      result.set(session.key, WEEKDAYS[best.day] as Weekday);
      used.set(best.day, (used.get(best.day) ?? false) || hard);
      count.set(best.day, (count.get(best.day) ?? 0) + 1);
    }
  });
  return result;
}

// « Appliquer ce jour à » (03b, choix du jour d'une séance) : la séance reçoit ce jour (et cette
// heure, ou « sans jour ») dans chaque semaine visée. Dans une autre semaine, « la même séance » est :
// 1. celle qui porte le même nom ;
// 2. sinon, si la semaine a autant de séances que la semaine source (programme parti d'un modèle),
//    celle à la même place (règle de la maquette : la séance n de chaque semaine) ;
// 3. sinon, la séance n'y est pas : elle y est COPIÉE à ce jour (demande d'Antonino du 10/11 : poser
//    « Sortie longue le mercredi » sur tout le programme sans dupliquer les semaines à la main).
// Une semaine visée passe en jours fixes ; ses autres séances gardent leur jour. Les semaines passées
// (BR-07) et les séances avec le coach (BR-06) ne changent pas ; « Sans jour » ne copie rien.
export function applySessionDay(
  weeks: Week[],
  phases: Phase[],
  sourceIndex: number,
  slot: number,
  choice: { day: Weekday | null; time?: string; moment?: SessionMoment; athleteCanMove: boolean },
  scope: ScheduleScope,
  dates?: { startDate: string; today: string },
): Week[] {
  const sourceWeek = weeks.find((week) => week.index === sourceIndex);
  const source = sourceWeek?.sessions[slot];
  if (!sourceWeek || !source) return weeks;
  const phase = phases.find((item) => item.weekFrom <= sourceIndex && sourceIndex <= item.weekTo);
  const inScope = (index: number) =>
    index === sourceIndex ||
    scope === "program" ||
    (scope === "phase" && phase !== undefined && phase.weekFrom <= index && index <= phase.weekTo);
  const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const taken = new Set(weeks.flatMap((week) => week.sessions.map((session) => session.key)));
  const placed = {
    fixedDay: choice.day ?? undefined,
    fixedTime: choice.day && choice.time ? choice.time : undefined,
    moment: choice.day && choice.moment ? choice.moment : undefined,
    athleteCanMove: choice.athleteCanMove,
  };

  return weeks.map((week) => {
    if (!inScope(week.index)) return week;
    if (week.index !== sourceIndex && dates && isPastWeek(dates.startDate, week.index, dates.today))
      return week;
    const at =
      week.index === sourceIndex
        ? slot
        : (() => {
            const byName = week.sessions.findIndex((session) =>
              sameName(session.title, source.title),
            );
            if (byName >= 0) return byName;
            return week.sessions.length === sourceWeek.sessions.length ? slot : -1;
          })();
    const target = at >= 0 ? week.sessions[at] : undefined;
    if (target?.withCoach) return week;
    // Jour déjà plein dans une autre semaine (4 séances, D-164) : cette semaine ne change pas.
    const full = (except?: string) =>
      choice.day !== null && !dayHasRoom({ ...week, scheduling: "fixed" }, choice.day, except);
    if (target) {
      if (week.index !== sourceIndex && full(target.key)) return week;
      return fillMoments({
        ...week,
        scheduling: "fixed",
        sessions: week.sessions.map((session, i) =>
          i === at ? { ...session, ...placed } : session,
        ),
      });
    }
    // Pas de séance correspondante : une copie, à ce jour (jamais avec le rendez-vous du coach).
    if (choice.day === null || week.sessions.length >= MAX_SESSIONS_PER_WEEK || full()) return week;
    const key = localId("s", taken);
    taken.add(key);
    return fillMoments({
      ...week,
      scheduling: "fixed",
      sessions: [...week.sessions, { ...source, ...placed, key, withCoach: undefined }],
    });
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
      moment: undefined,
    })),
  };
}

// « Fixer les jours » : la semaine passe en jours fixes avec les jours choisis (proposition corrigée).
export function setWeekFixed(week: Week, days: ReadonlyMap<string, Weekday>): Week {
  return fillMoments({
    ...week,
    scheduling: "fixed",
    sessions: week.sessions.map((session) =>
      session.withCoach
        ? session
        : {
            ...session,
            fixedDay: days.get(session.key),
            fixedTime: days.get(session.key) ? session.fixedTime : undefined,
            moment: days.get(session.key) ? session.moment : undefined,
          },
    ),
  });
}

// Une séance qui perd son rendez-vous du coach (copie dans une autre semaine, programme copié, revue
// MVP du 13/11, C5) : un rendez-vous est daté et appartient à l'agenda d'origine, il ne se copie
// jamais. En jours fixes, la copie garde le jour (et l'heure) du rendez-vous comme jour fixé ; dans
// l'ordre, elle n'a ni jour ni moment (sinon le brouillon serait refusé : un moment va avec un jour).
export function detachCoach(session: SessionDraft, scheduling: Week["scheduling"]): SessionDraft {
  if (!session.withCoach) return session;
  const { withCoach, ...rest } = session;
  if (scheduling === "ordered") {
    return { ...rest, fixedDay: undefined, fixedTime: undefined, moment: undefined };
  }
  return {
    ...rest,
    fixedDay: session.fixedDay ?? weekdayOf(withCoach.date),
    fixedTime: session.fixedTime ?? withCoach.time,
  };
}

// Où placer la copie d'une séance dans sa semaine (« Dupliquer la séance », C12) : en jours fixes, le
// même jour avec le premier moment libre ; si ce jour a déjà 4 séances, la copie reste sans jour (le
// coach la place ensuite). Dans l'ordre : sans jour.
export function copyPlacement(
  week: Week,
  original: SessionDraft,
): Pick<SessionDraft, "fixedDay" | "fixedTime" | "moment"> {
  const none = { fixedDay: undefined, fixedTime: undefined, moment: undefined };
  if (week.scheduling !== "fixed") return none;
  const day = sessionDay(original);
  if (!day || !dayHasRoom(week, day)) return none;
  return { fixedDay: day, fixedTime: undefined, moment: suggestedMoment(week, day) ?? undefined };
}
