import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/ui/logo";
import { LogoutButton } from "@/components/ui/logout-button";
import { getCoachMemberships, getCurrentUser } from "@/features/auth/session";

import { CoachSideNav, CoachTabBar } from "./coach-nav";

// Coquille de l'espace coach : barre latérale sur ordinateur, onglets en bas sur téléphone.
// La navigation lit la session : elle est derrière Suspense (Cache Components), le reste s'affiche aussitôt.
// Ce n'est PAS une protection : chaque page appelle elle-même son garde-fou (requireCoach, requireOrgAccess).
export default function CoachLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between border-r border-line bg-bg px-3 py-5 md:flex">
        <div className="flex flex-col gap-8">
          <Link href="/coach" aria-label="Tableau de bord" className="px-3">
            <Logo size="sm" />
          </Link>
          <nav aria-label="Navigation principale">
            <Suspense fallback={null}>
              <NavData variant="side" />
            </Suspense>
          </nav>
        </div>
        <LogoutButton className="px-1" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
          <Logo size="sm" />
          <LogoutButton size="sm" />
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
