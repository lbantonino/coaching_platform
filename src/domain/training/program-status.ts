// Statut d'un programme dans la liste (page Programmes, onglet Programmes) et choix du programme à
// montrer sur la fiche d'un sportif (C-8 : un « En cours » et un « À venir » possibles). Règles PURES.

export type ProgramListStatus = "draft" | "current" | "upcoming" | "finished" | "archived";

export const programStatusLabels: Record<ProgramListStatus, string> = {
  draft: "Brouillon",
  current: "En cours",
  upcoming: "À venir",
  finished: "Terminé",
  archived: "Archivé",
};

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Lundi suivant la dernière semaine (borne de fin exclue).
export function programEnd(startDate: string, weeksCount: number): string {
  return addDays(startDate, weeksCount * 7);
}

export function programListStatus(
  program: { status: "draft" | "published" | "archived"; startDate: string; weeksCount: number },
  today: string,
): ProgramListStatus {
  if (program.status === "archived") return "archived";
  if (program.status === "draft") return "draft";
  if (today < program.startDate) return "upcoming";
  if (today >= programEnd(program.startDate, program.weeksCount)) return "finished";
  return "current";
}

// Le programme publié à montrer pour un sportif : celui en cours ; sinon le prochain à venir ;
// sinon le dernier terminé.
export function pickCurrentProgram<T extends { startDate: string; weeksCount: number }>(
  programs: readonly T[],
  today: string,
): T | null {
  const current = programs.find(
    (program) =>
      program.startDate <= today && today < programEnd(program.startDate, program.weeksCount),
  );
  if (current) return current;
  const upcoming = programs
    .filter((program) => program.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (upcoming) return upcoming;
  return [...programs].sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;
}

// Carte « Programmes en cours » du tableau de bord (recette du 11/11/2026) : les programmes en cours
// d'abord (le plus récent en tête), puis ceux à venir (le plus proche en tête), puis les terminés.
// Avant, le tri par date de début décroissante faisait passer les « à venir » devant, et la carte
// (3 lignes) pouvait ne plus montrer aucun programme en cours.
export function orderForDashboard<T extends { startDate: string; weeksCount: number }>(
  programs: readonly T[],
  today: string,
): T[] {
  const group = (program: T) =>
    today < program.startDate
      ? 1
      : today >= programEnd(program.startDate, program.weeksCount)
        ? 2
        : 0;
  return [...programs].sort((a, b) => {
    const byGroup = group(a) - group(b);
    if (byGroup !== 0) return byGroup;
    return group(a) === 1
      ? a.startDate.localeCompare(b.startDate)
      : b.startDate.localeCompare(a.startDate);
  });
}

// ---------------------------------------------------------------------------
// Revue MVP du 13/11 (B1, B2, B8, C3) : où en est un programme publié, quelle semaine montrer, et
// quand en commencer un nouveau sans chevaucher les autres.
// ---------------------------------------------------------------------------
export type ProgramTiming = "current" | "upcoming" | "finished";

export function programTiming(
  program: { startDate: string; weeksCount: number },
  today: string,
): ProgramTiming {
  if (today < program.startDate) return "upcoming";
  return today >= programEnd(program.startDate, program.weeksCount) ? "finished" : "current";
}

// La semaine montrée par défaut, la MÊME dans les onglets Programme et Agenda : la semaine en cours ;
// avant le début, la semaine 1 ; après la fin, la dernière.
export function defaultWeekIndex(startDate: string, weeksCount: number, today: string): number {
  const days = Math.floor((Date.parse(today) - Date.parse(startDate)) / 86_400_000);
  return Math.min(Math.max(Math.floor(days / 7) + 1, 1), weeksCount);
}

type Period = { startDate: string; weeksCount: number };

// Deux programmes se chevauchent (C-8) : même règle que la contrainte de la base (fin exclue).
export function periodsOverlap(a: Period, b: Period): boolean {
  return (
    a.startDate < programEnd(b.startDate, b.weeksCount) &&
    b.startDate < programEnd(a.startDate, a.weeksCount)
  );
}

// Début proposé pour un nouveau programme : `from` (le prochain lundi), ou le lundi qui suit la fin
// du dernier programme publié encore en cours ou à venir, pour ne pas le chevaucher.
export function firstFreeMonday(published: readonly Period[], from: string): string {
  return published
    .map((program) => programEnd(program.startDate, program.weeksCount))
    .reduce((latest, end) => (end > latest ? end : latest), from);
}
