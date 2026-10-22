import type { ReactNode } from "react";

import { CooryLogo } from "./coory-logo";
import { ThemeToggle } from "./theme-toggle";

// Cadre minimal (espace sportif, administration) : logo, intitulé de l'espace et choix du thème en tête.
export function SimpleShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 sm:px-8">
        <CooryLogo size={20} />
        <div className="flex items-center gap-3">
          <span className="font-mono text-data tracking-wide text-muted uppercase">{label}</span>
          <ThemeToggle size="sm" />
        </div>
      </header>
      {children}
    </div>
  );
}
