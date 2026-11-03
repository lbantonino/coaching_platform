import Link from "next/link";
import type { ReactNode } from "react";

import { CooryLogo } from "@/components/ui/coory-logo";

import { AthleteTabBar, MobileTopBar } from "./mobile-bar";
import { MenuPage, MobileMenuPanel } from "./mobile-menu";
import { MobileMenuProvider } from "./mobile-menu-context";
import { homeHref } from "./navigation";
import { AccountMenu } from "./account-menu";
import { NavigationMemory } from "./back-link";
import { ShellProvider, type ShellValue } from "./shell-context";
import { HideSidebarButton, ShowSidebarButton } from "./sidebar-toggle";
import { SideNav } from "./side-nav";

// Coquille des espaces coach, sportif et admin (prompt Claude Design §5.2 et §5.3).
// Ordinateur (≥ 1024 px) : barre latérale collante de 252 px (logo, menu, carte de la personne et
// roue dentée : Paramètres, Thème, Compte, Se déconnecter, D-38). Téléphone : ☰, le nom de la page et
// les outils en haut, menu en plein écran (coach, admin) ; barre du bas à 5 onglets (sportif).
export function AppShell({ value, children }: { value: ShellValue; children: ReactNode }) {
  return (
    <ShellProvider value={value}>
      <MobileMenuProvider>
        {/* Retient la page précédente pour les liens « retour » (29/10/2026). */}
        <NavigationMemory />
        <div className="flex min-h-dvh flex-1">
          <MobileMenuPanel />
          <aside
            data-app-sidebar=""
            // Cadre de la maquette « Sportifs » (03/11/2026), le même pour toutes les pages : 236 px, à
            // 14 px des bords, padding 24 / 14 / 16. Filet en ombre intérieure (n'occupe pas de place).
            className="sticky top-3.5 my-3.5 ml-3.5 hidden h-[calc(100dvh-28px)] w-[236px] shrink-0 flex-col overflow-y-auto rounded-[20px] bg-panel px-3.5 pt-6 pb-4 inset-ring inset-ring-line lg:flex"
          >
            {/* Replié (29/10/2026, comme ChatGPT) : la boucle du logo seule et les icônes des pages. */}
            {/* Ligne du logo : 4 px au-dessus, 24 px dessous ; le bouton « Replier » (34 px) ne la
                grandit pas (marges négatives), comme l'icône de 17 px de la maquette. */}
            <div
              data-sidebar-head=""
              className="flex items-center justify-between gap-2 pt-1 pb-6 [&>[data-sidebar-hide]]:-my-[8.5px]"
            >
              <Link
                href={homeHref[value.space]}
                aria-label="Accueil"
                data-logo-full=""
                className="w-fit rounded-sm px-2.5"
              >
                <CooryLogo size={14.6} />
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
          <MenuPage className="flex min-w-0 flex-1 flex-col max-lg:pt-[env(safe-area-inset-top)]">
            <MobileTopBar />
            {children}
            {value.space === "athlete" ? <AthleteTabBar /> : null}
          </MenuPage>
        </div>
      </MobileMenuProvider>
    </ShellProvider>
  );
}
