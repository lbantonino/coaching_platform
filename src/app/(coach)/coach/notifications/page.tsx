import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { formatMoney } from "@/domain/billing/money";
import { requireCoach } from "@/features/auth/guards";
import { getCoachProfile } from "@/features/coach/profile";
import { NOTIFICATION_KINDS, notificationKindLabels } from "@/features/coach/settings";
import {
  deleteNotifications,
  dismissNotifications,
  restoreNotifications,
  setNotificationsRead,
  undeleteNotifications,
} from "@/features/notifications/actions";
import { unpaidSub } from "@/features/notifications/preview";
import { COMPETITION_NOTICE_DAYS, getNotifications } from "@/features/notifications/queries";
import {
  dayShortLabel,
  daysBetween,
  dueLabel,
  formatDate,
  messageTime,
  todayIsoInBrussels,
} from "@/lib/format";

import { NotificationsView, type NotificationSection } from "./notifications-view";

export const metadata: Metadata = {
  title: "Notifications",
};

// Page Notifications (demande d'Antonino, 24/10, D-37 ; refaite au kit « Coory Pages », page 03,
// D-128) : ce qui demande l'attention du coach, en sections : messages non lus, tâches du jour ou en
// retard, fiches à compléter, séances à encaisser (D-90), compétitions des sportifs dans les 7 jours.
// Tout est calculé à partir des vraies données ; chaque ligne mène là où on s'en occupe (et la marque
// lue), et disparaît d'elle-même une fois la chose faite. Le coach peut aussi la marquer lue / non
// lue, la masquer (onglet « Masquées », réversible) ou la supprimer (décision 11 : cachée pour de bon),
// ligne par ligne (menu « ··· ») ou par sélection ; « Annuler » pendant 5 secondes.
export default function NotificationsPage() {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        <NotificationList />
      </Suspense>
    </main>
  );
}

