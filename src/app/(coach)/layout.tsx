import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCoachMemberships, getCurrentUser } from "@/features/auth/session";
import { getCoachProfile } from "@/features/coach/profile";

// Coquille de l'espace coach (prompt Claude Design §5.2). Elle lit la session (organisation, carte
// du coach) : tout passe derrière Suspense (Cache Components).
// Ce n'est PAS une protection : chaque page appelle elle-même son garde-fou (requireCoach, requireOrgAccess).
export default function CoachLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <CoachShell>{children}</CoachShell>
    </Suspense>
  );
}

async function CoachShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const memberships = user ? await getCoachMemberships(user.id) : [];
  // Une organisation suffit au lancement ; le choix entre plusieurs organisations viendra plus tard.
  const first = memberships[0];
  const profile = user ? await getCoachProfile(user) : null;
  return (
    <AppShell
      value={{
        space: "coach",
        orgBase: first ? `/coach/o/${first.organizationId}` : null,
        user: profile
          ? {
              name: profile.displayName,
              role: first ? `Coach · ${first.organizationName}` : "Coach",
              photoPath: profile.photoPath,
              sex: null,
              settingsHref: "/coach/profil",
            }
          : null,
      }}
    >
      {children}
    </AppShell>
  );
}
