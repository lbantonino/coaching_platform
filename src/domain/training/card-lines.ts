import type { ProgramSessionContent } from "./program-session";
import { hoursToMinutes } from "./session-view";

// Lignes d'une carte de séance dans l'agenda du programme (maquette 2c, AGD-01 à 04) : une info par
// ligne, sans graphique, et RIEN de coupé (demande d'Antonino du 10/11 : tout doit se lire, même sur
// une carte étroite ; le texte passe à la ligne). Un bloc répété reste un bloc : « 4 × » puis ses
// lignes (l'effort et la récup qui le suit), pour comprendre que la récup est DANS la répétition.
// Lues depuis la forme d'affichage commune à la v1 et à la v2. Fonctions pures, testées par Vitest.

export type CardLine =
  | { kind: "line"; text: string }
  | { kind: "repeat"; times: number; lines: string[] }
  // Bloc Hyrox de plusieurs lignes sans tours (AMRAP, EMOM, bloc simple) : son nom puis ses lignes.
  | { kind: "group"; label: string; lines: string[] };

const bpm = (text: string) => text.replace(/(\d+)-(\d+) bpm/g, "$1–$2 bpm");

type Discipline = NonNullable<ProgramSessionContent["discipline"]>;

// Abréviations des CARTES seulement (demande d'Antonino du 10/11) : la séance dépliée garde le nom
// entier. « BBJ » pour Burpee broad jumps, « SDT » pour soulevé de terre, « KB » pour kettlebell.
const abbreviations: [RegExp, string][] = [
  [/\bburpees? broad jumps?\b/gi, "BBJ"],
  [/\bsoulevé de terre\b/gi, "SDT"],
  [/\bkettlebell\b/gi, "KB"],
];

export function abbreviate(text: string): string {
  return abbreviations.reduce((out, [pattern, short]) => out.replace(pattern, short), text);
}

// Musculation (demande d'Antonino du 10/11 : la carte la plus courte possible, le détail est dans la
// carte dépliée) : « Back squat · 4 × 6 · 40 kg · RIR 2 · repos 2:30 » -> « Back squat 4 × 6 ». Charge,
// RIR, repos, tempo et consignes ne restent que dans la séance dépliée. null pour une ligne qui n'est
// pas un exercice (consigne, « Repos 2 min en fin de tour », « Chaque minute… »).
export function strengthShort(line: string): string | null {
  const match = /^(.+?) · (\d[^·]*?)(?: · |$)/.exec(line);
  return match ? abbreviate(`${match[1]} ${match[2]}`) : null;
}

const exercisesOf = (lines: string[]) =>
  lines.flatMap((text) => {
    const short = strengthShort(text);
    return short ? [short] : [];
  });

function strengthCard(
  steps: ProgramSessionContent["steps"],
  line: (text: string) => string,
): CardLine[] {
  return steps.flatMap((step): CardLine[] => {
    // Échauffement et retour au calme : dans la séance dépliée seulement.
    if (step.title === "Échauffement" || step.title === "Retour au calme") return [];
    if (step.repeat) {
      const lines = exercisesOf(step.repeat.lines);
      return [
        {
          kind: "repeat",
          times: step.repeat.times,
          lines: lines.length > 0 ? lines : step.repeat.lines.map(line),
        },
      ];
    }
    const exercises = exercisesOf(step.lines);
    if (step.title === "EMOM" && exercises.length > 0) {
      return [
        {
          kind: "group",
          // « EMOM · 10 min », écrit comme « Superset · 3 tours » (16/11).
          label: [step.title, step.badge].filter(Boolean).join(" · "),
          lines: exercises,
        },
      ];
    }
    if (exercises.length > 0) return exercises.map((text): CardLine => ({ kind: "line", text }));
    return [{ kind: "line", text: line(step.lines[0] ?? step.badge ?? step.title) }];
  });
}

