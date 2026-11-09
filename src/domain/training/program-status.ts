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
