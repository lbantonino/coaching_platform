import { z } from "zod";

import {
  LEGAL_FORMS,
  VAT_STATUSES,
  normalizeBic,
  normalizeEnterpriseNumber,
  normalizeIban,
  vatNumberFor,
  type LegalForm,
  type VatStatus,
} from "@/domain/billing/legal";
import { parseEuros } from "@/domain/billing/payments";
import { emailField, newPasswordField } from "@/features/auth/schemas";

// Page Paramètres (D-57) : règles PURES des formulaires, testées par Vitest. Les actions serveur les
// appellent puis écrivent en base, qui revérifie les mêmes formats (contraintes CHECK).

const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim());
const PHONE = /^\+?[0-9 ().-]{6,24}$/;

// --- Profil -------------------------------------------------------------------------------------
export type ProfileInput = {
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
};
export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Indique ton prénom.").max(80, "Prénom trop long."),
  lastName: z.string().trim().max(80, "Nom trop long.").transform(blankToNull),
  companyName: z.string().trim().max(120, "Nom d'entreprise trop long.").transform(blankToNull),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || PHONE.test(value), {
      error: "Numéro de téléphone invalide (format international conseillé : +32 …).",
    })
    .transform(blankToNull),
});

export const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "Le nom de l'organisation est trop court.")
  .max(120, "Le nom de l'organisation est trop long.");

// --- Préférences --------------------------------------------------------------------------------
export type PreferencesInput = {
  defaultSessionMinutes: string;
  defaultLocation: string;
  defaultPrice: string;
  defaultPaymentMethod: string;
  agendaFirstHour: string;
  agendaLastHour: string;
};

export type PreferencesValues = {
  default_session_minutes: number;
  default_location: string | null;
  default_price_cents: number | null;
  default_payment_method: "cash" | "transfer";
  agenda_first_hour: number;
  agenda_last_hour: number;
};

export function parsePreferences(
  input: PreferencesInput,
): { ok: true; values: PreferencesValues } | { ok: false; error: string } {
  const minutes = Number(input.defaultSessionMinutes);
  if (!Number.isInteger(minutes) || minutes < 15 || minutes > 480) {
    return { ok: false, error: "Durée par défaut : entre 15 et 480 minutes." };
  }
  const location = blankToNull(input.defaultLocation);
  if (location !== null && location.length > 120) {
    return { ok: false, error: "Lieu trop long (120 caractères maximum)." };
  }
  let price: number | null = null;
  if (input.defaultPrice.trim() !== "") {
    price = parseEuros(input.defaultPrice);
    if (price === null)
      return { ok: false, error: "Prix invalide : écris par exemple 65 ou 65,50." };
  }
  const method =
    input.defaultPaymentMethod === "cash"
      ? "cash"
      : input.defaultPaymentMethod === "transfer"
        ? "transfer"
        : null;
  if (!method) return { ok: false, error: "Choisis espèces ou virement." };
  const first = Number(input.agendaFirstHour);
  const last = Number(input.agendaLastHour);
  if (!Number.isInteger(first) || first < 0 || first > 12) {
    return { ok: false, error: "Début de l'agenda : entre 0 h et 12 h." };
  }
  if (!Number.isInteger(last) || last < 13 || last > 24) {
    return { ok: false, error: "Fin de l'agenda : entre 13 h et 24 h." };
  }
  return {
    ok: true,
    values: {
      default_session_minutes: minutes,
      default_location: location,
      default_price_cents: price,
      default_payment_method: method,
      agenda_first_hour: first,
      agenda_last_hour: last,
    },
  };
}

