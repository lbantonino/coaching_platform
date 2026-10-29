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
    vatNumber: "",
    defaultVatRate: "21",
    addressLine: "Rue de la Loi 16",
    postalCode: "1000",
    city: "Bruxelles",
    country: "be",
    iban: "be68 5390 0754 7034",
    bic: "gebabebb",
    paymentDetails: "",
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
      default_vat_rate: 21,
      invoice_prefix: "FAC",
      is_default: true,
    });
  });

  // International (D-69) : formats belges seulement en Belgique, taux habituel libre.
  it("accepte une structure étrangère avec ses propres numéros et son taux", () => {
    const parsed = parseLegalEntity({
      ...base,
      country: "CH",
      enterpriseNumber: "che-123.456.789",
      vatNumber: "CHE-123.456.789 TVA",
      defaultVatRate: "8,1",
      iban: "",
      bic: "",
      paymentDetails: "Twint : +41 79 000 00 00",
    });
    expect(parsed.ok && parsed.values).toMatchObject({
      country: "CH",
      enterprise_number: "CHE-123.456.789",
      vat_number: "CHE-123.456.789 TVA",
      default_vat_rate: 8.1,
      payment_details: "Twint : +41 79 000 00 00",
    });
  });

  it("en Belgique, déduit le numéro d'entreprise du numéro de TVA saisi", () => {
    const parsed = parseLegalEntity({
      ...base,
      enterpriseNumber: "",
      vatNumber: "BE 0123.456.749",
    });
    expect(parsed.ok && parsed.values).toMatchObject({
      enterprise_number: "0123456749",
      vat_number: "BE0123456749",
    });
  });

  it("un assujetti donne un taux habituel valable ; un non-assujetti n'en a pas", () => {
    expect(parseLegalEntity({ ...base, defaultVatRate: "" }).ok).toBe(false);
    expect(parseLegalEntity({ ...base, defaultVatRate: "150" }).ok).toBe(false);
    const asbl = parseLegalEntity({ ...base, vatStatus: "not_subject", defaultVatRate: "21" });
    expect(asbl.ok && asbl.values.default_vat_rate).toBeNull();
  });

  it("une ASBL non assujettie n'a pas de numéro de TVA", () => {
    const parsed = parseLegalEntity({ ...base, legalForm: "asbl", vatStatus: "not_subject" });
    expect(parsed.ok && parsed.values.vat_number).toBeNull();
  });

  it("refuse un assujetti sans numéro, un IBAN ou un numéro d'entreprise faux", () => {
    expect(parseLegalEntity({ ...base, enterpriseNumber: "" })).toEqual({
      ok: false,
      error: "Un assujetti à la TVA a besoin de son numéro de TVA.",
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
