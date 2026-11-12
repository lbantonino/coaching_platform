"use client";

import { createContext, useContext, type ReactNode } from "react";

import { formatMoney, standardVatRate, type Currency } from "@/domain/billing/money";
import { paymentMethodLabel, type PaymentMethod } from "@/domain/billing/payments";

// Argent de l'organisation (D-69), pour les composants du navigateur : sa devise et son pays (nom des
// moyens de paiement, taux de TVA proposé). La TVA se choisit à chaque paiement, dépense ou séance
// (D-163) : il n'y a plus de taux de l'organisation.
// Fourni par la coquille de l'espace coach ; les pages serveur lisent les mêmes valeurs elles-mêmes.
export type MoneySettings = { currency: Currency; country: string };

const MoneyContext = createContext<MoneySettings>({ currency: "EUR", country: "BE" });

export function MoneyProvider({ value, children }: { value: MoneySettings; children: ReactNode }) {
  return <MoneyContext value={value}>{children}</MoneyContext>;
}

export function useMoney() {
  const settings = useContext(MoneyContext);
  return {
    ...settings,
    // Un montant dans la devise donnée (celle d'un paiement), sinon celle de l'organisation.
    format: (cents: number, currency: Currency = settings.currency) => formatMoney(cents, currency),
    methodLabel: (method: PaymentMethod) => paymentMethodLabel(method, settings.country),
    // Taux pré-rempli quand on coche « Appliquer la TVA » (« 21 », « 8,1 ») ; vide si pays inconnu.
    suggestedVatRate: String(standardVatRate(settings.country) ?? "").replace(".", ","),
  };
}
