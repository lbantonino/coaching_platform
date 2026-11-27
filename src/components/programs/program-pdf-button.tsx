import { FileDown } from "lucide-react";

// Bouton « PDF » d'un programme publié (phase 5 ; D-211 du 27/11/2026 : un seul PDF, l'agenda puis
// « Fiches et repères », à la place du menu à deux choix) : un lien vers le PDF tiré de la version
// publiée, ouvert dans un nouvel onglet (lecteur PDF du navigateur ou du téléphone). Depuis une
// séance, il s'ouvre sur sa semaine (#nameddest, compris par Chrome et Acrobat ; ailleurs, le sommaire
// y mène en un geste).
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
    <a
      href={`${base}${week ? `#nameddest=week-${week}` : ""}`}
      target="_blank"
      rel="noopener"
      aria-label="PDF du programme"
      title="PDF du programme"
      className={className}
    >
      <FileDown aria-hidden size={13} strokeWidth={2} />
      PDF
    </a>
  );
}
