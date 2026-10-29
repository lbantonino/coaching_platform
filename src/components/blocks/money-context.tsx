"use client";

import { createContext, useContext, type ReactNode } from "react";

import { formatMoney, type Currency } from "@/domain/billing/money";
import { paymentMethodLabel, type PaymentMethod } from "@/domain/billing/payments";

// Argent de l'organisation (D-69), pour les composants du navigateur : sa devise, son pays (nom des
// moyens de paiement) et son taux de TVA habituel (celui de la structure par défaut, 0 sinon).
// Fourni par la coquille de l'espace coach ; les pages serveur lisent les mêmes valeurs elles-mêmes.
export type MoneySettings = { currency: Currency; country: string; vatRate: number };

const MoneyContext = createContext<MoneySettings>({ currency: "EUR", country: "BE", vatRate: 0 });

export function MoneyProvider({ value, children }: { value: MoneySettings; children: ReactNode }) {
  return <MoneyContext value={value}>{children}</MoneyContext>;
}

export function useMoney() {
  const settings = useContext(MoneyContext);
  return {
    ...settings,
    // Un montant dans la devise donnée (celle d'un paiement, d'une facture), sinon celle de l'organisation.
    format: (cents: number, currency: Currency = settings.currency) => formatMoney(cents, currency),
    methodLabel: (method: PaymentMethod) => paymentMethodLabel(method, settings.country),
  };
}
