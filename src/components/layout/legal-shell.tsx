import Link from "next/link";
import type { ReactNode } from "react";

import { ThemedCooryLogo } from "@/components/brand/themed-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { AuthLegalLinks } from "./entry-ui";
import { LegalBackLink } from "./legal-back-link";

// Pages légales (conditions, confidentialité, mentions), maquette d'Antonino du 06/11/2026
// (écrans 04 à 06, D-139) : fond gris de la page, en-tête (logo, « Retour », thème), le document
// (voir app/(legal)/legal-notice.tsx), puis le pied « © 2026 Coory » et les liens.
// Téléphone : retour et thème en boutons de 40 px de part et d'autre du logo centré.
const squareButton =
  "flex size-10 cursor-pointer items-center justify-center rounded-[12px] bg-surface text-text inset-ring inset-ring-line transition-colors duration-150 hover:bg-dlg-field";

export function LegalShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-bg pt-[env(safe-area-inset-top)] pb-[calc(28px+env(safe-area-inset-bottom))] lg:pb-[30px]">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-[18px] pt-4 pb-3.5 lg:px-10 lg:py-[26px]">
        <LegalBackLink className={`${squareButton} lg:hidden`} compact />
        <Link href="/login" aria-label="Coory, connexion" className="flex rounded-sm">
          <span className="flex lg:hidden">
            <ThemedCooryLogo height={15} />
          </span>
          <span className="flex max-lg:hidden">
            <ThemedCooryLogo height={20} />
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <LegalBackLink className="flex items-center gap-2 text-[13.5px] font-semibold text-dlg-ink-2 transition-colors duration-150 hover:text-text max-lg:hidden" />
          <ThemeToggle className={squareButton} iconSize={17} />
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="mx-auto flex w-full max-w-[1200px] items-center justify-center pt-[22px] lg:justify-between lg:px-10 lg:pt-0">
        <span className="text-[12.5px] font-medium text-muted max-lg:hidden">© 2026 Coory</span>
        <AuthLegalLinks className="lg:text-[12.5px]" />
      </footer>
    </div>
  );
}
