import Link from "next/link";
import { Suspense } from "react";

import { CooryLogo } from "@/components/ui/coory-logo";
import { LogoutButton } from "@/components/ui/logout-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getCoachMemberships, getCurrentUser } from "@/features/auth/session";

import { CoachSideNav, CoachTabBar } from "./coach-nav";

// Coquille de l'espace coach : barre latérale de 232 px sur ordinateur, onglets en bas sur téléphone.
// Logo (choix d'Antonino, 22/10) : le mot « C∞ry » en grand dans la barre latérale (ordinateur),
// la boucle infinie seule dans l'en-tête mobile.
// La navigation lit la session : elle est derrière Suspense (Cache Components), le reste s'affiche aussitôt.
// Ce n'est PAS une protection : chaque page appelle elle-même son garde-fou (requireCoach, requireOrgAccess).
export default function CoachLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-58 shrink-0 flex-col justify-between border-r border-line bg-bg px-3 py-5 md:flex">
        <div className="flex flex-col gap-8">
          <Link href="/coach" aria-label="Tableau de bord" className="w-fit rounded-sm px-2.5">
            <CooryLogo size={40} />
          </Link>
          <nav aria-label="Navigation principale">
            <Suspense fallback={null}>
              <NavData variant="side" />
            </Suspense>
          </nav>
        </div>
        <div className="flex items-center gap-2 px-1">
          <LogoutButton className="flex-1 [&>button]:w-full" />
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="flex items-center justify-between border-b border-line px-5 py-3 md:hidden">
          <CooryLogo variant="symbol" size={28} />
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <LogoutButton size="sm" />
          </div>
        </header>
        {children}
      </div>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 border-t border-line bg-bg md:hidden"
      >
        <Suspense fallback={<div className="h-16" />}>
          <NavData variant="tabs" />
        </Suspense>
      </nav>
    </div>
  );
}

async function NavData({ variant }: { variant: "side" | "tabs" }) {
  const user = await getCurrentUser();
  const memberships = user ? await getCoachMemberships(user.id) : [];
  // Une organisation suffit au lancement ; le choix entre plusieurs organisations viendra plus tard.
  const first = memberships[0];
  const athletesHref = first ? `/coach/o/${first.organizationId}/sportifs` : null;
  return variant === "side" ? (
    <CoachSideNav athletesHref={athletesHref} />
  ) : (
    <CoachTabBar athletesHref={athletesHref} />
  );
}
