import { abbreviate, cardText } from "./card-lines";
import type { Discipline } from "./discipline";
import { hyroxStationLabels } from "./hyrox-official";
import { formatPaceRange, paceToSpeedKmh } from "./pace";
import {
  WEEKDAYS,
  hasFiche,
  pdfDayMonth,
  type PdfNav,
  type PdfProgramInput,
  type PdfSessionInput,
  type PdfWeekInput,
} from "./pdf-agenda";
import type { ProgramSessionContent } from "./program-session";
import type { PublishedSession, StrengthContent, StrengthExercise } from "./session-v2";
import {
  ergLabels,
  formatKg,
  formatMinutes,
  formatSeconds,
  hyroxFormatLabels,
  runRoleLabels,
} from "./session-view";

// PDF 2 « Fiches et repères » (handoff 12_PDF_SYSTEM, maquettes PDF-08, PDF-02, PDF-06, PDF-07) :
// le détail des séances que l'agenda renvoie ici, et les allures du programme. Tiré de la VERSION
// PUBLIÉE. Fonctions pures, testées par Vitest ; le document React-PDF ne fait que mettre en page.
//
// - Musculation : une fiche par séance (même nom d'une semaine à l'autre) : échauffement, tableau des
//   exercices (séries, répétitions, repos, commentaire ; A1/A2 pour un superset ; EMOM sur une ligne),
//   retour au calme, conseil, puis les CHARGES SEMAINE PAR SEMAINE (décision d'Antonino du 10/11).
// - Hyrox : un « workload » par séance trop longue pour une carte : une carte par semaine, ses blocs
//   numérotés (Échauffement, 3 tours, AMRAP 20 min…).
// - Allures : celles figées dans les séances (course en min/km, ergomètres en min/500 m), avec la
//   vitesse et les séances qui les utilisent.
// - Une fiche trop longue continue sur la page suivante, « Nom (suite) », même barre ‹ ›.

const PAGE_AVAILABLE = 600; // place sous le titre de la page (≈ 628 px), avec une marge de sécurité
const GAP = 12;

export type FicheTone = "strength" | "hyrox" | "paces";

export type FicheTableRow =
  | {
      kind: "exercise";
      tag: string | null;
      name: string;
      sets: string;
      reps: string;
      rest: string;
      comment: string;
    }
  | { kind: "span"; tag: null; name: string; text: string };

export type FicheBlock = { n: number; title: string; lines: string[] };

export type PaceRow = { label: string; pace: string; speed: string; usedFor: string };

export type FicheSection =
  | { kind: "text"; label: string; text: string }
  | { kind: "table"; title: string; rows: FicheTableRow[] }
  | { kind: "charges"; title: string; columns: string[]; rows: { week: string; cells: string[] }[] }
  | { kind: "blocks"; blocks: FicheBlock[] }
  | {
      kind: "workload";
      week: string;
      date: string;
      title: string;
      tag: string;
      current: boolean;
      blocks: FicheBlock[];
    }
  | { kind: "paces"; rows: PaceRow[] }
  | { kind: "tip"; label: string; text: string };

type PageBase = { anchor: string; nav: PdfNav; bookmark: string; pageNumber: number };
export type FichesTocRow = {
  title: string;
  subtitle: string;
  page: number;
  tone: FicheTone;
  anchor: string;
};
export type FichesTocPage = PageBase & {
  kind: "toc";
  title: string;
  subtitle: string;
  rows: FichesTocRow[];
  note: string;
};
export type FichePage = PageBase & {
  kind: "fiche";
  tone: FicheTone;
  kicker: string;
  title: string;
  subtitle: string;
  sections: FicheSection[];
};
export type FichesPdf = {
  documentTitle: string;
  fileName: string;
  headerTitle: string;
  headerSubtitle: string;
  footer: string;
  pages: (FichesTocPage | FichePage)[];
};

// ---------------------------------------------------------------------------
// Regroupement : une fiche par séance (discipline + nom), dans l'ordre du programme.
// ---------------------------------------------------------------------------
type Occurrence = { week: PdfWeekInput; session: PdfSessionInput };
type Group = { discipline: Discipline; title: string; occurrences: Occurrence[] };

