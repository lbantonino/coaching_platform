import {
  HYROX_RUN_METERS,
  HYROX_STATION_RULES,
  hyroxStationLabels,
  officialLoadKg,
  type AthleteSex,
} from "./hyrox-official";
import { formatPace } from "./pace";
import { localId } from "./plan-edit";
import type { HyroxDivision } from "./program-plan";
import {
  HYROX_STATIONS,
  type HyroxBlock,
  type HyroxContent,
  type HyroxLine,
  type HyroxStation,
} from "./session-v2";
import { formatClock, formatMeters, formatSeconds } from "./session-view";

// Éditeur de séance Hyrox (06, HYR-01 à 03, D-157) : règles PURES, testées par Vitest. Course en
// min/km, ergomètres en min/500 m, jamais mélangés (BR-16) ; charges du coach ou officielles de la
// division du sportif, choisies pour tout un bloc (BR-15), corrigeables ligne par ligne.

export type HyroxItem = HyroxContent["items"][number];

export const HYROX_SESSION_TYPES = ["Circuit", "Simulation", "Force", "Ergomètres"] as const;

export const HYROX_FORMAT_LABELS: Record<HyroxBlock["format"], string> = {
  simple: "Bloc simple",
  circuit: "Circuit",
  for_time: "For time",
  amrap: "AMRAP",
  emom: "EMOM",
  intervals: "Intervalles",
  simulation: "Simulation",
};

const ERG_LABELS = { skierg: "SkiErg", rowing: "Rameur", bike: "Bike" } as const;
const ERG_STATIONS: readonly HyroxStation[] = ["skierg", "rowing"];
export const isErgStation = (station: HyroxStation) => ERG_STATIONS.includes(station);

const kg = (value: number) => `${String(value).replace(".", ",")} kg`;
// Stations : « 1,5 km » ou « 25 m » ; runs et ergomètres en mètres comme la maquette (« 1 000 m »).
const meters = (value: number) =>
  value >= 1000 && value % 1000 !== 0 ? `${value.toLocaleString("fr-BE")} m` : formatMeters(value);
const ergMeters = (value: number) => `${value.toLocaleString("fr-BE")} m`;

// ---------------------------------------------------------------------------
// Lecture d'une ligne : titre, détail, valeur à droite
// ---------------------------------------------------------------------------
export function lineTitle(line: HyroxLine): string {
  switch (line.kind) {
    case "run":
      return "Run";
    case "station":
      return hyroxStationLabels[line.station];
    case "erg":
      return ERG_LABELS[line.machine];
    case "transition":
      return "Transition";
    case "exercise":
      return line.name;
  }
}

