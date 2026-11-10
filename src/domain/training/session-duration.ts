import { lineSeconds } from "./hyrox-edit";
import { runningSeconds } from "./running-edit";
import type {
  HyroxBlock,
  HyroxLine,
  HyroxStation,
  SessionBody,
  SessionContent,
  StrengthContent,
  StrengthExercise,
} from "./session-v2";

// Durée estimée d'une séance (décision d'Antonino du 10/11/2026, phase 4) : calculée d'après le
// contenu dans les trois disciplines, comme le Running le faisait déjà, et corrigeable par le coach
// (`durationManual`). Ce n'est qu'une estimation pour l'agenda, les cartes et les PDF (« ≈ 50 min ») :
// les repères ci-dessous sont volontairement simples et écrits ici pour pouvoir les discuter.

// Musculation : environ 4 s par répétition (une série entre 15 s et 90 s), 90 s de repos par défaut,
// 1 min pour passer d'un exercice ou d'un groupe au suivant, 10 min d'échauffement et 5 min de retour
// au calme quand ils sont écrits, 5 min pour un bloc de texte.
const SECONDS_PER_REP = 4;
const DEFAULT_REST = 90;
const CHANGEOVER = 60;
const WARMUP = 600;
const COOLDOWN = 300;
const TEXT_BLOCK = 300;

// Hyrox : temps de course de référence d'une station (format officiel, sportif moyen), ramené à la
// distance ou aux répétitions de la ligne. Course sans allure : 6:00/km ; ergomètre sans allure :
// 2:15/500 m ; exercice libre : 3 s par répétition (1 min sans répétitions).
const STATION_REFERENCE: Record<HyroxStation, { amount: number; seconds: number }> = {
  skierg: { amount: 1000, seconds: 270 },
  sled_push: { amount: 50, seconds: 180 },
  sled_pull: { amount: 50, seconds: 240 },
  burpee_broad_jumps: { amount: 80, seconds: 270 },
  rowing: { amount: 1000, seconds: 285 },
  farmers_carry: { amount: 200, seconds: 120 },
  sandbag_lunges: { amount: 100, seconds: 270 },
  wall_balls: { amount: 100, seconds: 360 },
};
const RUN_PACE = 360;
const ERG_PACE_500 = 135;

const setSeconds = (set: StrengthExercise["sets"][number]) =>
  Math.min(90, Math.max(15, ((set.repsMin + (set.repsMax ?? set.repsMin)) / 2) * SECONDS_PER_REP));

function exerciseSeconds(exercise: StrengthExercise): number {
  const work = exercise.sets.reduce((sum, set) => sum + setSeconds(set), 0);
  const rests = (exercise.sets.length - 1) * (exercise.restSec ?? DEFAULT_REST);
  return work + rests + CHANGEOVER;
}

function strengthSeconds(content: StrengthContent): number {
  let total = (content.warmup ? WARMUP : 0) + (content.cooldown ? COOLDOWN : 0);
  for (const item of content.items) {
    switch (item.kind) {
      case "exercise":
        total += exerciseSeconds(item);
        break;
      case "superset": {
        // Un tour : une série de chaque exercice, puis le repos (pas après le dernier tour).
        const round = item.exercises.reduce(
          (sum, exercise) => sum + (exercise.sets[0] ? setSeconds(exercise.sets[0]) : 0),
          0,
        );
        total +=
          item.rounds * round + (item.rounds - 1) * (item.restSec ?? DEFAULT_REST) + CHANGEOVER;
        break;
      }
      case "emom":
        total += item.minutes * 60 + CHANGEOVER;
        break;
      case "text":
        total += TEXT_BLOCK;
        break;
    }
  }
  return total;
}

function hyroxLineSeconds(line: HyroxLine): number {
  const known = lineSeconds(line);
  if (known !== null) return known;
  switch (line.kind) {
    case "run":
      return Math.round((line.meters / 1000) * RUN_PACE);
    case "station": {
      const reference = STATION_REFERENCE[line.station];
      const amount = line.meters ?? line.reps;
      return Math.round(
        amount ? (amount * reference.seconds) / reference.amount : reference.seconds,
      );
    }
    case "erg":
      return Math.round(((line.meters ?? 1000) / 500) * ERG_PACE_500);
    case "exercise":
      return line.reps ? line.reps * 3 : 60;
    case "transition":
      return line.seconds;
  }
}

function blockSeconds(block: HyroxBlock): number {
  const lines = block.lines.reduce((sum, line) => sum + hyroxLineSeconds(line), 0);
  const rounds = block.rounds ?? 1;
  const repeated = rounds * lines + (rounds - 1) * (block.restSec ?? 0);
  switch (block.format) {
    case "simple":
    case "simulation":
      return lines;
    case "circuit":
      return repeated;
    case "amrap":
      return block.timeCapSec ?? lines * (block.targetRounds ?? 1);
    case "emom":
      return block.timeCapSec ?? repeated;
    case "for_time":
    case "intervals": {
      const planned = block.targetSec ?? repeated;
      return block.timeCapSec ? Math.min(planned, block.timeCapSec) : planned;
    }
  }
}

// Secondes estimées d'après le contenu ; null quand on ne sait pas (séance hybride en texte, ou
// Running sans aucune durée connue).
export function estimatedSessionSeconds(content: SessionContent): number | null {
  switch (content.discipline) {
    case "running": {
      const seconds = runningSeconds(content);
      return seconds > 0 ? seconds : null;
    }
    case "strength":
      return strengthSeconds(content);
    case "hyrox":
      return content.items.reduce(
        (sum, item) => sum + (item.kind === "block" ? blockSeconds(item) : TEXT_BLOCK),
        0,
      );
    case "hybrid":
      return null;
  }
}

// La séance avec sa durée recalculée (en minutes, entre 5 et 600), sauf si le coach l'a corrigée.
export function withEstimatedDuration<T extends SessionBody & { durationManual?: boolean }>(
  session: T,
): T {
  if (session.durationManual) return session;
  const seconds = estimatedSessionSeconds(session.content);
  if (seconds === null) return session;
  const minutes = Math.min(600, Math.max(5, Math.round(seconds / 60)));
  return minutes === session.durationMinutes ? session : { ...session, durationMinutes: minutes };
}
