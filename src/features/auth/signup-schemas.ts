import { z } from "zod";

import { PASSWORD_MIN_LENGTH } from "./schemas";

// Inscription libre (D-30) : règles PURES, testées par Vitest.

// Version des conditions et de la politique de confidentialité acceptées (pages provisoires).
export const TERMS_VERSION = "2026-10-23-provisoire";

export const ACCOUNT_KINDS = ["coach", "athlete"] as const;
export type AccountKind = (typeof ACCOUNT_KINDS)[number];
export const accountKindLabels: Record<AccountKind, string> = {
  coach: "Je suis coach",
  athlete: "Je suis sportif",
};

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
  .max(120, { error: "Nom de l'activité trop long (120 caractères maximum)." })
  .transform((value) => (value === "" ? null : value));

const terms = z.literal("on", {
  error: "Accepte les conditions d'utilisation et la politique de confidentialité.",
});

export const signupSchema = z
  .object({
    kind: z.enum(ACCOUNT_KINDS, { error: "Indique si tu es coach ou sportif." }),
    firstName: name("prénom"),
    lastName: name("nom"),
    email: z.email({ error: "Adresse e-mail invalide." }).max(254),
    phone,
    organizationName,
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, {
        error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
      })
      .max(128, { error: "Le mot de passe est trop long (128 caractères maximum)." }),
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
