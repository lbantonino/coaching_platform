import {
  duplicateItem as duplicateHyroxItem,
  removeItem as removeHyroxItem,
  removeLine,
} from "./hyrox-edit";
import { localId } from "./local-id";
import {
  duplicateItem as duplicateRunItem,
  removeItem as removeRunItem,
  removeStep,
} from "./running-edit";
import {
  SESSION_ITEMS_MAX,
  type SessionContent,
  type StrengthContent,
  type StrengthExercise,
} from "./session-v2";
import { removeExercise, removeItem as removeStrengthItem } from "./strength-edit";

// « ⋯ » des cartes de la page du programme (D-187, test sur iPhone du 15/11/2026) : Dupliquer et
// Supprimer une étape par son chemin (session-cards.ts : [id], [id du groupe, id de l'étape],
// « warmup », « cooldown »), avec les MÊMES règles que l'éditeur de séance (un superset qui garde un
// seul exercice redevient un exercice seul, un bloc vidé disparaît, la séance garde au moins un
// élément). Rien ne change (même objet rendu) quand c'est refusé. Règles PURES.

const GROUP_MAX = 6; // exercices d'un superset ou d'un EMOM
const REPEAT_MAX = 10; // étapes d'un « Répéter »
const BLOCK_MAX = 40; // lignes d'un bloc Hyrox

// Tous les identifiants de la séance : une copie en reçoit de nouveaux, uniques dans la séance.
function takenIds(content: SessionContent): Set<string> {
  const ids = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (typeof record.id === "string") ids.add(record.id);
      Object.values(record).forEach(visit);
    }
  };
  visit(content.items);
  return ids;
}

function freshIds(content: SessionContent) {
  const taken = takenIds(content);
  return (prefix: string) => {
    const id = localId(prefix, taken);
    taken.add(id);
    return id;
  };
}

// Insérer une copie juste après l'élément d'identifiant `id`.
function insertAfter<T extends { id: string }>(list: T[], id: string, copy: T): T[] {
  return list.flatMap((item) => (item.id === id ? [item, copy] : [item]));
}

function duplicateStrength(content: StrengthContent, path: string[]): StrengthContent {
  const fresh = freshIds(content);
  const copyExercise = (exercise: StrengthExercise): StrengthExercise => ({
    ...exercise,
    id: fresh("x"),
  });
  const [first, second] = path;
  if (second === undefined) {
    const item = content.items.find((candidate) => candidate.id === first);
    if (!item || content.items.length >= SESSION_ITEMS_MAX) return content;
    const copy =
      item.kind === "superset" || item.kind === "emom"
        ? { ...item, id: fresh("g"), exercises: item.exercises.map(copyExercise) }
        : item.kind === "exercise"
          ? copyExercise(item)
          : { ...item, id: fresh("t") };
    return { ...content, items: insertAfter(content.items, item.id, copy) };
  }
  const group = content.items.find((candidate) => candidate.id === first);
  if (!group || (group.kind !== "superset" && group.kind !== "emom")) return content;
  const exercise = group.exercises.find((candidate) => candidate.id === second);
  if (!exercise || group.exercises.length >= GROUP_MAX) return content;
  const exercises = insertAfter(group.exercises, exercise.id, copyExercise(exercise));
  return {
    ...content,
    items: content.items.map((item) => (item.id === group.id ? { ...group, exercises } : item)),
  };
}

export function duplicateAt(content: SessionContent, path: string[]): SessionContent {
  const [first, second] = path;
  if (first === undefined) return content;
  switch (content.discipline) {
    case "strength":
      return duplicateStrength(content, path);
    case "running": {
      if (second === undefined) return duplicateRunItem(content, first);
      const repeat = content.items.find((item) => item.id === first);
      if (repeat?.kind !== "repeat" || repeat.steps.length >= REPEAT_MAX) return content;
      const step = repeat.steps.find((candidate) => candidate.id === second);
      if (!step) return content;
      const steps = insertAfter(repeat.steps, step.id, { ...step, id: freshIds(content)("e") });
      return {
        ...content,
        items: content.items.map((item) => (item.id === repeat.id ? { ...repeat, steps } : item)),
      };
    }
    case "hyrox": {
      if (second === undefined) return duplicateHyroxItem(content, first);
      const block = content.items.find((item) => item.id === first);
      if (block?.kind !== "block" || block.lines.length >= BLOCK_MAX) return content;
      const line = block.lines.find((candidate) => candidate.id === second);
      if (!line) return content;
      const lines = insertAfter(block.lines, line.id, { ...line, id: freshIds(content)("l") });
      return {
        ...content,
        items: content.items.map((item) => (item.id === block.id ? { ...block, lines } : item)),
      };
    }
    case "hybrid": {
      const block = content.items.find((item) => item.id === first);
      if (second !== undefined || !block || content.items.length >= SESSION_ITEMS_MAX) {
        return content;
      }
      const copy = { ...block, id: freshIds(content)("t") };
      return { ...content, items: insertAfter(content.items, block.id, copy) };
    }
  }
}

// L'étape [groupe, enfant] existe-t-elle vraiment (et pas une ligne d'un bloc texte répété, dont le
// chemin est un rang : « 0 », « 1 ») ? Sinon, rien à faire (relecture : un faux « Étape supprimée »).
function hasChild(content: SessionContent, groupId: string, childId: string): boolean {
  const parent = content.items.find((item) => item.id === groupId);
  if (!parent) return false;
  if (parent.kind === "superset" || parent.kind === "emom")
    return parent.exercises.some((exercise) => exercise.id === childId);
  if (parent.kind === "repeat") return parent.steps.some((step) => step.id === childId);
  if (parent.kind === "block") return parent.lines.some((line) => line.id === childId);
  return false;
}

export function removeAt(content: SessionContent, path: string[]): SessionContent {
  const [first, second] = path;
  if (first === undefined) return content;
  if (second !== undefined && !hasChild(content, first, second)) return content;
  switch (content.discipline) {
    case "strength": {
      if (second === undefined && (first === "warmup" || first === "cooldown")) {
        const { warmup, cooldown, ...rest } = content;
        if (first === "warmup")
          return warmup === undefined ? content : { ...rest, ...(cooldown ? { cooldown } : {}) };
        return cooldown === undefined ? content : { ...rest, ...(warmup ? { warmup } : {}) };
      }
      return second === undefined
        ? removeStrengthItem(content, first)
        : removeExercise(content, second);
    }
    case "running":
      return second === undefined ? removeRunItem(content, first) : removeStep(content, second);
    case "hyrox":
      return second === undefined ? removeHyroxItem(content, first) : removeLine(content, second);
    case "hybrid": {
      if (second !== undefined) return content;
      const items = content.items.filter((item) => item.id !== first);
      return items.length > 0 && items.length < content.items.length
        ? { ...content, items }
        : content;
    }
  }
}

// Le menu ne propose que ce qui changerait vraiment la séance.
export const canDuplicateAt = (content: SessionContent, path: string[]) =>
  duplicateAt(content, path) !== content;
export const canRemoveAt = (content: SessionContent, path: string[]) =>
  removeAt(content, path) !== content;
