"use client";

import { TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { buttonClass } from "./button";

// Fenêtres par-dessus la page (prompt Claude Design §4 « Sheet », « ActionMenu », « Dialog »).
// Téléphone : feuille du bas (rayon 22 22 0 0, poignée 40 × 4, 88 % de hauteur max, défile).
// Ordinateur (≥ 768 px) : fenêtre centrée de 560 px, rayon 20. Fond d'écran rgba(3,6,12,.6).
// Base : l'élément natif <dialog> ouvert avec showModal() : focus piégé, aria-modal et touche
// Échap fournis par le navigateur. Fermeture aussi par la croix, « Annuler » et un clic sur le fond.

function Overlay({
  open,
  onClose,
  labelledBy,
  describedBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Un clic sur le fond (hors du contenu) arrive sur le <dialog> lui-même.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-0 mt-auto max-h-[88%] w-full max-w-none overflow-y-auto rounded-t-sheet border border-line-2 bg-bg p-0 text-text backdrop:bg-[rgba(3,6,12,0.6)] md:m-auto md:max-h-[86vh] md:max-w-[560px] md:rounded-card"
    >
      {open ? (
        <div className="flex flex-col gap-4 px-[18px] pt-[18px] pb-[22px]">
          <span
            aria-hidden
            className="mx-auto -mt-1.5 h-1 w-10 rounded-[4px] bg-line-2 md:hidden"
          />
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fermer"
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-text transition-colors duration-150 hover:bg-surface-2"
    >
      <X aria-hidden size={18} strokeWidth={1.8} />
    </button>
  );
}

// Feuille de formulaire : titre 20/600, sous-titre 14 gris, contenu libre, pied (Annuler + action).
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={titleId} className="font-display text-[20px] font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          {subtitle ? <p className="text-[14px] text-muted">{subtitle}</p> : null}
        </div>
        <CloseButton onClose={onClose} />
      </div>
      {children}
      {footer ? <div className="flex gap-2.5 [&>*]:flex-1">{footer}</div> : null}
    </Overlay>
  );
}

export type ActionMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
};

// Menu « ••• » : lignes de 52 px, icône 19 + libellé 16/500 ; action destructrice en rouge texte.
export function ActionMenu({
  open,
  onClose,
  title,
  items,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: ActionMenuItem[];
}) {
  const titleId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-block font-semibold">
          {title}
        </h2>
        <CloseButton onClose={onClose} />
      </div>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={() => {
                onClose();
                item.onSelect();
              }}
              className={`flex min-h-[52px] w-full items-center gap-3.5 border-t border-line text-left text-[16px] font-medium transition-colors duration-150 hover:bg-surface ${
                item.destructive ? "text-accent-text" : "text-text"
              }`}
            >
              <item.icon aria-hidden size={19} strokeWidth={1.8} />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </Overlay>
  );
}

// Confirmation (suppression, publication, suspension, déconnexion globale) : icône « triangle-alert »
// dans un carré rouge doux de 48 px, titre 20/600, texte 15 gris, « Annuler » + action rouge.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  pending?: boolean;
}) {
  const titleId = useId();
  const bodyId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId} describedBy={bodyId}>
      <div className="flex flex-col gap-2.5">
        <span
          aria-hidden
          className="inline-flex size-12 items-center justify-center rounded-wide bg-accent-soft text-accent-text"
        >
          <TriangleAlert size={22} strokeWidth={1.8} />
        </span>
        <h2 id={titleId} className="font-display text-[20px] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {children ? (
          <p id={bodyId} className="text-[15px] leading-[1.55] text-muted">
            {children}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className={buttonClass({ variant: "outline", className: "flex-1 px-4" })}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={buttonClass({ className: "flex-1" })}
        >
          {confirmLabel}
        </button>
      </div>
    </Overlay>
  );
}
