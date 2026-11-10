import { hyroxStationLabels } from "./hyrox-official";
import { formatPace, formatPaceRange } from "./pace";
import type {
  HyroxBlock,
  HyroxLine,
  PublishedSession,
  RunRepeat,
  RunStep,
  StrengthExercise,
  StrengthSet,
  TextBlock,
} from "./session-v2";

// Une séance v2 (structurée) lue comme des LIGNES de texte, une information par ligne (règle des
// maquettes : aucun graphique de séance). C'est ce que montrent l'agenda, la page d'une séance et,
// plus tard, les PDF. Le format des lignes reprend celui de la v1 (« 4 min @4:55 min/km »,
// « 1:45 min de récupération (trot lent) », « Back squat · 4 × 6 · 60 kg ») pour que les écrans
// existants les affichent sans changement. Fonctions pures, testées par Vitest.

export type ViewStep = {
  title: string;
  badge?: string;
  short?: string;
  lines: string[];
  repeat?: { times: number; lines: string[] };
};

// 20 -> « 20 s » ; 240 -> « 4 min » ; 105 -> « 1:45 min » ; 4800 -> « 1 h 20 ».
export function formatSeconds(total: number): string {
  if (total < 60) return `${total} s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (total >= 3600) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const clock = seconds
      ? `${String(rest).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : String(rest).padStart(2, "0");
    return rest || seconds ? `${hours} h ${clock}` : `${hours} h`;
  }
  return seconds ? `${minutes}:${String(seconds).padStart(2, "0")} min` : `${minutes} min`;
}