function ficheGroups(weeks: PdfWeekInput[]): Group[] {
  const groups = new Map<string, Group>();
  for (const week of weeks) {
    for (const session of week.sessions) {
      if (!hasFiche(session.content)) continue;
      const discipline = session.content.discipline ?? "hybrid";
      const key = `${discipline}:${session.content.title}`;
      const group = groups.get(key) ?? {
        discipline,
        title: session.content.title,
        occurrences: [],
      };
      group.occurrences.push({ week, session });
      groups.set(key, group);
    }
  }
  const order: Discipline[] = ["strength", "hyrox", "running", "hybrid"];
  return [...groups.values()].sort(
    (a, b) => order.indexOf(a.discipline) - order.indexOf(b.discipline),
  );
}

// « Toutes les semaines », « Semaines impaires », « Semaines 1 à 8 », « Semaine 11 », « Semaines 2, 5, 9 ».
export function weeksText(indexes: number[], weeksCount: number): string {
  const sorted = [...new Set(indexes)].sort((a, b) => a - b);
  if (sorted.length === 1) return `Semaine ${sorted[0]}`;
  if (sorted.length === weeksCount) return "Toutes les semaines";
  const odd = Array.from({ length: Math.ceil(weeksCount / 2) }, (_, i) => 2 * i + 1);
  const even = Array.from({ length: Math.floor(weeksCount / 2) }, (_, i) => 2 * i + 2);
  const same = (list: number[]) =>
    list.length === sorted.length && list.every((value, i) => value === sorted[i]);
  if (weeksCount > 2 && same(odd)) return "Semaines impaires";
  if (weeksCount > 2 && same(even)) return "Semaines paires";
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  if (last - first + 1 === sorted.length) return `Semaines ${first} à ${last}`;
  return `Semaines ${sorted.join(", ")}`;
}

const weekdayLower: Record<string, string> = {
  mon: "lundi",
  tue: "mardi",
  wed: "mercredi",
  thu: "jeudi",
  fri: "vendredi",
  sat: "samedi",
  sun: "dimanche",
};

// Jour de la séance, s'il est le même chaque semaine : « mercredi », « mardi avec le coach ».
function dayText(occurrences: Occurrence[]): string | null {
  const days = new Set(occurrences.map((o) => o.session.day));
  const [day] = [...days];
  if (days.size !== 1 || !day) return null;
  const coach = occurrences.every((o) => o.session.coachDate !== null);
  return `${weekdayLower[day]}${coach ? " avec le coach" : ""}`;
}

function durationText(occurrences: Occurrence[]): string {
  const minutes = occurrences.map((o) => o.session.content.durationMinutes);
  const min = Math.min(...minutes);
  const max = Math.max(...minutes);
  return min === max ? `≈ ${formatMinutes(min * 60)}` : `≈ ${min}–${max} min`;
}

