import { z } from "zod";

import { parseVatRate } from "@/domain/billing/money";
import { addVat, parseAmount } from "@/domain/billing/payments";
import { DISCIPLINES, type Discipline } from "@/domain/training/discipline";
import { formatDate } from "@/lib/format";

// Séances encadrées du coach, en présentiel (P2-05b, D-27). Règles PURES, testées par Vitest.
// Individuelle d'abord (demande d'Antonino, 23/10) : un coach fait surtout du coaching individuel.
export const SESSION_KINDS = ["individual", "group"] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];
export const sessionKindLabels: Record<SessionKind, string> = {
  group: "Collective",
  individual: "Individuelle",
};

export type SessionFormInput = {
  kind: string;
  title: string;
  discipline: string;
  location: string;
  startsOn: string;
  startTime: string;
  durationMinutes: string;
  repeatsWeekly: boolean;
  endsOn: string;
  athleteId: string;
  athleteIds: string[];
  // Séance individuelle avec un nouveau sportif (D-35) : sa fiche minimale est créée avec ce nom.
  newClient: boolean;
  newAthleteName: string;
  notes: string;
  // Prix (D-52) : facultatif, « 65 » ou « 65,50 » ; mode attendu. TVA de la séance (D-163) :
  // « Appliquer la TVA », son taux, et si le prix la comprend déjà.
  price: string;
  applyVat: boolean;
  vatRate: string;
  vatIncluded: boolean;
  paymentMethod: string;
};

// Valeurs prêtes à enregistrer (noms de colonnes) ; les inscrits d'une séance collective sont à part.
export type SessionValues = {
  kind: SessionKind;
  title: string;
  discipline: Discipline | null;
  location: string | null;
  athlete_id: string | null;
  starts_on: string;
  start_time: string;
  duration_minutes: number;
  repeats_weekly: boolean;
  ends_on: string | null;
  notes: string | null;
  price_cents: number | null;
  price_vat_included: boolean;
  vat_rate: number;
  payment_method: SessionPaymentMethod | null;
};

// Paiement d'une séance (D-52) : espèces ou virement, comme l'a demandé Antonino.
export const SESSION_PAYMENT_METHODS = ["transfer", "cash"] as const;
export type SessionPaymentMethod = (typeof SESSION_PAYMENT_METHODS)[number];

// TVA d'une séance : son propre taux (D-163, 0 = sans TVA), choisi dans la fenêtre de la séance.
// Règle de Gianluca (26/10) : par virement, la séance est facturée et le prix est hors TVA
// (65 € HTVA -> 78,65 € payés à 21 %) ; en espèces, le prix est « direct », TVA comprise.
export const defaultVatIncluded = (method: SessionPaymentMethod) => method === "cash";

// Montant reçu pour une date : le prix tel quel s'il est sans TVA ou TVA comprise, sinon le prix
// HTVA plus la TVA de la séance.
export function sessionAmountCents(price: {
  priceCents: number;
  priceVatIncluded: boolean;
  vatRate: number;
}): number {
  return price.vatRate === 0 || price.priceVatIncluded
    ? price.priceCents
    : addVat(price.priceCents, price.vatRate);
}

// Nouveau sportif à créer avant la séance (fiche minimale : prénom, et nom s'il est donné).
export type NewAthleteName = { firstName: string; lastName: string | null };

export type SessionParseResult =
  | { ok: true; values: SessionValues; athleteIds: string[]; newAthlete: NewAthleteName | null }
  | { ok: false; error: string };

// « John » -> prénom John ; « John Martin Dupont » -> prénom John, nom « Martin Dupont » (comme la
// fiche sportif : le prénom est le premier mot).
export function splitAthleteName(fullName: string): NewAthleteName | null {
  const [firstName, ...rest] = fullName.trim().split(/\s+/).filter(Boolean);
  if (!firstName) return null;
  return { firstName, lastName: rest.length > 0 ? rest.join(" ") : null };
}

const isoDay = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && value >= "2000-01-01";

