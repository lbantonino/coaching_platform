import "server-only";

import { COLLECT_WEEKS, coveredByPackage } from "@/domain/billing/payments";
import { addDays } from "@/features/agenda/items";
import { listSessions, type CoachSession } from "@/features/sessions/queries";
import { datesToCollect } from "@/features/sessions/prices";
import { nowTimeInBrussels, todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { listPackageCovers, type PackageCover } from "./payment-queries";

// À encaisser : les COLLECT_WEEKS dernières semaines (règle dans domain/billing/payments).
export { COLLECT_WEEKS };
// En retard : pas payée plus d'une semaine après la séance. Seules celles-là sonnent dans la cloche,
// pour qu'elle ne signale pas chaque séance tout juste finie.
export const LATE_AFTER_DAYS = 7;

export type UnpaidDate = {
  sessionId: string;
  title: string;
  // Séance individuelle : son sportif ; collective : null (un seul prix pour toute la séance).
  athleteName: string | null;
  date: string;
  originalDate: string;
  // « 19:00 » ; vide pour une séance « Jour entier » (D-204).
  startTime: string;
  // Montant attendu, TVA comprise, dans la devise de la séance.
  amountCents: number;
  currency: CoachSession["currency"];
  // La page de la séance, ouverte sur cette date (on peut l'y marquer payée aussi).
  sessionHref: string;
  late: boolean;
};

// Dates déjà payées (séance + date d'origine) depuis `from`, pour une organisation DÉJÀ vérifiée.
async function listPaidSessionDates(organizationId: string, from: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_payments")
    .select("session_id, session_date")
    .eq("organization_id", organizationId)
    .gte("session_date", from);
  if (error) throw new Error("Lecture des paiements des séances impossible.");
  return new Set((data ?? []).map((row) => `${row.session_id}:${row.session_date}`));
}

// Séances passées avec un prix, pas encore payées, pour une organisation DÉJÀ vérifiée
// (requireCoach, requireOrgAccess). La plus récente d'abord. `preloaded` : séances et forfaits déjà
// lus par la page (tableau de bord), pour ne pas les relire.
export async function listUnpaidDates(
  organizationId: string,
  preloaded?: { sessions: CoachSession[]; covers: PackageCover[] },
): Promise<UnpaidDate[]> {
  const today = todayIsoInBrussels();
  const from = addDays(today, -7 * COLLECT_WEEKS);
  const [sessions, covers, paid] = await Promise.all([
    preloaded?.sessions ?? listSessions(organizationId),
    preloaded?.covers ?? listPackageCovers(organizationId),
    listPaidSessionDates(organizationId, from),
  ]);
  return datesToCollect(
    // Sans mode de paiement, une séance ne se marque pas payée (D-52) : elle n'attend rien.
    sessions.filter((session) => session.paymentMethod !== null),
    from,
    today,
    nowTimeInBrussels(),
    (session, date) => paid.has(`${session.id}:${date}`),
    // Forfait : seulement pour une séance individuelle (son sportif).
    (session, date) =>
      session.kind === "individual" && coveredByPackage(covers, session.athletes[0]?.id, date),
  ).map(({ session, date, originalDate, startTime, amountCents }) => ({
    sessionId: session.id,
    title: session.title,
    athleteName: session.kind === "individual" ? (session.athletes[0]?.name ?? null) : null,
    date,
    originalDate,
    startTime: session.allDay ? "" : startTime.slice(0, 5),
    amountCents,
    currency: session.currency,
    sessionHref: `/coach/o/${organizationId}/agenda/seances/${session.id}?date=${date}`,
    late: date < addDays(today, -LATE_AFTER_DAYS),
  }));
}
