import type { Discipline } from "@/domain/training/discipline";
import {
  scheduleRule,
  sessionOccurrences,
  type ScheduleLike,
  type SessionException,
} from "@/features/sessions/schemas";

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
  exceptions?: SessionException[];
};

// Lundi de la semaine qui contient `day` (AAAA-MM-JJ, calcul en UTC).
export function mondayOf(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
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
  // Glisser-déposer (D-35) : la date de la série dont vient le bloc, s'il se répète, s'il a été déplacé.
  originalDate: string;
  recurring: boolean;
  // « Toute la série » se décale seulement pour une série quotidienne ou hebdomadaire (D-203) ; une
  // série mensuelle, annuelle ou personnalisée par mois se déplace date par date.
  seriesMovable: boolean;
  moved: boolean;
  // « Jour entier » (D-204) : sans heure (label « Toute la journée »).
  allDay: boolean;
  // Colonne occupée parmi `lanes` quand des séances se chevauchent le même jour.
  lane: number;
  lanes: number;
};

export type WeekLayout = {
  // Les séances « Jour entier » (D-204, `allDay`) sont en tête de leur journée ; la grille les met
  // dans sa rangée du haut. Elles ne comptent ni dans les heures ni dans la plage horaire.
  days: { date: string; minutes: number; blocks: WeekBlock[] }[];
  totalMinutes: number;
  // Plage horaire affichée : au moins 06:00 - 22:00 (prompt Claude Design §6, toute la journée
  // visible), élargie pour ne couper aucune séance.
  firstHour: number;
  lastHour: number;
};

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
    sessionOccurrences(session, dates[0], dates[dates.length - 1]).map((occurrence) => {
      const { date } = occurrence;
      const start = toMinutes(occurrence.startTime);
      const end = start + session.durationMinutes;
      const individual = session.kind === "individual";
      return {
        key: `${session.id}:${occurrence.originalDate}`,
        sessionId: session.id,
        date,
        originalDate: occurrence.originalDate,
        recurring: session.repeatsWeekly,
        seriesMovable: ["daily", "weekly"].includes(scheduleRule(session)?.freq ?? ""),
        moved: occurrence.moved,
        start,
        end,
        label: session.allDay ? "Toute la journée" : `${toTime(start)} - ${toTime(end)}`,
        title: individual ? (session.athletes[0]?.name ?? session.title) : session.title,
        subtitle: individual
          ? session.title
          : `${session.athletes.length} inscrit${session.athletes.length > 1 ? "s" : ""}`,
        discipline: session.discipline,
        individual,
        allDay: session.allDay === true,
        lane: 0,
        lanes: 1,
      };
    }),
  );
  const timed = blocks.filter((block) => !block.allDay);

  const days = dates.map((date) => {
    const dayBlocks = blocks
      .filter((block) => block.date === date)
      .sort(
        (a, b) =>
          Number(b.allDay) - Number(a.allDay) ||
          a.start - b.start ||
          a.end - b.end ||
          a.title.localeCompare(b.title, "fr"),
      );
    assignLanes(dayBlocks.filter((block) => !block.allDay));
    return {
      date,
      minutes: dayBlocks
        .filter((block) => !block.allDay)
        .reduce((sum, block) => sum + (block.end - block.start), 0),
      blocks: dayBlocks,
    };
  });

  const starts = timed.map((block) => block.start);
  const ends = timed.map((block) => block.end);
  return {
    days,
    totalMinutes: days.reduce((sum, day) => sum + day.minutes, 0),
    firstHour: Math.min(6, ...starts.map((m) => Math.floor(m / 60))),
    lastHour: Math.min(24, Math.max(22, ...ends.map((m) => Math.ceil(m / 60)))),
  };
}

// Heures affichées (Paramètres, D-57) : la plage choisie par le coach (ex. 7 h – 21 h), élargie si
// une séance commence plus tôt ou finit plus tard, pour qu'aucune ne soit coupée.
export function withHours(layout: WeekLayout, first: number, last: number): WeekLayout {
  // Une séance « Jour entier » (D-204) n'a pas d'heure : elle n'élargit pas la plage.
  const blocks = layout.days.flatMap((day) => day.blocks).filter((block) => !block.allDay);
  return {
    ...layout,
    firstHour: Math.min(first, ...blocks.map((block) => Math.floor(block.start / 60))),
    lastHour: Math.min(24, Math.max(last, ...blocks.map((block) => Math.ceil(block.end / 60)))),
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