export function lineDetail(line: HyroxLine): string {
  switch (line.kind) {
    case "run":
      return [
        ergMeters(line.meters),
        line.paceSecPerKm ? `${formatPace(line.paceSecPerKm)} min/km` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    case "station": {
      const amount =
        line.meters !== undefined
          ? isErgStation(line.station)
            ? ergMeters(line.meters)
            : meters(line.meters)
          : line.reps !== undefined
            ? `${line.reps} répétitions`
            : null;
      const load =
        line.loadKg !== undefined
          ? line.station === "farmers_carry"
            ? `2 × ${kg(line.loadKg)}`
            : kg(line.loadKg)
          : null;
      const pace = line.pacePer500m ? `${formatPace(line.pacePer500m)} /500 m` : null;
      return [amount, load, pace, "station"].filter(Boolean).join(" · ");
    }
    case "erg":
      return [
        line.meters !== undefined
          ? ergMeters(line.meters)
          : line.seconds
            ? formatSeconds(line.seconds)
            : null,
        line.pacePer500m ? `${formatPace(line.pacePer500m)} /500 m` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    case "transition":
      return "Entre deux parties";
    case "exercise":
      return [
        line.reps !== undefined
          ? `${line.reps} répétitions`
          : line.meters !== undefined
            ? meters(line.meters)
            : null,
        line.loadKg !== undefined ? kg(line.loadKg) : null,
      ]
        .filter(Boolean)
        .join(" · ");
  }
}

// Durée d'une ligne en secondes : temps cible, sinon distance à l'allure ; null si on ne sait pas.
export function lineSeconds(line: HyroxLine): number | null {
  if (line.kind === "transition") return line.seconds;
  if ("targetSec" in line && line.targetSec) return line.targetSec;
  if (line.kind === "run" && line.paceSecPerKm)
    return Math.round((line.meters / 1000) * line.paceSecPerKm);
  if ((line.kind === "erg" || line.kind === "station") && line.pacePer500m && line.meters)
    return Math.round((line.meters / 500) * line.pacePer500m);
  if (line.kind === "erg" && line.seconds) return line.seconds;
  return null;
}

// À droite de la ligne : « ≈ 3:30 » (estimé), « 4:20 » (temps cible), « 30 s ».
export function lineRight(line: HyroxLine): string {
  if (line.kind === "transition") return formatSeconds(line.seconds);
  if ("targetSec" in line && line.targetSec) return formatClock(line.targetSec);
  const seconds = lineSeconds(line);
  if (!seconds) return "";
  return seconds % 60 === 0 && seconds >= 60
    ? `≈ ${formatSeconds(seconds)}`
    : `≈ ${formatClock(seconds)}`;
}

// Station et exercice : vignette ; run, ergomètre et transition : barre de couleur.
export const lineHasThumb = (line: HyroxLine) =>
  line.kind === "station" || line.kind === "exercise";

// ---------------------------------------------------------------------------
// Lecture d'un bloc et de la séance
// ---------------------------------------------------------------------------
const minutes = (seconds: number) =>
  seconds % 60 === 0 ? `${seconds / 60} min` : formatClock(seconds);

// En-tête du bloc : « Échauffement », « Circuit », « AMRAP 25 min », « Simulation de course ».
export function blockLabel(block: HyroxBlock): string {
  if (block.title) return block.title;
  if (block.format === "amrap" && block.timeCapSec) return `AMRAP ${minutes(block.timeCapSec)}`;
  if (block.format === "emom" && block.timeCapSec) return `EMOM ${minutes(block.timeCapSec)}`;
  if (block.format === "simulation") return "Simulation de course";
  return HYROX_FORMAT_LABELS[block.format];
}

// Ligne du bloc après le libellé : « tours · repos 1 min », « cible 4 tours », « Run ».
export function blockMeta(block: HyroxBlock): string {
  switch (block.format) {
    case "circuit":
      return ["tours", block.restSec ? `repos ${minutes(block.restSec)}` : null]
        .filter(Boolean)
        .join(" · ");
    case "amrap":
      return block.targetRounds ? `cible ${block.targetRounds} tours` : "le plus de tours possible";
    case "simulation": {
      const runs = block.lines.filter((line) => line.kind === "run").length;
      const stations = block.lines.filter((line) => line.kind !== "run").length;
      const total = block.lines.reduce((sum, line) => sum + (lineSeconds(line) ?? 0), 0);
      return [`${runs} runs + ${stations} stations`, total ? `cible ${formatClock(total)}` : null]
        .filter(Boolean)
        .join(" · ");
    }
    case "for_time":
    case "intervals":
    case "emom":
      return [
        block.rounds && block.rounds > 1 ? `${block.rounds} tours` : null,
        block.targetSec ? `cible ${formatClock(block.targetSec)}` : null,
        block.timeCapSec && block.format !== "emom"
          ? `limite ${formatClock(block.timeCapSec)}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");
    case "simple": {
      const kinds = [...new Set(block.lines.map(lineTitle))];
      return kinds.length <= 2 ? kinds.join(" + ") : `${block.lines.length} étapes`;
    }
  }
}

// Le stepper des tours (maquette : sur le circuit).
export const blockHasStepper = (block: HyroxBlock) => block.format === "circuit";

// Teinte du bloc : Running quand il ne contient que de la course (échauffement), sinon Hyrox.
export const blockIsRun = (block: HyroxBlock) => block.lines.every((line) => line.kind === "run");

// « Échauffement · 5 tours · AMRAP 25 min ».
export function hyroxSummary(content: HyroxContent): string {
  return content.items
    .map((item) => {
      if (item.kind === "text") return item.title;
      if (item.format === "circuit" && item.rounds && item.rounds > 1)
        return `${item.rounds} tours`;
      return blockLabel(item);
    })
    .join(" · ");
}

export function hyroxCounts(content: HyroxContent): { blocks: number; lines: number } {
  return {
    blocks: content.items.length,
    lines: content.items.reduce(
      (sum, item) => sum + (item.kind === "block" ? item.lines.length : 0),
      0,
    ),
  };
}

// Limite de la séance : la somme des limites de temps des blocs qui en ont une.
export function hyroxTimeCap(content: HyroxContent): number | null {
  const caps = content.items.flatMap((item) =>
    item.kind === "block" && item.timeCapSec ? [item.timeCapSec] : [],
  );
  return caps.length ? caps.reduce((sum, value) => sum + value, 0) : null;
}

// ---------------------------------------------------------------------------
// Charges officielles (BR-15) : un seul choix remplit toutes les stations du bloc.
// ---------------------------------------------------------------------------
export function applyLoads(
  block: HyroxBlock,
  loads: HyroxBlock["loads"],
  division: HyroxDivision | null,
  sex: AthleteSex,
): HyroxBlock {
  return {
    ...block,
    loads,
    lines: block.lines.map((line) => {
      if (line.kind !== "station") return line;
      if (loads === "coach") return { ...line, loadSource: "coach" };
      const official = division ? officialLoadKg(line.station, division, sex) : null;
      const next: HyroxLine = { ...line, loadSource: "official" };
      if (official !== null) next.loadKg = official;
      return next;
    }),
  };
}

// ---------------------------------------------------------------------------
// Modifications
// ---------------------------------------------------------------------------
function ids(content: HyroxContent): Set<string> {
  const taken = new Set<string>();
  for (const item of content.items) {
    taken.add(item.id);
    if (item.kind === "block") item.lines.forEach((line) => taken.add(line.id));
  }
  return taken;
}

export function newLine(
  kind: HyroxLine["kind"],
  id: string,
  loads: HyroxBlock["loads"] = "coach",
): HyroxLine {
  switch (kind) {
    case "run":
      return { id, kind: "run", meters: 1000 };
    case "station":
      return { id, kind: "station", station: "sled_push", meters: 50, loadSource: loads };
    case "erg":
      return { id, kind: "erg", machine: "rowing", meters: 500 };
    case "transition":
      return { id, kind: "transition", seconds: 30 };
    case "exercise":
      return { id, kind: "exercise", name: "Burpees", reps: 10 };
  }
}

// « Ajouter un bloc » : un circuit de 3 tours (run 1 km), à compléter.
export function addBlock(content: HyroxContent): { content: HyroxContent; id: string } {
  const taken = ids(content);
  const id = localId("b", taken);
  taken.add(id);
  const block: HyroxBlock = {
    id,
    kind: "block",
    format: "circuit",
    rounds: 3,
    loads: "coach",
    lines: [newLine("run", localId("l", taken))],
  };
  return content.items.length >= 20
    ? { content, id }
    : { id, content: { ...content, items: [...content.items, block] } };
}

export function addLine(
  content: HyroxContent,
  blockId: string,
  kind: HyroxLine["kind"] = "station",
): { content: HyroxContent; id: string } {
  const id = localId("l", ids(content));
  return {
    id,
    content: {
      ...content,
      items: content.items.map((item) =>
        item.kind === "block" && item.id === blockId && item.lines.length < 40
          ? { ...item, lines: [...item.lines, newLine(kind, id, item.loads)] }
          : item,
      ),
    },
  };
}

// Simulation de course : 8 runs de 1 km et les 8 stations dans l'ordre officiel, temps cibles
// facultatifs (par partie, dans l'ordre : run 1, station 1, run 2…).
export function simulationBlock(
  taken: Set<string>,
  loads: HyroxBlock["loads"],
  division: HyroxDivision | null,
  sex: AthleteSex,
  targets: (number | undefined)[] = [],
): HyroxBlock {
  const fresh = (prefix: string) => {
    const id = localId(prefix, taken);
    taken.add(id);
    return id;
  };
  const lines: HyroxLine[] = [];
  HYROX_STATIONS.forEach((station, index) => {
    const runTarget = targets[index * 2];
    lines.push({
      id: fresh("l"),
      kind: "run",
      meters: HYROX_RUN_METERS,
      ...(runTarget ? { targetSec: runTarget } : {}),
    });
    const rule = HYROX_STATION_RULES[station];
    const official =
      loads === "official" && division ? officialLoadKg(station, division, sex) : null;
    const stationTarget = targets[index * 2 + 1];
    lines.push({
      id: fresh("l"),
      kind: "station",
      station,
      ...(rule.meters !== undefined ? { meters: rule.meters } : {}),
      ...(rule.reps !== undefined ? { reps: rule.reps } : {}),
      loadSource: loads,
      ...(official !== null ? { loadKg: official } : {}),
      ...(stationTarget ? { targetSec: stationTarget } : {}),
    });
  });
  return { id: fresh("b"), kind: "block", format: "simulation", loads, lines };
}

export function insertSimulation(
  content: HyroxContent,
  loads: HyroxBlock["loads"],
  division: HyroxDivision | null,
  sex: AthleteSex,
  targets: (number | undefined)[] = [],
): { content: HyroxContent; id: string } {
  const block = simulationBlock(ids(content), loads, division, sex, targets);
  return content.items.length >= 20
    ? { content, id: block.id }
    : { id: block.id, content: { ...content, items: [...content.items, block] } };
}

export function findLine(
  content: HyroxContent,
  id: string,
): { line: HyroxLine; block: HyroxBlock; index: number; blockIndex: number } | null {
  for (const [blockIndex, item] of content.items.entries()) {
    if (item.kind !== "block") continue;
    const index = item.lines.findIndex((line) => line.id === id);
    const line = item.lines[index];
    if (line) return { line, block: item, index, blockIndex };
  }
  return null;
}

export function replaceLine(content: HyroxContent, line: HyroxLine): HyroxContent {
  return {
    ...content,
    items: content.items.map((item) =>
      item.kind === "block"
        ? { ...item, lines: item.lines.map((current) => (current.id === line.id ? line : current)) }
        : item,
    ),
  };
}

export function replaceBlock(content: HyroxContent, block: HyroxBlock): HyroxContent {
  return { ...content, items: content.items.map((item) => (item.id === block.id ? block : item)) };
}

// Retirer une ligne ; un bloc vidé disparaît ; la séance garde au moins un élément.
export function removeLine(content: HyroxContent, id: string): HyroxContent {
  const items = content.items.flatMap((item): HyroxItem[] => {
    if (item.kind !== "block") return [item];
    const lines = item.lines.filter((line) => line.id !== id);
    return lines.length === 0 ? [] : [{ ...item, lines }];
  });
  return items.length > 0 ? { ...content, items } : content;
}

export function removeItem(content: HyroxContent, id: string): HyroxContent {
  const items = content.items.filter((item) => item.id !== id);
  return items.length > 0 ? { ...content, items } : content;
}

export function setRounds(content: HyroxContent, id: string, rounds: number): HyroxContent {
  const value = Math.min(50, Math.max(1, Math.round(rounds)));
  return {
    ...content,
    items: content.items.map((item) =>
      item.kind === "block" && item.id === id ? { ...item, rounds: value } : item,
    ),
  };
}

const move = <T>(list: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
};

export function moveItem(
  content: HyroxContent,
  from: number,
  to: number,
  blockId?: string,
): HyroxContent {
  if (!blockId) return { ...content, items: move(content.items, from, to) };
  return {
    ...content,
    items: content.items.map((item) =>
      item.kind === "block" && item.id === blockId
        ? { ...item, lines: move(item.lines, from, to) }
        : item,
    ),
  };
}

// Temps cible et limite : « 5:05 » (mm:ss), « 1:18:20 » (h:mm:ss) ; un nombre seul = des minutes.
export function parseClock(input: string): number | null {
  const value = input.trim();
  if (!value) return null;
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

// Dupliquer un bloc juste après lui, avec de nouveaux identifiants.
export function duplicateItem(content: HyroxContent, id: string): HyroxContent {
  if (content.items.length >= 20) return content;
  const taken = ids(content);
  const fresh = (prefix: string) => {
    const next = localId(prefix, taken);
    taken.add(next);
    return next;
  };
  return {
    ...content,
    items: content.items.flatMap((item): HyroxItem[] => {
      if (item.id !== id) return [item];
      const copy: HyroxItem =
        item.kind === "block"
          ? {
              ...item,
              id: fresh("b"),
              lines: item.lines.map((line) => ({ ...line, id: fresh("l") })),
            }
          : { ...item, id: fresh("t") };
      return [item, copy];
    }),
  };
}
