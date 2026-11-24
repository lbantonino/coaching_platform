import { parseAlerts } from "@/domain/sessions/alerts";
import { z } from "zod";

import { parseVatRate } from "@/domain/billing/money";
import { addVat, parseAmount } from "@/domain/billing/payments";
import { DISCIPLINES, type Discipline } from "@/domain/training/discipline";
import {
  describeRule,
  normalizeRule,
  presetOf,
  recurrenceRuleSchema,
  ruleDates,
  weeklyRule,
  type RecurrenceRule,
} from "@/domain/sessions/recurrence";
import { formatDate } from "@/lib/format";

import type { CoachSession } from "./queries";

// Séances encadrées du coach, en présentiel (P2-05b, D-27). Règles PURES, testées par Vitest.
// Individuelle d'abord (demande d'Antonino, 23/10) : un coach fait surtout du coaching individuel.
export const SESSION_KINDS = ["individual", "group"] as const;
// Durée rangée d'une séance « Jour entier » (D-204, contrainte coach_sessions_all_day_time).
export const ALL_DAY_DURATION = 60;
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
  // « Jour entier » (D-204) : sans heure ni durée (rangée à 00:00, 60 min).
  allDay?: boolean;
  // Alertes (D-205) : « 15,1440 » (minutes avant le début), deux au plus ; vide = aucune.
  alerts?: string;
  repeatsWeekly: boolean;
  endsOn: string;
  // Récurrence (D-203) : la règle en JSON quand elle ne se déduit pas du début (« chaque semaine, le
  // jour du début » sinon) ; vide ou absente = cette règle par défaut.
  recurrence?: string;
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

// « Modifier la séance » : seuls les sportifs AJOUTÉS doivent être des fiches actives ; un inscrit
// archivé depuis reste inscrit et ne bloque pas l'enregistrement (relecture du lot 4, n°1).
export function newlyAddedAthletes(enrolled: Iterable<string>, next: readonly string[]): string[] {
  const before = new Set(enrolled);
  return next.filter((athleteId) => !before.has(athleteId));
}

