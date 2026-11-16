import { hyroxStationLabels } from "./hyrox-official";
import { formatPace, formatPaceRange } from "./pace";
import type {
  HyroxBlock,
  HyroxLine,
  RunStep,
  SessionContent,
  StrengthExercise,
  StrengthSet,
  TextBlock,
} from "./session-v2";
import {
  ergLabels,
  formatClock,
  formatKg,
  formatMeters,
  formatMinutes,
  formatSeconds,
  hyroxFormatLabels,
  runRoleLabels,
  type ViewStep,
} from "./session-view";

// Une séance en CARTES (test d'Antonino et de Gianluca sur iPhone, 15/11/2026, D-187) : une carte par
// étape (échauffement, chaque exercice, retour au calme), une grande carte pour ce qui se répète
// (superset, EMOM, « Répéter », circuit Hyrox) avec une petite carte par exercice. Dans une carte : le
// nom, le volume en haut à droite (« 4 séries »), la ligne (« 5 répétitions · 70 kg », « 1 km ·
// @5:30 »), puis en gris le repos, le tempo ou la consigne. Jamais de RIR (personne ne le comprend) ;
// les kilos si le max est connu, sinon « % du max ». Règles PURES, les mêmes partout.

export type CardRole = "warmup" | "work" | "rest" | "cooldown";

export type StepCard = {
  kind: "card";
  // La couleur de la barre : la discipline pour un exercice, gris pour un repos ou une transition.
  role: CardRole;
  title: string;
  aside?: string;
  lines: string[];
  // En gris, dessous : le repos, le tempo, la consigne.
  sub: string[];
  // Où est l'étape dans la séance : [id] ou [id du groupe, id de l'étape] ; « warmup », « cooldown »
  // pour l'échauffement et le retour au calme écrits d'un trait (musculation).
  path: string[];
  // Exercice lié à la Bibliothèque : « Voir dans la Bibliothèque ».
  exerciseId?: string;
};

export type GroupCard = {
  kind: "group";
  title: string;
  aside?: string;
  cards: StepCard[];
  // En bas de la grande carte : « Repos 1:30 entre les tours ».
  footer?: string;
  path: string[];
};

export type SessionCard = StepCard | GroupCard;

const card = (
  title: string,
  path: string[],
  fields: Partial<Omit<StepCard, "kind" | "title" | "path">> = {},
): StepCard => {
  const { role = roleOf(title), lines = [], sub = [], aside, exerciseId } = fields;
  return {
    kind: "card",
    role,
    title,
    ...(aside ? { aside } : {}),
    lines,
    sub,
    path,
    ...(exerciseId ? { exerciseId } : {}),
  };
};

const group = (
  title: string,
  path: string[],
  cards: StepCard[],
  { aside, footer }: { aside?: string; footer?: string | null } = {},
): GroupCard => ({
  kind: "group",
  title,
  ...(aside ? { aside } : {}),
  cards,
  ...(footer ? { footer } : {}),
  path,
});

