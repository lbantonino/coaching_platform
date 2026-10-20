import type { ReactNode } from "react";

import { Logo } from "./logo";

// Cadre minimal (espace sportif, administration) : logo et intitulé de l'espace en tête.
export function SimpleShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-8">
        <Logo size="sm" />
        <span className="font-mono text-data tracking-wide text-muted uppercase">{label}</span>
      </header>
      {children}
    </div>
  );
}
