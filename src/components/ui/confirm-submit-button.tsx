"use client";

import type { ReactNode } from "react";

// Bouton d'envoi qui demande confirmation avant une action qui efface des données.
export function ConfirmSubmitButton({
  message,
  className,
  children,
}: {
  message: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
