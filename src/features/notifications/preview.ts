import type { EditableTask } from "@/components/blocks/task-sheet";
import { formatMoney } from "@/domain/billing/money";
import type { NotifyPreferences } from "@/features/notifications/filter";
import { editableTask } from "@/features/tasks/editable";
import { dayShortLabel, daysBetween, dueLabel, messageTime } from "@/lib/format";

import type { Notifications } from "./queries";

// Aperçu des notifications sous la cloche (ordinateur, demande d'Antonino du 02/11) : les mêmes
// sections et les mêmes règles que la page Notifications (getNotifications), quelques éléments par
// section (non lus d'abord), chacun avec le lien où l'on s'en occupe, et un lien « Voir tout » vers la
// page de la section, déjà filtrée (Messages non lues, Tâches d'aujourd'hui, Facturation en retard,
// Sportifs à compléter ; les compétitions n'ont pas de page à elles : page Notifications). Règle
// PURE : les données viennent de getNotifications, les catégories décochées dans Paramètres (D-57) ne
// sont pas montrées. Les textes sont prêts à afficher (dates relatives à `today`).
export const PREVIEW_ITEMS = 3;

export type PreviewKind = "competitions" | "messages" | "tasks" | "invoices" | "profiles";

export type PreviewItem = {
  key: string;
  read: boolean;
  title: string;
  sub: string;
  // À droite : heure du message, montant de la facture, « J-3 »…
  meta?: string;
  // Une tâche s'ouvre dans sa fenêtre (D-59) plutôt que sur une page.
  href?: string;
  task?: EditableTask;
  // Message : la photo du sportif.
  person?: {
    name: string;
    photoPath: string | null;
    sex: "female" | "male" | "unspecified" | null;
  };
};

export type PreviewSection = {
  kind: PreviewKind;
  title: string;
  // Non lus de la section (tous, pas seulement ceux affichés).
  unread: number;
  total: number;
  items: PreviewItem[];
  more: { href: string; label: string };
};

export type NotificationPreview = { sections: PreviewSection[] };

// Non lus d'abord, puis l'ordre d'origine (le plus récent ou le plus urgent en premier).
const firstUnread = <T extends { read: boolean }>(items: T[]) =>
  [...items].sort((a, b) => Number(a.read) - Number(b.read));

export function buildPreview(
  all: Notifications,
  notify: NotifyPreferences,
  organizationId: string,
  today: string,
): NotificationPreview {
  const sportifs = `/coach/o/${organizationId}/sportifs`;
  const section = <T extends { read: boolean }>(
    kind: PreviewKind,
    title: string,
    items: T[],
    toItem: (item: T) => PreviewItem,
    more: PreviewSection["more"],
  ): PreviewSection => ({
    kind,
    title,
    unread: items.filter((item) => !item.read).length,
    total: items.length,
    items: firstUnread(items).slice(0, PREVIEW_ITEMS).map(toItem),
    more,
  });
  const sections: PreviewSection[] = [];
  if (notify.messages) {
    sections.push(
      section(
        "messages",
        "Messages non lus",
        all.messages,
        (conversation) => ({
          key: conversation.key,
          read: conversation.read,
          title: conversation.athlete.name,
          sub: conversation.lastBody,
          meta: messageTime(conversation.lastAt, today),
          href: `/coach/messages?sportif=${conversation.athlete.id}`,
          person: {
            name: conversation.athlete.name,
            photoPath: conversation.athlete.photoPath,
            sex: conversation.athlete.sex,
          },
        }),
        { href: "/coach/messages?filtre=non-lus", label: "Voir tous les messages non lus" },
      ),
    );
  }
  if (notify.tasks) {
    sections.push(
      section(
        "tasks",
        "Tâches du jour ou en retard",
        all.tasks,
        (task) => ({
          key: task.key,
          read: task.read,
          title: task.title,
          sub: [dueLabel(task.dueOn, today), task.athleteName].filter(Boolean).join(" · "),
          meta: task.priority === "high" ? "Haute" : undefined,
          task: editableTask(task),
        }),
        { href: "/coach/taches?onglet=aujourdhui", label: "Voir toutes les tâches du jour" },
      ),
    );
  }
  if (notify.invoices) {
    sections.push(
      section(
        "invoices",
        "Factures en retard",
        all.invoices,
        (invoice) => ({
          key: invoice.key,
          read: invoice.read,
          title: invoice.athleteName,
          sub: `${invoice.label} · échéance ${dayShortLabel(invoice.dueOn, today).toLowerCase()}`,
          meta: formatMoney(invoice.amountCents, invoice.currency),
          // Brouillons et factures numérotées ont leur page ; le simple suivi d'avant D-65, non.
          href:
            invoice.status === "draft" || invoice.number !== null
              ? `/coach/facturation/${invoice.id}`
              : "/coach/facturation?statut=en-retard",
        }),
        {
          href: "/coach/facturation?statut=en-retard",
          label: "Voir toutes les factures en retard",
        },
      ),
    );
  }
  if (notify.profiles) {
    sections.push(
      section(
        "profiles",
        "Fiches à compléter",
        all.profiles,
        (profile) => ({
          key: profile.key,
          read: profile.read,
          title: profile.name,
          sub: `À compléter : ${profile.missing.join(", ")}`,
          href: `${sportifs}/${profile.id}?onglet=profil`,
        }),
        { href: `${sportifs}?fiche=a-completer`, label: "Voir toutes les fiches à compléter" },
      ),
    );
  }
  if (notify.competitions) {
    sections.push(
      section(
        "competitions",
        "Compétitions des 7 prochains jours",
        all.competitions,
        (competition) => {
          const gap = daysBetween(today, competition.date);
          return {
            key: competition.key,
            read: competition.read,
            title: `${competition.title} · ${competition.athleteName}`,
            sub: competition.detail || dayShortLabel(competition.date, today),
            meta: gap === 0 ? "Jour J" : `J-${gap}`,
            href: `${sportifs}/${competition.athleteId}?onglet=objectifs`,
          };
        },
        {
          href: "/coach/notifications#notif-competitions",
          label: "Voir toutes les compétitions",
        },
      ),
    );
  }
  return { sections };
}
