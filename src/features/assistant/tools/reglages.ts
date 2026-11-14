import "server-only";

import type Anthropic from "@anthropic-ai/sdk";

import { CURRENCIES, parseExchangeRate } from "@/domain/billing/money";
import { isNotificationKey } from "@/domain/notifications/keys";
import {
  NOTIFICATION_KINDS,
  organizationNameSchema,
  parsePreferences,
  profileSchema,
  type NotificationKind,
} from "@/features/coach/settings";
import { loadSettings, previewCurrencyChange } from "@/features/coach/settings-actions";
import { getNotifications } from "@/features/notifications/queries";
import { todayIsoInBrussels } from "@/lib/format";

import {
  countryName,
  mergePreferences,
  mergeProfile,
  preferenceText,
  type ReglagesKind,
} from "../reglages";
import { shapeNotifications } from "./shape";

// Assistant IA, lot 6 (D-185) : outils et contrôles des RÉGLAGES. Rien n'est exécuté : chaque appel
// devient une carte après vérification (les mêmes règles que la fenêtre Paramètres et la page
// Notifications). Jamais la sécurité du compte : aucun outil pour l'e-mail de connexion, le mot de
// passe ou la déconnexion.

const nullable = (schema: Record<string, unknown>, description: string) => ({
  ...schema,
  description: `${description} null efface.`,
});

export const REGLAGES_TOOLS: Anthropic.Tool[] = [
  {
    name: "modifier_profil",
    description:
      "Propose de modifier le profil du coach (voir_parametres) : prénom, nom, entreprise, téléphone. Jamais l'e-mail de connexion ni le mot de passe : le coach les change lui-même dans Paramètres, Sécurité.",
    input_schema: {
      type: "object",
      properties: {
        changes: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: nullable({ type: "string" }, "Nom."),
            companyName: nullable({ type: "string" }, "Entreprise."),
            phone: nullable({ type: "string" }, "Format international conseillé : +32 …"),
          },
        },
      },
      required: ["changes"],
    },
  },
  {
    name: "nom_organisation",
    description: "Propose de renommer l'organisation (propriétaire seulement).",
    input_schema: {
      type: "object",
      properties: { nom: { type: "string" } },
      required: ["nom"],
    },
  },
  {
    name: "pays_organisation",
    description:
      "Propose de changer le pays de l'organisation (code à 2 lettres : BE, FR, CH…), propriétaire seulement. La devise ne change pas ici.",
    input_schema: {
      type: "object",
      properties: { pays: { type: "string" } },
      required: ["pays"],
    },
  },
  {
    name: "devise_organisation",
    description:
      "Propose de changer la devise (déménagement, propriétaire seulement) : le futur est converti au taux donné par le coach (1 ancienne = taux nouvelle), le passé reste. Demande le taux au coach s'il ne le donne pas.",
    input_schema: {
      type: "object",
      properties: {
        devise: { type: "string", enum: [...CURRENCIES] },
        taux: { type: "string", description: "Taux : 1 devise actuelle = … nouvelle (ex. 0,94)." },
      },
      required: ["devise", "taux"],
    },
  },
  {
    name: "preferences",
    description:
      "Propose de modifier les préférences du coach : durée, lieu, prix et paiement par défaut d'une séance, heures de début (0 à 12) et de fin (13 à 24) de l'agenda.",
    input_schema: {
      type: "object",
      properties: {
        changes: {
          type: "object",
          properties: {
            defaultSessionMinutes: { type: "integer", description: "15 à 480." },
            defaultLocation: nullable({ type: "string" }, "Lieu."),
            defaultPrice: nullable({ type: "number" }, "Prix en unités de la devise."),
            defaultPaymentMethod: { type: "string", enum: ["transfer", "cash"] },
            agendaFirstHour: { type: "integer" },
            agendaLastHour: { type: "integer" },
          },
        },
      },
      required: ["changes"],
    },
  },
  {
    name: "preference_notification",
    description:
      "Propose d'activer ou de couper une sorte de notifications (cloche et page Notifications).",
    input_schema: {
      type: "object",
      properties: {
        sorte: { type: "string", enum: [...NOTIFICATION_KINDS] },
        active: { type: "boolean" },
      },
      required: ["sorte", "active"],
    },
  },
  {
    name: "notifications",
    description:
      "Propose de changer l'état de notifications (clés de voir_notifications) : lues, non_lues, masquer, afficher, supprimer (définitif : une notification supprimée ne revient pas).",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["lues", "non_lues", "masquer", "afficher", "supprimer"],
        },
        cles: { type: "array", items: { type: "string" }, description: "500 au plus." },
      },
      required: ["action", "cles"],
    },
  },
];

