import { z } from "zod";

import { isCurrency, parseVatRate, type Currency } from "@/domain/billing/money";
import { isCountryCode } from "@/domain/geo/countries";

import { emailField, newPasswordField } from "./schemas";

// Inscription libre (D-30) : règles PURES, testées par Vitest.

// Version des conditions et de la politique de confidentialité acceptées (pages provisoires).
// Nouvelle version le 06/11/2026 (D-139) : éditeur, contact et hébergement complétés, code d'accès.
export const TERMS_VERSION = "2026-11-06-provisoire";

export const ACCOUNT_KINDS = ["coach", "athlete"] as const;
export type AccountKind = (typeof ACCOUNT_KINDS)[number];
const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `Indique ton ${label}.` })
    .max(80, {
      error: `${label[0].toUpperCase()}${label.slice(1)} trop long (80 caractères maximum).`,
    });

// Téléphone facultatif : on accepte « 0470/12.34.56 » ou « +32 470 12 34 56 » et on garde chiffres,
// espaces et « + » (même règle que la base).
const phone = z
  .string()
  .trim()
  .transform((value) =>
    value
      .replace(/[./()-]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
  .refine((value) => value === "" || /^\+?[0-9 ]{6,20}$/.test(value), {
    error: "Numéro de téléphone invalide.",
  })
  .transform((value) => (value === "" ? null : value));

const organizationName = z
  .string()
  .trim()
  .max(120, { error: "Nom de l'entreprise trop long (120 caractères maximum)." })
  .transform((value) => (value === "" ? null : value));

const terms = z.literal("on", {
  error: "Tu dois accepter les conditions pour continuer.",
});

// Code d'accès de la bêta privée (D-140) : vérifié par Supabase (crochet « before user created »),
// ici seulement « présent ». Majuscules et espaces des bords ignorés, comme en base.
const accessCode = z
  .string()
  .trim()
  .min(1, { error: "Indique ton code d'accès." })
  .max(64, { error: "Code d'accès incorrect." })
  .transform((value) => value.toUpperCase());

// Inscription (maquette du 06/11/2026, D-139) : plus de téléphone, d'entreprise ni de confirmation
// du mot de passe (décision d'Antonino) ; téléphone et entreprise se remplissent dans Paramètres.
export const signupSchema = z.object({
  kind: z.enum(ACCOUNT_KINDS, { error: "Indique si tu es coach ou sportif." }),
  firstName: name("prénom"),
  lastName: name("nom"),
  email: emailField,
  password: newPasswordField,
  accessCode,
  terms,
});

// Dernière étape (après confirmation de l'e-mail, ou après Google / Facebook / Apple).
export const onboardingSchema = z.object({
  kind: z.enum(ACCOUNT_KINDS, { error: "Indique si tu es coach ou sportif." }),
  firstName: name("prénom"),
  lastName: name("nom"),
  phone,
  organizationName,
  terms,
});

// Étape « Pays, devise et TVA » d'un coach (D-69, simplifiée par D-90) : pays et devise (toujours,
// pré-remplis), puis une seule question, la TVA : « Pas de TVA » (par défaut) ou « Je facture la
// TVA » avec son taux. Coory ne fait pas de factures : ce taux sert au prix des séances et au
// résultat HTVA de la Comptabilité. Tout se modifie ensuite dans Paramètres.
export const VAT_CHOICES = ["none", "vat"] as const;
export type VatChoice = (typeof VAT_CHOICES)[number];

export type BillingSetupInput = {
  country: string;
  currency: string;
  vatChoice: string;
  vatRate: string;
};

export type BillingSetup = {
  country: string;
  currency: Currency;
  // 0 = pas de TVA.
  vatRate: number;
};

export function parseBillingSetup(
  input: BillingSetupInput,
): { ok: true; setup: BillingSetup } | { ok: false; error: string } {
  if (!isCountryCode(input.country)) return { ok: false, error: "Choisis ton pays." };
  if (!isCurrency(input.currency)) return { ok: false, error: "Choisis ta devise." };
  const base = { country: input.country, currency: input.currency };
  if (input.vatChoice !== "vat") return { ok: true, setup: { ...base, vatRate: 0 } };
  const vatRate = parseVatRate(input.vatRate);
  if (vatRate === null || vatRate === 0) {
    return { ok: false, error: "Indique ton taux de TVA (un nombre entre 0 et 100)." };
  }
  return { ok: true, setup: { ...base, vatRate } };
}
