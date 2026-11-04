"use client";

import { LogOut, Shield, TriangleAlert } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { ConfirmDialog } from "./overlay";

const ICONS = { shield: Shield, logout: LogOut } as const;

// Bouton d'envoi qui demande confirmation avant une action qui efface des données (prompt §9 :
// toute suppression passe par la fenêtre de confirmation). Le formulaire n'est envoyé qu'après
// « Confirmer » ; « Annuler », Échap ou un clic sur le fond ne font rien.
export function ConfirmSubmitButton({
  title,
  message,
  confirmLabel,
  icon,
  className,
  children,
}: {
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  // Icône de la confirmation (kit) : bouclier pour un accord, déconnexion ; triangle par défaut. Un
  // nom plutôt qu'un composant : les pages serveur ne peuvent pas passer de fonction à ce bouton.
  icon?: keyof typeof ICONS;
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={buttonRef} type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          buttonRef.current?.form?.requestSubmit();
        }}
        title={title}
        confirmLabel={confirmLabel}
        icon={icon ? ICONS[icon] : TriangleAlert}
      >
        {message}
      </ConfirmDialog>
    </>
  );
}
