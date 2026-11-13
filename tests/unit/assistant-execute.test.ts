import { describe, expect, it } from "vitest";

import { requireResolved, toFormData, toNewAthleteValues } from "@/features/assistant/form-data";
import type { ParsedAssistantAction } from "@/features/assistant/proposals";

// Exécution d'une carte de l'Assistant IA (lot 1 des actions) : la proposition validée passe par le
// MÊME formulaire que la saisie à la main. Ces tests fixent les champs envoyés à chaque formulaire.
const LUCAS = "00000000-0000-4000-8000-000000000001";
const LISTE = "7c000000-0000-4000-8000-000000000001";

const fields = (form: FormData) =>
  Object.fromEntries([...form.keys()].map((key) => [key, form.getAll(key).map(String).join("|")]));

describe("toNewAthleteValues", () => {
  it("remplit la fiche sans santé, accord ni note privée", () => {
    const values = toNewAthleteValues({
      firstName: "Lucas",
      lastName: "Martin",
      level: "intermediate",
      programType: "hybrid",
      goalType: "run_half",
      goalDate: "2027-04-11",
    });
    expect(values).toMatchObject({
      firstName: "Lucas",
      lastName: "Martin",
      status: "active",
      level: "intermediate",
      programType: "hybrid",
      goalType: "run_half",
      goalDate: "2027-04-11",
      healthConstraints: "",
      healthConsent: false,
      consentProof: "",
      coachNote: "",
      trainingPlaces: [],
      availableDays: [],
    });
  });
});

describe("toFormData", () => {
  it("prépare une séance individuelle qui reste sur la page (stay)", () => {
    const action: ParsedAssistantAction = {
      kind: "creer_seance",
      params: {
        kind: "individual",
        title: "Coaching force",
        athlete: { athleteId: LUCAS },
        startsOn: "2026-11-17",
        startTime: "18:00",
        durationMinutes: 60,
        repeatsWeekly: true,
        location: "Salle",
        price: 65,
        paymentMethod: "transfer",
      },
    };
    expect(fields(toFormData(action))).toEqual({
      kind: "individual",
      title: "Coaching force",
      discipline: "",
      location: "Salle",
      startsOn: "2026-11-17",
      startTime: "18:00",
      durationMinutes: "60",
      repeatsWeekly: "on",
      endsOn: "",
      athleteId: LUCAS,
      notes: "",
      price: "65,00",
      vatRate: "0",
      paymentMethod: "transfer",
      stay: "1",
    });
  });

  it("coche la TVA d'une séance seulement quand un taux est donné", () => {
    const form = toFormData({
      kind: "creer_seance",
      params: {
        kind: "group",
        title: "Run club",
        athleteIds: [LUCAS],
        startsOn: "2026-11-21",
        startTime: "08:30",
        durationMinutes: 60,
        price: 10,
        vatRate: 21,
        vatIncluded: true,
      },
    });
    expect(form.get("applyVat")).toBe("on");
    expect(form.get("vatRate")).toBe("21");
    expect(form.get("vatIncluded")).toBe("on");
    expect(form.getAll("athleteIds")).toEqual([LUCAS]);
  });

  it("prépare un paiement et une dépense mensuelle", () => {
    expect(
      fields(
        toFormData({
          kind: "noter_paiement",
          params: {
            athlete: { athleteId: LUCAS },
            receivedOn: "2026-11-13",
            amount: 60,
            method: "cash",
          },
        }),
      ),
    ).toEqual({
      athleteId: LUCAS,
      receivedOn: "2026-11-13",
      amount: "60,00",
      vatRate: "0",
      method: "cash",
      label: "",
    });
    expect(
      fields(
        toFormData({
          kind: "noter_depense",
          params: {
            label: "Loyer",
            amount: 450.5,
            spentOn: "2026-11-01",
            repeatsMonthly: true,
          },
        }),
      ),
    ).toEqual({
      label: "Loyer",
      categoryId: "",
      amount: "450,50",
      vatRate: "0",
      spentOn: "2026-11-01",
      repeatsMonthly: "on",
      endsOn: "",
    });
  });

  it("prépare une tâche avec sa liste et son sportif", () => {
    expect(
      fields(
        toFormData({
          kind: "creer_tache",
          params: {
            title: "Appeler Lucas",
            dueOn: "2026-11-14",
            listId: LISTE,
            athlete: { athleteId: LUCAS },
          },
        }),
      ),
    ).toEqual({
      title: "Appeler Lucas",
      priority: "normal",
      dueOn: "2026-11-14",
      listId: LISTE,
      athleteId: LUCAS,
      notes: "",
    });
  });
});

describe("requireResolved", () => {
  it("refuse une carte liée dont le sportif n'est pas encore créé", () => {
    expect(
      requireResolved({ kind: "creer_tache", params: { title: "x", athlete: { fromCard: "c1" } } }),
    ).toBe(false);
    expect(
      requireResolved({
        kind: "creer_tache",
        params: { title: "x", athlete: { athleteId: LUCAS } },
      }),
    ).toBe(true);
  });
});
