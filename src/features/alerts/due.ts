import { alertMoment } from "@/domain/sessions/alerts";
import {
  sessionOccurrences,
  type ScheduleLike,
  type SessionException,
} from "@/features/sessions/schemas";

// Alertes dues à `now` (D-205) : pour chaque séance qui en a, ses dates proches (récurrences et dates
// déplacées comprises, D-203), puis chaque délai. Une alerte est due si son heure est passée depuis
// `windowMinutes` au plus : la route appelée chaque minute ne rattrape pas une longue panne en rafale.
// La clé d'envoi (séance, date d'origine, délai) évite les doublons (session_alerts_sent).
export type AlertSession = ScheduleLike & {
  id: string;
  startTime: string;
  alerts: number[];
  exceptions?: SessionException[];
};

export type DueAlert = { sessionId: string; date: string; originalDate: string; offset: number };

const WINDOW_MINUTES = 15;
// La plus longue alerte : 1 semaine avant (9540 min) ; on regarde 8 jours devant.
const DAYS_AHEAD = 8;

const localDay = (instant: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(instant);
const addDays = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export function dueAlerts(
  sessions: AlertSession[],
  now: Date,
  timeZone: string,
  windowMinutes = WINDOW_MINUTES,
): DueAlert[] {
  const today = localDay(now, timeZone);
  const from = addDays(today, -1);
  const to = addDays(today, DAYS_AHEAD);
  const due: DueAlert[] = [];
  for (const session of sessions) {
    if (session.alerts.length === 0) continue;
    for (const occurrence of sessionOccurrences(session, from, to)) {
      const startTime = session.allDay ? "00:00" : occurrence.startTime;
      for (const offset of session.alerts) {
        const at = alertMoment(occurrence.date, startTime, offset, timeZone).getTime();
        if (at <= now.getTime() && at > now.getTime() - windowMinutes * 60_000) {
          due.push({
            sessionId: session.id,
            date: occurrence.date,
            originalDate: occurrence.originalDate,
            offset,
          });
        }
      }
    }
  }
  return due;
}
