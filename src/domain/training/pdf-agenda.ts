import { cardLines, type CardLine } from "./card-lines";
import { programKindLabel, type Discipline } from "./discipline";
import type { ProgramSessionContent } from "./program-session";
import { sessionMomentLabels, type PublishedSession, type Weekday } from "./session-v2";
import { formatMinutes } from "./session-view";
import type { FicheTone } from "./pdf-fiches";

// PDF 1 « Agenda du programme » (handoff 12_PDF_SYSTEM, maquette CooryPdfDoc, phase 5) : un sommaire
// puis une page par semaine, tirés de la VERSION PUBLIÉE. Ce module construit le contenu de chaque
// page (textes, liens ‹ ›, jours, cartes) sans rien dessiner : le document React-PDF ne fait que le
// mettre en page. Fonctions pures, testées par Vitest.
//
// Règles :
// - une semaine = une page ; si elle déborde, les séances les plus longues passent à 3 lignes puis
//   « → détail dans Coory » (règle du handoff), jamais une carte coupée sur deux pages ;
// - la musculation, et un bloc Hyrox de plus de 4 lignes, ont leur fiche après les semaines (PDF
//   unique, D-211) : la carte ne répète pas son détail (décision d'Antonino du 28/11, qui remplace
//   celle du 16/11) ; la musculation garde son nom, le Hyrox trop long sa ligne de résumé, puis
//   « → Voir la fiche, page N », un lien vers la fiche ;
// - un seul sommaire (28/11) : les semaines, puis « Fiches et repères » et une ligne par fiche ; sur
//   chaque page, ‹ › mène aux pages voisines et le bouton du milieu, « Sommaire », au sommaire ;
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
// Sommaire (28/11) : place laissée aux lignes sous le titre, pour un titre de 2 lignes et une note
// d'une ligne (≈ 552 px), avec une marge de sécurité. Une ligne fait 38 px, plus 5 px d'écart ;
// l'intertitre « Fiches et repères » 24 px avec son écart. Le test de rendu vérifie ces mesures.
const TOC_BUDGET = 548;
const TOC_PITCH = 43;
const TOC_GAP = 5;
const TOC_HEADING = 24;
const TOC_NOTE = "Touche une ligne pour y aller. Sur chaque page, « Sommaire » ramène ici.";
export const FICHES_HEADING = "Fiches et repères";

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
  // Discipline de la version publiée (D-180) ; null pour un ancien programme (v1).
  discipline: Discipline | null;
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

// Une fiche du PDF unique, telle que le sommaire et les cartes des semaines la citent (programPdf).
export type PdfFicheLink = {
  // Séance de la fiche (ficheKey) ; null pour les allures.
  key: string | null;
  title: string;
  subtitle: string;
  tone: FicheTone;
  anchor: string;
  // Rang de sa première page parmi les pages des fiches (0 : juste après la dernière semaine).
  offset: number;
};

