import { z } from "zod";

// Récurrence des séances encadrées, comme le Calendrier d'Apple (demande d'Antonino du 24/11/2026) :
// chaque jour, chaque semaine, toutes les 2 semaines, chaque mois, chaque année, ou personnalisé
// (« tous les N jours / semaines / mois / ans », jours de la semaine, « le 2e mardi », mois de l'année).
// Règle PURE, testée par Vitest ; son jumeau SQL (private.session_occurs_on) suit les mêmes règles :
// - la date de début est TOUJOURS la première séance (comme la norme iCalendar), même hors de la règle ;
// - les semaines vont du lundi au dimanche ; « toutes les 2 semaines » compte depuis la semaine du début ;
// - un jour qui manque (31, 29 février) ne donne pas de séance ce mois-là (comme Apple) ;
// - `endsOn` : dernière date possible, ou aucune fin.

export const RECURRENCE_WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type RecurrenceWeekday = (typeof RECURRENCE_WEEKDAYS)[number];
export const RECURRENCE_FREQS = ["daily", "weekly", "monthly", "yearly"] as const;
export type RecurrenceFreq = (typeof RECURRENCE_FREQS)[number];
export const SET_POSITIONS = [1, 2, 3, 4, -1] as const;
export type SetPosition = (typeof SET_POSITIONS)[number];

export type RecurrenceRule = {
  freq: RecurrenceFreq;
  interval: number;
  // Semaine : les jours cochés.
  weekdays?: RecurrenceWeekday[];
  // Mois (« Chaque ») : les jours du mois.
  monthDays?: number[];
  // Mois ou année (« Le ») : le 1er, 2e, 3e, 4e ou dernier jour de la semaine donné.
  setPos?: SetPosition;
  setWeekday?: RecurrenceWeekday;
  // Année : les mois (1 à 12).
  months?: number[];
};

const weekday = z.enum(RECURRENCE_WEEKDAYS);
export const recurrenceRuleSchema = z
  .strictObject({
    freq: z.enum(RECURRENCE_FREQS),
    interval: z.number().int().min(1).max(99),
    weekdays: z.array(weekday).min(1).max(7).optional(),
    monthDays: z.array(z.number().int().min(1).max(31)).min(1).max(31).optional(),
    setPos: z.union(SET_POSITIONS.map((value) => z.literal(value))).optional(),
    setWeekday: weekday.optional(),
    months: z.array(z.number().int().min(1).max(12)).min(1).max(12).optional(),
  })
  .refine((rule) => rule.freq !== "weekly" || rule.weekdays !== undefined, {
    error: "Choisis au moins un jour de la semaine.",
  })
  .refine((rule) => (rule.setPos === undefined) === (rule.setWeekday === undefined), {
    error: "« Le » demande une position et un jour de la semaine.",
  })
  .refine((rule) => !(rule.monthDays && rule.setPos !== undefined), {
    error: "Choisis « Chaque » ou « Le », pas les deux.",
  })
  .refine(
    (rule) =>
      (rule.freq === "weekly" || rule.weekdays === undefined) &&
      (rule.freq === "monthly" || rule.monthDays === undefined) &&
      (rule.freq === "yearly" || rule.months === undefined) &&
      (rule.setPos === undefined || rule.freq === "monthly" || rule.freq === "yearly"),
    { error: "Ces réglages ne vont pas avec cette fréquence." },
  );

export const RECURRENCE_PRESETS = ["daily", "weekly", "biweekly", "monthly", "yearly"] as const;
export type RecurrencePreset = (typeof RECURRENCE_PRESETS)[number];

// --- Dates (jours entiers, sans fuseau) ---------------------------------------------------------
const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);
const isoOf = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);
const parts = (iso: string) => ({
  year: Number(iso.slice(0, 4)),
  month: Number(iso.slice(5, 7)),
  day: Number(iso.slice(8, 10)),
});
// 0 = lundi … 6 = dimanche.
const weekdayIndex = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
export const weekdayOfDate = (iso: string): RecurrenceWeekday =>
  RECURRENCE_WEEKDAYS[weekdayIndex(iso)]!;
