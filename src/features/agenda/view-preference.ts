// Vue de l'agenda retenue sur l'appareil (demande d'Antonino du 24/11/2026) : le dernier choix du
// sélecteur de vue est gardé dans un cookie d'un an. Téléphone et ordinateur n'ont pas les mêmes vues
// (« 3 jours » n'existe que sur téléphone) : un cookie par appareil, pas une préférence du compte.
// Lu par la page (serveur) quand l'adresse ne donne pas la vue, écrit par le sélecteur (navigateur).

export const AGENDA_VIEW_COOKIE = "coory_agenda_vue";

export type AgendaViewKey = "jour" | "3jours" | "semaine" | "mois" | "liste";

const ONE_YEAR = 60 * 60 * 24 * 365;

const PREFERENCES: Record<
  AgendaViewKey,
  { view: "jour" | "semaine" | "mois" | "liste"; fullWeek: boolean }
> = {
  liste: { view: "liste", fullWeek: false },
  jour: { view: "jour", fullWeek: false },
  "3jours": { view: "semaine", fullWeek: false },
  semaine: { view: "semaine", fullWeek: true },
  mois: { view: "mois", fullWeek: false },
};

export function viewFromPreference(
  value: string | undefined,
): { view: "jour" | "semaine" | "mois" | "liste"; fullWeek: boolean } | null {
  return value && Object.hasOwn(PREFERENCES, value) ? PREFERENCES[value as AgendaViewKey] : null;
}

export function agendaViewCookie(key: AgendaViewKey): string {
  return `${AGENDA_VIEW_COOKIE}=${key}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}
