import "server-only";

import {
  changeOrganizationCurrency,
  loadSettings,
  renameOrganization,
  setNotificationPreference,
  setOrganizationCountry,
  updatePreferences,
  updateProfile,
} from "@/features/coach/settings-actions";
import type { NotificationKind } from "@/features/coach/settings";
import {
  deleteNotifications,
  dismissNotifications,
  restoreNotifications,
  setNotificationsRead,
} from "@/features/notifications/actions";

import type { ExecuteResult } from "./execute";
import type { ParsedAssistantAction } from "./proposals";
import { currencyConflict, mergePreferences, mergeProfile, type ReglagesKind } from "./reglages";

// « Valider » une carte des RÉGLAGES (lot 6, D-185). Appelé par executeAssistantAction APRÈS
// requireOrgAccess et le schéma strict ; jamais depuis le navigateur (server-only). Les valeurs
// actuelles sont relues (loadSettings, comme la fenêtre Paramètres) ; l'action habituelle fait le
// travail, avec ses propres contrôles (propriétaire, formats).

type ReglagesAction = Extract<ParsedAssistantAction, { kind: ReglagesKind }>;
const fail = (error: string): ExecuteResult => ({ ok: false, error });
const SETTINGS = "/coach/profil";

function fields(values: Record<string, string>): FormData {
  const form = new FormData();
  for (const [field, value] of Object.entries(values)) form.set(field, value);
  return form;
}
const state = <T>() => ({ error: null, saved: false, attempt: 0, values: null as T | null });

export async function executeReglages(
  orgId: string,
  action: ReglagesAction,
): Promise<ExecuteResult> {
  switch (action.kind) {
    case "modifier_profil": {
      const data = await loadSettings(orgId);
      const saved = await updateProfile(
        state(),
        fields(mergeProfile(data.profile, action.params.changes)),
      );
      if (!saved.saved) return fail(saved.error ?? "Le profil n'a pas pu être enregistré.");
      return { ok: true, href: SETTINGS };
    }
    case "nom_organisation": {
      const saved = await renameOrganization(
        orgId,
        state(),
        fields({ organizationName: action.params.nom }),
      );
      if (!saved.saved) return fail(saved.error ?? "Le nom n'a pas pu être enregistré.");
      return { ok: true, href: SETTINGS };
    }
    case "pays_organisation": {
      const done = await setOrganizationCountry(orgId, action.params.pays);
      if (!done.ok) return fail(done.error ?? "Le pays n'a pas pu être enregistré.");
      return { ok: true, href: SETTINGS };
    }
    case "devise_organisation": {
      // Relecture n°1 : seulement depuis la devise annoncée sur la carte.
      const data = await loadSettings(orgId);
      if (data.organization.id !== orgId) return fail("Organisation introuvable.");
      const conflict = currencyConflict(action.params.depuis, data.organization.currency);
      if (conflict) return fail(conflict);
      const done = await changeOrganizationCurrency(
        orgId,
        action.params.devise,
        action.params.taux,
      );
      if (!done.ok) return fail(done.error ?? "La devise n'a pas pu être changée.");
      return { ok: true, href: SETTINGS };
    }
    case "preferences": {
      const data = await loadSettings(orgId);
      const saved = await updatePreferences(
        state(),
        fields(mergePreferences(data.preferences, action.params.changes)),
      );
      if (!saved.saved)
        return fail(saved.error ?? "Les préférences n'ont pas pu être enregistrées.");
      return { ok: true, href: SETTINGS };
    }
    case "preference_notification": {
      const done = await setNotificationPreference(
        action.params.sorte as NotificationKind,
        action.params.active,
      );
      if (!done.ok) return fail("La préférence n'a pas pu être enregistrée.");
      return { ok: true, href: "/coach/notifications" };
    }
    case "notifications": {
      const { action: change, cles } = action.params;
      const done =
        change === "lues"
          ? await setNotificationsRead(orgId, cles, true)
          : change === "non_lues"
            ? await setNotificationsRead(orgId, cles, false)
            : change === "masquer"
              ? await dismissNotifications(orgId, cles)
              : change === "afficher"
                ? await restoreNotifications(orgId, cles)
                : await deleteNotifications(orgId, cles);
      if (!done.ok) return fail("Les notifications n'ont pas pu changer.");
      return { ok: true, href: "/coach/notifications" };
    }
  }
  return fail("Cette action n'est pas valable. Redemande-la à l'assistant.");
}
