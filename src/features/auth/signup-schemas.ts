import { z } from "zod";

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