function roleOf(title: string): CardRole {
  if (/^échauffement/i.test(title)) return "warmup";
  if (/^retour au calme/i.test(title)) return "cooldown";
  return "work";
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;
// « Repos 3:00 », « Repos 1:30 », « Repos 0:45 ».
const restText = (seconds: number) => `Repos ${formatClock(seconds)}`;

// ---------------------------------------------------------------------------
// Musculation
// ---------------------------------------------------------------------------
// « 5 répétitions », « 8 à 10 répétitions », « 1 répétition », « 30 s », « 30 à 45 s ».
function amountText(set: StrengthSet): string {
  if (set.seconds !== undefined) {
    return set.secondsMax !== undefined && set.secondsMax !== set.seconds
      ? `${set.seconds} à ${set.secondsMax} s`
      : `${set.seconds} s`;
  }
  const reps = set.repsMin ?? 0;
  if (set.repsMax !== undefined && set.repsMax !== reps)
    return `${reps} à ${set.repsMax} répétitions`;
  return plural(reps, "répétition");
}

// Les kilos (calculés depuis le max à la publication, ou écrits par le coach) ; sinon le % du max.
function loadText(set: StrengthSet): string | null {
  if (set.kg !== undefined && set.kg > 0) return formatKg(set.kg);
  if (set.pct !== undefined) return `${set.pct} % du max`;
  return null;
}

const setText = (set: StrengthSet) => [amountText(set), loadText(set)].filter(Boolean).join(" · ");
const allSame = (values: string[]) => values.every((value) => value === values[0]);

function exerciseCard(exercise: StrengthExercise, path: string[], inGroup: boolean): StepCard {
  const warmups = exercise.sets.filter((set) => set.type === "warmup");
  const work = exercise.sets.filter((set) => set.type === "normal");
  const sets = work.length > 0 ? work : exercise.sets;
  const texts = sets.map(setText);
  const lines: string[] = [];
  if (warmups.length > 0 && work.length > 0) {
    const warm = warmups.map(setText);
    lines.push(
      allSame(warm)
        ? `Échauffement : ${warmups.length > 1 ? `${warmups.length} × ` : ""}${warm[0]}`
        : `Échauffement : ${warm.join(", ")}`,
    );
  }
  if (allSame(texts)) lines.push(texts[0] ?? "");
  else lines.push(...texts.map((text, i) => `Série ${i + 1} · ${text}`));
  const sub = [
    ...(exercise.restSec ? [restText(exercise.restSec)] : []),
    ...(exercise.tempo ? [`Tempo ${exercise.tempo}`] : []),
    ...(exercise.cue ? [exercise.cue] : []),
  ];
  return card(exercise.name, path, {
    role: "work",
    // Dans un superset ou un EMOM, les tours sont sur la grande carte.
    ...(inGroup ? {} : { aside: plural(sets.length, "série") }),
    lines,
    sub,
    ...(exercise.exerciseId ? { exerciseId: exercise.exerciseId } : {}),
  });
}

function strengthCards(content: Extract<SessionContent, { discipline: "strength" }>) {
  const cards: SessionCard[] = [];
  if (content.warmup) {
    cards.push(card("Échauffement", ["warmup"], { role: "warmup", lines: [content.warmup] }));
  }
  for (const item of content.items) {
    if (item.kind === "exercise") cards.push(exerciseCard(item, [item.id], false));
    else if (item.kind === "superset") {
      cards.push(
        group(
          "Superset",
          [item.id],
          item.exercises.map((exercise) => exerciseCard(exercise, [item.id, exercise.id], true)),
          {
            aside: plural(item.rounds, "tour"),
            footer: item.restSec ? `${restText(item.restSec)} après chaque tour` : null,
          },
        ),
      );
    } else if (item.kind === "emom") {
      cards.push(
        group(
          "EMOM",
          [item.id],
          item.exercises.map((exercise) => exerciseCard(exercise, [item.id, exercise.id], true)),
          {
            aside: `${item.minutes} min`,
            footer: item.workSec
              ? `Chaque minute : ${item.workSec} s de travail, puis repos`
              : "Chaque minute, au début de la minute",
          },
        ),
      );
    } else cards.push(textCard(item));
  }
  if (content.cooldown) {
    cards.push(
      card("Retour au calme", ["cooldown"], { role: "cooldown", lines: [content.cooldown] }),
    );
  }
  return cards;
}

// ---------------------------------------------------------------------------
// Course
// ---------------------------------------------------------------------------
function runMeasureText(step: RunStep): string {
  switch (step.measure.type) {
    case "time":
      return formatMinutes(step.measure.seconds);
    case "distance":
      return formatMeters(step.measure.meters);
    case "open":
      return "Libre";
  }
}

function runTargetText(step: RunStep): string | null {
  if (!step.target) return null;
  if (step.target.kind === "pace") {
    return `@${formatPaceRange(step.target.fromSecPerKm, step.target.toSecPerKm)}`;
  }
  const bpm =
    step.target.bpmFrom !== undefined ? ` · ${step.target.bpmFrom}–${step.target.bpmTo} bpm` : "";
  return `zone ${step.target.zone}${bpm}`;
}

function runCard(step: RunStep, path: string[]): StepCard {
  const resting = step.role === "recovery" || step.role === "rest";
  const name = runRoleLabels[step.role];
  // Une récupération garde son nom en titre ; son libellé (« Trot léger ») passe dessous.
  const title = resting ? name : (step.label ?? name);
  const sub = [
    ...(resting && step.label && step.label !== name ? [step.label] : []),
    ...(step.note ? [step.note] : []),
  ];
  return card(title, path, {
    role:
      step.role === "warmup"
        ? "warmup"
        : step.role === "cooldown"
          ? "cooldown"
          : resting
            ? "rest"
            : "work",
    lines: [[runMeasureText(step), runTargetText(step)].filter(Boolean).join(" · ")],
    sub,
  });
}

// ---------------------------------------------------------------------------
// Hyrox
// ---------------------------------------------------------------------------
function hyroxCard(line: HyroxLine, path: string[]): StepCard {
  const target =
    "targetSec" in line && line.targetSec ? [`Temps cible ${formatClock(line.targetSec)}`] : [];
  switch (line.kind) {
    case "run":
      return card("Course", path, {
        role: "work",
        lines: [
          [
            formatMeters(line.meters),
            line.paceSecPerKm ? `@${formatPace(line.paceSecPerKm)}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
        ],
        sub: target,
      });
    case "station": {
      const amount =
        line.meters !== undefined
          ? formatMeters(line.meters)
          : line.reps !== undefined
            ? plural(line.reps, "répétition")
            : null;
      const load =
        line.loadKg !== undefined
          ? line.station === "farmers_carry"
            ? `2 × ${formatKg(line.loadKg)}`
            : formatKg(line.loadKg)
          : null;
      const pace = line.pacePer500m ? `@${formatPace(line.pacePer500m)} /500 m` : null;
      return card(hyroxStationLabels[line.station], path, {
        role: "work",
        lines: [[amount, load, pace].filter(Boolean).join(" · ")].filter(Boolean),
        sub: [...target, ...(line.note ? [line.note] : [])],
      });
    }
    case "erg": {
      const amount =
        line.meters !== undefined
          ? formatMeters(line.meters)
          : line.seconds !== undefined
            ? formatSeconds(line.seconds)
            : null;
      const pace = line.pacePer500m ? `@${formatPace(line.pacePer500m)} /500 m` : null;
      return card(ergLabels[line.machine], path, {
        role: "work",
        lines: [[amount, pace].filter(Boolean).join(" · ")].filter(Boolean),
        sub: target,
      });
    }
    case "transition":
      return card("Transition", path, { role: "rest", lines: [formatClock(line.seconds)] });
    case "exercise": {
      const amount =
        line.reps !== undefined
          ? plural(line.reps, "répétition")
          : line.meters !== undefined
            ? formatMeters(line.meters)
            : null;
      return card(line.name, path, {
        role: "work",
        lines: [
          [amount, line.loadKg !== undefined ? formatKg(line.loadKg) : null]
            .filter(Boolean)
            .join(" · "),
        ].filter(Boolean),
        ...(line.exerciseId ? { exerciseId: line.exerciseId } : {}),
      });
    }
  }
}

function hyroxBlockCard(block: HyroxBlock): SessionCard {
  const title = block.title ?? hyroxFormatLabels[block.format];
  const rounds = block.rounds ?? 1;
  // Un bloc simple d'un seul tour (échauffement, retour au calme…) reste UNE carte.
  if (block.format === "simple" && rounds < 2) {
    const steps = block.lines.map((line) => hyroxCard(line, []));
    const only = steps.length === 1 ? steps[0] : undefined;
    return card(title, [block.id], {
      ...(block.targetSec ? { aside: formatClock(block.targetSec) } : {}),
      // Chaque ligne écrite comme une carte, en une ligne, son temps cible compris (relecture) :
      // « Course 1 km · @6:00 », « Course 1 km · Temps cible 6:00 », « Rameur 1 km ».
      lines: steps.map((step) =>
        [[step.title, step.lines.join(" · ")].filter(Boolean).join(" "), ...step.sub].join(" · "),
      ),
      sub: block.timeCapSec ? [`Limite ${formatClock(block.timeCapSec)}`] : [],
      // Un seul exercice lié : « Voir dans la Bibliothèque » sur la carte.
      ...(only?.exerciseId ? { exerciseId: only.exerciseId } : {}),
    });
  }
  const window = block.timeCapSec ?? block.targetSec;
  // AMRAP ou EMOM renommé (« Finisher ») : le format reste écrit à droite (relecture).
  const format = block.title ? `${hyroxFormatLabels[block.format]} ` : "";
  const aside =
    block.format === "amrap" || block.format === "emom"
      ? window
        ? `${format}${formatSeconds(window)}`
        : block.title
          ? hyroxFormatLabels[block.format]
          : undefined
      : rounds >= 2
        ? plural(rounds, "tour")
        : block.targetSec
          ? formatClock(block.targetSec)
          : undefined;
  const footer = [
    ...(rounds >= 2 && block.restSec ? [`${restText(block.restSec)} entre les tours`] : []),
    ...(block.targetRounds ? [`Objectif ${block.targetRounds} tours`] : []),
    ...(block.targetSec && block.format !== "amrap" && rounds >= 2
      ? [`Temps cible ${formatClock(block.targetSec)}`]
      : []),
    ...(block.timeCapSec && block.format !== "amrap" && block.format !== "emom"
      ? [`Limite ${formatClock(block.timeCapSec)}`]
      : []),
  ].join(" · ");
  return group(
    title,
    [block.id],
    block.lines.map((line) => hyroxCard(line, [block.id, line.id])),
    { ...(aside ? { aside } : {}), footer: footer || null },
  );
}

// ---------------------------------------------------------------------------
// Blocs texte (notes libres, séances v1 converties)
// ---------------------------------------------------------------------------
function textCard(block: TextBlock): SessionCard {
  if (!block.repeat) {
    return card(block.title, [block.id], {
      ...(block.badge ? { aside: block.badge } : {}),
      lines: block.lines,
    });
  }
  return group(
    block.title,
    [block.id],
    block.repeat.lines.map((line, i) => card(line, [block.id, String(i)], { role: "work" })),
    { aside: block.badge ?? `${block.repeat.times} fois`, footer: block.lines.join(" · ") || null },
  );
}

export function sessionCards(content: SessionContent): SessionCard[] {
  switch (content.discipline) {
    case "running":
      return content.items.map((item) =>
        item.kind === "step"
          ? runCard(item, [item.id])
          : item.kind === "repeat"
            ? group(
                "Répéter",
                [item.id],
                item.steps.map((step) => runCard(step, [item.id, step.id])),
                { aside: `${item.times} fois` },
              )
            : textCard(item),
      );
    case "strength":
      return strengthCards(content);
    case "hyrox":
      return content.items.map((item) =>
        item.kind === "block" ? hyroxBlockCard(item) : textCard(item),
      );
    case "hybrid":
      return content.items.map(textCard);
  }
}

// Séance v1 (texte, publiée avant les éditeurs) : les mêmes cartes, depuis ses étapes.
export function viewStepCards(steps: ViewStep[]): SessionCard[] {
  return steps.map((step, i) =>
    step.repeat
      ? group(
          step.title,
          [String(i)],
          step.repeat.lines.map((line, j) => card(line, [String(i), String(j)], { role: "work" })),
          {
            aside: step.badge ?? `${step.repeat.times} fois`,
            footer: step.lines.join(" · ") || null,
          },
        )
      : card(step.title, [String(i)], {
          // « 20 min » en haut à droite ET en début de ligne : une seule fois, dans la ligne.
          ...(step.badge && !step.lines[0]?.startsWith(step.badge) ? { aside: step.badge } : {}),
          lines: step.lines,
        }),
  );
}
