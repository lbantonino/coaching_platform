import {
  sessionOccurrences,
  type ScheduleLike,
  type SessionException,
} from "@/features/sessions/schemas";

import { addDays } from "./items";

// Le VRAI rendez-vous d'une séance de programme faite « avec le coach » (revue MVP du 13/11, B3 et
// B4). La version publiée garde la date du rendez-vous au moment de la publication (v2) ou seulement
// l'identifiant de la séance encadrée (v1) ; l'agenda, lui, vit : une date se déplace, une série se
// termine, une séance se supprime. La fiche du sportif, ses onglets et les PDF montrent donc le
// rendez-vous tel qu'il est dans l'agenda, ou disent qu'il n'existe plus. Module PUR, testé par Vitest.

export type MeetingSource = ScheduleLike & {
  id: string;
  startTime: string;
  exceptions?: SessionException[];
};

export type CoachMeeting =
  // Le rendez-vous de cette semaine (déplacé ou non).
  | { status: "ok"; date: string; time: string; moved: boolean }
  // La séance encadrée n'existe plus dans l'agenda.
  | { status: "deleted" }
  // Elle existe, mais n'a pas lieu cette semaine-là (série terminée, date déplacée ailleurs).
  | { status: "absent" };

// `planned` : la date figée dans la version publiée (v2), qui désigne UNE date de la série ; null en
// v1 (seule la semaine est connue).
export function findCoachMeeting(
  source: MeetingSource | undefined,
  week: { monday: string; sunday: string },
  planned: string | null,
): CoachMeeting {
  if (!source) return { status: "deleted" };
  // Deux semaines de marge : une date de la semaine peut avoir été déplacée juste avant ou après.
  const around = sessionOccurrences(source, addDays(week.monday, -14), addDays(week.sunday, 14));
  const inWeek = (date: string) => date >= week.monday && date <= week.sunday;
  // La date de la série qui tombe dans la semaine d'abord (même déplacée dans une semaine voisine :
  // on la suit) ; sinon une date déplacée DANS la semaine.
  const found =
    (planned ? around.find((occurrence) => occurrence.originalDate === planned) : undefined) ??
    around.find((occurrence) => inWeek(occurrence.originalDate)) ??
    around.find((occurrence) => inWeek(occurrence.date));
  if (!found) return { status: "absent" };
  return {
    status: "ok",
    date: found.date,
    time: found.startTime.slice(0, 5),
    moved: found.moved,
  };
}

// Le résolveur attendu par la reprise d'un programme v1 (program-upgrade.ts) : le rendez-vous de la
// semaine, ou null.
export function meetingResolver(sources: readonly MeetingSource[]) {
  const byId = new Map(sources.map((source) => [source.id, source]));
  return (coachSessionId: string, monday: string, sunday: string) => {
    const meeting = findCoachMeeting(byId.get(coachSessionId), { monday, sunday }, null);
    return meeting.status === "ok" ? { date: meeting.date, time: meeting.time } : null;
  };
}
