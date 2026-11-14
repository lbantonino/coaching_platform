import { MAX_SESSIONS_PER_WEEK } from "@/domain/training/session-v2";
import { firstFreeMonday } from "@/domain/training/program-status";

import type { CreateProgramInput } from "./schemas";
import type { WizardAthlete, WizardTemplate } from "./wizard";

// Règles partagées par l'assistant « Nouveau programme » et « Utiliser ce modèle » en direct
// (demande d'Antonino du 14/11/2026, D-178). Pures : utilisables dans le navigateur et testées par Vitest.

// Façon de viser pré-choisie (WIZ-F06) : allure si la VMA est connue, sinon zones de FC ; % du max si
// des maxima sont reliés à un exercice, sinon kg.
export function aimFor(athlete: WizardAthlete | undefined) {
  return {
    running: athlete?.hasVma ? ("pace" as const) : ("hr" as const),
    strength: athlete?.hasLinkedMaxes ? ("pct" as const) : ("kg" as const),
  };
}

// Début proposé pour ce sportif (revue MVP du 13/11, B8) : le prochain lundi, ou le lundi qui suit son
// dernier programme publié, pour ne pas le chevaucher.
export function freeStart(athlete: WizardAthlete | undefined, fallback: string): string {
  return firstFreeMonday(
    (athlete?.programs ?? []).filter((program) => program.status === "published"),
    fallback,
  );
}

// Les semaines se lisent du lundi au dimanche (C-9) : une date choisie revient au lundi de sa semaine.
export function mondayOf(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

// Le programme créé en direct depuis un modèle : TOUT vient du modèle (discipline, durée, rythme, et
// ses phases, que le serveur reprend quand on n'en donne pas), sauf la façon de viser et la catégorie
// Hyrox, qui suivent le sportif. Les séances se placent « dans l'ordre » ; le coach fixe les jours
// ensuite dans l'éditeur s'il le veut.
export function templateUseInput({
  template,
  athlete,
  title,
  startDate,
}: {
  template: WizardTemplate;
  athlete: WizardAthlete;
  title: string;
  startDate: string;
}): CreateProgramInput {
  const perWeek = template.sessionsPerWeek ?? athlete.sessionsPerWeek ?? 4;
  return {
    athleteId: athlete.id,
    title: title.trim(),
    discipline: template.discipline,
    ...(template.discipline === "hyrox" && athlete.defaultDivision
      ? { goal: { hyroxDivision: athlete.defaultDivision } }
      : {}),
    aimDefaults: aimFor(athlete),
    startDate,
    weeksCount: template.weeksCount,
    sessionsPerWeek: Math.min(Math.max(perWeek, 1), MAX_SESSIONS_PER_WEEK),
    phases: [],
    scheduling: "ordered",
    start: { kind: "template", templateId: template.id },
  };
}