async function NotificationList() {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { user, memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const today = todayIsoInBrussels();
  const [all, profile] = await Promise.all([
    getNotifications(organizationId, today),
    getCoachProfile(user),
  ]);
  // Catégories gardées dans Paramètres > Préférences (D-57) : les autres ne s'affichent pas ici.
  const { notify } = profile.preferences;
  const hidden = NOTIFICATION_KINDS.filter((kind) => !notify[kind]);
  const sportifs = `/coach/o/${organizationId}/sportifs`;

  // Les sections, dans l'ordre du kit (ordinateur : gauche puis droite ; téléphone : voir la vue).
  const sections: NotificationSection[] = [];
  if (notify.messages) {
    sections.push({
      id: "messages",
      title: "Messages non lus",
      link: { href: "/coach/messages", label: "Ouvrir" },
      items: all.messages.map((conversation) => ({
        key: conversation.key,
        read: conversation.read,
        dismissed: conversation.dismissed,
        href: `/coach/messages?sportif=${conversation.athlete.id}`,
        title: conversation.athlete.name,
        sub: conversation.lastBody,
        person: {
          name: conversation.athlete.name,
          photoPath: conversation.athlete.photoPath,
          sex: conversation.athlete.sex,
        },
        tags: [
          {
            label: `${conversation.unread} non lu${conversation.unread > 1 ? "s" : ""}`,
            tone: "warn",
          },
        ],
        right: { text: messageTime(conversation.lastAt, today) },
        menuSubtitle: `Message · ${messageTime(conversation.lastAt, today)} · ${
          conversation.unread
        } non lu${conversation.unread > 1 ? "s" : ""}`,
      })),
    });
  }
  if (notify.tasks) {
    sections.push({
      id: "tasks",
      title: "Tâches du jour ou en retard",
      link: { href: "/coach/taches", label: "Tâches" },
      items: all.tasks.map((task) => {
        const due = dueLabel(task.dueOn, today) === "En retard" ? "En retard" : "Aujourd'hui";
        return {
          key: task.key,
          read: task.read,
          dismissed: task.dismissed,
          href: "/coach/taches?onglet=aujourdhui",
          title: task.title,
          sub: task.athleteName ?? "",
          tags: [
            ...(task.priority === "high" ? [{ label: "Haute", tone: "warn" as const }] : []),
            { label: due, tone: due === "En retard" ? ("warn" as const) : ("neutral" as const) },
          ],
          menuSubtitle: `Tâche · ${due}`,
        };
      }),
    });
  }
  if (notify.profiles) {
    sections.push({
      id: "profiles",
      title: "Fiches à compléter",
      link: { href: sportifs, label: "Sportifs" },
      items: all.profiles.map((athlete) => ({
        key: athlete.key,
        read: athlete.read,
        dismissed: athlete.dismissed,
        href: `${sportifs}/${athlete.id}?onglet=profil`,
        title: athlete.name,
        sub: `Manque : ${athlete.missing.join(", ")}`,
        person: { name: athlete.name, photoPath: athlete.photoPath, sex: athlete.sex },
        menuSubtitle: "Fiche à compléter",
      })),
    });
  }
  // Séances à encaisser (D-90, à la place des factures en retard) : chacune ouvre sa séance, sur la
  // bonne date, où elle se marque payée.
  if (notify.unpaid) {
    sections.push({
      id: "unpaid",
      title: "Séances à encaisser",
      link: { href: "/coach/comptabilite", label: "Comptabilité" },
      items: all.unpaid.map((date) => ({
        key: date.key,
        read: date.read,
        dismissed: date.dismissed,
        href: date.sessionHref,
        title: date.athleteName ?? date.title,
        sub: unpaidSub(date, today),
        person: date.athleteName
          ? { name: date.athleteName, photoPath: null, sex: null }
          : undefined,
        right: { text: formatMoney(date.amountCents, date.currency), strong: true },
        menuSubtitle: `Séance à encaisser · ${formatMoney(date.amountCents, date.currency)}`,
      })),
    });
  }
  // Conversations de l'Assistant IA bientôt effacées (D-212) : toujours, chacune ouvre la
  // conversation (la télécharger, ou y écrire pour la garder).
  if (all.assistant.length > 0) {
    sections.push({
      id: "assistant",
      title: "Conversations bientôt effacées",
      link: { href: "/coach/assistant", label: "Assistant IA" },
      items: all.assistant.map((conversation) => ({
        key: conversation.key,
        read: conversation.read,
        dismissed: conversation.dismissed,
        href: `/coach/assistant?conversation=${conversation.id}`,
        title: conversation.title,
        sub: `Sera effacée le ${formatDate(conversation.expiresOn)}. Télécharge-la, ou écris-y pour la garder 12 mois de plus.`,
        menuSubtitle: "Conversation bientôt effacée",
      })),
    });
  }
  if (notify.competitions) {
    sections.push({
      id: "competitions",
      title: `Compétitions dans les ${COMPETITION_NOTICE_DAYS} jours`,
      items: all.competitions.map((competition) => {
        const gap = daysBetween(today, competition.date);
        const when = gap === 0 ? "Jour J" : `J-${gap}`;
        return {
          key: competition.key,
          read: competition.read,
          dismissed: competition.dismissed,
          href: `${sportifs}/${competition.athleteId}?onglet=objectifs`,
          title: `${competition.title} · ${competition.athleteName}`,
          sub: competition.detail || "Compétition",
          // Le jour en étiquette (ordinateur), « J-3 » à droite (aussi sur téléphone).
          tags: [{ label: dayShortLabel(competition.date, today), tone: "neutral" }],
          right: { text: when },
          menuSubtitle: `Compétition · ${when}`,
        };
      }),
    });
  }

  return (
    <>
      <PageHeader title="Notifications" />
      <PageBody>
        {hidden.length > 0 ? (
          <p className="px-1.5 text-[13px] leading-[1.45] text-muted">
            Masqué :{" "}
            {hidden.map((kind) => notificationKindLabels[kind].label.toLowerCase()).join(", ")}.{" "}
            <Link
              // La fenêtre des Paramètres s'ouvre par-dessus cette page (D-127).
              href="/coach/notifications?parametres=preferences"
              scroll={false}
              className="font-medium text-text underline underline-offset-4"
            >
              Changer dans Paramètres
            </Link>
          </p>
        ) : null}
        <NotificationsView
          sections={sections}
          actions={{
            setRead: setNotificationsRead.bind(null, organizationId),
            dismiss: dismissNotifications.bind(null, organizationId),
            restore: restoreNotifications.bind(null, organizationId),
            remove: deleteNotifications.bind(null, organizationId),
            undelete: undeleteNotifications.bind(null, organizationId),
          }}
        />
      </PageBody>
    </>
  );
}