// Date de la séance dans sa semaine (jour fixé ou rendez-vous du coach), sinon le lundi.
function sessionDate(week: PdfWeekInput, session: PdfSessionInput): string {
  if (session.coachDate) return session.coachDate;
  const offset = session.day ? WEEKDAYS.indexOf(session.day) : 0;
  const date = new Date(`${week.monday}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Blocs numérotés (workload Hyrox, et fiche d'une séance v1 en texte)
// ---------------------------------------------------------------------------
export function blocksOf(content: ProgramSessionContent): FicheBlock[] {
  // Lu à l'appel, pas au chargement du module (dépendance circulaire avec session-view).
  const formatLabels = new Set(Object.values(hyroxFormatLabels));
  return content.steps.map((step, i) => {
    const generic = formatLabels.has(step.title);
    const title = step.repeat
      ? step.badge && !generic
        ? `${step.title} · ${step.badge}`
        : `${step.repeat.times} tours`
      : step.badge
        ? generic
          ? step.badge
          : `${step.title} · ${step.badge}`
        : step.title;
    const lines = step.repeat ? [...step.repeat.lines, ...step.lines] : step.lines;
    return { n: i + 1, title, lines: lines.map((line) => cardText(line, content.discipline)) };
  });
}

// ---------------------------------------------------------------------------
// Musculation
// ---------------------------------------------------------------------------
const repsOf = (exercise: StrengthExercise) => {
  const work = exercise.sets.filter((set) => set.type === "normal");
  const sets = work.length > 0 ? work : exercise.sets;
  const reps = sets.map((set) =>
    set.repsMax !== undefined && set.repsMax !== set.repsMin
      ? `${set.repsMin}-${set.repsMax}`
      : `${set.repsMin}`,
  );
  return { count: sets.length, reps: new Set(reps).size === 1 ? reps[0]! : reps.join("-") };
};

const restText = (seconds?: number) =>
  seconds ? formatSeconds(seconds).replace(/^(\d+:\d{2}) min$/, "$1") : "—";

function commentOf(exercise: StrengthExercise): string {
  const work = exercise.sets.filter((set) => set.type === "normal");
  const rirs = new Set(work.map((set) => set.rir));
  const [rir] = [...rirs];
  return (
    [
      rirs.size === 1 && rir !== undefined ? `RIR ${rir}` : null,
      exercise.tempo ? `tempo ${exercise.tempo}` : null,
      exercise.cue ?? null,
    ]
      .filter(Boolean)
      .join(" · ") || "—"
  );
}

// Charge d'un exercice : « 40 kg », « 40-45 kg », « 70 % » (sans max connu), « — » sans charge.
export function loadText(exercise: StrengthExercise): string {
  const work = exercise.sets.filter((set) => set.type === "normal");
  const kgs = work.map((set) => set.kg).filter((kg): kg is number => kg !== undefined && kg > 0);
  if (kgs.length > 0) {
    const min = Math.min(...kgs);
    const max = Math.max(...kgs);
    return min === max ? formatKg(min) : `${String(min).replace(".", ",")}-${formatKg(max)}`;
  }
  const pcts = [...new Set(work.map((set) => set.pct).filter((pct) => pct !== undefined))];
  return pcts.length > 0 ? `${pcts.join("-")} %` : "—";
}

type Entry = { exercise: StrengthExercise; scheme: string };

// Les exercices d'une séance dans l'ordre, avec leur schéma (« 4 × 6 », « 10 » dans un superset).
function entries(content: StrengthContent): Entry[] {
  return content.items.flatMap((item): Entry[] => {
    if (item.kind === "exercise") {
      const { count, reps } = repsOf(item);
      return [{ exercise: item, scheme: `${count} × ${reps}` }];
    }
    if (item.kind === "superset" || item.kind === "emom") {
      return item.exercises.map((exercise) => ({ exercise, scheme: repsOf(exercise).reps }));
    }
    return [];
  });
}

function strengthTable(content: StrengthContent): FicheTableRow[] {
  let superset = 0;
  return content.items.flatMap((item): FicheTableRow[] => {
    if (item.kind === "exercise") {
      const { count, reps } = repsOf(item);
      return [
        {
          kind: "exercise",
          tag: null,
          name: item.name,
          sets: String(count),
          reps,
          rest: restText(item.restSec),
          comment: commentOf(item),
        },
      ];
    }
    if (item.kind === "superset") {
      const letter = String.fromCharCode(65 + superset++);
      return item.exercises.map((exercise, i) => ({
        kind: "exercise",
        tag: `${letter}${i + 1}`,
        name: exercise.name,
        sets: String(item.rounds),
        reps: repsOf(exercise).reps,
        // Repos après le dernier exercice du tour (maquette : « — » sur A1, « 90 s » sur A2).
        rest: i === item.exercises.length - 1 ? restText(item.restSec) : "—",
        comment: commentOf(exercise),
      }));
    }
    if (item.kind === "emom") {
      const work = item.workSec
        ? ` · ${item.workSec} s de travail · ${60 - item.workSec} s de repos`
        : " · au début de chaque minute";
      return [
        {
          kind: "span",
          tag: null,
          name: item.exercises.map((exercise) => exercise.name).join(" + "),
          text: `EMOM ${item.minutes} min · ${item.exercises
            .map((exercise) => `${repsOf(exercise).reps} répét.`)
            .join(" + ")}${work}`,
        },
      ];
    }
    return [{ kind: "span", tag: null, name: item.title, text: item.lines.join(" · ") || "—" }];
  });
}

const MAX_CHARGE_COLUMNS = 6;

// Charges semaine par semaine : une ligne par semaine, une colonne par exercice (nom court). Un
// schéma différent de celui de la fiche s'écrit devant la charge (« 3 × 6 · 40 kg », semaine allégée).
function chargesSections(occurrences: Occurrence[], base: Entry[]): FicheSection[] {
  const rows = occurrences.map(({ week, session }) => {
    const published = session.published?.content;
    const own = published?.discipline === "strength" ? entries(published) : [];
    return {
      week: `Semaine ${week.index} · ${pdfDayMonth(sessionDate(week, session))}`,
      cells: base.map((entry, i) => {
        const match = own[i]?.exercise.name === entry.exercise.name ? own[i] : undefined;
        const found =
          match ?? own.find((candidate) => candidate.exercise.name === entry.exercise.name);
        if (!found) return "—";
        const load = loadText(found.exercise);
        return found.scheme !== entry.scheme ? `${found.scheme} · ${load}` : load;
      }),
    };
  });
  // Aucune charge nulle part (poids du corps) : pas de tableau.
  if (rows.every((row) => row.cells.every((cell) => cell === "—"))) return [];
  const sections: FicheSection[] = [];
  for (let start = 0; start < base.length; start += MAX_CHARGE_COLUMNS) {
    sections.push({
      kind: "charges",
      title: "Charges semaine par semaine",
      columns: base
        .slice(start, start + MAX_CHARGE_COLUMNS)
        .map((entry) => abbreviate(entry.exercise.name)),
      rows: rows.map((row) => ({
        week: row.week,
        cells: row.cells.slice(start, start + MAX_CHARGE_COLUMNS),
      })),
    });
  }
  return sections;
}

function strengthSections(group: Group): FicheSection[] {
  const first = group.occurrences[0]!.session;
  const content = first.published?.content;
  if (content?.discipline !== "strength") {
    // Séance v1 (texte) : ses blocs numérotés.
    return [{ kind: "blocks", blocks: blocksOf(first.content) }];
  }
  const hasSuperset = content.items.some((item) => item.kind === "superset");
  const tip = [
    hasSuperset
      ? "A1 + A2 = superset : enchaîne les exercices, le repos vient après le dernier."
      : null,
    first.published?.coachTip ?? null,
  ]
    .filter(Boolean)
    .join(" ");
  return [
    ...(content.warmup
      ? [{ kind: "text", label: "Échauffement", text: content.warmup } as const]
      : []),
    { kind: "table", title: "Musculation", rows: strengthTable(content) },
    ...(content.cooldown
      ? [{ kind: "text", label: "Retour au calme", text: content.cooldown } as const]
      : []),
    ...(tip ? [{ kind: "tip", label: "Conseil", text: tip } as const] : []),
    ...chargesSections(group.occurrences, entries(content)),
  ];
}

// ---------------------------------------------------------------------------
// Workload Hyrox
// ---------------------------------------------------------------------------
function workloadSections(group: Group, today: string): FicheSection[] {
  return group.occurrences.map(({ week, session }) => {
    const current = today >= week.monday && today <= week.sunday;
    return {
      kind: "workload",
      week: `Semaine ${week.index}`,
      date: pdfDayMonth(sessionDate(week, session)),
      title: session.headline,
      tag: current ? "cette semaine" : today > week.sunday ? "passée" : "à venir",
      current,
      blocks: blocksOf(session.content),
    };
  });
}

// ---------------------------------------------------------------------------
// Allures
// ---------------------------------------------------------------------------
const speed = (secPerKm: number) => String(paceToSpeedKmh(secPerKm)).replace(".", ",");

type PaceEntry = { label: string; sort: number; pace: string; speed: string; used: Set<string> };

export function paceRows(sessions: PublishedSession[]): PaceRow[] {
  const found = new Map<string, PaceEntry>();
  const add = (key: string, entry: Omit<PaceEntry, "used">, title: string) => {
    const current = found.get(key) ?? { ...entry, used: new Set<string>() };
    current.used.add(title);
    found.set(key, current);
  };
  for (const session of sessions) {
    const { content, title } = session;
    if (content.discipline === "running") {
      const steps = content.items.flatMap((item) =>
        item.kind === "step" ? [item] : item.kind === "repeat" ? item.steps : [],
      );
      for (const step of steps) {
        if (step.target?.kind !== "pace") continue;
        const { fromSecPerKm: from, toSecPerKm: to } = step.target;
        add(
          `run:${from}:${to}`,
          {
            label: step.label ?? runRoleLabels[step.role],
            sort: to,
            pace: formatPaceRange(from, to).replace("–", " – "),
            speed: from === to ? `${speed(from)} km/h` : `${speed(to)} – ${speed(from)} km/h`,
          },
          title,
        );
      }
    }
    if (content.discipline === "hyrox") {
      for (const block of content.items) {
        if (block.kind !== "block") continue;
        for (const line of block.lines) {
          if (line.kind === "run" && line.paceSecPerKm) {
            add(
              `run:${line.paceSecPerKm}:${line.paceSecPerKm}`,
              {
                label: "Run Hyrox",
                sort: line.paceSecPerKm,
                pace: formatPaceRange(line.paceSecPerKm, line.paceSecPerKm),
                speed: `${speed(line.paceSecPerKm)} km/h`,
              },
              title,
            );
          }
          if ((line.kind === "erg" || line.kind === "station") && line.pacePer500m) {
            const label =
              line.kind === "erg" ? ergLabels[line.machine] : hyroxStationLabels[line.station];
            add(
              `erg:${label}:${line.pacePer500m}`,
              {
                label,
                // Après les allures de course, du plus lent au plus rapide.
                sort: -1000 + line.pacePer500m,
                pace: `${formatPaceRange(line.pacePer500m, line.pacePer500m)} /500 m`,
                speed: "—",
              },
              title,
            );
          }
        }
      }
    }
  }
  return [...found.values()]
    .sort((a, b) => b.sort - a.sort)
    .map((entry) => ({
      label: entry.label,
      pace: entry.pace,
      speed: entry.speed,
      usedFor: [...entry.used].join(", "),
    }));
}

// ---------------------------------------------------------------------------
// Mise en pages : une fiche trop longue continue sur la page suivante (« (suite) »).
// ---------------------------------------------------------------------------
const lines = (text: string, perLine: number) => Math.max(1, Math.ceil(text.length / perLine));

// Hauteurs en px de maquette, calées sur le rendu réel (mesures dans les PDF d'Anaïs, 10/11) : un
// écart d'estimation pousse le pied de page sur une page de plus.
const BLOCK_PITCH = 11 * 1.3 + 1; // ligne d'un bloc de workload (interligne 1,3, écart 1)
const blocksHeight = (blocks: FicheBlock[]) =>
  12 +
  blocks.reduce((sum, block) => sum + BLOCK_PITCH * (1 + block.lines.length), 0) +
  4 * Math.max(0, blocks.length - 1);

// En-tête du tableau des charges : les noms d'exercice passent à la ligne dans leur colonne.
function chargesHeaderLines(columns: string[]): number {
  const width = 546 / (1.7 + columns.length) - 8;
  const perLine = Math.max(4, Math.floor(width / 7.3));
  return Math.max(1, ...columns.map((column) => lines(column, perLine)));
}

export function sectionHeight(section: FicheSection): number {
  switch (section.kind) {
    case "text":
      return lines(`${section.label} — ${section.text}`, 92) * 18;
    case "tip":
      return 20 + lines(section.text, 76) * 16.8;
    case "table":
      return (
        28 +
        section.rows.reduce(
          (sum, row) =>
            sum +
            (row.kind === "span"
              ? 30 + 15 * (lines(row.text, 46) - 1)
              : (row.tag ? 34 : 30) +
                15 * (Math.max(lines(row.name, 26), lines(row.comment, 22)) - 1)),
          0,
        )
      );
    case "charges":
      return 24 + 15 + 12.5 * chargesHeaderLines(section.columns) + section.rows.length * 24;
    case "blocks":
      return 2 + blocksHeight(section.blocks);
    case "workload":
      return 2 + 24 + blocksHeight(section.blocks);
    case "paces":
      return 28 + section.rows.reduce((sum, row) => sum + 17.5 + 15.5 * lines(row.usedFor, 24), 0);
  }
}

// Coupe un tableau trop long pour la place qui reste ; null s'il ne se coupe pas.
function splitSection(section: FicheSection, room: number): [FicheSection, FicheSection] | null {
  if (section.kind !== "table" && section.kind !== "charges" && section.kind !== "paces") {
    return null;
  }
  const rows = section.rows as unknown[];
  for (let keep = rows.length - 1; keep >= 1; keep--) {
    const head = { ...section, rows: rows.slice(0, keep) } as FicheSection;
    if (sectionHeight(head) <= room) {
      return [head, { ...section, rows: rows.slice(keep) } as FicheSection];
    }
  }
  return null;
}

export function paginate(sections: FicheSection[]): FicheSection[][] {
  const pages: FicheSection[][] = [];
  let page: FicheSection[] = [];
  let used = 0;
  const queue = [...sections];
  while (queue.length > 0) {
    const section = queue.shift()!;
    const height = sectionHeight(section);
    const gap = page.length > 0 ? GAP : 0;
    if (used + gap + height <= PAGE_AVAILABLE || page.length === 0) {
      // Une section seule plus haute qu'une page se coupe si elle le peut.
      if (page.length === 0 && height > PAGE_AVAILABLE) {
        const split = splitSection(section, PAGE_AVAILABLE);
        if (split) {
          pages.push([split[0]]);
          queue.unshift(split[1]);
          continue;
        }
      }
      page.push(section);
      used += gap + height;
      continue;
    }
    const split = splitSection(section, PAGE_AVAILABLE - used - gap);
    if (split) {
      page.push(split[0]);
      queue.unshift(split[1]);
    } else {
      queue.unshift(section);
    }
    pages.push(page);
    page = [];
    used = 0;
  }
  if (page.length > 0) pages.push(page);
  return pages;
}

// ---------------------------------------------------------------------------
// Le document
// ---------------------------------------------------------------------------
type Fiche = {
  name: string;
  tone: FicheTone;
  kicker: string;
  subtitle: string;
  tocSubtitle: string;
  sections: FicheSection[];
};

const slug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "fiche";

export function fichesPdf(input: PdfProgramInput): FichesPdf {
  const fiches: Fiche[] = [];
  for (const group of ficheGroups(input.weeks)) {
    const first = group.occurrences[0]!.session;
    const weeks = weeksText(
      group.occurrences.map((o) => o.week.index),
      input.weeksCount,
    );
    const day = dayText(group.occurrences);
    const subtitle = [weeks, durationText(group.occurrences), day].filter(Boolean).join(" · ");
    if (group.discipline === "strength") {
      const sections = strengthSections(group);
      const table = sections.find((section) => section.kind === "table");
      const count = table?.kind === "table" ? table.rows.length : 0;
      fiches.push({
        name: group.title,
        tone: "strength",
        kicker: `Musculation · ${first.content.sessionType}`,
        subtitle,
        tocSubtitle: ["Musculation", weeks.toLowerCase(), count ? `${count} exercices` : null]
          .filter(Boolean)
          .join(" · "),
        sections,
      });
    } else {
      fiches.push({
        name: group.title,
        tone: "hyrox",
        kicker: `${group.discipline === "hyrox" ? "Hyrox" : "Séance"} · ${first.content.sessionType}`,
        subtitle:
          group.occurrences.length > 1
            ? `${day ? `La séance du ${day.replace(" avec le coach", "")}` : "La séance"} évolue chaque semaine · ${durationText(group.occurrences)}`
            : subtitle,
        tocSubtitle: `Hyrox · ${weeks.toLowerCase()}`,
        sections: workloadSections(group, input.today),
      });
    }
  }
  const paces = paceRows(
    input.weeks.flatMap((week) =>
      week.sessions.flatMap((session) => (session.published ? [session.published] : [])),
    ),
  );
  if (paces.length > 0) {
    fiches.push({
      name: "Allures",
      tone: "paces",
      kicker: "Repères",
      subtitle: "Les allures de ce programme, telles que publiées",
      tocSubtitle: "Repères · allures de course et ergomètres",
      sections: [
        { kind: "paces", rows: paces },
        {
          kind: "tip",
          label: "À retenir",
          text: "Course en min/km ; SkiErg et rameur en min/500 m.",
        },
      ],
    });
  }

  // Pages : le sommaire, puis chaque fiche (une ou plusieurs pages).
  const used = new Set<string>();
  const laidOut = fiches.map((fiche, index) => {
    let anchor = `sheet-${slug(fiche.name)}`;
    for (let n = 2; used.has(anchor); n++) anchor = `sheet-${slug(fiche.name)}-${n}`;
    used.add(anchor);
    return { fiche, index, anchor, pages: paginate(fiche.sections) };
  });
  const order: { anchor: string; label: string; ficheIndex: number | null }[] = [
    { anchor: "toc", label: "Sommaire", ficheIndex: null },
    ...laidOut.flatMap(({ fiche, index, anchor, pages }) =>
      pages.map((_, p) => ({
        anchor: p === 0 ? anchor : `${anchor}-suite-${p}`,
        // Les boutons ‹ › nomment la page voisine : « Force bas du corps (suite) ».
        label: p === 0 ? fiche.name : `${fiche.name} (suite)`,
        ficheIndex: index,
      })),
    ),
  ];
  const pageOf = new Map(order.map((page, i) => [page.anchor, i + 1]));
  const nav = (i: number, current: string): PdfNav => ({
    prev: i > 0 ? { anchor: order[i - 1]!.anchor, label: order[i - 1]!.label } : null,
    current: { label: current, anchor: "toc" },
    next:
      i < order.length - 1 ? { anchor: order[i + 1]!.anchor, label: order[i + 1]!.label } : null,
  });

  const toc: FichesTocPage = {
    kind: "toc",
    anchor: "toc",
    nav: nav(0, "Sommaire"),
    bookmark: "Sommaire",
    pageNumber: 1,
    title: "Fiches et repères",
    subtitle: "Le détail des séances renvoyées par l'agenda, et tes allures",
    rows: laidOut.map(({ fiche, anchor }) => ({
      title: fiche.name,
      subtitle: fiche.tocSubtitle,
      page: pageOf.get(anchor) ?? 0,
      tone: fiche.tone,
      anchor,
    })),
    note:
      laidOut.length > 0
        ? "Touche une fiche pour y aller. Les séances de l'agenda renvoient à ces fiches."
        : "Ce programme n'a pas de fiche : toutes ses séances sont détaillées dans l'agenda.",
  };

  const total = laidOut.length;
  const ficheNumber = new Map(laidOut.map(({ index }, i) => [index, i + 1]));
  const pages: FichePage[] = [];
  for (const { fiche, index, anchor, pages: chunks } of laidOut) {
    chunks.forEach((sections, p) => {
      const pageAnchor = p === 0 ? anchor : `${anchor}-suite-${p}`;
      const i = order.findIndex((entry) => entry.anchor === pageAnchor);
      pages.push({
        kind: "fiche",
        anchor: pageAnchor,
        nav: nav(i, `${fiche.name} · ${ficheNumber.get(index)} sur ${total}`),
        bookmark: p === 0 ? fiche.name : `${fiche.name} (suite)`,
        pageNumber: i + 1,
        tone: fiche.tone,
        kicker: fiche.kicker,
        title: p === 0 ? fiche.name : `${fiche.name} (suite)`,
        subtitle: fiche.subtitle,
        sections,
      });
    });
  }

  const header = `${input.title} · ${input.athleteName}`;
  return {
    documentTitle: `${header} · Fiches et repères`,
    fileName: `Fiches et repères - ${input.title} - ${input.athleteName} - v${input.version}.pdf`,
    headerTitle: header,
    headerSubtitle: "Fiches et repères",
    footer: `Coory · ${input.coachName} · Version ${input.version}`,
    pages: [toc, ...pages],
  };
}
