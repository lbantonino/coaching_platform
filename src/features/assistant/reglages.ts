import { z } from "zod";

import { CURRENCIES, formatMoney, type Currency } from "@/domain/billing/money";
import { isCountryCode } from "@/domain/geo/countries";
import { COUNTRY_NAMES } from "@/domain/geo/country-names";
import {
  NOTIFICATION_KINDS,
  notificationKindLabels,
  type NotificationKind,
  type PreferencesInput,
  type ProfileInput,
} from "@/features/coach/settings";

// Assistant IA, lot 6 (D-185) : les RÉGLAGES (fenêtre Paramètres et page Notifications), en cartes à
// valider. JAMAIS la sécurité du compte : ni e-mail de connexion, ni mot de passe, ni déconnexion
// (aucun champ pour eux ici : un champ inconnu fait refuser la carte). Règles PURES.

const text = (max: number) => z.string().trim().min(1).max(max);
const short = (max: number) => z.string().trim().max(max);
const atLeastOne = { error: "Indique au moins un changement." };
const nonEmpty = (value: object) => Object.keys(value).length > 0;
const ALL_KINDS = ["competitions", "messages", "tasks", "unpaid", "profiles"] as const;

const DURATION_ERROR = { error: "La durée par défaut va de 15 à 480 minutes." };
const PRICE_ERROR = { error: "Le prix par défaut va de 0 à 100 000." };
const FIRST_HOUR_ERROR = { error: "L'agenda commence entre 0 h et 12 h (un nombre entier)." };
const LAST_HOUR_ERROR = { error: "L'agenda finit entre 13 h et 24 h (un nombre entier)." };

export const REGLAGES_PARAMS = {
  modifier_profil: z.strictObject({
    changes: z
      .strictObject({
        firstName: text(80).optional(),
        lastName: short(80).nullable().optional(),
        companyName: short(120).nullable().optional(),
        phone: short(24).nullable().optional(),
      })
      .refine(nonEmpty, atLeastOne),
  }),
  nom_organisation: z.strictObject({ nom: text(120) }),
  pays_organisation: z.strictObject({
    pays: z.string().length(2).refine(isCountryCode, { error: "Pays inconnu (code à 2 lettres)." }),
  }),
  // `depuis` : la devise ACTUELLE, notée par le serveur à la proposition ; au clic, une autre devise
  // refuse la carte (relecture n°1 : jamais convertir depuis la mauvaise devise, au mauvais taux).
  devise_organisation: z.strictObject({
    devise: z.enum(CURRENCIES),
    taux: text(20),
    depuis: z.enum(CURRENCIES).optional(),
  }),
  preferences: z.strictObject({
    changes: z
      .strictObject({
        // Messages en français (mineur n°5 du lot 6) : ils reviennent tels quels à l'assistant.
        defaultSessionMinutes: z
          .number(DURATION_ERROR)
          .int(DURATION_ERROR)
          .min(15, DURATION_ERROR)
          .max(480, DURATION_ERROR)
          .optional(),
        defaultLocation: short(120).nullable().optional(),
        defaultPrice: z
          .number(PRICE_ERROR)
          .min(0, PRICE_ERROR)
          .max(100_000, PRICE_ERROR)
          .nullable()
          .optional(),
        defaultPaymentMethod: z.enum(["transfer", "cash"]).optional(),
        agendaFirstHour: z
          .number(FIRST_HOUR_ERROR)
          .int(FIRST_HOUR_ERROR)
          .min(0, FIRST_HOUR_ERROR)
          .max(12, FIRST_HOUR_ERROR)
          .optional(),
        agendaLastHour: z
          .number(LAST_HOUR_ERROR)
          .int(LAST_HOUR_ERROR)
          .min(13, LAST_HOUR_ERROR)
          .max(24, LAST_HOUR_ERROR)
          .optional(),
      })
      .refine(nonEmpty, atLeastOne),
  }),
  // Seulement les sortes visibles (pas « Messages » tant que la messagerie est masquée, D-167).
  preference_notification: z.strictObject({
    sorte: z.enum(ALL_KINDS).refine((kind) => NOTIFICATION_KINDS.includes(kind), {
      error: "Sorte de notification inconnue.",
    }),
    active: z.boolean(),
  }),
  notifications: z.strictObject({
    // Pas de « rétablir » : une notification supprimée n'apparaît plus nulle part, l'assistant ne
    // saurait pas laquelle rétablir ; la carte « Supprimer » le dit (relecture n°2).
    action: z.enum(["lues", "non_lues", "masquer", "afficher", "supprimer"]),
    cles: z.array(text(200)).min(1).max(500),
  }),
} as const;

