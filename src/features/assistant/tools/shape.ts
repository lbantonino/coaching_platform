import { formatMoney } from "@/domain/billing/money";
import type { LibraryExercise } from "@/domain/exercises/library";
import type { AthleteListItem } from "@/features/athletes/queries";
import type { UnpaidDate } from "@/features/billing/collect-queries";
import type { AthleteProgramRow } from "@/features/programs/queries";
import type { TemplateCard } from "@/features/programs/templates";
import type { CoachSession } from "@/features/sessions/queries";
import { sessionOccurrences } from "@/features/sessions/schemas";

// Mise en forme des outils de lecture de l'Assistant IA (lot 1 des actions) : ce qui part chez
// Anthropic. Court, utile à l'action, jamais d'e-mail, de téléphone, de note ni de donnée de santé.

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const STATUS: Record<AthleteListItem["status"], string> = {
  active: "actif",
  paused: "en pause",
  archived: "archivé",
};

export type AthleteRow = {
  id: string;
  nom: string;
  statut: string;
  discipline: AthleteListItem["programType"];
  manque: string[];
};

// Sportifs dont un mot du nom commence par la recherche (« luc » : Lucas, Lucie), sans accent ni
// majuscule ; les archivés seulement sur demande ; 10 au plus.
export function shapeAthletes(
  items: AthleteListItem[],
  nom: string,
  withArchived = false,
): AthleteRow[] {
  const query = fold(nom);
  return items
    .filter((item) => withArchived || item.status !== "archived")
    .filter((item) => {
      const name = fold(item.displayName);
      return (
        query === "" || name.startsWith(query) || name.split(/\s+/).some((w) => w.startsWith(query))
      );
    })
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      nom: item.displayName,
      statut: STATUS[item.status],
      discipline: item.programType,
      manque: item.missingInfo,
    }));
}

export type AgendaRow = {
  seance_id: string;
  date: string;
  date_originale: string;
  heure: string;
  duree_min: number;
  titre: string;
  sportif: string;
  repetee: boolean;
};

const who = (session: CoachSession) =>
  session.kind === "group"
    ? `collective (${session.athletes.length} inscrit${session.athletes.length > 1 ? "s" : ""})`
    : (session.athletes[0]?.name ?? "sans sportif");

// Une ligne par date entre `du` et `au` (dates déplacées comprises, avec leur date d'origine).
export function shapeAgenda(sessions: CoachSession[], du: string, au: string): AgendaRow[] {
  return sessions
    .flatMap((session) =>
      sessionOccurrences(session, du, au).map((occurrence) => ({
        seance_id: session.id,
        date: occurrence.date,
        date_originale: occurrence.originalDate,
        heure: occurrence.startTime,
        duree_min: session.durationMinutes,
        titre: session.title,
        sportif: who(session),
        repetee: session.repeatsWeekly,
      })),
    )
    .sort((a, b) => `${a.date} ${a.heure}`.localeCompare(`${b.date} ${b.heure}`));
}

export type UnpaidRow = {
  seance_id: string;
  date: string;
  date_originale: string;
  heure: string;
  titre: string;
  sportif: string;
  montant: string;
  en_retard: boolean;
};

// Dates de séances à encaisser, d'un sportif si demandé (sa séance individuelle ou une collective
// où il est inscrit).
export function shapeUnpaid(
  dates: UnpaidDate[],
  sessions: CoachSession[],
  sportifId?: string,
): UnpaidRow[] {
  const byId = new Map(sessions.map((session) => [session.id, session]));
  return dates
    .filter((date) => {
      if (!sportifId) return true;
      return byId.get(date.sessionId)?.athletes.some((athlete) => athlete.id === sportifId);
    })
    .map((date) => ({
      seance_id: date.sessionId,
      date: date.date,
      date_originale: date.originalDate,
      heure: date.startTime,
      titre: date.title,
      sportif: date.athleteName ?? "collective",
      montant: formatMoney(date.amountCents, date.currency).replace(/\s/g, " "),
      en_retard: date.late,
    }));
}

// --- Lot 3a : créer un programme --------------------------------------------------------------

// Modèles de PROGRAMME (Coory et du coach), pour partir d'un modèle qui convient.
export function shapeTemplates(cards: TemplateCard[]) {
  return cards
    .filter((card) => card.kind === "program")
    .map((card) => ({
      id: card.id,
      titre: card.title,
      discipline: card.discipline,
      semaines: card.weeksCount,
      seances_par_semaine: card.sessionsPerWeek,
      origine: card.source,
    }));
}

const addDaysIso = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

// Programmes d'un sportif avec leurs dates : pour choisir un début qui ne chevauche rien, ou copier.
export function shapePrograms(rows: AthleteProgramRow[]) {
  return rows.map((row) => ({
    id: row.id,
    titre: row.title,
    statut: row.status,
    debut: row.startDate,
    fin: addDaysIso(row.startDate, row.weeksCount * 7 - 1),
  }));
}

// Exercices de la Bibliothèque dont le nom ou un alias contient, pour chaque mot cherché, un mot qui
// commence par lui (« développé couché », « dev », « bench press » ; relecture n°4).
const words = (text: string) =>
  fold(text)
    .split(/[\s/()-]+/)
    .filter(Boolean);

export function shapeExercises(items: LibraryExercise[], nom: string) {
  const query = words(nom);
  const matches = (text: string) => {
    const own = words(text);
    return query.every((part) => own.some((word) => word.startsWith(part)));
  };
  return items
    .filter((item) => [item.nameFr, ...item.aliasesFr].some(matches))
    .slice(0, 15)
    .map((item) => ({
      id: item.id,
      nom: item.nameFr,
      mesure: item.timed ? ("secondes" as const) : ("repetitions" as const),
    }));
}
