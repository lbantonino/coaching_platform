import { decimalClock } from "./clock-input";
import { formatPace } from "./pace";
import { localId } from "./local-id";
import {
  SESSION_ITEMS_MAX,
  type RunMeasure,
  type RunRepeat,
  type RunStep,
  type RunningContent,
} from "./session-v2";
import { formatMeters, formatMinutes } from "./session-view";

// Éditeur de séance Running (04, RUN-01 à 03, D-157) : règles PURES, testées par Vitest. L'éditeur
// les appelle à chaque modification ; le contenu reste valide pour runningContentSchema.

export type RunItem = RunningContent["items"][number];

export const RUN_ROLE_LABELS: Record<RunStep["role"], string> = {
  warmup: "Échauffement",
  run: "Course",
  recovery: "Récupération",
  rest: "Repos",
  cooldown: "Retour au calme",
};

// Types de séance proposés (spécification 04) ; une valeur reprise d'ailleurs reste choisie.
export const RUN_SESSION_TYPES = [
  "Endurance",
  "Fractionné",
  "Sortie longue",
  "Tempo",
  "Récupération",
] as const;

// ---------------------------------------------------------------------------
// Saisie
// ---------------------------------------------------------------------------
// « 2:00 » -> 120 ; « 45 » -> 2700 (minutes) ; « 1:15:00 » -> 4500 ; « 90 s » -> 90.
export function parseDuration(input: string): number | null {
  // « 2,30 » ou « 1,5 » au pavé décimal du téléphone (clock-input.ts).
  const value = decimalClock(input.trim().replace(/\s*min$/i, ""));
  if (!value) return null;
  const seconds = /^(\d{1,4})\s*s$/i.exec(value);
  if (seconds) return Number(seconds[1]) || null;
  const parts = value.split(":");
  if (parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
  const numbers = parts.map(Number);
  let total: number;
  if (numbers.length === 1) total = (numbers[0] ?? 0) * 60;
  else if (numbers.length === 2) {
    if ((numbers[1] ?? 0) >= 60) return null;
    total = (numbers[0] ?? 0) * 60 + (numbers[1] ?? 0);
  } else {
    if ((numbers[1] ?? 0) >= 60 || (numbers[2] ?? 0) >= 60) return null;
    total = (numbers[0] ?? 0) * 3600 + (numbers[1] ?? 0) * 60 + (numbers[2] ?? 0);
  }
  return total >= 1 && total <= 36_000 ? total : null;
}

// Valeur du champ « Mesure » : « 2:00 », « 80:00 » ; toujours en minutes (jamais d'heures en Running).
export function durationField(seconds: number): { value: string; unit: string } {
  const minutes = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");
  return { value: `${minutes}:${ss}`, unit: "min" };
}

// « 800 » ou « 800 m » -> 800 ; « 1,5 », « 1.5 km », « 10 » (moins de 100 : des km) -> mètres.
export function parseDistance(input: string): number | null {
  const value = input.trim().toLowerCase().replace(",", ".");
  const match = /^(\d+(?:\.\d+)?)\s*(km|m)?$/.exec(value);
  if (!match) return null;
  const number = Number(match[1]);
  const km = match[2] === "km" || (match[2] !== "m" && (number < 100 || value.includes(".")));
  const meters = Math.round(km ? number * 1000 : number);
  return meters >= 10 && meters <= 100_000 ? meters : null;
}

export function distanceField(meters: number): { value: string; unit: string } {
  return meters >= 1000
    ? { value: String(Math.round(meters / 10) / 100).replace(".", ","), unit: "km" }
    : { value: String(meters), unit: "m" };
}

// ---------------------------------------------------------------------------
// Lecture : ligne d'une étape, résumé écrit, totaux
// ---------------------------------------------------------------------------
export function measureText(measure: RunMeasure): string {
  switch (measure.type) {
    case "time":
      return formatMinutes(measure.seconds);
    case "distance":
      return formatMeters(measure.meters);
    case "open":
      return "Libre";
  }
}

export function targetText(step: RunStep): string | null {
  if (!step.target) return null;
  if (step.target.kind === "pace") {
    const { fromSecPerKm: from, toSecPerKm: to } = step.target;
    return `${from === to ? formatPace(from) : `${formatPace(from)} – ${formatPace(to)}`} min/km`;
  }
  const bpm =
    step.target.bpmFrom !== undefined ? ` · ${step.target.bpmFrom}–${step.target.bpmTo} bpm` : "";
  return `Zone ${step.target.zone}${bpm}`;
}

// Ligne de la liste : « 6:15 min/km · allure progressive », « Trot · sans cible ».
export function stepDetail(step: RunStep): string {
  const target = targetText(step);
  return target
    ? [target, step.note].filter(Boolean).join(" · ")
    : [step.note, "sans cible"].filter(Boolean).join(" · ");
}

export const stepTitle = (step: RunStep) => step.label ?? RUN_ROLE_LABELS[step.role];

// Renommer une étape (D-179) : le nom écrit remplace celui du type ; vidé, ou identique au type,
// l'étape reprend le nom de son type (et le suit s'il change). 60 caractères au plus (schéma).
export function renameStep(step: RunStep, text: string): RunStep {
  const name = text.trim().slice(0, 60);
  const rest = { ...step };
  delete rest.label;
  return name && name !== RUN_ROLE_LABELS[step.role] ? { ...rest, label: name } : rest;
}

// « 15 min + 5 × (2 min + 2 min) + 10 min » (Aperçu en direct, sans graphique).
export function runningSummary(content: RunningContent): string {
  return content.items
    .map((item) => {
      if (item.kind === "step") return measureText(item.measure);
      if (item.kind === "repeat") {
        const inner = item.steps.map((step) => measureText(step.measure));
        return `${item.times} × ${inner.length > 1 ? `(${inner.join(" + ")})` : inner[0]}`;
      }
      return item.title;
    })
    .join(" + ");
}

// Durée d'une étape en secondes : durée écrite, ou distance à l'allure visée ; null si on ne sait pas.
function stepSeconds(step: RunStep): number | null {
  if (step.measure.type === "time") return step.measure.seconds;
  if (step.measure.type === "distance" && step.target?.kind === "pace") {
    const pace = (step.target.fromSecPerKm + step.target.toSecPerKm) / 2;
    return Math.round((step.measure.meters / 1000) * pace);
  }
  return null;
}

// Durée estimée de la séance (secondes connues) ; « fois · 20 min » pour un bloc Répéter.
export function repeatSeconds(repeat: RunRepeat): number | null {
  let total = 0;
  for (const step of repeat.steps) {
    const seconds = stepSeconds(step);
    if (seconds === null) return null;
    total += seconds;
  }
  return total * repeat.times;
}

export function runningSeconds(content: RunningContent): number {
  let total = 0;
  for (const item of content.items) {
    if (item.kind === "step") total += stepSeconds(item) ?? 0;
    else if (item.kind === "repeat")
      item.steps.forEach((step) => (total += (stepSeconds(step) ?? 0) * item.times));
  }
  return total;
}

// « 3 blocs · 12 étapes au total » (un bloc Répéter compte toutes ses répétitions).
export function runningCounts(content: RunningContent): { blocks: number; steps: number } {
  const steps = content.items.reduce(
    (count, item) =>
      count +
      (item.kind === "repeat" ? item.steps.length * item.times : item.kind === "step" ? 1 : 0),
    0,
  );
  return { blocks: content.items.length, steps };
}

// Durée à enregistrer dans la séance : celle des étapes, arrondie, entre 5 et 600 min.
export function estimatedMinutes(content: RunningContent, fallback: number): number {
  const seconds = runningSeconds(content);
  if (seconds <= 0) return fallback;
  return Math.min(600, Math.max(5, Math.round(seconds / 60)));
}

// ---------------------------------------------------------------------------
// Modifications (chaque fonction renvoie un nouveau contenu)
// ---------------------------------------------------------------------------
function itemIds(content: RunningContent): Set<string> {
  const ids = new Set<string>();
  for (const item of content.items) {
    ids.add(item.id);
    if (item.kind === "repeat") item.steps.forEach((step) => ids.add(step.id));
  }
  return ids;
}

export function newStep(content: RunningContent, role: RunStep["role"] = "run"): RunStep {
  return {
    id: localId("e", itemIds(content)),
    kind: "step",
    role,
    measure: { type: "time", seconds: role === "warmup" || role === "cooldown" ? 600 : 300 },
  };
}

export function addStep(
  content: RunningContent,
  repeatId?: string,
): { content: RunningContent; id: string } {
  if (repeatId) {
    const step = newStep(content, "recovery");
    return {
      id: step.id,
      content: {
        ...content,
        items: content.items.map((item) =>
          item.kind === "repeat" && item.id === repeatId && item.steps.length < 10
            ? {
                ...item,
                steps: [...item.steps, { ...step, measure: { type: "time", seconds: 60 } }],
              }
            : item,
        ),
      },
    };
  }
  const step = newStep(content);
  if (content.items.length >= SESSION_ITEMS_MAX) return { id: step.id, content };
  return { id: step.id, content: { ...content, items: [...content.items, step] } };
}

// « Ajouter « Répéter » » : 4 fois (1 min de course + 1 min de récupération), à modifier ensuite.
export function addRepeat(content: RunningContent): { content: RunningContent; id: string } {
  const taken = itemIds(content);
  const id = localId("r", taken);
  taken.add(id);
  const run = localId("e", taken);
  taken.add(run);
  const recovery = localId("e", taken);
  const repeat: RunRepeat = {
    id,
    kind: "repeat",
    times: 4,
    steps: [
      { id: run, kind: "step", role: "run", measure: { type: "time", seconds: 60 } },
      { id: recovery, kind: "step", role: "recovery", measure: { type: "time", seconds: 60 } },
    ],
  };
  if (content.items.length >= SESSION_ITEMS_MAX) return { id: run, content };
  return { id: run, content: { ...content, items: [...content.items, repeat] } };
}

export function findStep(
  content: RunningContent,
  id: string,
): { step: RunStep; repeat: RunRepeat | null; index: number } | null {
  for (const [index, item] of content.items.entries()) {
    if (item.kind === "step" && item.id === id) return { step: item, repeat: null, index };
    if (item.kind === "repeat") {
      const at = item.steps.findIndex((step) => step.id === id);
      const step = item.steps[at];
      if (step) return { step, repeat: item, index: at };
    }
  }
  return null;
}

export function replaceStep(content: RunningContent, step: RunStep): RunningContent {
  return {
    ...content,
    items: content.items.map((item) =>
      item.kind === "step" && item.id === step.id
        ? step
        : item.kind === "repeat"
          ? { ...item, steps: item.steps.map((child) => (child.id === step.id ? step : child)) }
          : item,
    ),
  };
}

// Retirer une étape ; un bloc Répéter vidé disparaît ; la séance garde au moins un élément.
export function removeStep(content: RunningContent, id: string): RunningContent {
  const items = content.items.flatMap((item): RunItem[] => {
    if (item.kind === "step") return item.id === id ? [] : [item];
    if (item.kind === "repeat") {
      const steps = item.steps.filter((step) => step.id !== id);
      return steps.length === 0 ? [] : [{ ...item, steps }];
    }
    return [item];
  });
  return items.length > 0 ? { ...content, items } : content;
}

export function removeItem(content: RunningContent, id: string): RunningContent {
  const items = content.items.filter((item) => item.id !== id);
  return items.length > 0 ? { ...content, items } : content;
}

export function setRepeatTimes(content: RunningContent, id: string, times: number): RunningContent {
  const value = Math.min(50, Math.max(2, Math.round(times)));
  return {
    ...content,
    items: content.items.map((item) =>
      item.kind === "repeat" && item.id === id ? { ...item, times: value } : item,
    ),
  };
}

// Dupliquer un bloc (ou une étape) juste après lui, avec de nouveaux identifiants.
export function duplicateItem(content: RunningContent, id: string): RunningContent {
  const taken = itemIds(content);
  const fresh = (prefix: string) => {
    const next = localId(prefix, taken);
    taken.add(next);
    return next;
  };
  const items = content.items.flatMap((item): RunItem[] => {
    if (item.id !== id) return [item];
    const copy: RunItem =
      item.kind === "repeat"
        ? {
            ...item,
            id: fresh("r"),
            steps: item.steps.map((step) => ({ ...step, id: fresh("e") })),
          }
        : { ...item, id: fresh(item.kind === "step" ? "e" : "t") };
    return [item, copy];
  });
  return items.length <= 40 ? { ...content, items } : content;
}

const move = <T>(list: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
};

// Changer l'ordre (poignée glissée ou flèches du clavier) : dans la séance, ou dans un bloc.
export function moveItem(
  content: RunningContent,
  from: number,
  to: number,
  repeatId?: string,
): RunningContent {
  if (!repeatId) return { ...content, items: move(content.items, from, to) };
  return {
    ...content,
    items: content.items.map((item) =>
      item.kind === "repeat" && item.id === repeatId
        ? { ...item, steps: move(item.steps, from, to) }
        : item,
    ),
  };
}
