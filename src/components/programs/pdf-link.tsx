"use client";

import { Download } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { DialogHeader, Overlay } from "@/components/ui/overlay";

// Lien vers le PDF d'un programme (demande d'Antonino du 28/11/2026 : « pas une nouvelle fenêtre »).
// - Dans le navigateur : nouvel onglet, comme avant.
// - Dans l'app Coory installée sur un ordinateur : Chrome ouvre chaque lien de l'app dans une nouvelle
//   fenêtre de l'app, et aucun réglage du site ne l'en empêche (« navigation capturing », Chrome 139).
//   Le PDF s'ouvre donc dans Coory, par-dessus la page, avec le lecteur PDF de Chrome (sommaire et
//   liens internes, zoom, recherche) ; « Télécharger » et ✕ ramènent où l'on était.
// - Sur téléphone : inchangé (le lecteur du téléphone).
const IN_APP = "(display-mode: standalone) and (min-width: 1024px)";

export function PdfLink({
  href,
  title,
  label,
  className,
  children,
}: {
  // « …/programmes/[programId]/pdf », avec ou sans « #nameddest=week-N ».
  href: string;
  // Titre de la fenêtre du lecteur (« PDF du programme »).
  title: string;
  // Nom accessible du lien, s'il diffère de son texte.
  label?: string;
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const file = href.split("#")[0]!;
  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        aria-label={label}
        title={label}
        className={className}
        onClick={(event) => {
          // Cmd/Ctrl + clic, clic du milieu : la personne choisit elle-même où l'ouvrir.
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
          if (!window.matchMedia(IN_APP).matches) return;
          event.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </a>
      <Overlay open={open} onClose={() => setOpen(false)} labelledBy={titleId} size="document">
        <DialogHeader titleId={titleId} title={title} onClose={() => setOpen(false)} />
        {open ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 pb-6">
            <div className="flex justify-end">
              <a
                href={`${file}?telecharger`}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] px-3.5 text-[13.5px] font-medium text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2"
              >
                <Download aria-hidden size={15} strokeWidth={1.9} className="shrink-0" />
                Télécharger
              </a>
            </div>
            <iframe
              src={href}
              title={title}
              className="min-h-0 w-full flex-1 rounded-[12px] bg-surface-2 inset-ring inset-ring-line"
            />
          </div>
        ) : null}
      </Overlay>
    </>
  );
}
