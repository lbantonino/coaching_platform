"use client";

import { CalendarDays, ClipboardList, FileDown } from "lucide-react";

import { MoreMenu } from "@/components/ui/more-menu";

// Bouton « PDF » d'un programme publié (phase 5, décision d'Antonino du 10/11 : un petit menu à 2
// choix) : « Agenda du programme » et « Fiches et repères », deux fichiers tirés de la version
// publiée, ouverts dans un nouvel onglet (lecteur PDF du navigateur ou du téléphone). Depuis une
// séance, l'agenda s'ouvre sur sa semaine (#nameddest, compris par Chrome et Acrobat ; ailleurs, le
// sommaire y mène en un geste).
export function ProgramPdfMenu({
  base,
  week,
  className,
  iconSize = 13,
  iconClassName = "",
}: {
  // « …/programmes/[programId]/pdf ».
  base: string;
  week?: number;
  className: string;
  iconSize?: number;
  iconClassName?: string;
}) {
  const open = (href: string) => window.open(href, "_blank", "noopener");
  return (
    <MoreMenu
      label="PDF du programme"
      title="PDF du programme"
      width={240}
      button={{
        className,
        content: (
          <>
            <FileDown aria-hidden size={iconSize} strokeWidth={2} className={iconClassName} />
            PDF
          </>
        ),
      }}
      items={[
        {
          label: "Agenda du programme",
          icon: CalendarDays,
          onSelect: () => open(`${base}/agenda${week ? `#nameddest=week-${week}` : ""}`),
        },
        { label: "Fiches et repères", icon: ClipboardList, onSelect: () => open(`${base}/fiches`) },
      ]}
    />
  );
}
