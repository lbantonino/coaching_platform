import { currencyOf, type Currency } from "@/domain/billing/money";
import "server-only";

import {
  normalizeRule,
  recurrenceRuleSchema,
  type RecurrenceRule,
} from "@/domain/sessions/recurrence";
import type { Discipline } from "@/domain/training/discipline";
import { createClient } from "@/lib/supabase/server";

import type { SessionException, SessionKind, SessionPaymentMethod } from "./schemas";

// photoPath : photo de profil (stockage privé), pour la carte « Prochaine séance » (D-77).
const readRule = (value: unknown): RecurrenceRule | null => {
  const parsed = recurrenceRuleSchema.safeParse(value);
  return parsed.success ? normalizeRule(parsed.data) : null;
};

export type SessionAthlete = { id: string; name: string; photoPath?: string | null };

export type CoachSession = {
  id: string;
  kind: SessionKind;
  title: string;
  discipline: Discipline | null;
  location: string | null;
  startsOn: string;
  // « 19:00 » (la base renvoie « 19:00:00 »).
  startTime: string;
  // « Jour entier » (D-204).
  allDay: boolean;
  // Alertes (D-205) : minutes avant le début.
  alerts: number[];
  durationMinutes: number;
  repeatsWeekly: boolean;
  // Règle de récurrence (D-203) ; null pour une séance unique.
  recurrence: RecurrenceRule | null;
  endsOn: string | null;
  notes: string | null;
  // Séance individuelle : son sportif. Séance collective : ses inscrits.
  athletes: SessionAthlete[];
  // Dates déplacées (séance hebdomadaire seulement).
  exceptions: SessionException[];
  // Prix (D-52), en centimes ; null : pas de prix. TVA de la séance (D-163) : vatRate (0 = sans TVA),
  // comprise dans le prix si priceVatIncluded, sinon elle s'ajoute.
  priceCents: number | null;
  priceVatIncluded: boolean;
  vatRate: number;
  // Devise du prix (D-69).
  currency: Currency;
  paymentMethod: SessionPaymentMethod | null;
};

// Le sportif direct (séance individuelle) et les inscrits (collective) passent par deux relations
// différentes vers athlete_profiles : on nomme chacune pour lever l'ambiguïté.
export const SESSION_SELECT = `id, kind, title, discipline, location, starts_on, start_time, duration_minutes, all_day, alerts,
  repeats_weekly, recurrence, ends_on, notes, price_cents, price_vat_included, vat_rate, currency, payment_method,
  individual:athlete_profiles!coach_sessions_athlete_id_organization_id_fkey ( id, first_name, display_name, photo_path ),
  enrolled:coach_session_athletes ( athlete:athlete_profiles!coach_session_athletes_athlete_id_organization_id_fkey ( id, first_name, display_name, photo_path ) ),
  exceptions:coach_session_exceptions ( original_date, new_date, new_start_time )`;

type Profile = {
  id: string;
  first_name: string;
  display_name: string | null;
  photo_path: string | null;
} | null;
export type SessionRow = {
  id: string;
  kind: string;
  title: string;
  discipline: string | null;
  location: string | null;
  starts_on: string;
  start_time: string;
  all_day: boolean;
  alerts: number[];
  duration_minutes: number;
  repeats_weekly: boolean;
  recurrence: unknown;
  ends_on: string | null;
  notes: string | null;
  price_cents: number | null;
  price_vat_included: boolean;
  vat_rate: number;
  currency: string;
  payment_method: string | null;
  individual: Profile;
  enrolled: { athlete: Profile }[];
  exceptions: { original_date: string; new_date: string; new_start_time: string }[];
};

// display_name est calculé par la base : jamais vide, le repli ne sert qu'au typage.
const toAthlete = (profile: NonNullable<Profile>): SessionAthlete => ({
  id: profile.id,
  name: profile.display_name ?? profile.first_name,
  photoPath: profile.photo_path,
});

export function toCoachSession(row: SessionRow): CoachSession {
  const athletes = row.individual
    ? [toAthlete(row.individual)]
    : row.enrolled
        .flatMap(({ athlete }) => (athlete ? [toAthlete(athlete)] : []))
        .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return {
    id: row.id,
    // Les contraintes CHECK en base garantissent ces listes fermées.
    kind: row.kind as SessionKind,
    title: row.title,
    discipline: row.discipline as Discipline | null,
    location: row.location,
    startsOn: row.starts_on,
    startTime: row.start_time.slice(0, 5),
    allDay: row.all_day,
    alerts: row.alerts,
    durationMinutes: row.duration_minutes,
    repeatsWeekly: row.repeats_weekly,
    // Une règle illisible (jamais en principe : la base la vérifie) : chaque semaine, le jour du début.
    recurrence: row.repeats_weekly ? readRule(row.recurrence) : null,
    endsOn: row.ends_on,
    notes: row.notes,
    athletes,
    exceptions: row.exceptions.map((e) => ({
      originalDate: e.original_date,
      newDate: e.new_date,
      newStartTime: e.new_start_time.slice(0, 5),
    })),
    priceCents: row.price_cents,
    priceVatIncluded: row.price_vat_included,
    vatRate: Number(row.vat_rate),
    currency: currencyOf(row.currency),
    paymentMethod: row.payment_method as SessionPaymentMethod | null,
  };
}

// Séances de l'organisation (DÉJÀ vérifiée par requireOrgAccess), filtrées par la RLS.
export async function listSessions(organizationId: string): Promise<CoachSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_sessions")
    .select(SESSION_SELECT)
    .eq("organization_id", organizationId)
    .order("start_time");
  if (error) throw new Error("Lecture des séances impossible.");
  return ((data ?? []) as unknown as SessionRow[]).map(toCoachSession);
}

export async function getSession(
  organizationId: string,
  sessionId: string,
): Promise<CoachSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_sessions")
    .select(SESSION_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error("Lecture de la séance impossible.");
  return data ? toCoachSession(data as unknown as SessionRow) : null;
}

// Paiements des dates d'une séance (D-52), repérés par la date de la série (`sessionDate`).
export type SessionPayment = {
  id: string;
  sessionDate: string;
  receivedOn: string;
  amountCents: number;
  currency: Currency;
  method: string;
};

export async function listSessionPayments(
  organizationId: string,
  sessionId: string,
): Promise<SessionPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_payments")
    .select("id, session_date, received_on, amount_cents, currency, method")
    .eq("organization_id", organizationId)
    .eq("session_id", sessionId);
  if (error) throw new Error("Lecture des paiements de la séance impossible.");
  return (data ?? []).flatMap((row) =>
    row.session_date
      ? [
          {
            id: row.id,
            sessionDate: row.session_date,
            receivedOn: row.received_on,
            amountCents: row.amount_cents,
            currency: currencyOf(row.currency),
            method: row.method,
          },
        ]
      : [],
  );
}
