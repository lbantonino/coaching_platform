import { FileDown } from "lucide-react";

import { PdfLink } from "./pdf-link";

// Bouton « PDF » d'un programme publié (phase 5 ; D-211 du 27/11/2026 : un seul PDF) : un lien vers
// le PDF tiré de la version publiée. Nouvel onglet dans le navigateur ; dans l'app installée sur
// ordinateur, le PDF s'ouvre dans Coory, par-dessus la page (PdfLink, 28/11). Depuis une séance, il
// s'ouvre sur sa semaine (#nameddest, compris par Chrome et Acrobat ; ailleurs, le bouton
// « Sommaire » y mène en un geste).
export function ProgramPdfButton({
  base,
  week,
  className,
}: {
  // « …/programmes/[programId]/pdf ».
  base: string;
  week?: number;
  className: string;
}) {
  return (
    <PdfLink
      href={`${base}${week ? `#nameddest=week-${week}` : ""}`}
      title="PDF du programme"
      label="PDF du programme"
      className={className}
    >
      <FileDown aria-hidden size={13} strokeWidth={2} />
      PDF
    </PdfLink>
  );
}
