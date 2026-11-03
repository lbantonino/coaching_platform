import { describe, expect, it } from "vitest";

import {
  parsePreferences,
  parseVatSetting,
  passwordChangeSchema,
  profileSchema,
} from "@/features/coach/settings";
import { enabledTotal } from "@/features/notifications/filter";

// Page Paramètres (D-57) : profil, préférences, TVA, mot de passe.
describe("profil et préférences", () => {
  it("lit le profil, téléphone facultatif mais bien formé", () => {
    expect(
      profileSchema.parse({ firstName: " Marco ", lastName: "", companyName: "", phone: "" }),
    ).toEqual({
      firstName: "Marco",
      lastName: null,
      companyName: null,
      phone: null,
    });
    expect(
      profileSchema.safeParse({ firstName: "Marco", lastName: "", companyName: "", phone: "abc" })
        .success,
    ).toBe(false);
  });

  const prefs = {
    defaultSessionMinutes: "60",
    defaultLocation: " Salle de sport ",
    defaultPrice: "65",
    defaultPaymentMethod: "transfer",
    agendaFirstHour: "7",
    agendaLastHour: "21",
  };

  it("lit les valeurs par défaut d'une séance et les heures de l'agenda", () => {
    expect(parsePreferences(prefs)).toEqual({
      ok: true,
      values: {
        default_session_minutes: 60,
        default_location: "Salle de sport",
        default_price_cents: 6500,
        default_payment_method: "transfer",
        agenda_first_hour: 7,
        agenda_last_hour: 21,
      },
    });
    expect(parsePreferences({ ...prefs, defaultPrice: "" })).toMatchObject({
      ok: true,
      values: { default_price_cents: null },
    });
  });

  it("refuse une durée, un prix ou des heures impossibles", () => {
    expect(parsePreferences({ ...prefs, defaultSessionMinutes: "5" }).ok).toBe(false);
    expect(parsePreferences({ ...prefs, defaultPrice: "abc" }).ok).toBe(false);
    expect(parsePreferences({ ...prefs, agendaFirstHour: "14" }).ok).toBe(false);
    expect(parsePreferences({ ...prefs, agendaLastHour: "12" }).ok).toBe(false);
    expect(parsePreferences({ ...prefs, defaultPaymentMethod: "bitcoin" }).ok).toBe(false);
  });
});

// TVA (D-90) : un seul taux, 0 sans TVA.
describe("TVA de l'organisation", () => {
  it("sans TVA, le taux vaut 0, quoi qu'il reste dans le champ", () => {
    expect(parseVatSetting({ vatEnabled: false, vatRate: "21" })).toEqual({ ok: true, vatRate: 0 });
  });

  it("avec TVA, un taux libre entre 0 et 100, virgule acceptée", () => {
    expect(parseVatSetting({ vatEnabled: true, vatRate: "8,1" })).toEqual({
      ok: true,
      vatRate: 8.1,
    });
    expect(parseVatSetting({ vatEnabled: true, vatRate: "" }).ok).toBe(false);
    expect(parseVatSetting({ vatEnabled: true, vatRate: "0" }).ok).toBe(false);
    expect(parseVatSetting({ vatEnabled: true, vatRate: "150" }).ok).toBe(false);
  });
});

describe("changement de mot de passe", () => {
  it("exige l'actuel, 10 caractères, la confirmation et un mot de passe différent", () => {
    const ok = {
      current: "ancien-mdp-123",
      password: "nouveau-mdp-456",
      confirmation: "nouveau-mdp-456",
    };
    expect(passwordChangeSchema.safeParse(ok).success).toBe(true);
    expect(passwordChangeSchema.safeParse({ ...ok, confirmation: "autre" }).success).toBe(false);
    expect(
      passwordChangeSchema.safeParse({ ...ok, password: "court", confirmation: "court" }).success,
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({ ...ok, password: ok.current, confirmation: ok.current })
        .success,
    ).toBe(false);
  });
});

describe("cloche des notifications", () => {
  it("ne compte que les catégories gardées", () => {
    const counts = { competitions: 2, messages: 3, tasks: 1, unpaid: 4, profiles: 5 };
    const all = { competitions: true, messages: true, tasks: true, unpaid: true, profiles: true };
    expect(enabledTotal(counts, all)).toBe(15);
    expect(enabledTotal(counts, { ...all, profiles: false, unpaid: false })).toBe(6);
  });
});
