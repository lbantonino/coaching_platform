import { cardLines, type CardLine } from "./card-lines";
import type { Discipline } from "./discipline";
import type { ProgramSessionContent } from "./program-session";
import type { PublishedSession, Weekday } from "./session-v2";
import { formatMinutes } from "./session-view";

// PDF 1 « Agenda du programme » (handoff 12_PDF_SYSTEM, maquette CooryPdfDoc, phase 5) : un sommaire
// puis une page par semaine, tirés de la VERSION PUBLIÉE. Ce module construit le contenu de chaque
// page (textes, liens ‹ ›, jours, cartes) sans rien dessiner : le document React-PDF ne fait que le
// mettre en page. Fonctions pures, testées par Vitest.
//
// Règles :
// - une semaine = une page ; si elle déborde, les séances les plus longues passent à 3 lignes puis
//   « → détail dans Coory » (règle du handoff), jamais une carte coupée sur deux pages ;
// - la musculation, et un bloc Hyrox de plus de 4 lignes, ont leur fiche dans le PDF 2 « Fiches et
//   repères » : l'agenda écrit leur résumé et le renvoi (texte, un lien entre deux fichiers ne marche
//   pas sur téléphone) ;
// - les lignes suivent les règles des cartes de l'agenda de l'app (card-lines.ts : Running en
//   minutes, une info par ligne, puces, gras et italique).

// Mesures de la maquette (620 × 877 px pour une page A4), servant à estimer la hauteur d'une semaine.
const LINE = 15.4; // texte 11 px, interligne 1,4
const CARD_CHROME = 2 + 25 + 12; // bordures, en-tête de la carte, marges du corps
const DAY_GAP = 6;
const DAY_MIN = 30;
// Place laissée aux jours sous le titre de la semaine (≈ 628 px), avec une marge de sécurité.
const DAYS_AVAILABLE = 600;
// Au-delà, une ligne passe à la ligne dans une carte (≈ 67 signes sur 440 px en 11 px).
const CHARS_PER_LINE = 62;
const TOC_ROWS_PER_PAGE = 12;

export const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const weekdayNames: Record<Weekday, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

export type PdfSessionInput = {
  content: ProgramSessionContent;
  // Résumé d'une ligne (« 3 tours · 43 min », « 5 exercices »).
  headline: string;
  day: Weekday | null;
  time: string | null;
  coachDate: string | null;
  // Séance structurée (v2) publiée, pour les fiches ; null en v1.
  published: PublishedSession | null;
};

export type PdfWeekInput = {
  index: number;
  // Nom de la phase (« Base »), si le coach l'a nommée.
  label: string | null;
  light: boolean;
  monday: string;
  sunday: string;
  // Jours fixés par le coach, ou « dans l'ordre » (le sportif choisit ses jours).
  fixed: boolean;
  sessions: PdfSessionInput[];
};

export type PdfProgramInput = {
  title: string;
  athleteName: string;
  coachName: string;
  version: number;
  startDate: string;
  weeksCount: number;
  sessionsPerWeek: number | null;
  race: { name: string; date: string | null } | null;
  weeks: PdfWeekInput[];
  // Aujourd'hui (Bruxelles) : la semaine en cours est surlignée dans le sommaire.
  today: string;
};

export type PdfNavLink = { label: string; anchor: string };
export type PdfNav = { prev: PdfNavLink | null; current: PdfNavLink; next: PdfNavLink | null };

export type AgendaSessionView = {
  discipline: Discipline;
  title: string;
  // À droite de l'en-tête : « coach · 10:00 », « ≈ 55 min ».
  meta: string;
  lines: CardLine[];
  // Séance qui a sa fiche : son résumé en gras, puis le renvoi.
  fiche: { summary: string } | null;
  // Séance raccourcie pour tenir sur la page : « → détail dans Coory ».
  cut: boolean;
};

export type AgendaDayView = { label: string; date: string | null; sessions: AgendaSessionView[] };

