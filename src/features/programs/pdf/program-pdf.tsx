import "server-only";

import { Document, renderToBuffer } from "@react-pdf/renderer";

import type { FichePage } from "@/domain/training/pdf-fiches";
import type { ProgramPdf } from "@/domain/training/pdf-programme";

import { AgendaTocPageView, AgendaWeekPageView } from "./agenda-pdf";
import { FichePageView } from "./fiches-pdf";
import { pdfText, registerPdfFonts } from "./pdf-kit";

// Le PDF du programme (D-211, 27/11/2026) : un seul fichier. Depuis le 28/11, un seul sommaire (celui
// de l'agenda, qui liste aussi les fiches), les semaines, puis les fiches. Chaque partie garde son
// en-tête et son pied de page ; la numérotation (« Page 7 sur 24 ») court sur tout le fichier. Le
// contenu vient de programPdf() (domain/training).
export async function renderProgramPdf(model: ProgramPdf, author: string): Promise<Buffer> {
  registerPdfFonts();
  const total = model.totalPages;
  const { agenda, fiches } = model;
  const sheets = fiches?.pages.filter((page): page is FichePage => page.kind === "fiche") ?? [];
  return renderToBuffer(
    <Document
      title={pdfText(model.documentTitle)}
      author={pdfText(author)}
      subject="Programme"
      creator="Coory"
      producer="Coory"
      language="fr-FR"
    >
      {agenda.pages.map((page) =>
        page.kind === "toc" ? (
          <AgendaTocPageView key={page.anchor} page={page} total={total} model={agenda} />
        ) : (
          <AgendaWeekPageView key={page.anchor} page={page} total={total} model={agenda} />
        ),
      )}
      {fiches
        ? sheets.map((page) => (
            <FichePageView key={page.anchor} page={page} total={total} model={fiches} />
          ))
        : null}
    </Document>,
  );
}
