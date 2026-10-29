import type { Converter, Currency } from "@/domain/billing/money";

import {
  sessionAmountCents,
  sessionOccurrences,
  type ScheduleLike,
  type SessionException,
} from "./schemas";

// Prix des séances (D-52) : ce que les séances d'une période « pourraient rapporter », TVA comprise.
// Règle PURE, testée par Vitest : chaque date de séance avec un prix compte une fois, déplacements
// compris (une date déplacée compte à sa nouvelle date), sauf si `covered` dit qu'elle est comprise
// dans un forfait déjà payé. Ce n'est PAS de l'argent reçu : « Encaissé » reste la somme des
// paiements (D-36).
export type PricedSessionLike = ScheduleLike & {
  startTime: string;
  exceptions?: SessionException[];
  priceCents: number | null;
  priceVatIncluded: boolean;
  // Devise du prix (D-69) ; sans devise, celle de l'organisation.
  currency?: Currency;
};

export function plannedIncome<T extends PricedSessionLike>(
  sessions: T[],
  from: string,
  to: string,
  // Taux de TVA habituel de l'organisation (D-69), pour les prix hors TVA.
  vatRate: number,
  covered: (session: T, date: string) => boolean = () => false,
  // Après un changement de devise (D-70) : prix ramenés dans la devise de l'organisation.
  convert?: Converter,
): { count: number; inclCents: number } {
  let count = 0;
  let inclCents = 0;
  for (const session of sessions) {
    if (session.priceCents === null) continue;
    const dates = sessionOccurrences(session, from, to).filter(
      (occurrence) => !covered(session, occurrence.originalDate),
    ).length;
    count += dates;
    const amount = sessionAmountCents({ ...session, priceCents: session.priceCents }, vatRate);
    inclCents += dates * (convert && session.currency ? convert(amount, session.currency) : amount);
  }
  return { count, inclCents };
}