// Lecture PURE du formulaire « Nouvelle séance » / « Modifier la séance ».
export function parseSessionForm(input: SessionFormInput): SessionParseResult {
  const kind = SESSION_KINDS.find((candidate) => candidate === input.kind);
  if (!kind) return { ok: false, error: "Choisis le type de séance." };

  const title = input.title.trim();
  if (title.length < 1 || title.length > 120) {
    return { ok: false, error: "Donne un titre à la séance (120 caractères maximum)." };
  }

  let discipline: Discipline | null = null;
  if (input.discipline !== "") {
    discipline = DISCIPLINES.find((candidate) => candidate === input.discipline) ?? null;
    if (!discipline) return { ok: false, error: "Discipline invalide." };
  }

  const location = input.location.trim();
  if (location.length > 120) {
    return { ok: false, error: "Lieu trop long (120 caractères maximum)." };
  }

  const startsOn = input.startsOn.trim();
  if (!isoDay(startsOn)) return { ok: false, error: "Indique la date de la séance." };

  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(input.startTime.trim());
  if (!time) return { ok: false, error: "Indique l'heure de début, par exemple 19:00." };

  const duration = Number(input.durationMinutes.trim());
  if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
    return { ok: false, error: "Durée invalide : entre 15 et 480 minutes." };
  }

  let endsOn: string | null = null;
  if (input.repeatsWeekly && input.endsOn.trim() !== "") {
    endsOn = input.endsOn.trim();
    if (!isoDay(endsOn)) return { ok: false, error: "Date de fin invalide." };
    if (endsOn < startsOn) {
      return { ok: false, error: "La date de fin ne peut pas précéder la première séance." };
    }
  }

  const notes = input.notes.trim();
  if (notes.length > 500) return { ok: false, error: "Note trop longue (500 caractères maximum)." };

  let priceCents: number | null = null;
  let paymentMethod: SessionPaymentMethod | null = null;
  let vatRate = 0;
  if (input.price.trim() !== "") {
    priceCents = parseAmount(input.price);
    if (priceCents === null) {
      return { ok: false, error: "Prix invalide : écris par exemple 65 ou 65,50." };
    }
    paymentMethod =
      SESSION_PAYMENT_METHODS.find((method) => method === input.paymentMethod) ?? null;
    if (!paymentMethod) return { ok: false, error: "Choisis espèces ou virement." };
    if (input.applyVat) {
      const rate = parseVatRate(input.vatRate);
      if (rate === null) {
        return { ok: false, error: "Taux de TVA invalide : un nombre entre 0 et 100 (ex. 21)." };
      }
      vatRate = rate;
    }
  }

  let athleteId: string | null = null;
  let newAthlete: NewAthleteName | null = null;
  let athleteIds: string[] = [];
  if (kind === "individual" && input.newClient) {
    // Nouveau sportif : sa fiche minimale sera créée avec ce nom, puis la séance lui sera rattachée.
    newAthlete = splitAthleteName(input.newAthleteName);
    if (!newAthlete) return { ok: false, error: "Écris le nom du nouveau sportif." };
    if (newAthlete.firstName.length > 80 || (newAthlete.lastName?.length ?? 0) > 80) {
      return { ok: false, error: "Nom trop long (80 caractères maximum)." };
    }
  } else if (kind === "individual") {
    if (!z.uuid().safeParse(input.athleteId).success) {
      return {
        ok: false,
        error: "Choisis le sportif de la séance, ou coche « Nouveau sportif ».",
      };
    }
    athleteId = input.athleteId;
  } else {
    athleteIds = [...new Set(input.athleteIds)];
    if (athleteIds.some((id) => !z.uuid().safeParse(id).success) || athleteIds.length > 100) {
      return { ok: false, error: "Liste de sportifs invalide." };
    }
  }

  return {
    ok: true,
    athleteIds,
    newAthlete,
    values: {
      kind,
      title,
      discipline,
      location: location === "" ? null : location,
      athlete_id: athleteId,
      starts_on: startsOn,
      start_time: `${time[1]}:${time[2]}`,
      duration_minutes: duration,
      repeats_weekly: input.repeatsWeekly,
      ends_on: endsOn,
      notes: notes === "" ? null : notes,
      price_cents: priceCents,
      // Sans TVA, le prix est ce que le sportif paie.
      price_vat_included: vatRate === 0 ? true : input.vatIncluded,
      vat_rate: vatRate,
      payment_method: paymentMethod,
    },
  };
}

export type ScheduleLike = { startsOn: string; repeatsWeekly: boolean; endsOn: string | null };

// Date déplacée d'une séance hebdomadaire (*_seances_dates_deplacees.sql) : l'occurrence du
// `originalDate` a lieu le `newDate` à `newStartTime` (« 18:00 »).
export type SessionException = { originalDate: string; newDate: string; newStartTime: string };

