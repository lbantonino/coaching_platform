import { describe, expect, it } from "vitest";

import {
  AGENDA_VIEW_COOKIE,
  agendaViewCookie,
  viewFromPreference,
} from "@/features/agenda/view-preference";

// Demande d'Antonino du 24/11/2026 : la vue choisie dans l'agenda est retenue sur l'appareil.
describe("vue de l'agenda retenue", () => {
  it("chaque vue choisie se relit", () => {
    expect(viewFromPreference("liste")).toEqual({ view: "liste", fullWeek: false });
    expect(viewFromPreference("jour")).toEqual({ view: "jour", fullWeek: false });
    expect(viewFromPreference("mois")).toEqual({ view: "mois", fullWeek: false });
  });

  it("téléphone : « 3 jours » et « Semaine » sont deux vues de la semaine", () => {
    expect(viewFromPreference("3jours")).toEqual({ view: "semaine", fullWeek: false });
    expect(viewFromPreference("semaine")).toEqual({ view: "semaine", fullWeek: true });
  });

  it("rien de retenu, ou une valeur inconnue : la vue par défaut", () => {
    expect(viewFromPreference(undefined)).toBeNull();
    expect(viewFromPreference("")).toBeNull();
    expect(viewFromPreference("aujourdhui")).toBeNull();
  });

  it("le cookie dure un an, pour tout le site", () => {
    const cookie = agendaViewCookie("liste");
    expect(cookie.startsWith(`${AGENDA_VIEW_COOKIE}=liste;`)).toBe(true);
    expect(cookie).toContain("path=/");
    expect(cookie).toContain("max-age=31536000");
    expect(cookie).toContain("samesite=lax");
  });
});
