import Link from "next/link";
import type { ReactNode } from "react";

import { CooryLogo } from "@/components/ui/coory-logo";

import { AthleteTabBar, MobileTopBar } from "./mobile-bar";
import { homeHref } from "./navigation";
import { SettingsMenu } from "./settings-menu";
import { ShellProvider, type ShellValue } from "./shell-context";
import { SideNav, UserCard } from "./side-nav";

// Coquille des espaces coach, sportif et admin (prompt Claude Design §5.2 et §5.3).
// Ordinateur (≥ 1024 px) : barre latérale collante de 252 px (logo, menu, carte de la personne et
// roue dentée : Paramètres, Thème, Compte, Se déconnecter, D-38). Téléphone : barre du haut avec le titre centré, menu hamburger
// (coach, admin) ou barre du bas à 5 onglets (sportif).
export function AppShell({ value, children }: { value: ShellValue; children: ReactNode }) {
  return (
    <ShellProvider value={value}>
      <div className="flex min-h-dvh flex-1">
        <aside className="sticky top-0 hidden h-dvh w-[252px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-line px-3.5 py-[22px] lg:flex">
          <Link
            href={homeHref[value.space]}
            aria-label="Accueil"
            className="w-fit rounded-sm px-2.5 pb-1.5"
          >
            <CooryLogo size={26} />
          </Link>
          <SideNav />
          {/* La carte de la personne, et la roue dentée (Paramètres, Thème, Compte, Se déconnecter). */}
          <div className="mt-auto flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <UserCard />
            </div>
            <SettingsMenu />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />
          {children}
          {value.space === "athlete" ? <AthleteTabBar /> : null}
        </div>
      </div>
    </ShellProvider>
  );
}
