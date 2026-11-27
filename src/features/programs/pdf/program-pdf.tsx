import "server-only";

import { Document, renderToBuffer } from "@react-pdf/renderer";

import type { ProgramPdf } from "@/domain/training/pdf-programme";

import { AgendaTocPageView, AgendaWeekPageView } from "./agenda-pdf";
import { FichePageView, FichesTocPageView } from "./fiches-pdf";
import { pdfText, registerPdfFonts } from "./pdf-kit";

// Le PDF du programme (D-211, 27/11/2026) : un seul fichier, l'agenda puis « Fiches et repères ».
// Chaque partie garde ses pages, son en-tête et son pied de page ; la numérotation (« Page 7 sur 24 »)
// court sur tout le fichier. Le contenu vient de programPdf() (domain/training).
export async function renderProgramPdf(model: ProgramPdf, author: string): Promise<Buffer> {
  registerPdfFonts();
  const total = model.totalPages;
  const { agenda, fiches } = model;
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
      {fiches?.pages.map((page) =>
        page.kind === "toc" ? (
          <FichesTocPageView key={page.anchor} page={page} total={total} model={fiches} />
        ) : (
          <FichePageView key={page.anchor} page={page} total={total} model={fiches} />
        ),
      )}
    </Document>,
  );
}
