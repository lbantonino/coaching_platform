import type { Discipline } from "@/domain/training/discipline";
import {
  formatDuration,
  sessionOccurrences,
  type ScheduleLike,
  type SessionException,
} from "@/features/sessions/schemas";

// Fusion des deux calques de l'agenda (D-27) : séances encadrées (dates calculées) et compétitions.
// Module PUR : reçoit des données déjà lues, testé par Vitest.

export type AgendaSessionSource = ScheduleLike & {
  id: string;
  kind: "group" | "individual";
  title: string;
  discipline: Discipline | null;
  location: string | null;
  startTime: string;
  durationMinutes: number;
  athletes: { id: string; name: string }[];
  exceptions?: SessionException[];
};

export type AgendaEventSource = {
  id: string;
  date: string;
  athleteId: string;
  athleteName: string;
  title: string;
  detail: string;
  discipline: Discipline | null;
  achieved: boolean;
};

export type AgendaItem =
  | {
      type: "session";
      key: string;
      date: string;
      time: string;
      sessionId: string;
      individual: boolean;
      title: string;
      detail: string;
      discipline: Discipline | null;
    }
  | {
      type: "event";
      key: string;
      date: string;
      time: null;
      athleteId: string;
      athleteName: string;
      title: string;
      detail: string;
      discipline: Discipline | null;
      achieved: boolean;
    };

export type AgendaFilter = { discipline: Discipline | null; athleteId: string | null };

// « Stade · 4 inscrits · 1 h 30 » ou « Avec Inès Benali · Salle · 1 h ».
function sessionDetail(session: AgendaSessionSource): string {
  const who =
    session.kind === "individual"
      ? `Avec ${session.athletes[0]?.name ?? "un sportif"}`
      : `${session.athletes.length} inscrit${session.athletes.length > 1 ? "s" : ""}`;
  return [
    session.kind === "individual" ? who : null,
    session.location,
    session.kind === "group" ? who : null,
    formatDuration(session.durationMinutes),
  ]
    .filter(Boolean)
    .join(" · ");
}

// Éléments de l'agenda entre `from` et `to` inclus, triés par jour puis : compétitions (journée
// entière) d'abord, séances par heure.
export function buildAgendaItems(
  sessions: AgendaSessionSource[],
  events: AgendaEventSource[],
  from: string,
  to: string,
  filter: AgendaFilter,
): AgendaItem[] {
  const keep = (discipline: Discipline | null) =>
    !filter.discipline || discipline === filter.discipline;

  const items: AgendaItem[] = [];
  for (const session of sessions) {
    if (!keep(session.discipline)) continue;
    if (filter.athleteId && !session.athletes.some((a) => a.id === filter.athleteId)) continue;
    for (const { date, startTime, originalDate } of sessionOccurrences(session, from, to)) {
      items.push({
        type: "session",
        key: `${session.id}:${originalDate}`,
        date,
        // « Jour entier » (D-204) : sans heure, en tête de la journée (comme les événements).
        time: session.allDay ? "" : startTime,
        sessionId: session.id,
        individual: session.kind === "individual",
        title: session.title,
        detail: sessionDetail(session),
        discipline: session.discipline,
      });
    }
  }
  for (const event of events) {
    if (!keep(event.discipline)) continue;
    if (filter.athleteId && event.athleteId !== filter.athleteId) continue;
    if (event.date < from || event.date > to) continue;
    items.push({ type: "event", key: event.id, time: null, ...event });
  }

  return items.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time ?? "").localeCompare(b.time ?? "") ||
      a.title.localeCompare(b.title, "fr"),
  );
}

// Jour + n (AAAA-MM-JJ), en UTC.

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
