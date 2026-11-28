import { agendaPdf, chainNav, type AgendaPdf, type PdfProgramInput } from "./pdf-agenda";
import { fichesPdf, type FichePage, type FichesPdf } from "./pdf-fiches";

// Un seul PDF par programme (D-211, demande d'Antonino du 27/11/2026) : le coach n'envoie plus qu'un
// fichier au sportif. Un seul sommaire (28/11) : il liste les semaines, puis « Fiches et repères » et
// chaque fiche ; les pages des fiches suivent la dernière semaine. Sur chaque page, ‹ › mène aux pages
// voisines, d'un bout à l'autre du fichier, et le bouton du milieu, « Sommaire », au sommaire.
// Les deux modèles existants font le contenu (rien n'est redessiné) ; le sommaire propre aux fiches
// (sa page 1 dans fichesPdf) disparaît.
export type ProgramPdf = {
  documentTitle: string;
  fileName: string;
  agenda: AgendaPdf;
  // Les pages des fiches seulement ; null : ni fiche ni allure, le PDF est l'agenda seul.
  fiches: FichesPdf | null;
  totalPages: number;
};

export function programPdf(input: PdfProgramInput): ProgramPdf {
  const alone = fichesPdf(input);
  const toc = alone.pages[0];
  const sheets = alone.pages.filter((page): page is FichePage => page.kind === "fiche");
  const header = `${input.title} · ${input.athleteName}`;
  const base = {
    documentTitle: `${header} · Programme`,
    fileName: `Programme - ${input.title} - ${input.athleteName} - v${input.version}.pdf`,
  };
  if (sheets.length === 0 || toc?.kind !== "toc") {
    const agenda = agendaPdf(input);
    return { ...base, agenda, fiches: null, totalPages: agenda.pages.length };
  }

  // Dans fichesPdf, la page 1 est son sommaire : sa première fiche est sa page 2.
  const agenda = agendaPdf(input, {
    fiches: toc.rows.map((row) => ({
      key: row.key,
      title: row.title,
      subtitle: row.subtitle,
      tone: row.tone,
      anchor: row.anchor,
      offset: row.page - 2,
    })),
  });
  const offset = agenda.pages.length;
  const navs = chainNav([
    ...agenda.pages.map((page) => ({
      anchor: page.anchor,
      label: page.kind === "toc" ? "Sommaire" : page.title,
    })),
    ...sheets.map((page) => ({ anchor: page.anchor, label: page.title })),
  ]);
  return {
    ...base,
    agenda: { ...agenda, pages: agenda.pages.map((page, i) => ({ ...page, nav: navs[i]! })) },
    fiches: {
      ...alone,
      pages: sheets.map((page, i) => ({
        ...page,
        pageNumber: offset + i + 1,
        nav: navs[offset + i]!,
      })),
    },
    totalPages: offset + sheets.length,
  };
}
