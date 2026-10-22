import { z } from "zod";

import { DISCIPLINES, type Discipline } from "@/domain/training/discipline";
import { formatDate } from "@/lib/format";

// Séances encadrées du coach, en présentiel (P2-05b, D-27). Règles PURES, testées par Vitest.
export const SESSION_KINDS = ["group", "individual"] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];
export const sessionKindLabels: Record<SessionKind, string> = {
  group: "Collective",
  individual: "Individuelle",
};

export type SessionFormInput = {
  kind: string;
  title: string;
  discipline: string;
  location: string;
  startsOn: string;
  startTime: string;
  durationMinutes: string;
  repeatsWeekly: boolean;
  endsOn: string;
  athleteId: string;
  athleteIds: string[];
  notes: string;
};

// Valeurs prêtes à enregistrer (noms de colonnes) ; les inscrits d'une séance collective sont à part.
export type SessionValues = {
  kind: SessionKind;
  title: string;
  discipline: Discipline | null;
  location: string | null;
  athlete_id: string | null;
  starts_on: string;
  start_time: string;
  duration_minutes: number;
  repeats_weekly: boolean;
  ends_on: string | null;
  notes: string | null;
};

export type SessionParseResult =
  { ok: true; values: SessionValues; athleteIds: string[] } | { ok: false; error: string };

const isoDay = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && value >= "2000-01-01";

// Lecture PURE du formulaire « Nouvelle séance » / « Modifier la séance ».
export function parseSessionForm(input: SessionFormInput): SessionParseResult {
  const kind = SESSION_KINDS.find((candidate) => candidate === input.kind);
  if (!kind) return { ok: false, error: "Choisis le type de séance." };

  const title = input.title.trim();
  if (title.length < 1 || title.length > 120) {
    return { ok: false, error: "Donne un titre à la séance (120 caractères maximum)." };
  }

  let discipline: Discipline | null = null;
  if (input.discipline !== "") {
    discipline = DISCIPLINES.find((candidate) => candidate === input.discipline) ?? null;
    if (!discipline) return { ok: false, error: "Discipline invalide." };
  }

  const location = input.location.trim();
  if (location.length > 120) {
    return { ok: false, error: "Lieu trop long (120 caractères maximum)." };
  }

  const startsOn = input.startsOn.trim();
  if (!isoDay(startsOn)) return { ok: false, error: "Indique la date de la séance." };

  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(input.startTime.trim());
  if (!time) return { ok: false, error: "Indique l'heure de début, par exemple 19:00." };

  const duration = Number(input.durationMinutes.trim());
  if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
    return { ok: false, error: "Durée invalide : entre 15 et 480 minutes." };
  }

  let endsOn: string | null = null;
  if (input.repeatsWeekly && input.endsOn.trim() !== "") {
    endsOn = input.endsOn.trim();
    if (!isoDay(endsOn)) return { ok: false, error: "Date de fin invalide." };
    if (endsOn < startsOn) {
      return { ok: false, error: "La date de fin ne peut pas précéder la première séance." };
    }
  }

  const notes = input.notes.trim();
  if (notes.length > 500) return { ok: false, error: "Note trop longue (500 caractères maximum)." };

  let athleteId: string | null = null;
  let athleteIds: string[] = [];
  if (kind === "individual") {
    if (!z.uuid().safeParse(input.athleteId).success) {
      return { ok: false, error: "Choisis le sportif de la séance individuelle." };
    }
    athleteId = input.athleteId;
  } else {
    athleteIds = [...new Set(input.athleteIds)];
    if (athleteIds.some((id) => !z.uuid().safeParse(id).success) || athleteIds.length > 100) {
      return { ok: false, error: "Liste de sportifs invalide." };
    }
  }

  return {
    ok: true,
    athleteIds,
    values: {
      kind,
      title,
      discipline,
      location: location === "" ? null : location,
      athlete_id: athleteId,
      starts_on: startsOn,
      start_time: `${time[1]}:${time[2]}`,
      duration_minutes: duration,
      repeats_weekly: input.repeatsWeekly,
      ends_on: endsOn,
      notes: notes === "" ? null : notes,
    },
  };
}

export type ScheduleLike = { startsOn: string; repeatsWeekly: boolean; endsOn: string | null };

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);
const isoFromDay = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);

// Dates d'une séance entre `from` et `to` inclus : sa date unique, ou chaque semaine depuis son début
// jusqu'à sa fin éventuelle. Calcul en jours UTC : aucun décalage au changement d'heure.
export function occurrencesBetween(session: ScheduleLike, from: string, to: string): string[] {
  const start = dayNumber(session.startsOn);
  const first = dayNumber(from);
  const last = Math.min(
    dayNumber(to),
    session.endsOn ? dayNumber(session.endsOn) : Number.POSITIVE_INFINITY,
  );
  if (!session.repeatsWeekly) {
    return start >= first && start <= last ? [session.startsOn] : [];
  }
  // Première occurrence ≥ from : on avance d'un nombre entier de semaines depuis le début.
  const weeksToSkip = Math.max(0, Math.ceil((first - start) / 7));
  const dates: string[] = [];
  for (let day = start + weeksToSkip * 7; day <= last; day += 7) dates.push(isoFromDay(day));
  return dates;
}

const weekdayFormatter = new Intl.DateTimeFormat("fr-BE", { weekday: "long", timeZone: "UTC" });

// 90 -> « 1 h 30 » ; 60 -> « 1 h » ; 45 -> « 45 min ».
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

// « Chaque mercredi à 19:00 · 1 h 30 » ou « Le 28 octobre 2026 à 08:00 · 1 h ».
export function describeSchedule(
  session: ScheduleLike & { startTime: string; durationMinutes: number },
): string {
  const time = session.startTime.slice(0, 5);
  const when = session.repeatsWeekly
    ? `Chaque ${weekdayFormatter.format(new Date(`${session.startsOn}T00:00:00Z`))} à ${time}`
    : `Le ${formatDate(session.startsOn)} à ${time}`;
  return `${when} · ${formatDuration(session.durationMinutes)}`;
}

// « Depuis le 2 septembre 2026, jusqu'au 16 décembre 2026 » (séance récurrente seulement).
export function describePeriod(session: ScheduleLike): string | null {
  if (!session.repeatsWeekly) return null;
  const since = `Depuis le ${formatDate(session.startsOn)}`;
  return session.endsOn ? `${since}, jusqu'au ${formatDate(session.endsOn)}` : since;
}
