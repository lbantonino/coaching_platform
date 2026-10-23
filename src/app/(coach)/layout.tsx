import { Suspense } from "react";

import { NewPaymentSheet } from "@/components/blocks/new-payment-sheet";
import { NewSessionSheet } from "@/components/blocks/new-session-sheet";
import { AppShell } from "@/components/layout/app-shell";
import { getCoachMemberships, getCurrentUser } from "@/features/auth/session";
import { createPayment } from "@/features/billing/payment-actions";
import { getCoachProfile } from "@/features/coach/profile";
import { countUnreadMessages } from "@/features/messages/queries";
import { createSession, listSessionAthletes } from "@/features/sessions/actions";

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
  const [profile, unreadMessages] = await Promise.all([
    user ? getCoachProfile(user) : null,
    first ? countUnreadMessages(first.organizationId) : 0,
  ]);
  return (
    <AppShell
      value={{
        space: "coach",
        orgBase: first ? `/coach/o/${first.organizationId}` : null,
        unreadMessages,
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
      {/* Les fenêtres « Nouvelle séance » (D-35) et « Nouveau paiement » (D-36), les mêmes sur toutes
          les pages coach. Les actions revérifient elles-mêmes l'accès à l'organisation. */}
      {first ? (
        <NewSessionSheet
          action={createSession.bind(null, first.organizationId)}
          loadAthletes={listSessionAthletes.bind(null, first.organizationId)}
        >
          <NewPaymentSheet
            action={createPayment.bind(null, first.organizationId)}
            loadAthletes={listSessionAthletes.bind(null, first.organizationId)}
          >
            {children}
          </NewPaymentSheet>
        </NewSessionSheet>
      ) : (
        children
      )}
    </AppShell>
  );
}