type Checked = { ok: true; params?: Record<string, unknown> } | { ok: false; error: string };
const refuse = (error: string): Checked => ({ ok: false, error });
const OWNER_ONLY = "Seul le propriétaire de l'organisation peut changer ce réglage.";

export async function proposeReglages(
  orgId: string,
  kind: ReglagesKind,
  p: Record<string, unknown>,
  names: Record<string, string>,
): Promise<Checked> {
  if (kind === "notifications") {
    const keys = p.cles as string[];
    if (!keys.every(isNotificationKey)) {
      return refuse("Notification inconnue : prends les clés de voir_notifications.");
    }
    const rows = shapeNotifications(await getNotifications(orgId, todayIsoInBrussels()));
    const byKey = new Map(rows.map((row) => [row.cle, row.texte]));
    if (keys.some((key) => !byKey.has(key))) {
      return refuse("Notification introuvable : regarde voir_notifications.");
    }
    keys.slice(0, 5).forEach((key, index) => {
      names[`notif:${index}`] = byKey.get(key) ?? "";
    });
    return { ok: true };
  }

  const data = await loadSettings();
  const owner = data.organization.isOwner && data.organization.id === orgId;
  switch (kind) {
    case "modifier_profil": {
      const changes = p.changes as Record<string, unknown>;
      const parsed = profileSchema.safeParse(mergeProfile(data.profile, changes));
      if (!parsed.success) return refuse(parsed.error.issues[0]?.message ?? "Profil invalide.");
      for (const field of Object.keys(changes)) {
        names[`avant:${field}`] = data.profile[field as keyof typeof data.profile] || "—";
      }
      return { ok: true };
    }
    case "nom_organisation": {
      if (!owner) return refuse(OWNER_ONLY);
      const parsed = organizationNameSchema.safeParse(p.nom);
      if (!parsed.success) return refuse(parsed.error.issues[0]?.message ?? "Nom invalide.");
      if (parsed.data === data.organization.name)
        return refuse("C'est déjà le nom de l'organisation.");
      names.avant = data.organization.name;
      return { ok: true };
    }
    case "pays_organisation": {
      if (!owner) return refuse(OWNER_ONLY);
      if (p.pays === data.organization.country)
        return refuse("C'est déjà le pays de l'organisation.");
      names.avant = countryName(data.organization.country);
      return { ok: true };
    }
    case "devise_organisation": {
      if (!owner) return refuse(OWNER_ONLY);
      if (p.devise === data.organization.currency) {
        return refuse("C'est déjà la devise de ton organisation.");
      }
      if (parseExchangeRate(String(p.taux)) === null) {
        return refuse("Taux invalide : un nombre plus grand que 0 (ex. 0,94).");
      }
      const preview = await previewCurrencyChange(orgId);
      if (!preview) return refuse(OWNER_ONLY);
      names.devise = data.organization.currency;
      names.seances = String(preview.sessions);
      names.paiements = String(preview.payments);
      return { ok: true, params: { depuis: data.organization.currency } };
    }
    case "preferences": {
      const changes = p.changes as Record<string, unknown>;
      const parsed = parsePreferences(mergePreferences(data.preferences, changes));
      if (!parsed.ok) return refuse(parsed.error);
      for (const field of Object.keys(changes)) {
        names[`avant:${field}`] = preferenceText(
          field,
          data.preferences[field as keyof typeof data.preferences],
          data.organization.currency,
        );
      }
      return { ok: true };
    }
    case "preference_notification": {
      const sorte = p.sorte as NotificationKind;
      if (data.notify[sorte] === p.active) {
        return refuse(
          p.active ? "Cette notification est déjà active." : "Cette notification est déjà coupée.",
        );
      }
      return { ok: true };
    }
  }
  return { ok: true };
}
