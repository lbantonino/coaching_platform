import { z } from "zod";

import {
  LEGAL_FORMS,
  VAT_STATUSES,
  normalizeBic,
  normalizeCompanyNumber,
  normalizeIban,
  normalizeVatNumber,
  type LegalForm,
  type VatStatus,
} from "@/domain/billing/legal";
import { parseVatRate } from "@/domain/billing/money";
import { parseAmount } from "@/domain/billing/payments";
import { isCountryCode } from "@/domain/geo/countries";
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
    price = parseAmount(input.defaultPrice);
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
  // Assujetti (D-69) : son numéro de TVA (en Belgique, déduit du numéro d'entreprise s'il est vide)
  // et son taux habituel.
  vatNumber: string;
  defaultVatRate: string;
  addressLine: string;
  postalCode: string;
  city: string;
  country: string;
  iban: string;
  bic: string;
  paymentDetails: string;
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
  default_vat_rate: number | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  iban: string | null;
  bic: string | null;
  payment_details: string | null;
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
  if (!isCountryCode(country)) return { ok: false, error: "Choisis le pays de la structure." };

  // Numéros (D-69) : formats belges vérifiés pour une structure belge, libres ailleurs.
  const be = country === "BE";
  let enterpriseNumber: string | null = null;
  if (input.enterpriseNumber.trim() !== "") {
    enterpriseNumber = normalizeCompanyNumber(input.enterpriseNumber, country);
    if (!enterpriseNumber) {
      return {
        ok: false,
        error: be
          ? "Numéro d'entreprise invalide : 10 chiffres, ex. 0123.456.749."
          : "Numéro d'entreprise invalide : lettres, chiffres, points ou tirets (30 maximum).",
      };
    }
  }
  let vatNumber: string | null = null;
  let defaultVatRate: number | null = null;
  if (vatStatus === "subject") {
    const typed = input.vatNumber.trim();
    // Belgique : sans numéro de TVA saisi, celui du numéro d'entreprise (BE + les 10 chiffres).
    vatNumber = typed
      ? normalizeVatNumber(typed, country)
      : be && enterpriseNumber
        ? normalizeVatNumber(enterpriseNumber, country)
        : null;
    if (!vatNumber) {
      return {
        ok: false,
        error: typed
          ? be
            ? "Numéro de TVA invalide : BE suivi de 10 chiffres, ex. BE0123.456.749."
            : "Numéro de TVA invalide : lettres, chiffres, points ou tirets (30 maximum)."
          : "Un assujetti à la TVA a besoin de son numéro de TVA.",
      };
    }
    // Belgique : le numéro d'entreprise est celui du numéro de TVA, s'il n'a pas été donné.
    if (be && !enterpriseNumber) enterpriseNumber = vatNumber.slice(2);
    defaultVatRate = parseVatRate(input.defaultVatRate);
    if (defaultVatRate === null) {
      return {
        ok: false,
        error: "Taux de TVA habituel : un nombre entre 0 et 100 (ex. 21 ou 8,1).",
      };
    }
  }

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
  const paymentDetails = blankToNull(input.paymentDetails);
  if (paymentDetails !== null && paymentDetails.length > 300) {
    return { ok: false, error: "Coordonnées de paiement limitées à 300 caractères." };
  }
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
      default_vat_rate: defaultVatRate,
      address_line: addressLine,
      postal_code: postalCode,
      city,
      country,
      iban,
      bic,
      payment_details: paymentDetails,
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
