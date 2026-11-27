import {
  agendaPdf,
  type AgendaPage,
  type AgendaPdf,
  type PdfNavLink,
  type PdfProgramInput,
} from "./pdf-agenda";
import { fichesPdf, type FichesPdf } from "./pdf-fiches";

// Un seul PDF par programme (D-211, demande d'Antonino du 27/11/2026) : le coach n'envoie plus qu'un
// fichier au sportif. L'agenda (sommaire, puis une page par semaine), puis « Fiches et repères »
// (sommaire, puis les fiches), composés à partir des deux modèles existants : rien n'est redessiné.
// Ce module ne fait que les relier : ancres uniques, pages numérotées d'un bout à l'autre, ‹ › qui
// passe d'une partie à l'autre.
export const FICHES_ANCHOR = "fiches";
const FICHES_LABEL = "Fiches et repères";

export type ProgramPdf = {
  documentTitle: string;
  fileName: string;
  agenda: AgendaPdf;
  // null : ni fiche ni allure, le PDF est l'agenda seul.
  fiches: FichesPdf | null;
  totalPages: number;
};

export function programPdf(input: PdfProgramInput): ProgramPdf {
  const alone = fichesPdf(input);
  // Le sommaire des fiches seul (« Ce programme n'a pas de fiche ») n'apporterait rien.
  const withFiches = alone.pages.length > 1;
  const agenda = agendaPdf(input, { fiches: withFiches });
  const header = `${input.title} · ${input.athleteName}`;
  const base = {
    documentTitle: `${header} · Programme`,
    fileName: `Programme - ${input.title} - ${input.athleteName} - v${input.version}.pdf`,
  };
  if (!withFiches) return { ...base, agenda, fiches: null, totalPages: agenda.pages.length };

  const offset = agenda.pages.length;
  const last = agenda.pages.at(-1)!;
  const toFiches: PdfNavLink = { label: FICHES_LABEL, anchor: FICHES_ANCHOR };
  // Dans les fiches, « toc » désignait leur sommaire : il devient « fiches », et son nom « Sommaire »
  // devient « Fiches et repères » (le sommaire de l'agenda garde « toc » et « Sommaire »).
  const moved = (link: PdfNavLink | null): PdfNavLink | null =>
    link?.anchor === "toc"
      ? { label: link.label === "Sommaire" ? FICHES_LABEL : link.label, anchor: FICHES_ANCHOR }
      : link;

  const fiches: FichesPdf = {
    ...alone,
    pages: alone.pages.map((page, i) => {
      const shifted = {
        ...page,
        anchor: page.anchor === "toc" ? FICHES_ANCHOR : page.anchor,
        pageNumber: page.pageNumber + offset,
        nav: {
          // ‹ du sommaire des fiches : la dernière semaine de l'agenda.
          prev:
            i === 0
              ? { label: last.kind === "week" ? last.title : "Sommaire", anchor: last.anchor }
              : moved(page.nav.prev),
          current: moved(page.nav.current)!,
          next: moved(page.nav.next),
        },
      };
      return shifted.kind === "toc"
        ? {
            ...shifted,
            bookmark: FICHES_LABEL,
            rows: shifted.rows.map((row) => ({ ...row, page: row.page + offset })),
          }
        : shifted;
    }),
  };
  // › de la dernière semaine : le sommaire des fiches.
  const pages: AgendaPage[] = agenda.pages.map((page) =>
    page === last ? { ...page, nav: { ...page.nav, next: toFiches } } : page,
  );
  return {
    ...base,
    agenda: { ...agenda, pages },
    fiches,
    totalPages: offset + fiches.pages.length,
  };
}
