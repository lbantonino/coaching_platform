import Link from "next/link";
import type { ReactNode } from "react";

import { CooryLogo } from "@/components/ui/coory-logo";

import { AthleteTabBar, MobileTopBar } from "./mobile-bar";
import { homeHref } from "./navigation";
import { AccountMenu } from "./account-menu";
import { NavigationMemory } from "./back-link";
import { ShellProvider, type ShellValue } from "./shell-context";
import { HideSidebarButton, ShowSidebarButton } from "./sidebar-toggle";
import { SideNav } from "./side-nav";

// Coquille des espaces coach, sportif et admin (prompt Claude Design §5.2 et §5.3).
// Ordinateur (≥ 1024 px) : barre latérale collante de 252 px (logo, menu, carte de la personne et
// roue dentée : Paramètres, Thème, Compte, Se déconnecter, D-38). Téléphone : barre du haut avec le titre centré, menu hamburger
// (coach, admin) ou barre du bas à 5 onglets (sportif).
export function AppShell({ value, children }: { value: ShellValue; children: ReactNode }) {
  return (
    <ShellProvider value={value}>
      {/* Retient la page précédente pour les liens « retour » (29/10/2026). */}
      <NavigationMemory />
      <div className="flex min-h-dvh flex-1">
        <aside
          data-app-sidebar=""
          className="sticky top-3 my-3 ml-3 hidden h-[calc(100dvh-24px)] w-[240px] shrink-0 flex-col gap-5 overflow-y-auto rounded-[20px] border border-line bg-panel px-4 pt-[30px] pb-4 lg:flex"
        >
          {/* Replié (29/10/2026, comme ChatGPT) : la boucle du logo seule et les icônes des pages. */}
          <div data-sidebar-head="" className="flex items-center justify-between gap-2 pb-1.5">
            <Link
              href={homeHref[value.space]}
              aria-label="Accueil"
              data-logo-full=""
              className="w-fit rounded-sm px-2.5"
            >
              <CooryLogo size={15} />
            </Link>
            <HideSidebarButton />
            <ShowSidebarButton />
          </div>
          <SideNav />
          {/* Menu du compte : Mon profil, Paramètres, Changer de compte, Se déconnecter. */}
          <div className="mt-auto">
            <AccountMenu />
          </div>
        </aside>
        <div data-app-main="" className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />
          {children}
          {value.space === "athlete" ? <AthleteTabBar /> : null}
        </div>
      </div>
    </ShellProvider>
  );
}