// « 20 min @6:00 min/km, allure progressive » -> « 20 min · 6:00 /km » (l'allure écrite comme dans les
// applications de sport, Antonino le 16/11 : jamais « @ » ni une allure sans unité) ;
// « 1:45 min de récupération (trot lent) » -> « récup 1:45 (trot lent) » ;
// « 1 min de récupération Z2 · 130-145 bpm » -> « récup 1 min · Z2 · 130–145 bpm ».
export function shortLine(line: string): string {
  const recovery = /^(\S+(?: min| s)?) de (récupération|repos)(?: \(([^)]+)\))?(?:\s+(.+))?$/i.exec(
    line,
  );
  if (recovery) {
    const raw = recovery[1] ?? "";
    // « 1:45 min » s'écrit « 1:45 » (maquette) ; « 1 min » et « 30 s » gardent leur unité.
    const value = raw.includes(":") ? raw.replace(/ min$/, "") : raw;
    const word = /repos/i.test(recovery[2] ?? "") ? "repos" : "récup";
    const note = recovery[3] ? ` (${recovery[3]})` : "";
    const target = recovery[4] ? ` · ${shortLine(recovery[4])}` : "";
    return bpm(`${word} ${value}${note}${target}`);
  }
  return bpm(
    // Coupe au premier « , texte » (« 20 min @6:00 min/km, allure progressive ») mais jamais dans un
    // nombre décimal (« Run 1,5 km »), ni dans une simple liste sans mesure (« Hanches, épaules,
    // colonne », 16/11) : la coupure ne retire qu'un commentaire écrit après un chiffre.
    cutComment(line)
      .replace(/ min\/km/g, " /km")
      // « 2:10 min/500 m » -> « 2:10 /500 m ».
      .replace(/(?: min)? ?\/ ?500 ?m/g, " /500 m")
      // Une allure en tête (celle d'une récup) perd son « @ » ; ailleurs elle suit le volume : « · ».
      .replace(/^\s*@\s*/, "")
      .replace(/\s*@\s*/g, " · ")
      .trim(),
  );
}

function cutComment(line: string): string {
  const [head] = line.split(/,\s(?=\D)/);
  return head !== undefined && /\d/.test(head) ? head : line;
}

// Une ligne de séance telle qu'une carte l'écrit (cartes de l'agenda, PDF) : raccourcie, Running en
// minutes jamais en heures (règle d'Antonino du 10/11/2026, même pour une séance v1 écrite en texte :
// « 1 h 05 » -> « 65 min »), abréviations (BBJ, SDT, KB) hors Running.
export function cardText(text: string, discipline?: ProgramSessionContent["discipline"]): string {
  const line = shortLine(text);
  return discipline === "running" ? hoursToMinutes(line) : abbreviate(line);
}

export function cardLines(
  content: Pick<ProgramSessionContent, "steps"> & {
    discipline?: ProgramSessionContent["discipline"];
  },
): CardLine[] {
  const line = (text: string) => cardText(text, content.discipline);
  if (content.discipline === "strength") return strengthCard(content.steps, line);
  return content.steps.flatMap((step): CardLine[] => {
    if (step.repeat) {
      return [{ kind: "repeat", times: step.repeat.times, lines: step.repeat.lines.map(line) }];
    }
    // Hyrox : un bloc de plusieurs lignes (AMRAP, échauffement en deux temps…) garde toutes ses lignes.
    if (content.discipline === "hyrox" && step.lines.length > 1) {
      return [{ kind: "group", label: step.badge ?? step.title, lines: step.lines.map(line) }];
    }
    return [{ kind: "line", text: line(step.lines[0] ?? step.badge ?? step.title) }];
  });
}

// Une puce devant chaque exercice (demande d'Antonino du 10/11) : « 40 min », « Run 1 km »,
// « Back squat 4 × 6 », « Transition 30 s »… Une récup, un repos ou un objectif ne sont pas des
// exercices : pas de puce, ils complètent l'exercice au-dessus.
export function isExercise(text: string): boolean {
  return !/^(récup|repos|objectif)\b/i.test(text);
}

// Contraste d'une ligne (demandes d'Antonino du 10/11) : la durée ou la distance en gras (« 10 min »,
// « récup 1 min », « 800 m ») ; la plage de FC qui précise une zone en italique (« 130–145 bpm ») ;
// le reste normal. Hyrox et musculation : le mouvement ET son volume en gras (« Run 1 km » @ 6:00,
// « Sled push 50 m » · 102 kg, « BBJ 40 m », « Back squat 4 × 6 »), l'intensité (allure, charge)
// normale. Découpage pur, l'affichage choisit le style de chaque morceau.
export type LinePart = { text: string; tone: "strong" | "soft" | "plain" };

