import { Suspense } from "react";

import { MoneyProvider } from "@/components/blocks/money-context";
import { NewPaymentSheet } from "@/components/blocks/new-payment-sheet";
import { NewSessionSheet } from "@/components/blocks/new-session-sheet";
import { AssistantProvider } from "@/components/blocks/assistant";
import { TaskSheetProvider } from "@/components/blocks/task-sheet";
import { AppShell } from "@/components/layout/app-shell";
import { getCoachMemberships, getCurrentUser } from "@/features/auth/session";
import { createPayment } from "@/features/billing/payment-actions";
import { loadSettings } from "@/features/coach/settings-actions";
import { DEFAULT_PREFERENCES, getCoachProfile } from "@/features/coach/profile";
import { enabledTotal } from "@/features/notifications/filter";
import { loadNotificationPreview, setNotificationsRead } from "@/features/notifications/actions";
import { countNotifications } from "@/features/notifications/queries";
import { todayIsoInBrussels } from "@/lib/format";
import { createSession, listSessionAthletes } from "@/features/sessions/actions";
import { createTask, deleteTask, loadTaskLists, updateTask } from "@/features/tasks/actions";

import { SettingsDialogProvider } from "./coach/profil/settings-dialog";

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
  const [profile, counts] = await Promise.all([
    user ? getCoachProfile(user) : null,
    first ? countNotifications(first.organizationId, todayIsoInBrussels()) : null,
  ]);
  // La fenêtre des Paramètres (D-58) enveloppe toute la coquille : le menu du compte l'ouvre.
  // Devise et pays (D-69) de l'organisation pour tous les écrans d'argent (la TVA se choisit à chaque
  // paiement, D-163).
  return (
    <MoneyProvider
      value={{
        currency: first?.currency ?? "EUR",
        country: first?.country ?? "BE",
      }}
    >
      <SettingsDialogProvider load={loadSettings}>
        {/* Assistant IA (kit « Coory Pages », 02, D-132) : sa boîte, ouverte par le bouton de
            l'en-tête ou de la barre ; sa conversation est partagée avec la page /coach/assistant. */}
        <AssistantProvider
          firstName={profile?.firstName ?? ""}
          loadAthletes={first ? listSessionAthletes.bind(null, first.organizationId) : undefined}
        >
          <AppShell
            value={{
              space: "coach",
              orgBase: first ? `/coach/o/${first.organizationId}` : null,
              unreadMessages: counts?.messages ?? 0,
              // Cloche : seulement les catégories gardées dans Paramètres > Préférences (D-57).
              notificationCount: counts
                ? enabledTotal(counts, (profile?.preferences ?? DEFAULT_PREFERENCES).notify)
                : 0,
              notifications: first
                ? {
                    load: loadNotificationPreview.bind(null, first.organizationId),
                    setRead: setNotificationsRead.bind(null, first.organizationId),
                  }
                : undefined,
              user: profile
                ? {
                    name: profile.displayName,
                    role: "Coach",
                    photoPath: profile.photoPath,
                    sex: null,
                    settingsHref: "/coach/profil",
                  }
                : null,
            }}
          >
            {/* Les fenêtres « Nouvelle séance » (D-35), « Nouveau paiement » (D-36) et « Tâche » (D-59), les mêmes sur toutes
          les pages coach. Les actions revérifient elles-mêmes l'accès à l'organisation. */}
            {first ? (
              <NewSessionSheet
                action={createSession.bind(null, first.organizationId)}
                loadAthletes={listSessionAthletes.bind(null, first.organizationId)}
                defaults={{
                  durationMinutes: (profile?.preferences ?? DEFAULT_PREFERENCES)
                    .defaultSessionMinutes,
                  location: (profile?.preferences ?? DEFAULT_PREFERENCES).defaultLocation,
                  priceCents: (profile?.preferences ?? DEFAULT_PREFERENCES).defaultPriceCents,
                  paymentMethod: (profile?.preferences ?? DEFAULT_PREFERENCES).defaultPaymentMethod,
                }}
              >
                <NewPaymentSheet
                  action={createPayment.bind(null, first.organizationId)}
                  loadAthletes={listSessionAthletes.bind(null, first.organizationId)}
                >
                  {/* Fenêtre « Nouvelle tâche / Modifier la tâche » (D-59). */}
                  <TaskSheetProvider
                    create={createTask.bind(null, first.organizationId)}
                    update={updateTask.bind(null, first.organizationId)}
                    remove={deleteTask.bind(null, first.organizationId)}
                    loadAthletes={listSessionAthletes.bind(null, first.organizationId)}
                    loadLists={loadTaskLists.bind(null, first.organizationId)}
                  >
                    {children}
                  </TaskSheetProvider>
                </NewPaymentSheet>
              </NewSessionSheet>
            ) : (
              children
            )}
          </AppShell>
        </AssistantProvider>
      </SettingsDialogProvider>
    </MoneyProvider>
  );
}
