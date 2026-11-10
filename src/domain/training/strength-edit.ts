import { kgFromPercent } from "./aims";
import { localId } from "./plan-edit";
import type { StrengthContent, StrengthExercise, StrengthSet } from "./session-v2";
import { formatSeconds } from "./session-view";

// Éditeur de séance Musculation (05, MUS-01 à 03, D-157) : règles PURES, testées par Vitest. Charge
// en kg ou en % du max, au choix pour chaque exercice ; en %, les kg sont calculés depuis le max du
// sportif (arrondis au 0,5 kg) et figés à la publication.

export type StrengthItem = StrengthContent["items"][number];
export type StrengthGroup = Extract<StrengthItem, { kind: "superset" | "emom" }>;

// ---------------------------------------------------------------------------
// Saisie rapide : « 3 séries de 8 à 10 », « 4 x 6 », « 5×5 », « 3 de 12 ».
// ---------------------------------------------------------------------------
export function parseQuickFill(
  input: string,
): { count: number; repsMin: number; repsMax?: number } | null {
  const match =
    /^\s*(\d{1,2})\s*(?:séries?|series?|x|×)?\s*(?:de\s*)?(\d{1,3})(?:\s*(?:à|a|-|–)\s*(\d{1,3}))?\s*(?:rép\w*|reps?)?\s*$/i.exec(
      input,
    );
  if (!match) return null;
  const count = Number(match[1]);
  const repsMin = Number(match[2]);
  const repsMax = match[3] ? Number(match[3]) : undefined;
  if (count < 1 || count > 20 || repsMin < 1 || repsMin > 100) return null;
  if (repsMax !== undefined && (repsMax < repsMin || repsMax > 100)) return null;
  return { count, repsMin, ...(repsMax !== undefined && repsMax !== repsMin ? { repsMax } : {}) };
}

// « Remplir » : les séries d'échauffement restent, les séries normales sont remplacées ; la charge
// et le RIR de la première série normale sont repris.
export function quickFill(
  exercise: StrengthExercise,
  fill: { count: number; repsMin: number; repsMax?: number },
): StrengthExercise {
  const warmups = exercise.sets.filter((set) => set.type === "warmup");
  const model = exercise.sets.find((set) => set.type === "normal");
  const base: StrengthSet = {
    type: "normal",
    repsMin: fill.repsMin,
    ...(fill.repsMax !== undefined ? { repsMax: fill.repsMax } : {}),
    ...(model?.kg !== undefined ? { kg: model.kg } : {}),
    ...(model?.pct !== undefined
      ? { pct: model.pct }
      : exercise.loadMode === "pct"
        ? { pct: 70 }
        : {}),
    ...(model?.rir !== undefined ? { rir: model.rir } : {}),
  };
  return {
    ...exercise,
    sets: [...warmups, ...Array.from({ length: fill.count }, () => ({ ...base }))].slice(0, 20),
  };
}

export const quickFillText = (exercise: StrengthExercise): string => {
  const work = exercise.sets.filter((set) => set.type === "normal");
  const first = work[0];
  if (!first) return "";
  const range =
    first.repsMax !== undefined && first.repsMax !== first.repsMin
      ? `${first.repsMin} à ${first.repsMax}`
      : `${first.repsMin}`;
  return `${work.length} série${work.length > 1 ? "s" : ""} de ${range}`;
};

// ---------------------------------------------------------------------------
// Lecture : résumé d'un exercice, de la séance
// ---------------------------------------------------------------------------
export const repsText = (set: StrengthSet) =>
  set.repsMax !== undefined && set.repsMax !== set.repsMin
    ? `${set.repsMin}–${set.repsMax}`
    : `${set.repsMin}`;

// 60 -> « 60 s » ; 90 -> « 90 s » ; 120 -> « 2 min » ; 150 -> « 2:30 min » (maquette : « repos 90 s »).
export const restText = (seconds: number) =>
  seconds < 120 ? `${seconds} s` : formatSeconds(seconds);

const kgText = (kg: number) => `${String(kg).replace(".", ",")} kg`;