export type Occurrence = {
  date: string;
  startTime: string;
  // Date de la série dont vient l'occurrence (= `date` si elle n'a pas été déplacée).
  originalDate: string;
  moved: boolean;
};

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);
const isoFromDay = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);

// Dates d'une séance entre `from` et `to` inclus : sa date unique, ou chaque semaine depuis son début
// jusqu'à sa fin éventuelle. Calcul en jours UTC : aucun décalage au changement d'heure.
export function occurrencesBetween(session: ScheduleLike, from: string, to: string): string[] {
  const start = dayNumber(session.startsOn);
  const first = dayNumber(from);
  const last = Math.min(
    dayNumber(to),
    session.endsOn ? dayNumber(session.endsOn) : Number.POSITIVE_INFINITY,
  );
  if (!session.repeatsWeekly) {
    return start >= first && start <= last ? [session.startsOn] : [];
  }
  // Première occurrence ≥ from : on avance d'un nombre entier de semaines depuis le début.
  const weeksToSkip = Math.max(0, Math.ceil((first - start) / 7));
  const dates: string[] = [];
  for (let day = start + weeksToSkip * 7; day <= last; day += 7) dates.push(isoFromDay(day));
  return dates;
}

// Rang d'une date dans sa série hebdomadaire (« Séance 9 sur 19 », page d'une séance) : `originalDate`
// est la date d'origine (une date déplacée garde son rang). `total` vaut null pour une série sans fin.
// null : pas une série, ou pas une de ses dates.
export function seriesPosition(
  session: ScheduleLike,
  originalDate: string,
): { index: number; total: number | null } | null {
  if (!session.repeatsWeekly || !occursOn(session, originalDate)) return null;
  const index = occurrencesBetween(session, session.startsOn, originalDate).length;
  const total = session.endsOn
    ? occurrencesBetween(session, session.startsOn, session.endsOn).length
    : null;
  return { index, total };
}

// Vraie date de la série ?
export function occursOn(session: ScheduleLike, date: string): boolean {
  return occurrencesBetween(session, date, date).length === 1;
}

// Dates d'une séance entre `from` et `to`, déplacements compris : une date déplacée quitte sa place
// et apparaît à sa nouvelle date (même venant d'une autre semaine). Les déplacements devenus
// orphelins (série modifiée depuis) sont ignorés. Triées par date puis heure.
export function sessionOccurrences(
  session: ScheduleLike & { startTime: string; exceptions?: SessionException[] },
  from: string,
  to: string,
): Occurrence[] {
  const exceptions = (session.exceptions ?? []).filter((e) => occursOn(session, e.originalDate));
  const moved = new Set(exceptions.map((e) => e.originalDate));
  const result: Occurrence[] = occurrencesBetween(session, from, to)
    .filter((date) => !moved.has(date))
    .map((date) => ({ date, startTime: session.startTime, originalDate: date, moved: false }));
  for (const exception of exceptions) {
    if (exception.newDate < from || exception.newDate > to) continue;
    result.push({
      date: exception.newDate,
      startTime: exception.newStartTime,
      originalDate: exception.originalDate,
      moved: true,
    });
  }
  return result.sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
}

const weekdayFormatter = new Intl.DateTimeFormat("fr-BE", { weekday: "long", timeZone: "UTC" });

// 90 -> « 1 h 30 » ; 60 -> « 1 h » ; 45 -> « 45 min ».
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

// « Chaque mercredi à 19:00 · 1 h 30 » ou « Le 28 octobre 2026 à 08:00 · 1 h ».
export function describeSchedule(
  session: ScheduleLike & { startTime: string; durationMinutes: number },
): string {
  const time = session.startTime.slice(0, 5);
  const when = session.repeatsWeekly
    ? `Chaque ${weekdayFormatter.format(new Date(`${session.startsOn}T00:00:00Z`))} à ${time}`
    : `Le ${formatDate(session.startsOn)} à ${time}`;
  return `${when} · ${formatDuration(session.durationMinutes)}`;
}

// « Depuis le 2 septembre 2026, jusqu'au 16 décembre 2026 » (séance récurrente seulement).
export function describePeriod(session: ScheduleLike): string | null {
  if (!session.repeatsWeekly) return null;
  const since = `Depuis le ${formatDate(session.startsOn)}`;
  return session.endsOn ? `${since}, jusqu'au ${formatDate(session.endsOn)}` : since;
}
