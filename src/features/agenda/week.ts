import type { Discipline } from "@/domain/training/discipline";
import { occurrencesBetween, type ScheduleLike } from "@/features/sessions/schemas";

import { addDays } from "./items";

// Semaine du tableau de bord (D-28) : règles PURES, testées par Vitest.

export type WeekSession = ScheduleLike & {
  id: string;
  kind: "group" | "individual";
  title: string;
  discipline: Discipline | null;
  startTime: string;
  durationMinutes: number;
  athletes: { id: string; name: string }[];
};

// Lundi de la semaine qui contient `day` (AAAA-MM-JJ, calcul en UTC).
export function mondayOf(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
}

// Semaine demandée dans l'adresse (?semaine=AAAA-MM-JJ, n'importe quel jour), sinon celle d'aujourd'hui.
export function parseWeek(param: string | undefined, today: string): string {
  const valid =
    param &&
    /^\d{4}-\d{2}-\d{2}$/.test(param) &&
    !Number.isNaN(Date.parse(param)) &&
    param >= "2000-01-01";
  return mondayOf(valid ? param : today);
}

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export type WeekBlock = {
  key: string;
  sessionId: string;
  date: string;
  start: number; // minutes depuis minuit
  end: number;
  label: string; // « 09:00 - 10:00 »
  // Séance individuelle : le nom du sportif ; collective : le titre de la séance.
  title: string;
  subtitle: string;
  discipline: Discipline | null;
  individual: boolean;
  // Colonne occupée parmi `lanes` quand des séances se chevauchent le même jour.
  lane: number;
  lanes: number;
};

export type WeekLayout = {
  days: { date: string; minutes: number; blocks: WeekBlock[] }[];
  totalMinutes: number;
  // Plage horaire affichée : au moins 08:00 - 20:00, élargie pour ne couper aucune séance.
  firstHour: number;
  lastHour: number;
};

export function layoutWeek(sessions: WeekSession[], monday: string): WeekLayout {
  return layoutDays(
    sessions,
    Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
  );
}

// Jour affiché dans l'adresse (?date=AAAA-MM-JJ), sinon aujourd'hui.
export function parseDay(param: string | undefined, today: string): string {
  const valid =
    param &&
    /^\d{4}-\d{2}-\d{2}$/.test(param) &&
    !Number.isNaN(Date.parse(param)) &&
    param >= "2000-01-01";
  return valid ? param : today;
}

// Même calcul pour une liste de jours consécutifs : une journée, une semaine ou un mois.
export function layoutDays(sessions: WeekSession[], dates: string[]): WeekLayout {
  const blocks: WeekBlock[] = sessions.flatMap((session) =>
    occurrencesBetween(session, dates[0], dates[dates.length - 1]).map((date) => {
      const start = toMinutes(session.startTime);
      const end = start + session.durationMinutes;
      const individual = session.kind === "individual";
      return {
        key: `${session.id}:${date}`,
        sessionId: session.id,
        date,
        start,
        end,
        label: `${toTime(start)} - ${toTime(end)}`,
        title: individual ? (session.athletes[0]?.name ?? session.title) : session.title,
        subtitle: individual
          ? session.title
          : `${session.athletes.length} inscrit${session.athletes.length > 1 ? "s" : ""}`,
        discipline: session.discipline,
        individual,
        lane: 0,
        lanes: 1,
      };
    }),
  );

  const days = dates.map((date) => {
    const dayBlocks = blocks
      .filter((block) => block.date === date)
      .sort((a, b) => a.start - b.start || a.end - b.end);
    assignLanes(dayBlocks);
    return {
      date,
      minutes: dayBlocks.reduce((sum, block) => sum + (block.end - block.start), 0),
      blocks: dayBlocks,
    };
  });

  const starts = blocks.map((block) => block.start);
  const ends = blocks.map((block) => block.end);
  return {
    days,
    totalMinutes: days.reduce((sum, day) => sum + day.minutes, 0),
    firstHour: Math.min(8, ...starts.map((m) => Math.floor(m / 60))),
    lastHour: Math.min(24, Math.max(20, ...ends.map((m) => Math.ceil(m / 60)))),
  };
}

// Séances qui se chevauchent : chacune prend la première colonne libre ; toutes celles d'un même
// groupe de chevauchement partagent le même nombre de colonnes.
function assignLanes(sorted: WeekBlock[]) {
  let group: WeekBlock[] = [];
  let groupEnd = -1;
  const close = () => {
    const lanes = Math.max(1, ...group.map((block) => block.lane + 1));
    group.forEach((block) => (block.lanes = lanes));
    group = [];
  };
  for (const block of sorted) {
    if (block.start >= groupEnd && group.length > 0) close();
    const used = new Set(group.filter((other) => other.end > block.start).map((o) => o.lane));
    let lane = 0;
    while (used.has(lane)) lane += 1;
    block.lane = lane;
    group.push(block);
    groupEnd = Math.max(groupEnd, block.end);
  }
  if (group.length > 0) close();
}

// « 4 h », « 1 h 30 », « 45 min » : durée totale lisible.
export function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

// Heures de la journée occupées par au moins une séance (barres du résumé « coachings aujourd'hui »).
export function busyHours(sessions: WeekSession[], day: string): Set<number> {
  const hours = new Set<number>();
  for (const session of sessions) {
    if (occurrencesBetween(session, day, day).length === 0) continue;
    const start = toMinutes(session.startTime);
    const end = start + session.durationMinutes;
    for (let hour = Math.floor(start / 60); hour * 60 < end; hour += 1) hours.add(hour);
  }
  return hours;
}

// Prochaine séance d'un sportif (inscrit ou sportif d'une séance individuelle) à partir de `now`
// (jour + heure locale), dans les 60 prochains jours.
export function nextSessionFor(
  athleteId: string,
  sessions: WeekSession[],
  today: string,
  nowTime: string,
): { date: string; time: string } | null {
  let best: { date: string; time: string } | null = null;
  for (const session of sessions) {
    if (!session.athletes.some((athlete) => athlete.id === athleteId)) continue;
    for (const date of occurrencesBetween(session, today, addDays(today, 60))) {
      if (date === today && session.startTime < nowTime) continue;
      if (!best || date < best.date || (date === best.date && session.startTime < best.time)) {
        best = { date, time: session.startTime };
      }
      break;
    }
  }
  return best;
}

// Dernière séance passée d'un sportif (jusqu'à `now` inclus), dans les 60 derniers jours.
export function lastSessionFor(
  athleteId: string,
  sessions: WeekSession[],
  today: string,
  nowTime: string,
): { date: string; time: string } | null {
  let best: { date: string; time: string } | null = null;
  for (const session of sessions) {
    if (!session.athletes.some((athlete) => athlete.id === athleteId)) continue;
    const dates = occurrencesBetween(session, addDays(today, -60), today).filter(
      (date) => date < today || session.startTime <= nowTime,
    );
    const date = dates.at(-1);
    if (!date) continue;
    if (!best || date > best.date || (date === best.date && session.startTime > best.time)) {
      best = { date, time: session.startTime };
    }
  }
  return best;
}

// Nombre de séances de la semaine (toutes, collectives et individuelles) et détail par jour.
export function weekCounts(sessions: WeekSession[], monday: string): number[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    return sessions.filter((session) => occurrencesBetween(session, day, day).length > 0).length;
  });
}