const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();
// Le lundi de la semaine d'une date, en jours.
const mondayNumber = (iso: string) => dayNumber(iso) - weekdayIndex(iso);

// « Le 2e mardi » / « le dernier lundi » du mois de cette date ?
function matchesSetPos(iso: string, setPos: SetPosition, setWeekday: RecurrenceWeekday): boolean {
  if (weekdayOfDate(iso) !== setWeekday) return false;
  const { year, month, day } = parts(iso);
  return setPos === -1 ? day + 7 > daysInMonth(year, month) : Math.ceil(day / 7) === setPos;
}

// Une date de la série ? (Le jumeau SQL : private.session_occurs_on.)
export function occursOnRule(
  startsOn: string,
  endsOn: string | null,
  rule: RecurrenceRule,
  date: string,
): boolean {
  if (date < startsOn || (endsOn !== null && date > endsOn)) return false;
  if (date === startsOn) return true;
  const start = parts(startsOn);
  const current = parts(date);
  switch (rule.freq) {
    case "daily":
      return (dayNumber(date) - dayNumber(startsOn)) % rule.interval === 0;
    case "weekly": {
      const weeks = (mondayNumber(date) - mondayNumber(startsOn)) / 7;
      return weeks % rule.interval === 0 && (rule.weekdays ?? []).includes(weekdayOfDate(date));
    }
    case "monthly": {
      const months = (current.year - start.year) * 12 + (current.month - start.month);
      if (months % rule.interval !== 0) return false;
      if (rule.setPos !== undefined && rule.setWeekday) {
        return matchesSetPos(date, rule.setPos, rule.setWeekday);
      }
      return (rule.monthDays ?? [start.day]).includes(current.day);
    }
    case "yearly": {
      const years = current.year - start.year;
      if (years % rule.interval !== 0) return false;
      if (!(rule.months ?? [start.month]).includes(current.month)) return false;
      if (rule.setPos !== undefined && rule.setWeekday) {
        return matchesSetPos(date, rule.setPos, rule.setWeekday);
      }
      return current.day === start.day;
    }
  }
}

// Les dates de la série entre `from` et `to` inclus, dans l'ordre.
export function ruleDates(
  startsOn: string,
  endsOn: string | null,
  rule: RecurrenceRule,
  from: string,
  to: string,
): string[] {
  const first = Math.max(dayNumber(from), dayNumber(startsOn));
  const last = Math.min(dayNumber(to), endsOn ? dayNumber(endsOn) : Number.POSITIVE_INFINITY);
  const dates: string[] = [];
  for (let day = first; day <= last; day += 1) {
    const iso = isoOf(day);
    if (occursOnRule(startsOn, endsOn, rule, iso)) dates.push(iso);
  }
  return dates;
}

// --- Le menu ----------------------------------------------------------------------------------
export function weeklyRule(startsOn: string): RecurrenceRule {
  return { freq: "weekly", interval: 1, weekdays: [weekdayOfDate(startsOn)] };
}

export function presetRule(preset: RecurrencePreset, startsOn: string): RecurrenceRule {
  switch (preset) {
    case "daily":
      return { freq: "daily", interval: 1 };
    case "weekly":
      return weeklyRule(startsOn);
    case "biweekly":
      return { ...weeklyRule(startsOn), interval: 2 };
    case "monthly":
      return { freq: "monthly", interval: 1, monthDays: [parts(startsOn).day] };
    case "yearly":
      return { freq: "yearly", interval: 1, months: [parts(startsOn).month] };
  }
}

