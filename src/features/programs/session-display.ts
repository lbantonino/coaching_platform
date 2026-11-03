import type { ProgramSessionContent, ProgramSessionStep } from "@/domain/training/program-session";

// Lecture, pour l'affichage, d'une séance de programme écrite en texte (D-46, tranche 1) : durées,
// allures et récupérations de ses lignes, pour la page d'une séance (maquette « Sportifs » du
// 03/11/2026, page 2d). L'éditeur de programmes (P4) enregistrera ces valeurs directement ; d'ici
// là, une ligne qui n'est pas comprise s'affiche telle quelle, et le déroulé n'est dessiné que si
// la durée de chaque étape est connue. Fonctions pures, testées par Vitest.

export type SegmentKind = "effort" | "recovery";

// Une ligne d'un bloc répété : « Effort · 4:55 min/km · 4 min ».
export type Segment = {
  kind: SegmentKind;
  label: string;
  detail: string | null;
  // Ce qui s'écrit à droite : « 4 min », « 1 km », « 10 ».
  value: string | null;
  // Durée en minutes, si on la connaît (déduite de l'allure pour une distance).
  minutes: number | null;
};

const PACE = String.raw`(\d{1,2}:[0-5]\d)\s*min\/km`;

// « 20 min », « 1:45 min », « 1 h », « 1 h 20 » → minutes ; null sinon.
export function parseMinutes(text: string): number | null {
  const value = text.trim();
  const hours = /^(\d+)\s*h(?:\s*([0-5]?\d))?$/.exec(value);
  if (hours) return Number(hours[1]) * 60 + Number(hours[2] ?? 0);
  const minutes = /^(\d+)(?::([0-5]\d))?\s*min$/.exec(value);
  if (!minutes) return null;
  return Number(minutes[1]) + Number(minutes[2] ?? 0) / 60;
}

const paceMinutes = (pace: string) => {
  const [minutes, seconds] = pace.split(":").map(Number);
  return minutes + seconds / 60;
};
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const isRecoveryLine = (line: string) => /récup|repos|marche|retour en/i.test(line);

export function parseSegment(line: string): Segment {
  const text = line.trim();
  // « 4 min @4:55 min/km » : un effort en durée.
  let match = new RegExp(String.raw`^(\d+(?::[0-5]\d)?)\s*min\s*@\s*${PACE}$`, "i").exec(text);
  if (match) {
    const value = `${match[1]} min`;
    return {
      kind: "effort",
      label: "Effort",
      detail: `${match[2]} min/km`,
      value,
      minutes: parseMinutes(value),
    };
  }
  // « 1 km @5:15 min/km », « Run 1 km @5:15 min/km » : un effort en distance.
  match = new RegExp(
    String.raw`^(?:(\D+?)\s+)?(\d+(?:[.,]\d+)?)\s*(km|m)\s*@\s*${PACE}$`,
    "i",
  ).exec(text);
  if (match) {
    const distance = Number(match[2].replace(",", "."));
    const kilometres = match[3].toLowerCase() === "m" ? distance / 1000 : distance;
    return {
      kind: "effort",
      label: match[1] ? capitalize(match[1]) : "Effort",
      detail: `${match[4]} min/km`,
      value: `${match[2]} ${match[3]}`,
      minutes: kilometres * paceMinutes(match[4]),
    };
  }
  // « 1:45 min de récupération (trot lent) ».
  match = /^(\d+(?::[0-5]\d)?)\s*min\s+de\s+récupération(?:\s*\((.+)\))?$/i.exec(text);
  if (match) {
    const value = `${match[1]} min`;
    return {
      kind: "recovery",
      label: "Récupération",
      detail: match[2] ? capitalize(match[2]) : null,
      value,
      minutes: parseMinutes(value),
    };
  }
  // « Goblet squat · 10 » : un exercice et sa quantité.
  match = /^(.+?)\s+·\s+(.+)$/.exec(text);
  if (match) {
    return {
      kind: isRecoveryLine(text) ? "recovery" : "effort",
      label: match[1],
      detail: null,
      value: match[2],
      minutes: null,
    };
  }
  return {
    kind: isRecoveryLine(text) ? "recovery" : "effort",
    label: text,
    detail: null,
    value: null,
    minutes: null,
  };
}

