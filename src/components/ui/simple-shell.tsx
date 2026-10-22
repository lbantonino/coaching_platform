import type { ReactNode } from "react";

import { CooryLogo } from "./coory-logo";
import { ThemeToggle } from "./theme-toggle";

// Cadre minimal (espace sportif, administration) : logo, intitulé de l'espace et choix du thème en tête.
// Même règle que l'espace coach : les deux anneaux sur téléphone, le mot « coory » à partir de md (768 px).
export function SimpleShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 sm:px-8">
        <span className="inline-flex md:hidden">
          <CooryLogo variant="symbol" size={28} />
        </span>
        <span className="hidden md:inline-flex">
          <CooryLogo size={40} />
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-data tracking-wide text-muted uppercase">{label}</span>
          <ThemeToggle size="sm" />
        </div>
      </header>
      {children}
    </div>
  );
}
