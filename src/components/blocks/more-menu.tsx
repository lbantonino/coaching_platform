"use client";

import { Ellipsis, Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { iconButtonClass } from "@/components/ui/button";
import { ActionMenu, ConfirmDialog } from "@/components/ui/overlay";

// Menu « ••• » d'une page avec une action de suppression (prompt Claude Design §4 et §9) :
// « Supprimer » ouvre la fenêtre de confirmation, qui seule envoie le formulaire (action serveur).
export function DeleteMoreMenu({
  menuTitle,
  action,
  confirmTitle,
  confirmText,
}: {
  menuTitle: string;
  action: (formData: FormData) => void | Promise<void>;
  confirmTitle: string;
  confirmText: ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="contents">
      <button
        type="button"
        aria-label="Plus d'actions"
        onClick={() => setMenu(true)}
        className={iconButtonClass()}
      >
        <Ellipsis aria-hidden size={18} strokeWidth={1.8} />
      </button>
      <ActionMenu
        open={menu}
        onClose={() => setMenu(false)}
        title={menuTitle}
        items={[
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