const same = <T>(values: T[]): T | null =>
  values.length > 0 && values.every((value) => value === values[0]) ? (values[0] ?? null) : null;

// « 3 × 8–10 · 14 kg · RIR 2 · repos 90 s » ; « Pyramide 20–15–10–8 · repos 60 s » ;
// dans un superset : « 10 répétitions · RIR 1 ».
export function exerciseSummary(
  exercise: StrengthExercise,
  options: { inGroup?: boolean } = {},
): string {
  const work = exercise.sets.filter((set) => set.type === "normal");
  const sets = work.length > 0 ? work : exercise.sets;
  const reps = same(sets.map(repsText));
  const parts: string[] = [];
  if (options.inGroup) parts.push(reps ? `${reps} répétitions` : sets.map(repsText).join("–"));
  else if (reps) parts.push(`${sets.length} × ${reps}`);
  else parts.push(`Pyramide ${sets.map(repsText).join("–")}`);
  const load =
    exercise.loadMode === "pct"
      ? same(sets.map((set) => (set.pct !== undefined ? `${set.pct} %` : null)))
      : same(sets.map((set) => (set.kg !== undefined && set.kg > 0 ? kgText(set.kg) : null)));
  if (load) parts.push(load);
  const rir = same(sets.map((set) => (set.rir !== undefined ? `RIR ${set.rir}` : null)));
  if (rir) parts.push(rir);
  if (exercise.restSec && !options.inGroup) parts.push(`repos ${restText(exercise.restSec)}`);
  return parts.join(" · ");
}