export type ReglagesKind = keyof typeof REGLAGES_PARAMS;
export const REGLAGES_KINDS = Object.keys(REGLAGES_PARAMS) as ReglagesKind[];
export const isReglagesKind = (kind: string): kind is ReglagesKind =>
  (REGLAGES_KINDS as string[]).includes(kind);

const entry = <K extends ReglagesKind>(kind: K) =>
  z.object({ kind: z.literal(kind), params: REGLAGES_PARAMS[kind] });
export const REGLAGES_ACTIONS = [
  entry("modifier_profil"),
  entry("nom_organisation"),
  entry("pays_organisation"),
  entry("devise_organisation"),
  entry("preferences"),
  entry("preference_notification"),
  entry("notifications"),
] as const;

// --- Fusions dans les valeurs de la fenêtre Paramètres (relues au clic) ---------------------------
const assign = <T extends Record<string, string>>(current: T, changes: Record<string, unknown>) => {
  const next = { ...current };
  for (const [field, value] of Object.entries(changes)) {
    if (field in next)
      (next as Record<string, string>)[field] = value === null ? "" : String(value);
  }
  return next;
};

export function mergeProfile(
  current: ProfileInput,
  changes: Record<string, unknown>,
): ProfileInput {
  return assign(current, changes);
}

export function mergePreferences(
  current: PreferencesInput,
  changes: Record<string, unknown>,
): PreferencesInput {
  const { defaultPrice, ...others } = changes;
  const next = assign(current, others);
  // Prix en unités de la devise (70,5 → « 70,50 »), comme le champ de la fenêtre.
  if ("defaultPrice" in changes) {
    next.defaultPrice =
      defaultPrice === null ? "" : Number(defaultPrice).toFixed(2).replace(".", ",");
  }
  return next;
}

// Relecture n°1 : la carte convertit depuis la devise qu'elle annonce, ou rien.
export function currencyConflict(depuis: string | undefined, current: string): string | null {
  if (!depuis) return "Cette action n'est pas valable. Redemande-la à l'assistant.";
  return depuis === current
    ? null
    : `La devise a changé depuis cette carte (${depuis}, maintenant ${current}) : rien n'a été converti. Redemande à l'assistant.`;
}

// --- Ce que dit la carte --------------------------------------------------------------------------
export const PROFILE_LABELS: Record<string, string> = {
  firstName: "Prénom",
  lastName: "Nom",
  companyName: "Entreprise",
  phone: "Téléphone",
};
export const PREFERENCE_LABELS: Record<string, string> = {
  defaultSessionMinutes: "Durée par défaut",
  defaultLocation: "Lieu par défaut",
  defaultPrice: "Prix par défaut",
  defaultPaymentMethod: "Paiement par défaut",
  agendaFirstHour: "Début de l'agenda",
  agendaLastHour: "Fin de l'agenda",
};
const METHOD: Record<string, string> = { transfer: "virement", cash: "espèces" };
const countryNames = new Map(COUNTRY_NAMES);
export const countryName = (code: string) => countryNames.get(code) ?? code;

export function preferenceText(field: string, value: unknown, currency: Currency): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (field) {
    case "defaultSessionMinutes":
      return `${String(value)} min`;
    case "defaultPrice":
      return formatMoney(
        Math.round(Number(String(value).replace(",", ".")) * 100),
        currency,
      ).replace(/\s/g, " ");
    case "defaultPaymentMethod":
      return METHOD[String(value)] ?? String(value);
    case "agendaFirstHour":
    case "agendaLastHour":
      return `${String(value)} h`;
    default:
      return String(value);
  }
}

