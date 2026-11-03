"use client";

import { CircleStop, Ellipsis, Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { iconButtonClass } from "@/components/ui/button";
import { ActionMenu, ConfirmDialog } from "@/components/ui/overlay";

// Menu « ••• » d'une page avec une action de suppression (prompt Claude Design §4 et §9) :
// « Supprimer » ouvre la fenêtre de confirmation, qui seule envoie le formulaire (action serveur).
// `stop` (D-73) : une action « Arrêter » avant « Supprimer », ex. une dépense mensuelle qui prend fin.
// `button` (02/11, bas de la page d'une séance sur téléphone) : un simple bouton « Supprimer… » rouge à
// la place du « ••• », qui ouvre directement la confirmation ; `buttonClassName` remplace son allure
// (page d'une séance, 03/11 : barre d'actions de l'ordinateur, lien centré du téléphone).
export function DeleteMoreMenu({
  menuTitle,
  action,
  confirmTitle,
  confirmText,
  stop,
  button,
  buttonClassName,
  compact = false,
}: {
  menuTitle: string;
  action: (formData: FormData) => void | Promise<void>;
  confirmTitle: string;
  confirmText: ReactNode;
  stop?: { label: string; action: () => Promise<void> };
  button?: string;
  buttonClassName?: string;
  // En-tête d'ordinateur : « ••• » à la taille des outils de l'en-tête (32 px).
  compact?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="contents">
      {button ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className={
            buttonClassName ??
            "flex min-h-11 w-full items-center justify-center gap-2 rounded-control text-[15px] font-medium text-alert transition-colors duration-150 hover:bg-alert-soft active:bg-alert-soft"
          }
        >
          <Trash2 aria-hidden size={buttonClassName ? 15 : 17} strokeWidth={1.8} />
          {button}
        </button>
      ) : (
        <button
          type="button"
          aria-label="Plus d'actions"
          onClick={() => setMenu(true)}
          className={`${iconButtonClass()} ${compact ? "lg:size-8 lg:rounded-lg" : ""}`}
        >
          <Ellipsis aria-hidden size={18} strokeWidth={1.8} />
        </button>
      )}
      <ActionMenu
        open={menu}
        onClose={() => setMenu(false)}
        title={menuTitle}
        items={[
          ...(stop
            ? [{ label: stop.label, icon: CircleStop, onSelect: () => void stop.action() }]
            : []),
          { label: "Supprimer", icon: Trash2, destructive: true, onSelect: () => setConfirm(true) },
        ]}
      />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          form.current?.requestSubmit();
        }}
        title={confirmTitle}
        confirmLabel="Supprimer"
      >
        {confirmText}
      </ConfirmDialog>
    </form>
  );
}
