import { Coins, Flag, ListChecks, MessageSquare, UserPen, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { MarkAllRead, NotificationRow } from "./notification-row";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardEmpty } from "@/components/ui/card";
import { CountBadge } from "@/components/ui/count-badge";
import { formatMoney } from "@/domain/billing/money";
import { requireCoach } from "@/features/auth/guards";
import { getCoachProfile } from "@/features/coach/profile";
import { NOTIFICATION_KINDS, notificationKindLabels } from "@/features/coach/settings";
import {
  dismissNotification,
  restoreNotification,
  setNotificationsRead,
} from "@/features/notifications/actions";
import { unpaidSub } from "@/features/notifications/preview";
import { COMPETITION_NOTICE_DAYS, getNotifications } from "@/features/notifications/queries";
import {
  dayShortLabel,
  daysBetween,
  dueLabel,
  messageTime,
  todayIsoInBrussels,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Notifications",
};

// Page Notifications (demande d'Antonino, 24/10, D-37) : ce qui demande l'attention du coach, en
// sections : compétitions des sportifs dans les 7 jours (rappels, 26/10 : elles ne sont plus dans
// l'agenda du coach), messages non lus, tâches du jour ou en retard, séances à encaisser (D-90),
// fiches à compléter.
// Tout est calculé à partir des vraies données ; chaque ligne mène là où on s'en occupe, et une ligne
// disparaît d'elle-même une fois la chose faite (message lu, tâche cochée, séance payée, fiche
// complétée). Les retours de séance des sportifs s'ajouteront en P6.
// 4e (D-61) : chaque ligne se marque lue (en l'ouvrant, ou par « ••• ») ou se masque ; « Tout marquer
// comme lu » en rouge. La cloche ne compte que ce qui n'est ni lu ni masqué.
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
    getNotifications(organizationId, today, memberships[0].vatRate),
    getCoachProfile(user),
  ]);
  // Catégories gardées dans Paramètres > Préférences (D-57) : les autres ne s'affichent pas ici.
  const { notify } = profile.preferences;
  const competitions = notify.competitions ? all.competitions : [];
  const messages = notify.messages ? all.messages : [];
  const tasks = notify.tasks ? all.tasks : [];
  const unpaid = notify.unpaid ? all.unpaid : [];
  const profiles = notify.profiles ? all.profiles : [];
  const hidden = NOTIFICATION_KINDS.filter((kind) => !notify[kind]);
  const unreadOf = (items: { read: boolean }[]) => items.filter((item) => !item.read).length;
  const unreadKeys = [...competitions, ...messages, ...tasks, ...unpaid, ...profiles]
    .filter((item) => !item.read)
    .map((item) => item.key);
  const total = unreadKeys.length;
  const actions = {
    setRead: setNotificationsRead.bind(null, organizationId),
    dismiss: dismissNotification.bind(null, organizationId),
    restore: restoreNotification.bind(null, organizationId),
  };
  // Une ligne par clé ET par état : quand la page se recalcule (ex. « Tout marquer comme lu »), la
  // ligne repart de l'état enregistré.
  const rowKey = (item: { key: string; read: boolean }) => `${item.key}:${item.read}`;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={total > 0 ? `${total} à voir` : "Tout est à jour."}
        actions={<MarkAllRead keys={unreadKeys} setRead={actions.setRead} />}
      />
      <PageBody grid>
        {hidden.length > 0 ? (
          <p className="text-small text-muted lg:col-span-12">
            Masqué :{" "}
            {hidden.map((kind) => notificationKindLabels[kind].label.toLowerCase()).join(", ")}.{" "}
            <Link
              href="/coach/profil?onglet=preferences"
              className="font-medium text-text underline underline-offset-4"
            >
              Changer dans Paramètres
            </Link>
          </p>
        ) : null}
        {notify.competitions ? (
          <Section
            id="notif-competitions"
            title={`Compétitions dans les ${COMPETITION_NOTICE_DAYS} jours`}
            count={unreadOf(competitions)}
            icon={Flag}
          >
            {competitions.map((competition) => {
              const gap = daysBetween(today, competition.date);
              return (
                <NotificationRow
                  key={rowKey(competition)}
                  notificationKey={competition.key}
                  read={competition.read}
                  actions={actions}
                  href={`/coach/o/${organizationId}/sportifs/${competition.athleteId}?onglet=objectifs`}
                  leading={
                    <span className="flex w-[84px] shrink-0 flex-col font-mono text-[12px] leading-tight tabular">
                      <span className="text-accent-text">
                        {dayShortLabel(competition.date, today)}
                      </span>
                      <span className="text-[13px] font-medium">
                        {gap === 0 ? "Jour J" : `J-${gap}`}
                      </span>
                    </span>
                  }
                  title={`${competition.title} · ${competition.athleteName}`}
                  sub={competition.detail || "Compétition"}
                  menuSubtitle={`Compétition · ${gap === 0 ? "Jour J" : `J-${gap}`}`}
                />
              );
            })}
          </Section>
        ) : null}

        {notify.messages ? (
          <Section
            id="notif-messages"
            title="Messages non lus"
            count={unreadOf(messages)}
            icon={MessageSquare}
          >
            {messages.map((conversation) => (
              <NotificationRow
                key={rowKey(conversation)}
                notificationKey={conversation.key}
                read={conversation.read}
                actions={actions}
                href={`/coach/messages?sportif=${conversation.athlete.id}`}
                leading={
                  <Avatar
                    name={conversation.athlete.name}
                    photoPath={conversation.athlete.photoPath}
                    sex={conversation.athlete.sex}
                  />
                }
                title={conversation.athlete.name}
                sub={conversation.lastBody}
                menuSubtitle={`Message · ${messageTime(conversation.lastAt, today)} · ${
                  conversation.unread
                } non lu${conversation.unread > 1 ? "s" : ""}`}
                trailing={
                  <span className="flex flex-col items-end gap-1">
                    <span className="font-mono text-[11px] text-muted tabular">
                      {messageTime(conversation.lastAt, today)}
                    </span>
                    <Badge tone="live">
                      {conversation.unread} non lu{conversation.unread > 1 ? "s" : ""}
                    </Badge>
                  </span>
                }
              />
            ))}
          </Section>
        ) : null}

        {notify.tasks ? (
          <Section
            id="notif-tasks"
            title="Tâches du jour ou en retard"
            count={unreadOf(tasks)}
            icon={ListChecks}
          >
            {tasks.map((task) => (
              <NotificationRow
                key={rowKey(task)}
                notificationKey={task.key}
                read={task.read}
                actions={actions}
                href="/coach/taches?onglet=aujourdhui"
                title={task.title}
                sub={task.athleteName ?? undefined}
                menuSubtitle={`Tâche · ${
                  dueLabel(task.dueOn, today) === "En retard" ? "En retard" : "Aujourd'hui"
                }`}
                trailing={
                  <>
                    {task.priority === "high" ? <StatusBadge label="Haute" /> : null}
                    <StatusBadge
                      label={
                        dueLabel(task.dueOn, today) === "En retard" ? "En retard" : "Aujourd'hui"
                      }
                    />
                  </>
                }
              />
            ))}
          </Section>
        ) : null}

        {/* Séances à encaisser (D-90, à la place des factures en retard) : chacune ouvre sa séance,
            sur la bonne date, où elle se marque payée. */}
        {notify.unpaid ? (
          <Section
            id="notif-unpaid"
            title="Séances à encaisser"
            count={unreadOf(unpaid)}
            icon={Coins}
          >
            {unpaid.map((date) => (
              <NotificationRow
                key={rowKey(date)}
                notificationKey={date.key}
                read={date.read}
                actions={actions}
                href={date.sessionHref}
                title={date.athleteName ?? date.title}
                sub={unpaidSub(date, today)}
                menuSubtitle={`Séance à encaisser · ${formatMoney(date.amountCents, date.currency)}`}
                trailing={
                  <span className="text-[15px] font-semibold tabular">
                    {formatMoney(date.amountCents, date.currency)}
                  </span>
                }
              />
            ))}
          </Section>
        ) : null}

        {notify.profiles ? (
          <Section
            id="notif-profiles"
            title="Fiches à compléter"
            count={unreadOf(profiles)}
            icon={UserPen}
          >
            {profiles.map((profile) => (
              <NotificationRow
                key={rowKey(profile)}
                notificationKey={profile.key}
                read={profile.read}
                actions={actions}
                href={`/coach/o/${organizationId}/sportifs/${profile.id}?onglet=profil`}
                leading={
                  <Avatar name={profile.name} photoPath={profile.photoPath} sex={profile.sex} />
                }
                title={profile.name}
                sub={`Manque : ${profile.missing.join(", ")}`}
                menuSubtitle="Fiche à compléter"
              />
            ))}
          </Section>
        ) : null}
      </PageBody>
    </>
  );
}

// Une section : son titre et son nombre (pastille rouge), ses lignes, ou « Rien à signaler ».
function Section({
  id,
  title,
  count,
  icon,
  children,
}: {
  id: string;
  title: string;
  count: number;
  icon: LucideIcon;
  children: ReactNode[];
}) {
  return (
    <Card
      id={id}
      title={
        <span className="inline-flex items-center gap-2">
          {title}
          <CountBadge count={count} />
        </span>
      }
      className="lg:col-span-6"
    >
      {children.length === 0 ? (
        <CardEmpty icon={icon}>Rien à signaler.</CardEmpty>
      ) : (
        <div className="flex flex-col">{children}</div>
      )}
    </Card>
  );
}
