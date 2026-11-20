import { z } from "zod";

import { FEATURES } from "@/config/features";
import { parseAmount } from "@/domain/billing/payments";
import { emailField, newPasswordField, SAME_PASSWORD_MESSAGE } from "@/features/auth/schemas";

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

const ALL_NOTIFICATION_KINDS = ["competitions", "messages", "tasks", "unpaid", "profiles"] as const;
export type NotificationKind = (typeof ALL_NOTIFICATION_KINDS)[number];
// MVP espace coach seul (D-167) : pas de catégorie « Messages » tant que la messagerie est masquée
// (ni dans Paramètres, ni sur la page Notifications, ni dans la cloche).
export const NOTIFICATION_KINDS: readonly NotificationKind[] = ALL_NOTIFICATION_KINDS.filter(
  (kind) => FEATURES.messages || kind !== "messages",
);
export const notificationKindLabels: Record<NotificationKind, { label: string; hint: string }> = {
  messages: {
    label: "Messages non lus",
    hint: "Les messages des sportifs que tu n'as pas encore ouverts.",
  },
  tasks: {
    label: "Tâches du jour et en retard",
    hint: "Tes tâches à faire aujourd'hui ou déjà dépassées.",
  },
  unpaid: {
    label: "Séances à encaisser",
    hint: "Les séances avec un prix, toujours pas payées une semaine après.",
  },
  competitions: {
    label: "Compétitions dans les 7 jours",
    hint: "Les compétitions proches de tes sportifs.",
  },
  profiles: {
    label: "Fiches à compléter",
    hint: "Les sportifs sans nom de famille ou sans contact.",
  },
};

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
    error: SAME_PASSWORD_MESSAGE,
    path: ["password"],
  });

// Réglages lus pour UNE organisation (mineur n°4 du lot 6) : celle de l'assistant ou de la page, sinon la
// première (la plus ancienne, comme le menu). Jamais une organisation dont le coach n'est pas membre.
export function pickMembership<T extends { organizationId: string }>(
  memberships: readonly T[],
  organizationId?: string,
): T {
  return (
    memberships.find((membership) => membership.organizationId === organizationId) ?? memberships[0]
  );
}
