import { describe, expect, it } from "vitest";

import {
  blockDependents,
  canValidate,
  noteFor,
  resolveCard,
  startCard,
  toCards,
  type CardState,
} from "@/features/assistant/cards";
import { toPaymentPrefill, toSessionPrefill, toTaskPrefill } from "@/features/assistant/form-data";
import type { AssistantProposal } from "@/features/assistant/proposals";

// Cartes de l'Assistant IA (lot 1 des actions) : une carte ne s'exécute qu'une fois ; une carte liée
// attend la fiche qu'elle concerne, et devient impossible si cette fiche n'est pas créée.
const LUCAS = "00000000-0000-4000-8000-000000000001";

const fiche: AssistantProposal = {
  id: "fiche",
  kind: "creer_sportif",
  params: { firstName: "Lucas", lastName: "Martin" },
  title: "Nouvelle fiche sportif",
  summary: ["Lucas Martin"],
  dependsOn: null,
};
const tache: AssistantProposal = {
  id: "tache",
  kind: "creer_tache",
  params: { title: "Appeler Lucas", athlete: { fromCard: "fiche" } },
  title: "Nouvelle tâche",
  summary: ["Appeler Lucas", "Sans échéance", "Sportif : Lucas Martin"],
  dependsOn: "fiche",
};

describe("cartes liées", () => {
  it("une carte liée attend que sa fiche soit faite", () => {
    const cards = toCards([fiche, tache]);
    expect(canValidate(cards, "fiche")).toBe(true);
    expect(canValidate(cards, "tache")).toBe(false);
  });

  it("une fiche faite débloque la carte liée avec l'identifiant créé", () => {
    const cards = resolveCard(toCards([fiche, tache]), "fiche", "/fiche", LUCAS);
    const linked = cards.find((card) => card.id === "tache") as CardState;
    expect(cards[0]).toMatchObject({ status: "done", href: "/fiche" });
    expect(linked.params.athlete).toEqual({ athleteId: LUCAS });
    expect(canValidate(cards, "tache")).toBe(true);
  });

  it("une fiche annulée rend la carte liée impossible", () => {
    const cards = blockDependents(
      toCards([fiche, tache]),
      "fiche",
      "Impossible : la fiche de Lucas Martin n'a pas été créée.",
    );
    expect(cards[1]).toMatchObject({
      status: "blocked",
      result: "Impossible : la fiche de Lucas Martin n'a pas été créée.",
    });
    expect(canValidate(cards, "tache")).toBe(false);
  });
});

describe("une seule exécution", () => {
  it("une carte en cours ou faite ne repart pas", () => {
    const running = startCard(toCards([fiche]), "fiche");
    expect(running[0].status).toBe("running");
    expect(canValidate(running, "fiche")).toBe(false);
    expect(startCard(running, "fiche")).toBe(running);
    const done = resolveCard(running, "fiche", "/fiche", LUCAS);
    expect(startCard(done, "fiche")).toBe(done);
    expect(blockDependents(done, "autre", "x")[0].status).toBe("done");
  });
});

describe("noteFor", () => {
  it("raconte à l'assistant ce que le coach a fait ou annulé", () => {
    expect(noteFor(fiche, "done")).toBe("[Fait : Nouvelle fiche sportif · Lucas Martin]");
    expect(noteFor(tache, "cancelled")).toBe(
      "[Annulé : Nouvelle tâche · Appeler Lucas · Sans échéance · Sportif : Lucas Martin]",
    );
  });
});

describe("Modifier : fenêtres pré-remplies", () => {
  it("pré-remplit la séance, le paiement et la tâche", () => {
    expect(
      toSessionPrefill({
        kind: "individual",
        title: "Coaching force",
        athlete: { athleteId: LUCAS },
        startsOn: "2026-11-17",
        startTime: "18:00",
        durationMinutes: 60,
        price: 65,
      }),
    ).toEqual({
      kind: "individual",
      title: "Coaching force",
      startsOn: "2026-11-17",
      startTime: "18:00",
      durationMinutes: "60",
      athleteId: LUCAS,
      price: "65,00",
    });
    expect(
      toPaymentPrefill({
        athlete: { athleteId: LUCAS },
        receivedOn: "2026-11-13",
        amount: 60,
        method: "cash",
      }),
    ).toEqual({ athleteId: LUCAS, receivedOn: "2026-11-13", amount: "60,00", method: "cash" });
    expect(toSessionPrefill({ vatRate: 21 })).toEqual({ applyVat: true, vatRate: "21" });
    expect(toTaskPrefill({ title: "Appeler Lucas", dueOn: "2026-11-14" })).toEqual({
      title: "Appeler Lucas",
      dueOn: "2026-11-14",
    });
  });
});
