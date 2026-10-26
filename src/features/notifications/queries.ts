import "server-only";

import { invoiceStatus } from "@/domain/billing/invoices";
import { addDays } from "@/features/agenda/items";
import { listAgendaEvents, type AgendaEvent } from "@/features/agenda/queries";
import { listAthletes } from "@/features/athletes/queries";
import { listInvoices, type AthleteInvoice } from "@/features/billing/queries";
import { listConversations, type Conversation } from "@/features/messages/queries";
import { listTasks, type CoachTask } from "@/features/tasks/queries";
import { createClient } from "@/lib/supabase/server";

// Notifications du coach (D-37) : ce qui demande son attention, en sections, calculé à partir des
// vraies données (rien n'est stocké à part) : messages non lus, tâches du jour ou en retard, factures
// en retard, fiches à compléter, compétitions des sportifs dans les 7 jours (demande d'Antonino du
// 26/10 : les compétitions ne sont plus dans l'agenda du coach, ce sont des rappels). Les retours de
// séance s'ajouteront en P6.
export const COMPETITION_NOTICE_DAYS = 7;

export type NotificationCounts = {
  competitions: number;
  messages: number;
  tasks: number;
  invoices: number;
  profiles: number;
  total: number;
};

// Nombres seulement (pastilles de la coquille), pour une organisation DÉJÀ vérifiée.
export async function countNotifications(
  organizationId: string,
  today: string,
): Promise<NotificationCounts> {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [competitions, messages, tasks, invoices, profiles] = await Promise.all([
    // Compétitions (objectifs en cours avec un nom) d'aujourd'hui aux 7 prochains jours.
    supabase
      .from("athlete_goals")
      .select("id, athlete_profiles!inner ( status )", head)
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .not("competition_name", "is", null)
      .gte("target_date", today)
      .lte("target_date", addDays(today, COMPETITION_NOTICE_DAYS))
      .neq("athlete_profiles.status", "archived"),
    supabase
      .from("athlete_messages")
      .select("id", head)
      .eq("organization_id", organizationId)
      .eq("sender", "athlete")
      .is("read_at", null),
    supabase
      .from("coach_tasks")
      .select("id", head)
      .eq("organization_id", organizationId)
      .is("done_at", null)
      .lte("due_on", today),
    supabase
      .from("athlete_invoices")
      .select("id", head)
      .eq("organization_id", organizationId)
      .is("paid_on", null)
      .lt("due_on", today),
    // Même règle que features/athletes/completeness : sans nom de famille, ou sans aucun contact.
    supabase
      .from("athlete_profiles")
      .select("id", head)
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .or("last_name.is.null,and(email.is.null,phone.is.null)"),
  ]);
  const counts = {
    competitions: competitions.count ?? 0,
    messages: messages.count ?? 0,
    tasks: tasks.count ?? 0,
    invoices: invoices.count ?? 0,
    profiles: profiles.count ?? 0,
  };
  return {
    ...counts,
    total: counts.competitions + counts.messages + counts.tasks + counts.invoices + counts.profiles,
  };
}

export type IncompleteProfile = {
  id: string;
  name: string;
  photoPath: string | null;
  sex: "female" | "male" | "unspecified" | null;
  missing: string[];
};

export type Notifications = {
  competitions: AgendaEvent[];
  messages: Conversation[];
  tasks: CoachTask[];
  invoices: AthleteInvoice[];
  profiles: IncompleteProfile[];
};

// Le détail de chaque section (page Notifications).
export async function getNotifications(
  organizationId: string,
  today: string,
): Promise<Notifications> {
  const [events, conversations, tasks, invoices, athletes] = await Promise.all([
    listAgendaEvents(organizationId),
    listConversations(organizationId),
    listTasks(organizationId),
    listInvoices(organizationId),
    listAthletes(organizationId, { status: "all", q: "" }),
  ]);
  const until = addDays(today, COMPETITION_NOTICE_DAYS);
  return {
    // Même règle que le compte : compétition en cours (pas un simple objectif daté), sous 7 jours.
    competitions: events.filter(
      (event) =>
        event.isCompetition && !event.achieved && event.date >= today && event.date <= until,
    ),
    messages: conversations.filter((conversation) => conversation.unread > 0),
    tasks: tasks.open.filter((task) => task.dueOn !== null && task.dueOn <= today),
    invoices: invoices.filter((invoice) => invoiceStatus(invoice, today) === "overdue"),
    profiles: athletes
      .filter((athlete) => athlete.status !== "archived" && athlete.missingInfo.length > 0)
      .map((athlete) => ({
        id: athlete.id,
        name: athlete.displayName,
        photoPath: athlete.photoPath,
        sex: athlete.sex,
        missing: athlete.missingInfo,
      })),
  };
}
