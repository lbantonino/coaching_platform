"use client";

import { useState } from "react";

import { useMoney } from "@/components/blocks/money-context";
import { formatVatRate, parseVatRate } from "@/domain/billing/money";
import { addVat, splitVat } from "@/domain/billing/payments";
import type { Discipline } from "@/domain/training/discipline";
import type { SessionFormInput } from "@/features/sessions/schemas";

// Morceaux partagés par les formulaires d'une séance encadrée : la page « Modifier la séance » et la
// fenêtre « Nouvelle séance » façon Apple (D-204).

// Ordre du menu Discipline (demande d'Antonino, 23/10) : les séances encadrées ont surtout lieu en salle.
export const SESSION_DISCIPLINES: Discipline[] = ["strength", "hyrox", "running", "hybrid"];

// TVA d'une séance (D-163, demande d'Antonino du 11/11) : « Appliquer la TVA » est décochée par défaut,
// le prix est alors ce que le sportif paie. Cochée : le taux (pré-rempli avec le taux normal du pays,
// modifiable) et « TVA comprise dans le prix », qui suit le mode de paiement (règle de Gianluca :
// virement = prix hors TVA, espèces = TVA comprise).
export function useSessionVat(v: SessionFormInput) {
  const { suggestedVatRate } = useMoney();
  const [apply, setApply] = useState(v.applyVat);
  const [rateText, setRateText] = useState(v.vatRate || suggestedVatRate);
  const [included, setIncluded] = useState(v.vatIncluded);
  const parsed = parseVatRate(rateText);
  return {
    apply,
    setApply,
    rateText,
    setRateText,
    included,
    setIncluded,
    // Taux appliqué : 0 sans TVA, null si le taux saisi est faux.
    rate: apply ? parsed : 0,
  };
}
export type SessionVat = ReturnType<typeof useSessionVat>;

// Ce que le sportif paie : le prix tel quel sans TVA ou TVA comprise, sinon le prix HTVA plus la TVA.
export function paidAmount(priceCents: number, vat: SessionVat): number {
  return !vat.rate || vat.included ? priceCents : addVat(priceCents, vat.rate);
}

// La phrase de calcul sous le prix, recalculée à chaque frappe.
export function priceSentence(
  priceCents: number,
  vat: SessionVat,
  format: (cents: number) => string,
): string {
  if (vat.rate === null) return "Indique le taux de TVA (ex. 21).";
  if (vat.rate === 0) return `${format(priceCents)} reçus, sans TVA.`;
  const rate = formatVatRate(vat.rate);
  if (vat.included) {
    const split = splitVat(priceCents, vat.rate);
    return `${format(priceCents)} reçus, TVA comprise : ${format(split.exclCents)} HTVA et ${format(split.vatCents)} de TVA (${rate}).`;
  }
  return `${format(priceCents)} HTVA : le sportif paie ${format(addVat(priceCents, vat.rate))}, TVA de ${rate} comprise.`;
}