export type AgendaSessionView = {
  discipline: Discipline;
  title: string;
  // À droite de l'en-tête : « coach · 10:00 », « ≈ 55 min ».
  meta: string;
  lines: CardLine[];
  // Séance qui a sa fiche : son résumé en gras (Hyrox) ou rien (musculation), puis le renvoi à la
  // page de sa fiche (lien) ; sans page connue (agenda seul), « → fiche dans « Fiches et repères » ».
  fiche: { summary: string | null; anchor: string | null; page: number | null } | null;
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

export type AgendaFicheRow = {
  title: string;
  subtitle: string;
  tone: FicheTone;
  page: number;
  anchor: string;
};

type PageBase = { anchor: string; nav: PdfNav; bookmark: string; pageNumber: number };
export type AgendaTocPage = PageBase & {
  kind: "toc";
  // « Programme hybride · Sommaire » (D-180), « Sommaire » sans discipline.
  kicker: string;
  title: string;
  subtitle: string;
  // Les semaines de cette page du sommaire, puis (28/11) l'intertitre et les fiches qui y tiennent.
  rows: AgendaTocRow[];
  fichesHeading: string | null;
  fiches: AgendaFicheRow[];
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

// Une fiche par séance de même discipline et de même nom : la clé relie la carte d'une semaine à sa
// fiche (pdf-fiches, lien « → Voir la fiche, page N » du 28/11).
export const ficheKey = (content: ProgramSessionContent) =>
  `${content.discipline ?? "hybrid"}:${content.title}`;

type FicheTarget = { anchor: string; page: number };

function sessionMeta(session: PdfSessionInput): string {
  const time = session.time ? session.time.slice(0, 5) : null;
  if (session.coachDate) return time ? `coach · ${time}` : "avec le coach";
  // En minutes pour toutes les disciplines, comme la maquette (« ≈ 54 min ») ; pour le Running c'est
  // aussi la règle d'Antonino du 10/11/2026 (jamais en heures).
  const duration = `≈ ${formatMinutes(session.content.durationMinutes * 60)}`;
  // Plusieurs séances le même jour (D-164) : le moment d'abord (« Soir · 18:30 · ≈ 45 min »).
  const moment = session.published?.moment ? sessionMomentLabels[session.published.moment] : null;
  return [moment, time, duration].filter(Boolean).join(" · ");
}

function sessionView(
  session: PdfSessionInput,
  raceDate: string | null,
  date: string | null,
  fiches: Map<string, FicheTarget>,
) {
  const { content } = session;
  const race = raceDate !== null && date === raceDate;
  const fiche = hasFiche(content);
  const target = fiche ? fiches.get(ficheKey(content)) : undefined;
  return {
    discipline: content.discipline ?? "hybrid",
    title: `${race ? "★ " : ""}${content.title}`,
    meta: sessionMeta(session),
    // Sa fiche détaille tout (28/11) : la carte ne répète rien, sauf la ligne de résumé d'un Hyrox.
    lines: fiche ? [] : cardLines(content),
    fiche: fiche
      ? {
          summary: content.discipline === "strength" ? null : session.headline,
          anchor: target?.anchor ?? null,
          page: target?.page ?? null,
        }
      : null,
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
  // Avec une fiche : son résumé éventuel, ses lignes, puis le renvoi (qui remplace « détail dans Coory »).
  if (session.fiche) return (session.fiche.summary ? 1 : 0) + visualLines(session.lines) + 1;
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
// 1 ligne si besoin, chacune suivie de « → détail dans Coory ». Une séance qui a sa fiche n'a pas de
// lignes à raccourcir.
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

function weekDays(
  week: PdfWeekInput,
  raceDate: string | null,
  fiches: Map<string, FicheTarget>,
): AgendaDayView[] {
  if (!week.fixed) {
    // Dans l'ordre : une ligne par séance (« Séance 1 »…), datée seulement si elle est avec le coach.
    return week.sessions.map((session, i) => ({
      label: `Séance ${i + 1}`,
      date: session.coachDate ? pdfDayMonth(session.coachDate) : null,
      sessions: [sessionView(session, raceDate, session.coachDate, fiches)],
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
        .map((session) => sessionView(session, raceDate, date, fiches)),
    };
  });
  const free = week.sessions.filter((session) => session.day === null);
  if (free.length > 0) {
    days.push({
      label: "Au choix",
      date: null,
      sessions: free.map((session) => sessionView(session, raceDate, null, fiches)),
    });
  }
  return days;
}

// ---------------------------------------------------------------------------
// Le document
// ---------------------------------------------------------------------------
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

// ‹ › de chaque page : ses voisines dans l'ordre du fichier ; le bouton du milieu ramène toujours
// au sommaire (demande d'Antonino du 28/11 : y aller d'un geste, sans défiler).
export const SUMMARY_LINK: PdfNavLink = { label: "Sommaire", anchor: "toc" };
export function chainNav(order: PdfNavLink[]): PdfNav[] {
  return order.map((_, i) => ({
    prev: order[i - 1] ?? null,
    current: SUMMARY_LINK,
    next: order[i + 1] ?? null,
  }));
}

type TocItem =
  | { kind: "week"; index: number }
  | { kind: "heading" }
  // Une ligne du sommaire porte deux fiches côte à côte.
  | { kind: "fiches"; from: number; to: number };

// Pages du sommaire : les semaines, puis l'intertitre et les fiches, à la hauteur de chaque ligne.
// L'intertitre ne reste jamais seul en bas d'une page : il part avec la première ligne de fiches.
export function tocLayout(weeks: number, fiches: number): TocItem[][] {
  const pages: TocItem[][] = [[]];
  let used = 0;
  const fits = (height: number) => used + height - TOC_GAP <= TOC_BUDGET;
  const place = (item: TocItem, height: number) => {
    if (pages.at(-1)!.length > 0 && !fits(height)) {
      pages.push([]);
      used = 0;
    }
    pages.at(-1)!.push(item);
    used += height;
  };
  for (let index = 0; index < weeks; index++) place({ kind: "week", index }, TOC_PITCH);
  if (fiches > 0) {
    if (pages.at(-1)!.length > 0 && !fits(TOC_HEADING + TOC_PITCH)) {
      pages.push([]);
      used = 0;
    }
    pages.at(-1)!.push({ kind: "heading" });
    used += TOC_HEADING;
    for (let from = 0; from < fiches; from += 2)
      place({ kind: "fiches", from, to: Math.min(from + 2, fiches) }, TOC_PITCH);
  }
  return pages;
}

// `fiches` : les fiches qui suivent les semaines dans le même fichier (PDF unique, programPdf).
export function agendaPdf(
  input: PdfProgramInput,
  options: { fiches?: PdfFicheLink[] } = {},
): AgendaPdf {
  const raceDate = input.race?.date ?? null;
  const phases = [...new Set(input.weeks.map((week) => week.label).filter(Boolean))] as string[];
  const fiches = options.fiches ?? [];
  const layout = tocLayout(input.weeks.length, fiches.length);
  const tocPages = layout.length;
  const tocAnchor = (i: number) => (i === 0 ? "toc" : `toc-${i + 1}`);
  const weekAnchor = (index: number) => `week-${index}`;
  const fichePage = (offset: number) => tocPages + input.weeks.length + offset + 1;
  const targets = new Map(
    fiches.flatMap((fiche) =>
      fiche.key
        ? [[fiche.key, { anchor: fiche.anchor, page: fichePage(fiche.offset) }] as const]
        : [],
    ),
  );
  const end = addDays(input.startDate, 7 * input.weeksCount - 1);
  const perWeek =
    input.sessionsPerWeek ?? Math.max(0, ...input.weeks.map((week) => week.sessions.length));
  const hasFiches = input.weeks.some((week) =>
    week.sessions.some((session) => hasFiche(session.content)),
  );

  // Ordre des pages : sommaire(s), semaines, puis (seul lien connu ici) la première fiche.
  const navs = chainNav([
    ...layout.map((_, i) => ({ anchor: tocAnchor(i), label: "Sommaire" })),
    ...input.weeks.map((week) => ({
      anchor: weekAnchor(week.index),
      label: `Semaine ${week.index}`,
    })),
    ...(fiches[0] ? [{ anchor: fiches[0].anchor, label: fiches[0].title }] : []),
  ]);

  const weekRow = (week: PdfWeekInput, i: number): AgendaTocRow => {
    const race = raceDate !== null && raceDate >= week.monday && raceDate <= week.sunday;
    const range = `${pdfDayMonth(week.monday)} – ${pdfDayMonth(week.sunday)}`;
    return {
      title: `Semaine ${week.index}`,
      subtitle: week.label ? `${range} · ${week.label}` : range,
      tag: race ? "★ course" : week.light ? "allégée" : "",
      page: tocPages + i + 1,
      phase: week.label ? phases.indexOf(week.label) : null,
      current: input.today >= week.monday && input.today <= week.sunday,
      anchor: weekAnchor(week.index),
    };
  };
  const ficheRow = (fiche: PdfFicheLink): AgendaFicheRow => ({
    title: fiche.title,
    subtitle: fiche.subtitle,
    tone: fiche.tone,
    page: fichePage(fiche.offset),
    anchor: fiche.anchor,
  });

  const kind = programKindLabel(input.discipline);
  const toc: AgendaTocPage[] = layout.map((items, i) => ({
    kind: "toc",
    anchor: tocAnchor(i),
    nav: navs[i]!,
    bookmark: tocPages > 1 ? `Sommaire (${i + 1})` : "Sommaire",
    pageNumber: i + 1,
    kicker: kind ? `${kind} · Sommaire` : "Sommaire",
    title: input.title,
    subtitle: [
      `${pdfDayMonthYear(input.startDate)} → ${pdfDayMonthYear(end)}`,
      plural(input.weeksCount, "semaine"),
      perWeek > 0 ? `${plural(perWeek, "séance")} par semaine` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    rows: items.flatMap((item) =>
      item.kind === "week" ? [weekRow(input.weeks[item.index]!, item.index)] : [],
    ),
    fichesHeading: items.some((item) => item.kind === "heading") ? FICHES_HEADING : null,
    fiches: items.flatMap((item) =>
      item.kind === "fiches" ? fiches.slice(item.from, item.to).map(ficheRow) : [],
    ),
    note: i === tocPages - 1 ? TOC_NOTE : null,
  }));

  const weeks: AgendaWeekPage[] = input.weeks.map((week, i) => {
    const range = `${pdfDayMonth(week.monday)} – ${pdfDayMonth(week.sunday)}`;
    return {
      kind: "week",
      anchor: weekAnchor(week.index),
      nav: navs[tocPages + i]!,
      bookmark: week.label ? `Semaine ${week.index} (${week.label})` : `Semaine ${week.index}`,
      pageNumber: tocPages + i + 1,
      // La position (« 3 sur 10 ») était dans le bouton du milieu, qui dit maintenant « Sommaire ».
      kicker: [week.label, `${week.index} sur ${input.weeksCount}`, week.light ? "allégée" : null]
        .filter(Boolean)
        .join(" · "),
      title: `Semaine ${week.index}`,
      subtitle: week.light ? `${range} · semaine allégée` : range,
      badge: week.fixed ? "Jours fixés par le coach" : "Dans l'ordre, jours au choix",
      days: fitWeek(weekDays(week, raceDate, targets)),
    };
  });

  const header = `${input.title} · ${input.athleteName}`;
  return {
    documentTitle: `${header} · Agenda du programme`,
    fileName: `Agenda du programme - ${input.title} - ${input.athleteName} - v${input.version}.pdf`,
    headerTitle: header,
    headerSubtitle: kind
      ? `${kind} · Agenda · ${plural(input.weeksCount, "semaine")}`
      : `Agenda du programme · ${plural(input.weeksCount, "semaine")}`,
    footer: `Coory · ${input.coachName} · Version ${input.version}`,
    hasFiches,
    pages: [...toc, ...weeks],
  };
}
