import { z } from "zod";

import { normalizeVatNumber, type VatStatus } from "@/domain/billing/legal";
import { isCurrency, parseVatRate, type Currency } from "@/domain/billing/money";
import { isCountryCode } from "@/domain/geo/countries";

import { emailField, newPasswordField } from "./schemas";

// Inscription libre (D-30) : règles PURES, testées par Vitest.

// Version des conditions et de la politique de confidentialité acceptées (pages provisoires).
export const TERMS_VERSION = "2026-10-23-provisoire";

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

export const signupSchema = z
  .object({
    kind: z.enum(ACCOUNT_KINDS, { error: "Indique si tu es coach ou sportif." }),
    firstName: name("prénom"),
    lastName: name("nom"),
    email: emailField,
    phone,
    organizationName,
    password: newPasswordField,
    confirmation: z.string(),
    terms,
  })
  .refine((values) => values.password === values.confirmation, {
    error: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmation"],
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

// Étape « Ta facturation » d'un coach (D-69, demande d'Antonino du 29/10/2026) : pays et devise
// (toujours, pré-remplis), puis la TVA, facultative (« Je verrai plus tard » : aucune structure créée,
// Coory la demandera avant la première facture). Assujetti : taux habituel et numéro de TVA.
export const VAT_CHOICES = ["subject", "franchise", "not_subject", "later"] as const;
export type VatChoice = (typeof VAT_CHOICES)[number];

export type BillingSetupInput = {
  country: string;
  currency: string;
  vatChoice: string;
  vatRate: string;
  vatNumber: string;
};

export type BillingSetup = {
  country: string;
  currency: Currency;
  // null = « plus tard » : pas de structure.
  vatStatus: VatStatus | null;
  vatRate: number | null;
  vatNumber: string | null;
};

export function parseBillingSetup(
  input: BillingSetupInput,
): { ok: true; setup: BillingSetup } | { ok: false; error: string } {
  if (!isCountryCode(input.country)) return { ok: false, error: "Choisis ton pays." };
  if (!isCurrency(input.currency)) return { ok: false, error: "Choisis ta devise." };
  const choice = VAT_CHOICES.find((item) => item === input.vatChoice) ?? "later";
  const base = { country: input.country, currency: input.currency };
  if (choice === "later") {
    return { ok: true, setup: { ...base, vatStatus: null, vatRate: null, vatNumber: null } };
  }
  if (choice !== "subject") {
    return { ok: true, setup: { ...base, vatStatus: choice, vatRate: null, vatNumber: null } };
  }
  const vatRate = parseVatRate(input.vatRate);
  if (vatRate === null) {
    return { ok: false, error: "Indique ton taux de TVA habituel (un nombre entre 0 et 100)." };
  }
  if (input.vatNumber.trim() === "") return { ok: false, error: "Indique ton numéro de TVA." };
  const vatNumber = normalizeVatNumber(input.vatNumber, input.country);
  if (!vatNumber) {
    return {
      ok: false,
      error:
        input.country === "BE"
          ? "Numéro de TVA invalide : BE suivi de 10 chiffres, ex. BE0123.456.749."
          : "Numéro de TVA invalide : lettres, chiffres, points ou tirets (30 maximum).",
    };
  }
  return { ok: true, setup: { ...base, vatStatus: "subject", vatRate, vatNumber } };
}
