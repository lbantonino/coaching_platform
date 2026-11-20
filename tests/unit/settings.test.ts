import { describe, expect, it } from "vitest";

import { SAME_PASSWORD_MESSAGE } from "@/features/auth/schemas";
import { parsePreferences, passwordChangeSchema, profileSchema } from "@/features/coach/settings";
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
    const same = passwordChangeSchema.safeParse({
      ...ok,
      password: ok.current,
      confirmation: ok.current,
    });
    expect(same.success).toBe(false);
    // Demande d'Antonino du 20/11 : le dire clairement et demander d'en écrire un nouveau.
    expect(same.error?.issues[0]?.message).toBe(SAME_PASSWORD_MESSAGE);
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