const NOTIFICATION_TITLES = {
  lues: ["Marquer comme lues", "lue", "lues"],
  non_lues: ["Marquer comme non lues", "non lue", "non lues"],
  masquer: ["Masquer des notifications", "masquée", "masquées"],
  afficher: ["Afficher des notifications", "affichée", "affichées"],
  supprimer: ["Supprimer des notifications", "supprimée (définitif)", "supprimées (définitif)"],
} as const;
const SHOWN_NOTIFICATIONS = 5;

const changeLines = (
  changes: Record<string, unknown>,
  labels: Record<string, string>,
  names: Record<string, string>,
  after: (field: string, value: unknown) => string,
) =>
  Object.entries(changes).map(
    ([field, value]) =>
      `${labels[field] ?? field} : ${names[`avant:${field}`] || "—"} → ${after(field, value)}`,
  );

export function summarizeReglages(
  action: { kind: string; params: Record<string, unknown> },
  names: Record<string, string>,
  currency: Currency,
): { title: string; summary: string[] } | null {
  if (!isReglagesKind(action.kind)) return null;
  const p = action.params;
  let title = "";
  const lines: (string | null)[] = [];
  switch (action.kind) {
    case "modifier_profil":
      title = "Modifier ton profil";
      lines.push(
        ...changeLines(
          (p.changes ?? {}) as Record<string, unknown>,
          PROFILE_LABELS,
          names,
          (_field, value) => (value === null || value === "" ? "—" : String(value)),
        ),
      );
      break;
    case "nom_organisation":
      title = "Nom de l'organisation";
      lines.push(`Nom : ${names.avant ?? "?"} → ${String(p.nom)}`);
      break;
    case "pays_organisation":
      title = "Pays de l'organisation";
      lines.push(`Pays : ${names.avant ?? "?"} → ${countryName(String(p.pays))}`);
      break;
    case "devise_organisation": {
      title = "Changer de devise";
      const from = names.devise ?? "?";
      const to = String(p.devise);
      const sessions = Number(names.seances ?? 0);
      const payments = Number(names.paiements ?? 0);
      lines.push(
        `Devise : ${from} → ${to}`,
        `Taux : 1 ${from} = ${String(p.taux)} ${to}`,
        `Sera converti en ${to} : ${sessions} séance${sessions > 1 ? "s" : ""} à venir avec prix, ton prix par défaut des séances`,
        `Reste en ${from} : ${payments} paiement${payments > 1 ? "s" : ""} reçu${payments > 1 ? "s" : ""}`,
      );
      break;
    }
    case "preferences":
      title = "Préférences";
      lines.push(
        ...changeLines(
          (p.changes ?? {}) as Record<string, unknown>,
          PREFERENCE_LABELS,
          names,
          (field, value) => preferenceText(field, value, currency),
        ),
      );
      break;
    case "preference_notification": {
      const label = notificationKindLabels[p.sorte as NotificationKind]?.label ?? String(p.sorte);
      title = p.active ? "Activer une notification" : "Couper une notification";
      lines.push(
        label,
        p.active
          ? "Elle revient dans la cloche et la page Notifications"
          : "Elle n'apparaît plus dans la cloche ni dans la page Notifications",
      );
      break;
    }
    case "notifications": {
      const [heading, one, many] =
        NOTIFICATION_TITLES[p.action as keyof typeof NOTIFICATION_TITLES];
      const count = Array.isArray(p.cles) ? p.cles.length : 0;
      title = heading;
      lines.push(`${count} notification${count > 1 ? "s" : ""} ${count > 1 ? many : one}`);
      for (let index = 0; index < Math.min(count, SHOWN_NOTIFICATIONS); index++) {
        lines.push(names[`notif:${index}`] ?? null);
      }
      if (count > SHOWN_NOTIFICATIONS) lines.push(`… et ${count - SHOWN_NOTIFICATIONS} autres`);
      break;
    }
  }
  return {
    title,
    summary: lines.filter((line): line is string => typeof line === "string" && line !== ""),
  };
}

// Une même notification citée deux fois compterait double sur la carte (mineur n°6 du lot 6).
export function uniqueNotificationKeys(keys: readonly string[]): string[] {
  return [...new Set(keys)];
}
