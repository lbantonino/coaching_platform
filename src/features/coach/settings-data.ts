import "server-only";

import type { Currency } from "@/domain/billing/money";
import type { CoachMembership, CurrentUser } from "@/features/auth/session";

import { listCurrencyChanges } from "./currency-queries";
import { listLegalEntities, type LegalEntity } from "./legal-queries";
import { getCoachProfile } from "./profile";
import type { NotificationKind, PreferencesInput, ProfileInput } from "./settings";

// Données des Paramètres (D-57, D-58), en valeurs simples : la page complète et la fenêtre les
// affichent de la même façon (la fenêtre les charge à son ouverture).
export type SettingsData = {
  email: string;
  displayName: string;
  photoPath: string | null;
  profile: ProfileInput;
  preferences: PreferencesInput;
  notify: Record<NotificationKind, boolean>;
  // Facturation (D-66) : proposer aussi les espèces dans « À facturer ».
  invoiceCash: boolean;
  // Pays et devise de l'organisation (D-69).
  organization: { id: string; name: string; isOwner: boolean; country: string; currency: Currency };
  entities: LegalEntity[];
  // Changements de devise passés (D-70), du plus ancien au plus récent.
  currencyChanges: { from: Currency; to: Currency; rate: number; changedOn: string }[];
};

const priceText = (cents: number | null) =>
  cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");

export async function getSettingsData(
  user: CurrentUser,
  membership: CoachMembership,
): Promise<SettingsData> {
  const [profile, entities, currencyChanges] = await Promise.all([
    getCoachProfile(user),
    listLegalEntities(membership.organizationId),
    listCurrencyChanges(membership.organizationId),
  ]);
  const p = profile.preferences;
  return {
    email: user.email ?? "",
    displayName: profile.displayName,
    photoPath: profile.photoPath,
    profile: {
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      companyName: profile.companyName ?? "",
      phone: profile.phone ?? "",
    },
    preferences: {
      defaultSessionMinutes: String(p.defaultSessionMinutes),
      defaultLocation: p.defaultLocation ?? "",
      defaultPrice: priceText(p.defaultPriceCents),
      defaultPaymentMethod: p.defaultPaymentMethod,
      agendaFirstHour: String(p.agendaFirstHour),
      agendaLastHour: String(p.agendaLastHour),
    },
    notify: p.notify,
    invoiceCash: p.invoiceCash,
    organization: {
      id: membership.organizationId,
      name: membership.organizationName,
      isOwner: membership.role === "owner",
      country: membership.country,
      currency: membership.currency,
    },
    entities,
    currencyChanges,
  };
}
