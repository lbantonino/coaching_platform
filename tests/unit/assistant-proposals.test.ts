import { describe, expect, it } from "vitest";

import {
  assistantActionSchema,
  linkNewAthlete,
  summarize,
  type AssistantProposal,
} from "@/features/assistant/proposals";

// Propositions de l'Assistant IA (lot 1 des actions) : ce que la carte montre au coach, et ce que la
// base n'acceptera jamais d'une proposition (santé, note privée, organisation, valeurs fausses).
const LUCAS = "00000000-0000-4000-8000-000000000001";
const SEANCE = "ca000000-0000-4000-8000-000000000001";

describe("summarize", () => {
  it("résume une séance avec le sportif, la date en toutes lettres et le prix", () => {
    expect(
      summarize(
        {
          kind: "creer_seance",
          params: {
            kind: "individual",
            title: "Coaching force",
            athlete: { athleteId: LUCAS },
            startsOn: "2026-11-17",
            startTime: "18:00",
            durationMinutes: 60,
            location: "Salle",
            price: 65,
            paymentMethod: "transfer",
          },
        },
        { [LUCAS]: "Lucas Janssens" },
        "EUR",
      ),
    ).toEqual({
      title: "Nouvelle séance",
      summary: [
        "Coaching force",
        "Lucas Janssens",
        "mardi 17 novembre 2026 · 18:00 · 60 min",
        "Salle",
        "65,00 € · virement",
      ],
    });
  });

  it("résume un paiement en espèces", () => {
    expect(
      summarize(
        {
          kind: "noter_paiement",
          params: {
            athlete: { athleteId: LUCAS },
            receivedOn: "2026-11-13",
            amount: 60,
            method: "cash",
          },
        },
        { [LUCAS]: "Lucas Janssens" },
        "EUR",
      ).summary,
    ).toEqual(["Lucas Janssens", "60,00 € · espèces", "Reçu le vendredi 13 novembre 2026"]);
  });

  it("résume une dépense mensuelle avec sa fin", () => {
    expect(
      summarize(
        {
          kind: "noter_depense",
          params: {
            label: "Loyer de la salle",
            amount: 450,
            spentOn: "2026-11-01",
            repeatsMonthly: true,
            endsOn: "2027-06-30",
          },
        },
        {},
        "EUR",
      ).summary,
    ).toEqual([
      "Loyer de la salle",
      "450,00 €",
      "Chaque mois depuis le dimanche 1 novembre 2026, jusqu'au mercredi 30 juin 2027",
    ]);
  });

  it("dit pour un déplacement la date de départ, d'arrivée et la portée", () => {
    expect(
      summarize(
        {
          kind: "deplacer_seance",
          params: {
            sessionId: SEANCE,
            originalDate: "2026-11-17",
            newDate: "2026-11-19",
            newTime: "19:00",
            scope: "single",
          },
        },
        { [SEANCE]: "Coaching force · Lucas Janssens" },
        "EUR",
      ),
    ).toEqual({
      title: "Déplacer une séance",
      summary: [
        "Coaching force · Lucas Janssens",
        "Du mardi 17 novembre 2026 au jeudi 19 novembre 2026 à 19:00",
        "Cette date seulement",
      ],
    });
  });
});

describe("assistantActionSchema", () => {
  const athlete = { kind: "creer_sportif", params: { firstName: "Lucas", lastName: "Martin" } };

  it("accepte une fiche sans santé ni note", () => {
    expect(assistantActionSchema.safeParse(athlete).success).toBe(true);
  });

  it("refuse la santé, l'accord, une note privée ou une organisation", () => {
    for (const extra of [
      { healthConstraints: "genou" },
      { healthConsent: true },
      { coachNote: "privé" },
      { organization_id: "0a000000-0000-4000-8000-0000000000a1" },
    ]) {
      const action = { ...athlete, params: { ...athlete.params, ...extra } };
      expect(assistantActionSchema.safeParse(action).success).toBe(false);
    }
  });

  it("refuse un montant négatif et une heure hors quart d'heure pour un déplacement", () => {
    expect(
      assistantActionSchema.safeParse({
        kind: "noter_paiement",
        params: {
          athlete: { athleteId: LUCAS },
          receivedOn: "2026-11-13",
          amount: -5,
          method: "cash",
        },
      }).success,
    ).toBe(false);
    expect(
      assistantActionSchema.safeParse({
        kind: "deplacer_seance",
        params: {
          sessionId: SEANCE,
          originalDate: "2026-11-17",
          newDate: "2026-11-19",
          newTime: "19:10",
          scope: "single",
        },
      }).success,
    ).toBe(false);
  });

  it("exige un sportif pour une séance individuelle", () => {
    expect(
      assistantActionSchema.safeParse({
        kind: "creer_seance",
        params: {
          kind: "individual",
          title: "Coaching",
          startsOn: "2026-11-17",
          startTime: "18:00",
          durationMinutes: 60,
        },
      }).success,
    ).toBe(false);
  });
});

describe("linkNewAthlete", () => {
  const card = (kind: AssistantProposal["kind"], params: Record<string, unknown>) =>
    ({
      id: `carte-${kind}`,
      kind,
      params,
      title: "",
      summary: [],
      dependsOn: null,
    }) as AssistantProposal;

  it("relie un sportif à créer à la carte de sa fiche dans la même réponse", () => {
    expect(
      linkNewAthlete(
        [card("creer_sportif", { firstName: "Lucas", lastName: "Martin" })],
        "lucas martin",
      ),
    ).toEqual({ ok: true, cardId: "carte-creer_sportif" });
  });

  it("refuse un nom qui ne désigne aucune fiche à créer", () => {
    expect(
      linkNewAthlete([card("creer_tache", { title: "Lucas Martin" })], "Lucas Martin").ok,
    ).toBe(false);
  });
});