export const NOTIFICATION_KINDS = [
  "competitions",
  "messages",
  "tasks",
  "invoices",
  "profiles",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export const notificationKindLabels: Record<NotificationKind, { label: string; hint: string }> = {
  messages: {
    label: "Messages non lus",
    hint: "Les messages des sportifs que tu n'as pas encore ouverts.",
  },
  tasks: {
    label: "Tâches du jour et en retard",
    hint: "Tes tâches à faire aujourd'hui ou déjà dépassées.",
  },
  invoices: { label: "Factures en retard", hint: "Les factures dont l'échéance est passée." },
  competitions: {
    label: "Compétitions dans les 7 jours",
    hint: "Les compétitions proches de tes sportifs.",
  },
  profiles: {
    label: "Fiches à compléter",
    hint: "Les sportifs sans nom de famille ou sans contact.",
  },
};

// --- Structures légales -------------------------------------------------------------------------
export type LegalEntityInput = {
  name: string;
  legalForm: string;
  enterpriseNumber: string;
  vatStatus: string;
  addressLine: string;
  postalCode: string;
  city: string;
  country: string;
  iban: string;
  bic: string;
  billingEmail: string;
  invoicePrefix: string;
  legalMentions: string;
  isDefault: boolean;
};

export type LegalEntityValues = {
  name: string;
  legal_form: LegalForm;
  enterprise_number: string | null;
  vat_status: VatStatus;
  vat_number: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  iban: string | null;
  bic: string | null;
  billing_email: string | null;
  invoice_prefix: string;
  legal_mentions: string | null;
  is_default: boolean;
};

export function parseLegalEntity(
  input: LegalEntityInput,
): { ok: true; values: LegalEntityValues } | { ok: false; error: string } {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 120) {
    return { ok: false, error: "Indique la raison sociale (120 caractères maximum)." };
  }
  const legalForm = LEGAL_FORMS.find((form) => form === input.legalForm);
  if (!legalForm) return { ok: false, error: "Choisis la forme juridique." };
  const vatStatus = VAT_STATUSES.find((status) => status === input.vatStatus);
  if (!vatStatus) return { ok: false, error: "Choisis le régime de TVA." };

  const country = (input.country.trim() || "BE").toUpperCase();
  if (!/^[A-Z]{2}$/.test(country))
    return { ok: false, error: "Pays invalide (code à 2 lettres, ex. BE)." };

  let enterpriseNumber: string | null = null;
  if (input.enterpriseNumber.trim() !== "") {
    enterpriseNumber = normalizeEnterpriseNumber(input.enterpriseNumber);
    if (!enterpriseNumber) {
      return { ok: false, error: "Numéro d'entreprise invalide : 10 chiffres, ex. 0123.456.749." };
    }
  }
  // En Belgique, le numéro de TVA = BE + numéro d'entreprise : obligatoire pour un assujetti.
  if (vatStatus === "subject" && !enterpriseNumber) {
    return { ok: false, error: "Un assujetti à la TVA a besoin de son numéro d'entreprise." };
  }
  const vatNumber =
    vatStatus === "subject" && enterpriseNumber ? vatNumberFor(enterpriseNumber) : null;

  let iban: string | null = null;
  if (input.iban.trim() !== "") {
    iban = normalizeIban(input.iban);
    if (!iban)
      return {
        ok: false,
        error: "IBAN invalide : vérifie les chiffres (ex. BE68 5390 0754 7034).",
      };
  }
  let bic: string | null = null;
  if (input.bic.trim() !== "") {
    bic = normalizeBic(input.bic);
    if (!bic) return { ok: false, error: "BIC invalide : 8 ou 11 caractères (ex. GEBABEBB)." };
  }
  let billingEmail: string | null = null;
  if (input.billingEmail.trim() !== "") {
    const email = emailField.safeParse(input.billingEmail.trim());
    if (!email.success) return { ok: false, error: "Adresse e-mail de facturation invalide." };
    billingEmail = email.data;
  }
  const prefix = (input.invoicePrefix.trim() || "FAC").toUpperCase();
  if (!/^[A-Z0-9-]{1,12}$/.test(prefix)) {
    return { ok: false, error: "Préfixe des factures : lettres, chiffres ou tirets (12 maximum)." };
  }
  const postalCode = blankToNull(input.postalCode)?.toUpperCase() ?? null;
  if (postalCode !== null && !/^[A-Z0-9 -]{2,10}$/.test(postalCode)) {
    return { ok: false, error: "Code postal invalide." };
  }
  const addressLine = blankToNull(input.addressLine);
  if (addressLine !== null && addressLine.length > 160)
    return { ok: false, error: "Adresse trop longue." };
  const city = blankToNull(input.city);
  if (city !== null && city.length > 80) return { ok: false, error: "Nom de ville trop long." };
  const mentions = blankToNull(input.legalMentions);
  if (mentions !== null && mentions.length > 1000) {
    return { ok: false, error: "Mentions légales limitées à 1000 caractères." };
  }

  return {
    ok: true,
    values: {
      name,
      legal_form: legalForm,
      enterprise_number: enterpriseNumber,
      vat_status: vatStatus,
      vat_number: vatNumber,
      address_line: addressLine,
      postal_code: postalCode,
      city,
      country,
      iban,
      bic,
      billing_email: billingEmail,
      invoice_prefix: prefix,
      legal_mentions: mentions,
      is_default: input.isDefault,
    },
  };
}

// --- Sécurité -----------------------------------------------------------------------------------
export const emailChangeSchema = z.object({ email: emailField });

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, { error: "Indique ton mot de passe actuel." }).max(128),
    password: newPasswordField,
    confirmation: z.string(),
  })
  .refine((values) => values.password === values.confirmation, {
    error: "Les deux nouveaux mots de passe ne correspondent pas.",
    path: ["confirmation"],
  })
  .refine((values) => values.password !== values.current, {
    error: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ["password"],
  });