// « Modifier la séance » pré-remplie depuis la séance enregistrée : la page du formulaire et l'Assistant
// IA (lot 4, qui fusionne ses changements dans ces valeurs) partagent cette règle. `enrolledIds` : les
// inscrits d'une séance collective.
export function sessionFormInitial(
  session: CoachSession,
  enrolledIds: Iterable<string>,
): SessionFormInput {
  return {
    kind: session.kind,
    title: session.title,
    discipline: session.discipline ?? "",
    location: session.location ?? "",
    startsOn: session.startsOn,
    startTime: session.startTime,
    durationMinutes: String(session.durationMinutes),
    allDay: session.allDay,
    alerts: session.alerts.join(","),
    repeatsWeekly: session.repeatsWeekly,
    endsOn: session.endsOn ?? "",
    // Une règle qui ne se déduit pas du début est renvoyée telle quelle (une série « chaque semaine »
    // suit son début si on le change, comme avant D-203).
    recurrence:
      session.recurrence && presetOf(session.recurrence, session.startsOn) !== "weekly"
        ? JSON.stringify(session.recurrence)
        : "",
    athleteId: session.kind === "individual" ? (session.athletes[0]?.id ?? "") : "",
    athleteIds: session.kind === "group" ? [...enrolledIds] : [],
    newClient: false,
    newAthleteName: "",
    notes: session.notes ?? "",
    // 6500 -> « 65 » ; 6550 -> « 65,50 ».
    price:
      session.priceCents === null
        ? ""
        : (session.priceCents / 100).toFixed(2).replace(".", ",").replace(/,00$/, ""),
    // TVA de la séance (D-163) : cochée si elle en a une, avec son taux (« 8,1 »).
    applyVat: session.vatRate > 0,
    vatRate: session.vatRate > 0 ? String(session.vatRate).replace(".", ",") : "",
    vatIncluded: session.priceVatIncluded,
    paymentMethod: session.paymentMethod ?? "transfer",
  };
}

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
  // « Jour entier » (D-204) : start_time 00:00 et duration_minutes 60, rangés (contrainte en base).
  all_day: boolean;
  // Alertes (D-205) : minutes avant le début, deux au plus (contrainte en base).
  alerts: number[];
  repeats_weekly: boolean;
  // Règle de récurrence (D-203), null pour une séance unique.
  recurrence: RecurrenceRule | null;
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

  // « Jour entier » : l'heure et la durée envoyées ne comptent pas.
  const allDay = input.allDay === true;
  const time = allDay
    ? ["00:00", "00", "00"]
    : /^([01]\d|2[0-3]):([0-5]\d)$/.exec(input.startTime.trim());
  if (!time) return { ok: false, error: "Indique l'heure de début, par exemple 19:00." };

  const alerts = parseAlerts(input.alerts ?? "", allDay);
  if (!alerts) {
    return { ok: false, error: "Alertes invalides : deux au plus, parmi les choix proposés." };
  }

  const duration = allDay ? ALL_DAY_DURATION : Number(input.durationMinutes.trim());
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

  // Récurrence (D-203) : la règle envoyée, sinon chaque semaine le jour du début ; aucune sans répétition.
  let recurrence: RecurrenceRule | null = null;
  if (input.repeatsWeekly) {
    const text = (input.recurrence ?? "").trim();
    if (text === "") {
      recurrence = weeklyRule(startsOn);
    } else {
      let json: unknown = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      const rule = recurrenceRuleSchema.safeParse(json);
      if (!rule.success) {
        return { ok: false, error: "Récurrence invalide : choisis au moins un jour." };
      }
      recurrence = normalizeRule(rule.data);
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
        error: "Choisis le sportif de la séance, ou « Nouveau sportif » dans la liste.",
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
      all_day: allDay,
      alerts,
      repeats_weekly: input.repeatsWeekly,
      recurrence,
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

export type ScheduleLike = {
  startsOn: string;
  repeatsWeekly: boolean;
  endsOn: string | null;
  // « Jour entier » (D-204) : pas d'heure à montrer.
  allDay?: boolean;
  // Règle de récurrence (D-203) ; absente pour une ancienne série = chaque semaine, le jour du début.
  recurrence?: RecurrenceRule | null;
};

// La règle d'une séance qui se répète (null pour une séance unique).
export function scheduleRule(session: ScheduleLike): RecurrenceRule | null {
  if (!session.repeatsWeekly) return null;
  return session.recurrence ?? weeklyRule(session.startsOn);
}

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

// Dates d'une séance entre `from` et `to` inclus : sa date unique, ou les dates de sa règle depuis son
// début jusqu'à sa fin éventuelle. Calcul en jours UTC : aucun décalage au changement d'heure.
export function occurrencesBetween(session: ScheduleLike, from: string, to: string): string[] {
  const rule = scheduleRule(session);
  if (!rule) {
    return session.startsOn >= from && session.startsOn <= to ? [session.startsOn] : [];
  }
  // La règle (chaque jour, semaine, mois, année, personnalisée) : src/domain/sessions/recurrence.ts.
  return ruleDates(session.startsOn, session.endsOn, rule, from, to);
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

// « Chaque mercredi à 19:00 · 1 h 30 » ou « Le 28 octobre 2026 à 08:00 · 1 h » ; « Jour entier » :
// « Le 5 décembre 2026, toute la journée ».
export function describeSchedule(
  session: ScheduleLike & { startTime: string; durationMinutes: number },
): string {
  const at = session.allDay ? ", toute la journée" : ` à ${session.startTime.slice(0, 5)}`;
  const rule = scheduleRule(session);
  // Une série simple garde « Chaque mercredi » ; une autre règle se dit en entier (D-203).
  const when = !rule
    ? `Le ${formatDate(session.startsOn)}${at}`
    : presetOf(rule, session.startsOn) === "weekly"
      ? `Chaque ${weekdayFormatter.format(new Date(`${session.startsOn}T00:00:00Z`))}${at}`
      : `${describeRule(rule, session.startsOn, null)}${at}`;
  return session.allDay ? when : `${when} · ${formatDuration(session.durationMinutes)}`;
}

// L'heure d'une séance à l'écran : « 19:00 », ou « Toute la journée » (D-204).
export function sessionTimeLabel(startTime: string, allDay = false): string {
  return allDay ? "Toute la journée" : startTime.slice(0, 5);
}

// « Depuis le 2 septembre 2026, jusqu'au 16 décembre 2026 » (séance récurrente seulement).
export function describePeriod(session: ScheduleLike): string | null {
  if (!session.repeatsWeekly) return null;
  const since = `Depuis le ${formatDate(session.startsOn)}`;
  return session.endsOn ? `${since}, jusqu'au ${formatDate(session.endsOn)}` : since;
}