export function lineParts(text: string, discipline?: Discipline): LinePart[] {
  const parts: LinePart[] = [];
  // « 1:30 » (min:s, sans unité), « 10 min », « 800 m », « 1,5 km » ; seul en tête (ou après « récup »).
  const lead =
    /^((?:récup|repos) )?(\d+:\d{2}(?: ?(?:min|s))?|\d[\d,]*\s?(?:min|s|m|km)|\d+ h(?: \d{1,2})?)(?=\s|$)/i.exec(
      text,
    );
  let rest = text;
  if (lead) {
    if (lead[1]) parts.push({ text: lead[1], tone: "plain" });
    parts.push({ text: lead[2] ?? "", tone: "strong" });
    rest = text.slice(lead[0].length);
  } else if (discipline === "hyrox" || discipline === "strength") {
    // Tout ce qui précède l'allure (« @ ») ou la charge (« · »), s'il porte un volume.
    const cut = text.search(/ @ | · /);
    const head = cut === -1 ? text : text.slice(0, cut);
    if (/\d/.test(head) && !/^objectif\b/i.test(head)) {
      parts.push({ text: head, tone: "strong" });
      rest = text.slice(head.length);
    }
  }
  const range = /\d+–\d+\s?bpm/g;
  let at = 0;
  for (const match of rest.matchAll(range)) {
    if (match.index > at) parts.push({ text: rest.slice(at, match.index), tone: "plain" });
    parts.push({ text: match[0], tone: "soft" });
    at = match.index + match[0].length;
  }
  if (at < rest.length) parts.push({ text: rest.slice(at), tone: "plain" });
  return parts;
}

// ---------------------------------------------------------------------------
// Détail d'une séance (panneau de l'éditeur, page d'un modèle ; demande d'Antonino du 10/11) : les
// mêmes règles que les cartes de l'agenda (une info par ligne, puce devant chaque exercice, gras),
// mais en entier : noms complets (pas de BBJ), et en musculation la ligne complète avec la charge,
// le RIR et le repos.
// ---------------------------------------------------------------------------
export type DetailItem = { text: string; exercise: boolean; parts: LinePart[] | null };

// « Back squat · 4 × 6 · 40 kg · RIR 2 · repos 2:30 » : le nom, les séries × répétitions et le repos
// en gras ; la charge et le RIR normaux. null pour une ligne qui n'est pas un exercice.
export function strengthDetailParts(text: string): LinePart[] | null {
  if (!strengthShort(text)) return null;
  const parts: LinePart[] = [];
  text.split(" · ").forEach((segment, i) => {
    if (i > 0) parts.push({ text: " · ", tone: "plain" });
    const strong = i === 0 || (i === 1 && /^\d/.test(segment)) || /^repos\b/i.test(segment);
    parts.push({ text: segment, tone: strong ? "strong" : "plain" });
  });
  return parts;
}

const EXERCISE_STEPS = new Set(["Exercices", "Superset", "EMOM"]);

// Les lignes d'une étape, prêtes à afficher. Musculation : une ligne d'exercice a sa puce ; une
// consigne, « Repos 2 min en fin de tour » ou « Chaque minute… » complètent l'exercice (sans puce),
// l'échauffement et le retour au calme sont des activités (avec puce).
export function detailItems(
  step: ProgramSessionContent["steps"][number],
  discipline: ProgramSessionContent["discipline"],
): DetailItem[] {
  const lines = step.repeat ? [...step.repeat.lines, ...step.lines] : step.lines;
  return lines.map((line): DetailItem => {
    if (discipline === "strength") {
      const parts = strengthDetailParts(line);
      if (parts) return { text: line, exercise: true, parts };
      // Dans un bloc d'exercices (Exercices, Superset, EMOM), une ligne qui n'est pas un exercice le
      // complète ; ailleurs (échauffement, retour au calme, bloc texte), c'est une activité. Texte
      // libre : en normal (seule la durée d'un « Repos 1:30 min en fin de tour » passe en gras).
      return {
        text: line,
        exercise: !EXERCISE_STEPS.has(step.title),
        parts: /^repos\b/i.test(line) ? null : [{ text: line, tone: "plain" }],
      };
    }
    const text = discipline === "running" ? cardText(line, "running") : shortLine(line);
    return { text, exercise: isExercise(text), parts: null };
  });
}
