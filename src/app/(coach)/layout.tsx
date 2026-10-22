import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Avatar } from "@/components/ui/avatar";
import { CooryLogo } from "@/components/ui/coory-logo";
import { LogoutButton } from "@/components/ui/logout-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getCoachMemberships, getCurrentUser } from "@/features/auth/session";
import { getCoachProfile } from "@/features/coach/profile";

import { CoachMobileMenu, CoachSideNav } from "./coach-nav";
import { CoachSearch } from "./coach-search";

// Coquille de l'espace coach : barre latérale de 232 px sur ordinateur, menu hamburger sur téléphone.
// Logo (choix d'Antonino, 22/10) : le mot « C∞ry » en grand dans la barre latérale (ordinateur),
// la boucle infinie seule dans l'en-tête mobile.
// La navigation lit la session : elle est derrière Suspense (Cache Components), le reste s'affiche aussitôt.
// Ce n'est PAS une protection : chaque page appelle elle-même son garde-fou (requireCoach, requireOrgAccess).
export default function CoachLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-58 shrink-0 flex-col justify-between gap-4 border-r border-line bg-bg px-3 py-5 md:flex">
        <div className="flex min-h-0 flex-1 flex-col gap-8">
          <Link href="/coach" aria-label="Tableau de bord" className="w-fit rounded-sm px-2.5">
            <CooryLogo size={40} />
          </Link>
          <nav
            aria-label="Navigation principale"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
            <Suspense fallback={null}>
              <NavData />
            </Suspense>
          </nav>
        </div>
        <div className="flex flex-col gap-3">
          <Suspense fallback={null}>
            <CoachCard />
          </Suspense>
          <div className="flex items-center gap-2 px-1">
            <LogoutButton className="flex-1 [&>button]:w-full" />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-3 md:hidden">
          <CooryLogo variant="symbol" size={28} />
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Suspense fallback={null}>
              <ProfileLink small />
            </Suspense>
            <Suspense fallback={<span className="size-9" />}>
              <MobileMenuData />
            </Suspense>
          </div>
        </header>
        {/* Barre du haut (ordinateur) : recherche de sportif, cloche (notifications : P7, affichée
            « bientôt », D-28) et accès au profil du coach. */}
        <div className="hidden h-[62px] shrink-0 items-center justify-end gap-3 border-b border-line px-8 md:flex">
          <Suspense fallback={null}>
            <SearchData />
          </Suspense>
          <span
            role="img"
            aria-label="Notifications : bientôt (P7)"
            title="Notifications : bientôt (P7)"
            className="inline-flex size-[38px] items-center justify-center rounded-full border border-line text-muted"
          >
            <Bell aria-hidden size={17} strokeWidth={1.7} />
          </span>
          <Suspense fallback={<span className="size-[38px]" />}>
            <ProfileLink />
          </Suspense>
        </div>
        {children}
      </div>
    </div>
  );
}

async function SearchData() {
  const user = await getCurrentUser();
  const memberships = user ? await getCoachMemberships(user.id) : [];
  const first = memberships[0];
  return first ? <CoachSearch athletesHref={`/coach/o/${first.organizationId}/sportifs`} /> : null;
}

async function NavData() {
  const user = await getCurrentUser();
  const memberships = user ? await getCoachMemberships(user.id) : [];
  // Une organisation suffit au lancement ; le choix entre plusieurs organisations viendra plus tard.
  const first = memberships[0];
  return <CoachSideNav orgBase={first ? `/coach/o/${first.organizationId}` : null} />;
}

// Menu hamburger du téléphone : mêmes entrées que la barre latérale, carte du coach et déconnexion.
async function MobileMenuData() {
  const user = await getCurrentUser();
  const memberships = user ? await getCoachMemberships(user.id) : [];
  const first = memberships[0];
  return (
    <CoachMobileMenu
      orgBase={first ? `/coach/o/${first.organizationId}` : null}
      footer={
        <div className="flex flex-col gap-3">
          <CoachCard />
          <LogoutButton className="[&>button]:w-full" />
        </div>
      }
    />
  );
}

// Carte du coach en bas de la barre latérale (maquette D-28) : photo, nom, lien vers « Mon profil ».
async function CoachCard() {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getCoachProfile(user);
  return (
    <Link
      href="/coach/profil"
      className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-3 py-2.5 transition-colors hover:bg-surface-2"
    >
      <Avatar name={profile.displayName} photoPath={profile.photoPath} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-small font-medium">{profile.displayName}</span>
        <span className="text-caption text-muted">Coach · Mon profil</span>
      </span>
      <ChevronRight aria-hidden size={16} strokeWidth={1.7} className="text-muted" />
    </Link>
  );
}

async function ProfileLink({ small = false }: { small?: boolean }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getCoachProfile(user);
  return (
    <Link href="/coach/profil" aria-label="Mon profil" className="rounded-full">
      <Avatar name={profile.displayName} photoPath={profile.photoPath} size={small ? "sm" : "md"} />
    </Link>
  );
}