export function groupMeta(group: StrengthGroup): string {
  if (group.kind === "superset") {
    return [
      `${group.rounds} tour${group.rounds > 1 ? "s" : ""}`,
      group.restSec ? `repos ${restText(group.restSec)}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return [
    `${group.minutes} min`,
    group.workSec ? `${group.workSec} s / ${60 - group.workSec} s` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function strengthCounts(content: StrengthContent): { exercises: number; sets: number } {
  let exercises = 0;
  let sets = 0;
  for (const item of content.items) {
    if (item.kind === "exercise") {
      exercises += 1;
      sets += item.sets.filter((set) => set.type === "normal").length;
    } else if (item.kind === "superset") {
      exercises += item.exercises.length;
      sets += item.rounds * item.exercises.length;
    } else if (item.kind === "emom") {
      exercises += item.exercises.length;
      sets += item.minutes;
    }
  }
  return { exercises, sets };
}

// « 6 exercices · 16 séries · superset et EMOM ».
export function strengthSummary(content: StrengthContent): string {
  const { exercises, sets } = strengthCounts(content);
  const kinds = [
    content.items.some((item) => item.kind === "superset") ? "superset" : null,
    content.items.some((item) => item.kind === "emom") ? "EMOM" : null,
  ].filter(Boolean);
  return [
    `${exercises} exercice${exercises > 1 ? "s" : ""}`,
    `${sets} série${sets > 1 ? "s" : ""}`,
    kinds.length ? kinds.join(" et ") : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

// ---------------------------------------------------------------------------
// Charge : kg ou % du max
// ---------------------------------------------------------------------------
// Passer en % : depuis les kg et le max quand on les a (arrondi à 5 %), sinon 70 % (40 % à
// l'échauffement), à corriger. Passer en kg : les kg calculés deviennent la charge écrite.
export function setLoadMode(
  exercise: StrengthExercise,
  mode: StrengthExercise["loadMode"],
  maxKg: number | null,
): StrengthExercise {
  if (mode === exercise.loadMode) return exercise;
  if (mode === "pct") {
    return {
      ...exercise,
      loadMode: "pct",
      sets: exercise.sets.map((set) => {
        const fromKg =
          maxKg && set.kg !== undefined && set.kg > 0
            ? Math.min(150, Math.max(1, Math.round((set.kg / maxKg) * 20) * 5))
            : null;
        const pct = fromKg ?? (set.type === "warmup" ? 40 : 70);
        return withComputedKg({ ...set, pct }, maxKg);
      }),
    };
  }
  return {
    ...exercise,
    loadMode: "kg",
    sets: exercise.sets.map((set) => {
      const next: StrengthSet = { ...set };
      delete next.pct;
      return next;
    }),
  };
}

// En % : les kg calculés depuis le max (absents si le max n'est pas connu).
export function withComputedKg(set: StrengthSet, maxKg: number | null): StrengthSet {
  if (set.pct === undefined) return set;
  const next: StrengthSet = { ...set };
  if (maxKg) next.kg = kgFromPercent(maxKg, set.pct);
  else delete next.kg;
  return next;
}

// ---------------------------------------------------------------------------
// Modifications
// ---------------------------------------------------------------------------
function ids(content: StrengthContent): Set<string> {
  const taken = new Set<string>();
  for (const item of content.items) {
    taken.add(item.id);
    if (item.kind === "superset" || item.kind === "emom")
      item.exercises.forEach((exercise) => taken.add(exercise.id));
  }
  return taken;
}

export function newExercise(
  content: StrengthContent,
  picked: { exerciseId?: string; name: string },
  taken = ids(content),
): StrengthExercise {
  const id = localId("x", taken);
  taken.add(id);
  return {
    id,
    kind: "exercise",
    ...(picked.exerciseId ? { exerciseId: picked.exerciseId } : {}),
    name: picked.name.slice(0, 80),
    loadMode: "kg",
    sets: Array.from({ length: 3 }, () => ({ type: "normal" as const, repsMin: 10 })),
    restSec: 90,
  };
}

export function addExercise(
  content: StrengthContent,
  picked: { exerciseId?: string; name: string },
  groupId?: string,
): { content: StrengthContent; id: string } {
  const exercise = newExercise(content, picked);
  if (!groupId)
    return { id: exercise.id, content: { ...content, items: [...content.items, exercise] } };
  return {
    id: exercise.id,
    content: {
      ...content,
      items: content.items.map((item) =>
        (item.kind === "superset" || item.kind === "emom") &&
        item.id === groupId &&
        item.exercises.length < 6
          ? { ...item, exercises: [...item.exercises, { ...exercise, restSec: undefined }] }
          : item,
      ),
    },
  };
}

// « Créer un superset » : les exercices choisis, reliés (3 tours, repos 90 s en fin de tour).
export function addSuperset(
  content: StrengthContent,
  picked: { exerciseId?: string; name: string }[],
): { content: StrengthContent; id: string } | null {
  if (picked.length < 2) return null;
  const taken = ids(content);
  const id = localId("g", taken);
  taken.add(id);
  const exercises = picked
    .slice(0, 6)
    .map((pick) => ({ ...newExercise(content, pick, taken), restSec: undefined }));
  return {
    id: exercises[0]?.id ?? id,
    content: {
      ...content,
      items: [...content.items, { id, kind: "superset", rounds: 3, restSec: 90, exercises }],
    },
  };
}

export function findExercise(
  content: StrengthContent,
  id: string,
): { exercise: StrengthExercise; group: StrengthGroup | null; position: number } | null {
  let position = 0;
  for (const item of content.items) {
    if (item.kind === "exercise") {
      position += 1;
      if (item.id === id) return { exercise: item, group: null, position };
    } else if (item.kind === "superset" || item.kind === "emom") {
      for (const exercise of item.exercises) {
        position += 1;
        if (exercise.id === id) return { exercise, group: item, position };
      }
    }
  }
  return null;
}

export function replaceExercise(
  content: StrengthContent,
  exercise: StrengthExercise,
): StrengthContent {
  return {
    ...content,
    items: content.items.map((item) =>
      item.kind === "exercise" && item.id === exercise.id
        ? exercise
        : item.kind === "superset" || item.kind === "emom"
          ? {
              ...item,
              exercises: item.exercises.map((child) =>
                child.id === exercise.id ? exercise : child,
              ),
            }
          : item,
    ),
  };
}

export function replaceGroup(content: StrengthContent, group: StrengthGroup): StrengthContent {
  return {
    ...content,
    items: content.items.map((item) => (item.id === group.id ? group : item)),
  };
}

// Retirer un exercice. Un superset qui n'en garde qu'un redevient un exercice seul ; un EMOM vidé
// disparaît ; la séance garde au moins un élément.
export function removeExercise(content: StrengthContent, id: string): StrengthContent {
  const items = content.items.flatMap((item): StrengthItem[] => {
    if (item.kind === "exercise") return item.id === id ? [] : [item];
    if (item.kind === "superset" || item.kind === "emom") {
      const exercises = item.exercises.filter((exercise) => exercise.id !== id);
      if (exercises.length === item.exercises.length) return [item];
      if (item.kind === "superset" && exercises.length < 2)
        return exercises.map((exercise) => ({ ...exercise, restSec: item.restSec }));
      return exercises.length === 0 ? [] : [{ ...item, exercises }];
    }
    return [item];
  });
  return items.length > 0 ? { ...content, items } : content;
}

// « Défaire » un superset ou un EMOM : ses exercices reprennent leur place, un par un.
export function ungroup(content: StrengthContent, id: string): StrengthContent {
  return {
    ...content,
    items: content.items.flatMap((item): StrengthItem[] =>
      (item.kind === "superset" || item.kind === "emom") && item.id === id
        ? item.exercises.map((exercise) => ({
            ...exercise,
            restSec: item.kind === "superset" ? item.restSec : exercise.restSec,
          }))
        : [item],
    ),
  };
}

export function removeItem(content: StrengthContent, id: string): StrengthContent {
  const items = content.items.filter((item) => item.id !== id);
  return items.length > 0 ? { ...content, items } : content;
}

const move = <T>(list: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
};

export function moveItem(
  content: StrengthContent,
  from: number,
  to: number,
  groupId?: string,
): StrengthContent {
  if (!groupId) return { ...content, items: move(content.items, from, to) };
  return {
    ...content,
    items: content.items.map((item) =>
      (item.kind === "superset" || item.kind === "emom") && item.id === groupId
        ? { ...item, exercises: move(item.exercises, from, to) }
        : item,
    ),
  };
}

// Une série de plus (copie de la dernière) ; une de moins (il en reste au moins une).
export function addSet(exercise: StrengthExercise): StrengthExercise {
  const last = exercise.sets[exercise.sets.length - 1] ?? { type: "normal" as const, repsMin: 10 };
  if (exercise.sets.length >= 20) return exercise;
  return { ...exercise, sets: [...exercise.sets, { ...last, type: "normal" }] };
}

export function removeLastSet(exercise: StrengthExercise): StrengthExercise {
  return exercise.sets.length > 1 ? { ...exercise, sets: exercise.sets.slice(0, -1) } : exercise;
}

// « 8 », « 8-10 », « 8 à 10 » -> répétitions ; null si illisible.
export function parseReps(input: string): { repsMin: number; repsMax?: number } | null {
  const match = /^\s*(\d{1,3})\s*(?:(?:-|–|à|a)\s*(\d{1,3}))?\s*$/i.exec(input);
  if (!match) return null;
  const repsMin = Number(match[1]);
  const repsMax = match[2] ? Number(match[2]) : undefined;
  if (
    repsMin < 1 ||
    repsMin > 100 ||
    (repsMax !== undefined && (repsMax < repsMin || repsMax > 100))
  )
    return null;
  return repsMax !== undefined && repsMax !== repsMin ? { repsMin, repsMax } : { repsMin };
}

// « 90 », « 90 s », « 1:30 », « 2 min » -> secondes (repos), 0 à 1 800.
export function parseRest(input: string): number | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;
  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(value);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const minutes = /^(\d{1,2})\s*min$/.exec(value);
  if (minutes) return Number(minutes[1]) * 60;
  const seconds = /^(\d{1,4})\s*s?$/.exec(value);
  if (!seconds) return null;
  const total = Number(seconds[1]);
  return total <= 1800 ? total : null;
}
