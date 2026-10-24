import "server-only";

import { invoiceStatus } from "@/domain/billing/invoices";
import { listAthletes } from "@/features/athletes/queries";
import { listInvoices, type AthleteInvoice } from "@/features/billing/queries";
import { listConversations, type Conversation } from "@/features/messages/queries";
import { listTasks, type CoachTask } from "@/features/tasks/queries";
import { createClient } from "@/lib/supabase/server";

// Notifications du coach (D-37) : ce qui demande son attention, en sections, calculé à partir des
// vraies données (rien n'est stocké à part) : messages non lus, tâches du jour ou en retard, factures
// en retard, fiches à compléter. Les retours de séance s'ajouteront en P6.
export type NotificationCounts = {
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
  const [messages, tasks, invoices, profiles] = await Promise.all([
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
    messages: messages.count ?? 0,
    tasks: tasks.count ?? 0,
    invoices: invoices.count ?? 0,
    profiles: profiles.count ?? 0,
  };
  return { ...counts, total: counts.messages + counts.tasks + counts.invoices + counts.profiles };
}

export type IncompleteProfile = { id: string; name: string; missing: string[] };

export type Notifications = {
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
  const [conversations, tasks, invoices, athletes] = await Promise.all([
    listConversations(organizationId),
    listTasks(organizationId),
    listInvoices(organizationId),
    listAthletes(organizationId, { status: "all", q: "" }),
  ]);
  return {
    messages: conversations.filter((conversation) => conversation.unread > 0),
    tasks: tasks.open.filter((task) => task.dueOn !== null && task.dueOn <= today),
    invoices: invoices.filter((invoice) => invoiceStatus(invoice, today) === "overdue"),
    profiles: athletes
      .filter((athlete) => athlete.status !== "archived" && athlete.missingInfo.length > 0)
      .map((athlete) => ({
        id: athlete.id,
        name: athlete.displayName,
        missing: athlete.missingInfo,
      })),
  };
}
