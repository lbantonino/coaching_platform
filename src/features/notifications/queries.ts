import "server-only";

import {
  competitionKey,
  countUnread,
  latestUnreadByAthlete,
  messageKey,
  profileKey,
  stateMap,
  taskKey,
  unpaidKey,
  type NotificationState,
} from "@/domain/notifications/keys";
import { addDays } from "@/features/agenda/items";
import { listAgendaEvents, type AgendaEvent } from "@/features/agenda/queries";
import { listAthletes } from "@/features/athletes/queries";
import { listUnpaidDates, type UnpaidDate } from "@/features/billing/collect-queries";
import { listConversations, type Conversation } from "@/features/messages/queries";
import { listTasks, type CoachTask } from "@/features/tasks/queries";
import { createClient } from "@/lib/supabase/server";

// Notifications du coach (D-37) : ce qui demande son attention, en sections, calculé à partir des
// vraies données (rien n'est stocké à part) : messages non lus, tâches du jour ou en retard, séances
// à encaisser (D-90, à la place des factures en retard), fiches à compléter, compétitions des
// sportifs dans les 7 jours (demande d'Antonino du 26/10 : les compétitions ne sont plus dans
// l'agenda du coach, ce sont des rappels). Les retours de
// séance s'ajouteront en P6.
// 4e (D-61) : chacune se marque lue ou se masque (table coach_notification_states, par coach) ; la
// cloche ne compte que ce qui n'est ni lu ni masqué.
export const COMPETITION_NOTICE_DAYS = 7;

type Client = Awaited<ReturnType<typeof createClient>>;

// États choisis par le coach connecté (la RLS ne renvoie que les siens).
async function readStates(
  supabase: Client,
  organizationId: string,
): Promise<Map<string, NotificationState>> {
  const { data } = await supabase
    .from("coach_notification_states")
    .select("key, read_at, dismissed_at, deleted_at")
    .eq("organization_id", organizationId);
  return stateMap(data ?? []);
}

// Dernier message non lu de chaque sportif : il définit la notification « message ».
async function unreadMessageHeads(supabase: Client, organizationId: string) {
  const { data } = await supabase
    .from("athlete_messages")
    .select("id, athlete_id")
    .eq("organization_id", organizationId)
    .eq("sender", "athlete")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(1000);
  return latestUnreadByAthlete(data ?? []);
}

export type NotificationCounts = {
  competitions: number;
  messages: number;
  tasks: number;
  unpaid: number;
  profiles: number;
  total: number;
};

// Nombres seulement (pastilles de la coquille), pour une organisation DÉJÀ vérifiée : ce qui n'est
// ni lu ni masqué, par catégorie. Messages : une notification par sportif qui a écrit.
export async function countNotifications(
  organizationId: string,
  today: string,
): Promise<NotificationCounts> {
  const supabase = await createClient();
  const [competitions, heads, tasks, unpaid, profiles, states] = await Promise.all([
    // Compétitions (objectifs en cours avec un nom) d'aujourd'hui aux 7 prochains jours.
    supabase
      .from("athlete_goals")
      .select("id, target_date, athlete_profiles!inner ( status )")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .not("competition_name", "is", null)
      .gte("target_date", today)
      .lte("target_date", addDays(today, COMPETITION_NOTICE_DAYS))
      .neq("athlete_profiles.status", "archived"),
    unreadMessageHeads(supabase, organizationId),
    supabase
      .from("coach_tasks")
      .select("id, due_on")
      .eq("organization_id", organizationId)
      .is("done_at", null)
      .lte("due_on", today),
    listUnpaidDates(organizationId).then((dates) => dates.filter((date) => date.late)),
    // Même règle que features/athletes/completeness : sans nom de famille, ou sans aucun contact.
    supabase
      .from("athlete_profiles")
      .select("id")
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .or("last_name.is.null,and(email.is.null,phone.is.null)"),
    readStates(supabase, organizationId),
  ]);
  const counts = {
    competitions: countUnread(
      (competitions.data ?? []).map((row) => competitionKey(row.id, row.target_date ?? "")),
      states,
    ),
    messages: countUnread(
      [...heads].map(([athleteId, messageId]) => messageKey(athleteId, messageId)),
      states,
    ),
    tasks: countUnread(
      (tasks.data ?? []).map((row) => taskKey(row.id, row.due_on)),
      states,
    ),
    unpaid: countUnread(
      unpaid.map((date) => unpaidKey(date.sessionId, date.originalDate)),
      states,
    ),
    profiles: countUnread(
      (profiles.data ?? []).map((row) => profileKey(row.id)),
      states,
    ),
  };
  return {
    ...counts,
    total: counts.competitions + counts.messages + counts.tasks + counts.unpaid + counts.profiles,
  };
}

