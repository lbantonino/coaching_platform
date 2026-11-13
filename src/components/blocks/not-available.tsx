"use client";

import { Sparkles } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { dlgPrimaryButtonClass } from "@/components/ui/dialog-styles";
import { Overlay } from "@/components/ui/overlay";
import { NOT_AVAILABLE_TEXT } from "@/config/features";

// Fenêtre « pas encore disponible » (MVP coach seul, D-167) : les boutons « Écrire » et « Inviter »
// restent visibles, mais leur fonctionnalité (messagerie, espace sportif) n'existe pas encore dans
// cette version. Une seule fenêtre, la même partout.
export function NotAvailableDialog({
  open,
  onClose,
  title = "Bientôt disponible",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
}) {
  const titleId = useId();
  const bodyId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId} describedBy={bodyId} size="confirm">
      <div
        data-sheet-grab
        className="flex min-h-0 flex-auto touch-none flex-col overflow-y-auto overscroll-contain px-5 pt-3.5 pb-[26px] md:p-7"
      >
        <span
          aria-hidden
          className="grid size-[52px] shrink-0 place-items-center rounded-[16px] bg-dlg-accent-soft text-violet-text"
        >
          <Sparkles size={24} strokeWidth={1.9} />
        </span>
        <h2
          id={titleId}
          className="mt-[18px] text-[21px] leading-[1.25] font-bold tracking-[-0.02em]"
        >
          {title}
        </h2>
        <p id={bodyId} className="mt-2 text-[15px] leading-[1.55] text-pretty text-muted">
          {NOT_AVAILABLE_TEXT}
        </p>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className={`${dlgPrimaryButtonClass} mt-[26px]`}
        >
          J&apos;ai compris
        </button>
      </div>
    </Overlay>
  );
}

// Un bouton (ou une icône) qui ouvre cette fenêtre : il garde l'apparence du lien qu'il remplace.
export function NotAvailableButton({
  className,
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  // Nom pour les lecteurs d'écran quand le bouton n'est qu'une icône.
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label={label} onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <NotAvailableDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
