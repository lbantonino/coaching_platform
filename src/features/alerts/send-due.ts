import "server-only";

import { alertText } from "@/domain/sessions/alerts";
import { SESSION_SELECT, toCoachSession, type SessionRow } from "@/features/sessions/queries";
import { createAdminClient } from "@/lib/supabase/admin";

import { dueAlerts } from "./due";
import { sendPush, type PushTarget } from "./push";

// Envoi des alertes dues (D-205), appelé chaque minute par la route /api/alertes (tâche pg_cron). Le
// client ADMIN est nécessaire : la tâche n'a pas d'utilisateur connecté et passe sur toutes les
// organisations. Il ne lit que ce qu'il faut (séances avec alertes, membres, appareils) et n'écrit que
// le journal des envois et la suppression des appareils désabonnés.
// Chaque alerte est d'abord NOTÉE (session_alerts_sent, clé séance + date + délai), puis envoyée : deux
// appels qui se croisent n'envoient jamais deux fois la même.
export type SendReport = { due: number; sent: number; removed: number };

type AlertRow = SessionRow & {
  organization_id: string;
  organization: { timezone: string } | null;
};

export async function sendDueAlerts(now: Date): Promise<SendReport> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coach_sessions")
    .select(`organization_id, organization:organizations ( timezone ), ${SESSION_SELECT}`)
    .not("alerts", "eq", "{}");
  if (error) throw new Error(`Alertes : lecture des séances impossible (${error.message}).`);
  const rows = (data ?? []) as unknown as AlertRow[];

  const report: SendReport = { due: 0, sent: 0, removed: 0 };
  for (const row of rows) {
    const session = toCoachSession(row);
    const timeZone = row.organization?.timezone ?? "Europe/Brussels";
    const due = dueAlerts([session], now, timeZone);
    if (due.length === 0) continue;

    // Les appareils des coachs de l'organisation (lus une fois par séance).
    const { data: members } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", row.organization_id)
      .in("role", ["owner", "coach"]);
    const userIds = (members ?? []).map((member) => member.user_id);
    const { data: devices } = userIds.length
      ? await admin
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .in("user_id", userIds)
      : { data: [] };

    for (const alert of due) {
      const { data: noted } = await admin
        .from("session_alerts_sent")
        .upsert(
          {
            session_id: session.id,
            occurrence_date: alert.originalDate,
            offset_minutes: alert.offset,
          },
          { onConflict: "session_id,occurrence_date,offset_minutes", ignoreDuplicates: true },
        )
        .select("session_id");
      // Déjà notée : envoyée par un appel précédent.
      if (!noted || noted.length === 0) continue;
      report.due += 1;

      const occurrence = session.exceptions.find((e) => e.originalDate === alert.originalDate);
      const startTime = session.allDay ? "00:00" : (occurrence?.newStartTime ?? session.startTime);
      const text = alertText({
        title: session.title,
        athleteName: session.kind === "individual" ? (session.athletes[0]?.name ?? null) : null,
        location: session.location,
        startTime,
        allDay: session.allDay,
        offset: alert.offset,
      });
      const payload = {
        ...text,
        url: `/coach/o/${row.organization_id}/agenda/seances/${session.id}?date=${alert.date}`,
        tag: `${session.id}:${alert.originalDate}:${alert.offset}`,
      };
      for (const device of (devices ?? []) as (PushTarget & { id: string })[]) {
        const result = await sendPush(device, payload);
        if (result === "sent") report.sent += 1;
        if (result === "gone") {
          await admin.from("push_subscriptions").delete().eq("id", device.id);
          report.removed += 1;
        }
      }
    }
  }
  return report;
}