// Forme canonique d'une règle : clés dans un ordre fixe, listes triées (une règle relue de la base a
// ses clés dans l'ordre de PostgreSQL). Sert à comparer et à enregistrer.
export function normalizeRule(rule: RecurrenceRule): RecurrenceRule {
  const sorted = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);
  return {
    freq: rule.freq,
    interval: rule.interval,
    ...(rule.weekdays
      ? { weekdays: RECURRENCE_WEEKDAYS.filter((day) => rule.weekdays!.includes(day)) }
      : {}),
    ...(rule.monthDays ? { monthDays: sorted(rule.monthDays) } : {}),
    ...(rule.setPos !== undefined ? { setPos: rule.setPos } : {}),
    ...(rule.setWeekday ? { setWeekday: rule.setWeekday } : {}),
    ...(rule.months ? { months: sorted(rule.months) } : {}),
  };
}
const sameRule = (a: RecurrenceRule, b: RecurrenceRule) =>
  JSON.stringify(normalizeRule(a)) === JSON.stringify(normalizeRule(b));

// Le choix du menu qui correspond à cette règle (« never » sans règle, « custom » sinon).
export function presetOf(
  rule: RecurrenceRule | null,
  startsOn: string,
): RecurrencePreset | "never" | "custom" {
  if (!rule) return "never";
  return (
    RECURRENCE_PRESETS.find((preset) => sameRule(presetRule(preset, startsOn), rule)) ?? "custom"
  );
}

export const presetLabels: Record<RecurrencePreset | "never" | "custom", string> = {
  never: "Jamais",
  daily: "Chaque jour",
  weekly: "Chaque semaine",
  biweekly: "Toutes les 2 semaines",
  monthly: "Chaque mois",
  yearly: "Chaque année",
  custom: "Personnalisé",
};

// --- La phrase --------------------------------------------------------------------------------
const WEEKDAY_WORDS: Record<RecurrenceWeekday, string> = {
  mon: "lundi",
  tue: "mardi",
  wed: "mercredi",
  thu: "jeudi",
  fri: "vendredi",
  sat: "samedi",
  sun: "dimanche",
};
const MONTH_WORDS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
const POSITION_WORDS: Record<SetPosition, string> = {
  1: "1er",
  2: "2e",
  3: "3e",
  4: "4e",
  [-1]: "dernier",
};
const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
const fullDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// « Toutes les 2 semaines le mardi et le jeudi, jusqu'au 31 décembre 2026 ».
export function describeRule(
  rule: RecurrenceRule,
  startsOn: string,
  endsOn: string | null,
): string {
  const start = parts(startsOn);
  const every = (one: string, many: (n: number) => string) =>
    rule.interval === 1 ? one : many(rule.interval);
  const setPart =
    rule.setPos !== undefined && rule.setWeekday
      ? `le ${POSITION_WORDS[rule.setPos]} ${WEEKDAY_WORDS[rule.setWeekday]}`
      : null;
  let text: string;
  switch (rule.freq) {
    case "daily":
      text = every("Chaque jour", (n) => `Tous les ${n} jours`);
      break;
    case "weekly": {
      const days = RECURRENCE_WEEKDAYS.filter((day) => (rule.weekdays ?? []).includes(day)).map(
        (day) => `le ${WEEKDAY_WORDS[day]}`,
      );
      text = `${every("Chaque semaine", (n) => `Toutes les ${n} semaines`)} ${list(days)}`;
      break;
    }
    case "monthly": {
      const days = [...(rule.monthDays ?? [start.day])].sort((a, b) => a - b).map(String);
      text = `${every("Chaque mois", (n) => `Tous les ${n} mois`)} ${setPart ?? `le ${list(days)}`}`;
      break;
    }
    case "yearly": {
      const months = [...(rule.months ?? [start.month])]
        .sort((a, b) => a - b)
        .map((month) => MONTH_WORDS[month - 1]!);
      text = `${every("Chaque année", (n) => `Tous les ${n} ans`)} ${
        setPart ? `${setPart} de ${list(months)}` : `le ${start.day} ${list(months)}`
      }`;
      break;
    }
  }
  return endsOn ? `${text}, jusqu'au ${fullDate.format(new Date(`${endsOn}T00:00:00Z`))}` : text;
}