export type AgendaTocRow = {
  title: string;
  subtitle: string;
  tag: string;
  page: number;
  // Rang de la phase (0 = première), pour sa couleur ; null sans phase.
  phase: number | null;
  current: boolean;
  anchor: string;
};

type PageBase = { anchor: string; nav: PdfNav; bookmark: string; pageNumber: number };
export type AgendaTocPage = PageBase & {
  kind: "toc";
  title: string;
  subtitle: string;
  rows: AgendaTocRow[];
  note: string | null;
};
export type AgendaWeekPage = PageBase & {
  kind: "week";
  kicker: string;
  title: string;
  subtitle: string;
  badge: string;
  days: AgendaDayView[];
};
export type AgendaPage = AgendaTocPage | AgendaWeekPage;

export type AgendaPdf = {
  documentTitle: string;
  fileName: string;
  headerTitle: string;
  headerSubtitle: string;
  footer: string;
  hasFiches: boolean;
  pages: AgendaPage[];
};

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------
const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dayMonthYear = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export const pdfDayMonth = (iso: string) => dayMonth.format(utc(iso));
export const pdfDayMonthYear = (iso: string) => dayMonthYear.format(utc(iso));

function addDays(iso: string, days: number): string {
  const date = utc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Séances
// ---------------------------------------------------------------------------
export function cardLineCount(lines: CardLine[]): number {
  return lines.reduce(
    (count, line) => count + (line.kind === "line" ? 1 : 1 + line.lines.length),
    0,
  );
}

// La séance a-t-elle sa fiche dans « Fiches et repères » ? Toute la musculation (tableau des
// exercices et charges semaine par semaine, décision d'Antonino du 10/11), et un bloc Hyrox trop
// long pour une carte (circuit, AMRAP, simulation : son workload semaine par semaine).
export function hasFiche(content: ProgramSessionContent): boolean {
  if (content.discipline === "strength") return content.steps.length > 0;
  if (content.discipline === "hyrox") return cardLineCount(cardLines(content)) > 4;
  return false;
}

function sessionMeta(session: PdfSessionInput): string {
  const time = session.time ? session.time.slice(0, 5) : null;
  if (session.coachDate) return time ? `coach · ${time}` : "avec le coach";
  // En minutes pour toutes les disciplines, comme la maquette (« ≈ 54 min ») ; pour le Running c'est
  // aussi la règle d'Antonino du 10/11/2026 (jamais en heures).
  const duration = `≈ ${formatMinutes(session.content.durationMinutes * 60)}`;
  return time ? `${time} · ${duration}` : duration;
}

function sessionView(session: PdfSessionInput, raceDate: string | null, date: string | null) {
  const { content } = session;
  const race = raceDate !== null && date === raceDate;
  const fiche = hasFiche(content);
  return {
    discipline: content.discipline ?? "hybrid",
    title: `${race ? "★ " : ""}${content.title}`,
    meta: sessionMeta(session),
    lines: fiche ? [] : cardLines(content),
    fiche: fiche ? { summary: session.headline } : null,
    cut: false,
  } satisfies AgendaSessionView;
}

// Une ligne longue passe à la ligne dans la carte : elle compte double.
function visualLines(lines: CardLine[]): number {
  const one = (text: string) => (text.length > CHARS_PER_LINE ? 2 : 1);
  return lines.reduce(
    (count, line) =>
      count +
      (line.kind === "line"
        ? one(line.text)
        : 1 + line.lines.reduce((sum, text) => sum + one(text), 0)),
    0,
  );
}

function sessionLines(session: AgendaSessionView): number {
  if (session.fiche) return 2;
  return visualLines(session.lines) + (session.cut ? 1 : 0);
}

const cardHeight = (session: AgendaSessionView) => {
  const lines = sessionLines(session);
  return CARD_CHROME + lines * LINE + Math.max(0, lines - 1);
};

export function estimateDaysHeight(days: AgendaDayView[]): number {
  const rows = days.map((day) =>
    day.sessions.length === 0
      ? DAY_MIN
      : Math.max(
          DAY_MIN,
          day.sessions.reduce((sum, session) => sum + cardHeight(session), 0) +
            DAY_GAP * (day.sessions.length - 1),
        ),
  );
  return rows.reduce((sum, height) => sum + height, 0) + DAY_GAP * Math.max(0, rows.length - 1);
}

// Garde les `max` premières lignes d'une séance (un bloc répété compte son en-tête).
export function firstLines(lines: CardLine[], max: number): CardLine[] {
  const kept: CardLine[] = [];
  let left = max;
  for (const line of lines) {
    if (left <= 0) break;
    if (line.kind === "line") {
      kept.push(line);
      left -= 1;
      continue;
    }
    // Un en-tête de bloc sans au moins une ligne ne se lit pas : on s'arrête avant.
    if (left < 2) break;
    const inner = line.lines.slice(0, left - 1);
    kept.push({ ...line, lines: inner });
    left -= 1 + inner.length;
  }
  return kept;
}

// Une semaine trop chargée pour sa page : les séances les plus longues passent à 3 lignes, puis à
// 1 ligne si besoin, chacune suivie de « → détail dans Coory ».
export function fitWeek(days: AgendaDayView[]): AgendaDayView[] {
  let fitted = days;
  for (const max of [3, 1]) {
    if (estimateDaysHeight(fitted) <= DAYS_AVAILABLE) return fitted;
    const candidates = fitted
      .flatMap((day) => day.sessions)
      .filter((session) => !session.fiche && cardLineCount(session.lines) > max)
      .sort((a, b) => sessionLines(b) - sessionLines(a));
    for (const target of candidates) {
      fitted = fitted.map((day) => ({
        ...day,
        sessions: day.sessions.map((session) =>
          session === target
            ? { ...session, lines: firstLines(session.lines, max), cut: true }
            : session,
        ),
      }));
      if (estimateDaysHeight(fitted) <= DAYS_AVAILABLE) return fitted;
    }
  }
  return fitted;
}

function weekDays(week: PdfWeekInput, raceDate: string | null): AgendaDayView[] {
  if (!week.fixed) {
    // Dans l'ordre : une ligne par séance (« Séance 1 »…), datée seulement si elle est avec le coach.
    return week.sessions.map((session, i) => ({
      label: `Séance ${i + 1}`,
      date: session.coachDate ? pdfDayMonth(session.coachDate) : null,
      sessions: [sessionView(session, raceDate, session.coachDate)],
    }));
  }
  // Jours fixés : les 7 jours (« Repos » sans séance). Une séance restée sans jour garde sa place à
  // la fin, sous « Au choix ».
  const days: AgendaDayView[] = WEEKDAYS.map((weekday, i) => {
    const date = addDays(week.monday, i);
    return {
      label: weekdayNames[weekday],
      date: pdfDayMonth(date),
      sessions: week.sessions
        .filter((session) => session.day === weekday)
        .map((session) => sessionView(session, raceDate, date)),
    };
  });
  const free = week.sessions.filter((session) => session.day === null);
  if (free.length > 0) {
    days.push({
      label: "Au choix",
      date: null,
      sessions: free.map((session) => sessionView(session, raceDate, null)),
    });
  }
  return days;
}

// ---------------------------------------------------------------------------
// Le document
// ---------------------------------------------------------------------------
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

export function agendaPdf(input: PdfProgramInput): AgendaPdf {
  const raceDate = input.race?.date ?? null;
  const phases = [...new Set(input.weeks.map((week) => week.label).filter(Boolean))] as string[];
  const tocPages = Math.max(1, Math.ceil(input.weeks.length / TOC_ROWS_PER_PAGE));
  const tocAnchor = (i: number) => (i === 0 ? "toc" : `toc-${i + 1}`);
  const weekAnchor = (index: number) => `week-${index}`;
  const end = addDays(input.startDate, 7 * input.weeksCount - 1);
  const perWeek =
    input.sessionsPerWeek ?? Math.max(0, ...input.weeks.map((week) => week.sessions.length));
  const hasFiches = input.weeks.some((week) =>
    week.sessions.some((session) => hasFiche(session.content)),
  );

  // Ordre des pages : sommaire(s), puis les semaines. Chaque page sait où mènent ‹ et ›.
  const order: { anchor: string; label: string }[] = [
    ...Array.from({ length: tocPages }, (_, i) => ({ anchor: tocAnchor(i), label: "Sommaire" })),
    ...input.weeks.map((week) => ({
      anchor: weekAnchor(week.index),
      label: `Semaine ${week.index}`,
    })),
  ];
  const pageOf = new Map(order.map((page, i) => [page.anchor, i + 1]));
  const nav = (i: number, current: string): PdfNav => ({
    prev: i > 0 ? order[i - 1]! : null,
    current: { label: current, anchor: "toc" },
    next: i < order.length - 1 ? order[i + 1]! : null,
  });

  const rows: AgendaTocRow[] = input.weeks.map((week) => {
    const race = raceDate !== null && raceDate >= week.monday && raceDate <= week.sunday;
    const range = `${pdfDayMonth(week.monday)} – ${pdfDayMonth(week.sunday)}`;
    return {
      title: `Semaine ${week.index}`,
      subtitle: week.label ? `${range} · ${week.label}` : range,
      tag: race ? "★ course" : week.light ? "allégée" : "",
      page: pageOf.get(weekAnchor(week.index)) ?? 0,
      phase: week.label ? phases.indexOf(week.label) : null,
      current: input.today >= week.monday && input.today <= week.sunday,
      anchor: weekAnchor(week.index),
    };
  });

  const toc: AgendaTocPage[] = Array.from({ length: tocPages }, (_, i) => ({
    kind: "toc",
    anchor: tocAnchor(i),
    nav: nav(i, "Sommaire"),
    bookmark: tocPages > 1 ? `Sommaire (${i + 1})` : "Sommaire",
    pageNumber: i + 1,
    title: input.title,
    subtitle: [
      `${pdfDayMonthYear(input.startDate)} → ${pdfDayMonthYear(end)}`,
      plural(input.weeksCount, "semaine"),
      perWeek > 0 ? `${plural(perWeek, "séance")} par semaine` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    rows: rows.slice(i * TOC_ROWS_PER_PAGE, (i + 1) * TOC_ROWS_PER_PAGE),
    note:
      i === tocPages - 1
        ? `Touche une semaine pour y aller. Dans chaque semaine, ‹ › passe à la semaine voisine et le bouton noir revient ici.${
            hasFiches
              ? " Les fiches (musculation, workload Hyrox, allures) sont dans le PDF « Fiches et repères »."
              : ""
          }`
        : null,
  }));

  const weeks: AgendaWeekPage[] = input.weeks.map((week, i) => {
    const range = `${pdfDayMonth(week.monday)} – ${pdfDayMonth(week.sunday)}`;
    return {
      kind: "week",
      anchor: weekAnchor(week.index),
      nav: nav(tocPages + i, `Semaine ${week.index} sur ${input.weeksCount}`),
      bookmark: week.label ? `Semaine ${week.index} (${week.label})` : `Semaine ${week.index}`,
      pageNumber: tocPages + i + 1,
      kicker: [week.label, week.light ? "allégée" : null].filter(Boolean).join(" · "),
      title: `Semaine ${week.index}`,
      subtitle: week.light ? `${range} · semaine allégée` : range,
      badge: week.fixed ? "Jours fixés par le coach" : "Dans l'ordre, jours au choix",
      days: fitWeek(weekDays(week, raceDate)),
    };
  });

  const header = `${input.title} · ${input.athleteName}`;
  return {
    documentTitle: `${header} · Agenda du programme`,
    fileName: `Agenda du programme - ${input.title} - ${input.athleteName} - v${input.version}.pdf`,
    headerTitle: header,
    headerSubtitle: `Agenda du programme · ${plural(input.weeksCount, "semaine")}`,
    footer: `Coory · ${input.coachName} · Version ${input.version}`,
    hasFiches,
    pages: [...toc, ...weeks],
  };
}
