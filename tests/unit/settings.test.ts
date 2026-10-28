import { describe, expect, it } from "vitest";

import {
  parseLegalEntity,
  parsePreferences,
  passwordChangeSchema,
  profileSchema,
  type LegalEntityInput,
} from "@/features/coach/settings";
import { enabledTotal } from "@/features/notifications/filter";

// Page Paramètres (D-57) : profil, préférences, structures légales, mot de passe.
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

describe("structures légales", () => {
  const base: LegalEntityInput = {
    name: " Bianchi Performance ",
    legalForm: "independent",
    enterpriseNumber: "0123.456.749",
    vatStatus: "subject",
    addressLine: "Rue de la Loi 16",
    postalCode: "1000",
    city: "Bruxelles",
    country: "be",
    iban: "be68 5390 0754 7034",
    bic: "gebabebb",
    billingEmail: "factures@example.test",
    invoicePrefix: "fac",
    legalMentions: "",
    isDefault: true,
  };

  it("normalise les numéros et déduit la TVA belge d'un assujetti", () => {
    const parsed = parseLegalEntity(base);
    expect(parsed.ok && parsed.values).toMatchObject({
      name: "Bianchi Performance",
      enterprise_number: "0123456749",
      vat_number: "BE0123456749",
      iban: "BE68539007547034",
      bic: "GEBABEBB",
      country: "BE",
      invoice_prefix: "FAC",
      is_default: true,
    });
  });

  it("une ASBL non assujettie n'a pas de numéro de TVA", () => {
    const parsed = parseLegalEntity({ ...base, legalForm: "asbl", vatStatus: "not_subject" });
    expect(parsed.ok && parsed.values.vat_number).toBeNull();
  });

  it("refuse un assujetti sans numéro, un IBAN ou un numéro d'entreprise faux", () => {
    expect(parseLegalEntity({ ...base, enterpriseNumber: "" })).toEqual({
      ok: false,
      error: "Un assujetti à la TVA a besoin de son numéro d'entreprise.",
    });
    expect(parseLegalEntity({ ...base, iban: "BE68 5390 0754 7035" }).ok).toBe(false);
    expect(parseLegalEntity({ ...base, enterpriseNumber: "0123.456.748" }).ok).toBe(false);
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
    const counts = { competitions: 2, messages: 3, tasks: 1, invoices: 4, profiles: 5 };
    const all = { competitions: true, messages: true, tasks: true, invoices: true, profiles: true };
    expect(enabledTotal(counts, all)).toBe(15);
    expect(enabledTotal(counts, { ...all, profiles: false, invoices: false })).toBe(6);
  });
});