export type IncompleteProfile = {
  id: string;
  name: string;
  photoPath: string | null;
  sex: "female" | "male" | "unspecified" | null;
  missing: string[];
};

// Ce que chaque ligne sait d'elle-même : sa clé, si le coach l'a déjà lue, et s'il l'a masquée
// (onglet « Masquées » de la page, kit « Coory Pages » 03, D-128). Les supprimées ne sont pas
// renvoyées.
export type NotificationMeta = { key: string; read: boolean; dismissed: boolean };

export type Notifications = {
  competitions: (AgendaEvent & NotificationMeta)[];
  messages: (Conversation & NotificationMeta)[];
  tasks: (CoachTask & NotificationMeta)[];
  unpaid: (UnpaidDate & NotificationMeta)[];
  profiles: (IncompleteProfile & NotificationMeta)[];
};

// Le détail de chaque section (page Notifications). Le montant attendu d'une séance à encaisser suit
// la TVA de la séance (D-163).
export async function getNotifications(
  organizationId: string,
  today: string,
): Promise<Notifications> {
  const supabase = await createClient();
  const [events, conversations, tasks, unpaid, athletes, heads, states] = await Promise.all([
    listAgendaEvents(organizationId),
    listConversations(organizationId),
    listTasks(organizationId),
    listUnpaidDates(organizationId),
    listAthletes(organizationId, { status: "all", q: "" }),
    unreadMessageHeads(supabase, organizationId),
    readStates(supabase, organizationId),
  ]);
  const until = addDays(today, COMPETITION_NOTICE_DAYS);
  // Ajoute la clé et l'état ; retire ce que le coach a supprimé.
  const withState = <T>(items: T[], keyOf: (item: T) => string): (T & NotificationMeta)[] =>
    items.flatMap((item) => {
      const key = keyOf(item);
      const state = states.get(key);
      return state?.deleted
        ? []
        : [{ ...item, key, read: state?.read ?? false, dismissed: state?.dismissed ?? false }];
    });
  return {
    // Même règle que le compte : compétition en cours (pas un simple objectif daté), sous 7 jours.
    competitions: withState(
      events.filter(
        (event) =>
          event.isCompetition && !event.achieved && event.date >= today && event.date <= until,
      ),
      (event) => competitionKey(event.id, event.date),
    ),
    messages: withState(
      conversations.filter(
        (conversation) => conversation.unread > 0 && heads.has(conversation.athlete.id),
      ),
      (conversation) =>
        messageKey(conversation.athlete.id, heads.get(conversation.athlete.id) ?? ""),
    ),
    tasks: withState(
      tasks.open.filter((task) => task.dueOn !== null && task.dueOn <= today),
      (task) => taskKey(task.id, task.dueOn),
    ),
    // En retard seulement (plus d'une semaine) : la cloche ne sonne pas après chaque séance.
    unpaid: withState(
      unpaid.filter((date) => date.late),
      (date) => unpaidKey(date.sessionId, date.originalDate),
    ),
    profiles: withState(
      athletes
        .filter((athlete) => athlete.status !== "archived" && athlete.missingInfo.length > 0)
        .map((athlete) => ({
          id: athlete.id,
          name: athlete.displayName,
          photoPath: athlete.photoPath,
          sex: athlete.sex,
          missing: athlete.missingInfo,
        })),
      (profile) => profileKey(profile.id),
    ),
  };
}