// Running (règle d'Antonino du 10/11/2026, pour TOUS les coachs) : une durée de course s'écrit
// toujours en minutes, jamais en heures : 4800 -> « 80 min » ; 105 -> « 1:45 min » ; 20 -> « 20 s ».
export function formatMinutes(total: number): string {
  if (total < 60) return `${total} s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return seconds ? `${minutes}:${String(seconds).padStart(2, "0")} min` : `${minutes} min`;
}

// « 1 h 20 » -> « 80 min » dans un texte déjà écrit (séances v1 en texte) : même règle Running.
export function hoursToMinutes(text: string): string {
  return text.replace(
    /\b(\d+) h(?: (\d{1,2}))?(?![:\d])/g,
    (_, h: string, m?: string) => `${Number(h) * 60 + Number(m ?? 0)} min`,
  );
}

// Temps cible : « 25:00 », « 1:18:20 ».
export function formatClock(total: number): string {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mmss = `${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours ? `${hours}:${mmss}` : mmss;
}

// 1000 -> « 1 km » ; 1500 -> « 1,5 km » ; 800 -> « 800 m ».
export function formatMeters(meters: number): string {
  if (meters >= 1000 && meters % 100 === 0) {
    return `${String(meters / 1000).replace(".", ",")} km`;
  }
  return `${meters} m`;
}

export const formatKg = (kg: number) => `${String(kg).replace(".", ",")} kg`;

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------
export const runRoleLabels: Record<RunStep["role"], string> = {
  warmup: "Échauffement",
  run: "Course",
  recovery: "Récupération",
  rest: "Repos",
  cooldown: "Retour au calme",
};

function runMeasure(step: RunStep): string | null {
  switch (step.measure.type) {
    case "time":
      return formatMinutes(step.measure.seconds);
    case "distance":
      return formatMeters(step.measure.meters);
    case "open":
      return null;
  }
}

function runTarget(step: RunStep): string | null {
  if (!step.target) return null;
  if (step.target.kind === "pace") {
    return `@${formatPaceRange(step.target.fromSecPerKm, step.target.toSecPerKm)} min/km`;
  }
  const bpm =
    step.target.bpmFrom !== undefined ? ` · ${step.target.bpmFrom}-${step.target.bpmTo} bpm` : "";
  return `Z${step.target.zone}${bpm}`;
}

// Une étape en une ligne : « 4 min @4:55 min/km », « Course rapide 2 min @5:00–5:10 min/km »,
// « 2 min de récupération (trot) », « 15 min · Z2 · 129-142 bpm ».
export function runStepLine(step: RunStep): string {
  const measure = runMeasure(step) ?? "Libre";
  const target = runTarget(step);
  if (step.role === "recovery" || step.role === "rest") {
    const kind = step.role === "rest" ? "de repos" : "de récupération";
    const detail =
      step.label && step.label !== runRoleLabels[step.role] ? ` (${step.label.toLowerCase()})` : "";
    return `${measure} ${kind}${detail}${target ? ` ${target}` : ""}`;
  }
  const label = step.role === "run" && step.label ? `${step.label} ` : "";
  if (!target) return `${label}${measure}`;
  return step.target?.kind === "pace"
    ? `${label}${measure} ${target}`
    : `${label}${measure} · ${target}`;
}

function runStepView(step: RunStep): ViewStep {
  const title = step.label ?? runRoleLabels[step.role];
  const measure = runMeasure(step);
  return {
    title,
    ...(measure
      ? { badge: measure, short: `${measure} ${runRoleLabels[step.role].toLowerCase()}` }
      : {}),
    lines: [runStepLine(step), ...(step.note ? [step.note] : [])],
  };
}

function runRepeatView(repeat: RunRepeat): ViewStep {
  const main = repeat.steps.find((step) => step.role === "run") ?? repeat.steps[0];
  const measure = main ? runMeasure(main) : null;
  const target = main ? runTarget(main) : null;
  return {
    title: `Répéter ${repeat.times} fois`,
    ...(measure
      ? {
          badge: `${repeat.times} × ${measure}`,
          short: `${repeat.times} × ${measure}${target ? ` ${target}` : ""}`,
        }
      : {}),
    lines: repeat.steps.flatMap((step) => (step.note ? [step.note] : [])),
    repeat: { times: repeat.times, lines: repeat.steps.map(runStepLine) },
  };
}

// ---------------------------------------------------------------------------
// Musculation
// ---------------------------------------------------------------------------
const repsText = (set: StrengthSet) =>
  set.repsMax !== undefined && set.repsMax !== set.repsMin
    ? `${set.repsMin}-${set.repsMax}`
    : `${set.repsMin}`;

function loadText(set: StrengthSet): string | null {
  if (set.pct !== undefined)
    return set.kg !== undefined ? `${set.pct} % (≈ ${formatKg(set.kg)})` : `${set.pct} %`;
  return set.kg !== undefined && set.kg > 0 ? formatKg(set.kg) : null;
}

const uniform = (values: (string | null)[]) =>
  values.every((value) => value === values[0]) ? (values[0] ?? null) : null;

// « Back squat · 4 × 6 · 60 kg · RIR 2 · repos 2:30 » ; pyramide : « Leg curl assis · 20-15-10-8 ».
export function exerciseLine(exercise: StrengthExercise, options?: { withSets?: boolean }): string {
  const work = exercise.sets.filter((set) => set.type === "normal");
  const sets = work.length > 0 ? work : exercise.sets;
  const reps = sets.map(repsText);
  const sameReps = uniform(reps);
  const parts = [exercise.name];
  if (options?.withSets === false) parts.push(sameReps ?? reps.join("-"));
  else parts.push(sameReps ? `${sets.length} × ${sameReps}` : reps.join("-"));
  const load = uniform(sets.map(loadText));
  if (load) parts.push(load);
  const rir = uniform(sets.map((set) => (set.rir !== undefined ? `RIR ${set.rir}` : null)));
  if (rir) parts.push(rir);
  if (exercise.restSec) {
    // « repos 2:30 » (maquette) mais « repos 2 min » : l'unité ne tombe qu'avec les secondes.
    const rest = formatSeconds(exercise.restSec);
    parts.push(`repos ${rest.includes(":") ? rest.replace(/ min$/, "") : rest}`);
  }
  if (exercise.tempo) parts.push(`tempo ${exercise.tempo}`);
  return parts.join(" · ");
}

// ---------------------------------------------------------------------------
// Hyrox
// ---------------------------------------------------------------------------
export const hyroxFormatLabels: Record<HyroxBlock["format"], string> = {
  simple: "Bloc",
  circuit: "Circuit",
  for_time: "For time",
  amrap: "AMRAP",
  emom: "EMOM",
  intervals: "Intervalles",
  simulation: "Simulation",
};

export const ergLabels = { skierg: "SkiErg", rowing: "Rameur", bike: "Bike" } as const;

// « Run 600 m @5:45 min/km », « Sled push 25 m · 102 kg », « Farmers carry 200 m · 2 × 16 kg »,
// « SkiErg 1 km @2:10 min/500 m », « Transition 30 s ».
export function hyroxLine(line: HyroxLine): string {
  const target = (seconds?: number) => (seconds ? ` · ${formatClock(seconds)}` : "");
  switch (line.kind) {
    case "run":
      return `Run ${formatMeters(line.meters)}${line.paceSecPerKm ? ` @${formatPace(line.paceSecPerKm)} min/km` : ""}${target(line.targetSec)}`;
    case "station": {
      const amount =
        line.meters !== undefined
          ? ` ${formatMeters(line.meters)}`
          : line.reps !== undefined
            ? ` ${line.reps}`
            : "";
      const load =
        line.loadKg !== undefined
          ? line.station === "farmers_carry"
            ? ` · 2 × ${formatKg(line.loadKg)}`
            : ` · ${formatKg(line.loadKg)}`
          : "";
      const pace = line.pacePer500m ? ` @${formatPace(line.pacePer500m)} min/500 m` : "";
      return `${hyroxStationLabels[line.station]}${amount}${load}${pace}${target(line.targetSec)}`;
    }
    case "erg": {
      const amount =
        line.meters !== undefined
          ? ` ${formatMeters(line.meters)}`
          : line.seconds !== undefined
            ? ` ${formatSeconds(line.seconds)}`
            : "";
      const pace = line.pacePer500m ? ` @${formatPace(line.pacePer500m)} min/500 m` : "";
      return `${ergLabels[line.machine]}${amount}${pace}${target(line.targetSec)}`;
    }
    case "transition":
      return `Transition ${formatSeconds(line.seconds)}`;
    case "exercise": {
      const amount =
        line.reps !== undefined
          ? ` ${line.reps}`
          : line.meters !== undefined
            ? ` ${formatMeters(line.meters)}`
            : "";
      return `${line.name}${amount}${line.loadKg !== undefined ? ` · ${formatKg(line.loadKg)}` : ""}`;
    }
  }
}

function hyroxBlockView(block: HyroxBlock): ViewStep {
  const title = block.title ?? hyroxFormatLabels[block.format];
  const window = block.timeCapSec ?? block.targetSec;
  let badge: string | undefined;
  if (block.format === "amrap" || block.format === "emom") {
    badge = window
      ? `${hyroxFormatLabels[block.format]} ${formatSeconds(window)}`
      : hyroxFormatLabels[block.format];
  } else if (block.rounds && block.rounds >= 2) {
    badge = `${block.rounds} tours`;
  } else if (block.targetSec) {
    badge = formatClock(block.targetSec);
  }
  const extra = [
    ...(block.rounds && block.rounds >= 2 && block.restSec
      ? [`Repos ${formatSeconds(block.restSec)} entre les tours`]
      : []),
    ...(block.targetRounds ? [`Objectif ${block.targetRounds} tours`] : []),
    ...(block.targetSec && block.format !== "amrap"
      ? [`Temps cible ${formatClock(block.targetSec)}`]
      : []),
    ...(block.timeCapSec && block.format !== "amrap" && block.format !== "emom"
      ? [`Limite ${formatClock(block.timeCapSec)}`]
      : []),
  ];
  const lines = block.lines.map(hyroxLine);
  return block.rounds && block.rounds >= 2
    ? { title, ...(badge ? { badge } : {}), lines: extra, repeat: { times: block.rounds, lines } }
    : { title, ...(badge ? { badge } : {}), lines: [...lines, ...extra] };
}

// ---------------------------------------------------------------------------
// La séance entière
// ---------------------------------------------------------------------------
function textView(block: TextBlock): ViewStep {
  return {
    title: block.title,
    ...(block.badge
      ? { badge: block.badge, short: `${block.badge} ${block.title.toLowerCase()}` }
      : {}),
    lines: block.lines,
    ...(block.repeat ? { repeat: block.repeat } : {}),
  };
}

export function sessionSteps(session: Pick<PublishedSession, "content">): ViewStep[] {
  const { content } = session;
  switch (content.discipline) {
    case "running":
      return content.items.map((item) =>
        item.kind === "step"
          ? runStepView(item)
          : item.kind === "repeat"
            ? runRepeatView(item)
            : textView(item),
      );
    case "strength": {
      const steps: ViewStep[] = [];
      if (content.warmup) steps.push({ title: "Échauffement", lines: [content.warmup] });
      let group: StrengthExercise[] = [];
      const flush = () => {
        if (group.length === 0) return;
        steps.push({
          title: "Exercices",
          badge: group.length > 1 ? `${group.length} exercices` : "1 exercice",
          lines: group.flatMap((exercise) => [
            exerciseLine(exercise),
            ...(exercise.cue ? [exercise.cue] : []),
          ]),
        });
        group = [];
      };
      for (const item of content.items) {
        if (item.kind === "exercise") {
          group.push(item);
          continue;
        }
        flush();
        if (item.kind === "superset") {
          const lines = item.exercises.map((exercise) =>
            exerciseLine(exercise, { withSets: false }),
          );
          const rest = item.restSec ? [`Repos ${formatSeconds(item.restSec)} en fin de tour`] : [];
          steps.push(
            item.rounds >= 2
              ? {
                  title: "Superset",
                  badge: `${item.rounds} tours`,
                  lines: rest,
                  repeat: { times: item.rounds, lines },
                }
              : { title: "Superset", badge: "1 tour", lines: [...lines, ...rest] },
          );
        } else if (item.kind === "emom") {
          const every = item.workSec
            ? `Chaque minute : ${item.workSec} s de travail, le reste en repos`
            : "Chaque minute, au début de la minute";
          steps.push({
            title: "EMOM",
            badge: `${item.minutes} min`,
            lines: [
              every,
              ...item.exercises.map((exercise) => exerciseLine(exercise, { withSets: false })),
            ],
          });
        } else {
          steps.push(textView(item));
        }
      }
      flush();
      if (content.cooldown) steps.push({ title: "Retour au calme", lines: [content.cooldown] });
      return steps;
    }
    case "hyrox":
      return content.items.map((item) =>
        item.kind === "block" ? hyroxBlockView(item) : textView(item),
      );
    case "hybrid":
      return content.items.map(textView);
  }
}

// ---------------------------------------------------------------------------
// Résumé d'une séance en une ligne (cartes de modèle, cartes de l'éditeur) : « 60 min · zone 2 »,
// « 6 exercices · % du max », « 8 runs + 8 stations », « 5 tours + AMRAP · 58 min ».
// ---------------------------------------------------------------------------
function strengthCount(content: Extract<PublishedSession["content"], { discipline: "strength" }>) {
  return content.items.reduce(
    (total, item) =>
      total +
      (item.kind === "exercise"
        ? 1
        : item.kind === "superset" || item.kind === "emom"
          ? item.exercises.length
          : 0),
    0,
  );
}

export function sessionHeadline(
  session: Pick<PublishedSession, "content" | "durationMinutes">,
): string {
  const duration = formatSeconds(session.durationMinutes * 60);
  const { content } = session;
  switch (content.discipline) {
    case "running": {
      const duration = formatMinutes(session.durationMinutes * 60);
      const steps = content.items.flatMap((item) =>
        item.kind === "step" ? [item] : item.kind === "repeat" ? item.steps : [],
      );
      const repeat = content.items.find((item) => item.kind === "repeat");
      const main = steps.find((step) => step.role === "run") ?? steps[0];
      const aim =
        main?.target?.kind === "hr"
          ? `zone ${main.target.zone}`
          : main?.target?.kind === "pace"
            ? `@${formatPaceRange(main.target.fromSecPerKm, main.target.toSecPerKm)}`
            : null;
      if (repeat && repeat.kind === "repeat") {
        const work = repeat.steps.find((step) => step.role === "run") ?? repeat.steps[0];
        const measure =
          work?.measure.type === "time"
            ? formatMinutes(work.measure.seconds)
            : work?.measure.type === "distance"
              ? formatMeters(work.measure.meters)
              : null;
        return [`${repeat.times} × ${measure ?? "…"}`, `≈ ${duration}`].join(" · ");
      }
      return [duration, aim].filter(Boolean).join(" · ");
    }
    case "strength": {
      const count = strengthCount(content);
      const pct = content.items.some(
        (item) =>
          (item.kind === "exercise" && item.loadMode === "pct") ||
          ((item.kind === "superset" || item.kind === "emom") &&
            item.exercises.some((exercise) => exercise.loadMode === "pct")),
      );
      return [`${count} exercice${count > 1 ? "s" : ""}`, pct ? "% du max" : null]
        .filter(Boolean)
        .join(" · ");
    }
    case "hyrox": {
      const simulation = content.items.find(
        (item) => item.kind === "block" && item.format === "simulation",
      );
      if (simulation && simulation.kind === "block") {
        const runs = simulation.lines.filter((line) => line.kind === "run").length;
        const stations = simulation.lines.filter((line) => line.kind === "station").length;
        return `${runs} runs + ${stations} stations`;
      }
      const parts = content.items.flatMap((item) => {
        if (item.kind !== "block" || item.format === "simple") return [];
        if (item.rounds && item.rounds >= 2) return [`${item.rounds} tours`];
        return [hyroxFormatLabels[item.format]];
      });
      return [parts.join(" + ") || null, duration].filter(Boolean).join(" · ");
    }
    case "hybrid":
      return duration;
  }
}

// ---------------------------------------------------------------------------
// Deux chiffres d'une séance (panneau de l'éditeur, page d'une séance) : la durée, puis la distance
// estimée (Running : distances écrites, et durées converties avec l'allure visée), le nombre de séries
// (Musculation) ou de blocs (Hyrox).
// ---------------------------------------------------------------------------
export function runningDistanceMeters(
  content: Extract<PublishedSession["content"], { discipline: "running" }>,
): number | null {
  let meters = 0;
  let known = false;
  const add = (step: RunStep, times: number) => {
    if (step.measure.type === "distance") {
      meters += step.measure.meters * times;
      known = true;
    } else if (step.measure.type === "time" && step.target?.kind === "pace") {
      const pace = (step.target.fromSecPerKm + step.target.toSecPerKm) / 2;
      meters += (step.measure.seconds / pace) * 1000 * times;
      known = true;
    }
  };
  for (const item of content.items) {
    if (item.kind === "step") add(item, 1);
    else if (item.kind === "repeat") item.steps.forEach((step) => add(step, item.times));
  }
  return known ? Math.round(meters) : null;
}

export function sessionStats(
  session: Pick<PublishedSession, "content" | "durationMinutes">,
): { label: string; value: string }[] {
  const duration = { label: "Durée", value: `≈ ${formatSeconds(session.durationMinutes * 60)}` };
  const { content } = session;
  switch (content.discipline) {
    case "running": {
      const meters = runningDistanceMeters(content);
      return [
        { label: "Durée", value: `≈ ${formatMinutes(session.durationMinutes * 60)}` },
        {
          label: "Distance",
          value: meters ? `≈ ${String(Math.round(meters / 100) / 10).replace(".", ",")} km` : "—",
        },
      ];
    }
    case "strength": {
      const sets = content.items.reduce((total, item) => {
        if (item.kind === "exercise")
          return total + item.sets.filter((set) => set.type === "normal").length;
        if (item.kind === "superset") return total + item.rounds * item.exercises.length;
        if (item.kind === "emom") return total + item.minutes;
        return total;
      }, 0);
      return [duration, { label: "Séries", value: String(sets) }];
    }
    case "hyrox":
      return [
        duration,
        {
          label: "Blocs",
          value: String(content.items.filter((item) => item.kind === "block").length),
        },
      ];
    case "hybrid":
      return [duration, { label: "Étapes", value: String(content.items.length) }];
  }
}