export type StepRole = "warmup" | "cooldown" | "main";

export function stepRole(step: ProgramSessionStep): StepRole {
  const title = step.title.toLowerCase();
  if (title.startsWith("échauffement")) return "warmup";
  if (title.startsWith("retour au calme")) return "cooldown";
  return "main";
}

// Durée d'une étape : répétitions × lignes pour un bloc répété, sinon sa pastille (« 20 min »).
export function stepMinutes(step: ProgramSessionStep): number | null {
  if (step.repeat) {
    const segments = step.repeat.lines.map(parseSegment);
    if (segments.some((segment) => segment.minutes === null)) return null;
    return step.repeat.times * segments.reduce((sum, segment) => sum + (segment.minutes ?? 0), 0);
  }
  return step.badge ? parseMinutes(step.badge) : null;
}

// Ligne d'une étape sans la durée déjà écrite à droite :
// « 20 min @6:00 min/km, allure progressive » → « À 6:00 min/km, allure progressive ».
export function stepLine(line: string, badge?: string): string {
  if (!badge) return line;
  const escaped = badge.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefix = new RegExp(String.raw`^${escaped}\s*@\s*`);
  return prefix.test(line) ? line.replace(prefix, "À ") : line;
}

export type TimelineBar = { kind: SegmentKind; minutes: number };

export type TimelineStep = {
  index: number;
  step: ProgramSessionStep;
  role: StepRole;
  minutes: number;
  // Barres d'un bloc répété (la dernière récupération, juste avant la suite, n'est pas dessinée).
  bars: TimelineBar[];
  // Récupération du bloc répété, pour la légende sous la barre : « Récup. 1:45 ».
  recovery: string | null;
};

export type Timeline = {
  totalMinutes: number;
  steps: TimelineStep[];
  // Légende : allure des efforts (« 4:55/km »), « » pour un effort sans allure, null s'il n'y en a
  // pas ; de même pour la récupération (« trot »).
  effort: string | null;
  recovery: string | null;
  easy: boolean;
};

// Déroulé de la séance : chaque étape à la largeur de sa durée. null si une durée manque.
export function sessionTimeline(session: ProgramSessionContent): Timeline | null {
  const steps: TimelineStep[] = [];
  let effort: string | null = null;
  let recovery: string | null = null;
  for (const [i, step] of session.steps.entries()) {
    const minutes = stepMinutes(step);
    if (minutes === null) return null;
    const bars: TimelineBar[] = [];
    let recoveryValue: string | null = null;
    if (step.repeat) {
      const segments = step.repeat.lines.map(parseSegment);
      for (let time = 0; time < step.repeat.times; time++) {
        for (const segment of segments) {
          bars.push({ kind: segment.kind, minutes: segment.minutes ?? 0 });
        }
      }
      while (bars.length > 1 && bars[bars.length - 1].kind === "recovery") bars.pop();
      const firstEffort = segments.find((segment) => segment.kind === "effort" && segment.detail);
      const firstRecovery = segments.find((segment) => segment.kind === "recovery");
      effort ??= firstEffort?.detail?.replace(" min/km", "/km") ?? null;
      if (firstRecovery) {
        recovery ??= firstRecovery.detail ? firstRecovery.detail.split(" ")[0].toLowerCase() : "";
        recoveryValue = firstRecovery.value?.includes(":")
          ? firstRecovery.value.replace(/\s*min$/, "")
          : firstRecovery.value;
      }
    }
    // Une étape principale sans répétitions (« Full body A · 45 min ») : un effort d'un seul bloc.
    if (!step.repeat && stepRole(step) === "main") effort ??= "";
    steps.push({
      index: i + 1,
      step,
      role: stepRole(step),
      minutes,
      bars,
      recovery: recoveryValue,
    });
  }
  return {
    totalMinutes: steps.reduce((sum, step) => sum + step.minutes, 0),
    steps,
    effort,
    recovery,
    easy: steps.some((step) => step.role !== "main"),
  };
}
