import { describe, expect, it } from "vitest";

import {
  ASSISTANT_ERRORS,
  ASSISTANT_MONTHLY_LIMIT,
  assistantComposerOpen,
  startInputSchema,
  brusselsMonthStart,
  reserveErrorKind,
  systemPrompt,
  toApiMessages,
} from "@/features/assistant/rules";

// Assistant IA réservé à l'abonnement Coory (D-168) : règles pures (aucun appel à Claude ici).
describe("toApiMessages", () => {
  it("finit par la question, en alternance coach / assistant", () => {
    const messages = toApiMessages({
      history: [
        { from: "coach", text: "Une séance de seuil ?" },
        { from: "assistant", text: "3 × 10 min à allure seuil." },
      ],
      question: "Et pour un débutant ?",
    });
    expect(messages).toEqual([
      { role: "user", content: "Une séance de seuil ?" },
      { role: "assistant", content: "3 × 10 min à allure seuil." },
      { role: "user", content: "Et pour un débutant ?" },
    ]);
  });

  it("fusionne deux messages du même côté et ignore les vides", () => {
    const messages = toApiMessages({
      history: [
        { from: "assistant", text: "Bonjour" },
        { from: "coach", text: "Première question" },
        { from: "coach", text: "   " },
      ],
      question: "Deuxième question",
    });
    expect(messages).toEqual([{ role: "user", content: "Première question\n\nDeuxième question" }]);
  });

  it("ne garde que les 20 derniers échanges, en commençant par le coach", () => {
    const history = Array.from({ length: 40 }, (_, index) => ({
      from: index % 2 === 0 ? ("coach" as const) : ("assistant" as const),
      text: `message ${index}`,
    }));
    const messages = toApiMessages({ history, question: "dernière" });
    expect(messages.length).toBeLessThanOrEqual(20);
    expect(messages[0].role).toBe("user");
    expect(messages.at(-1)).toEqual({ role: "user", content: "dernière" });
  });
});

describe("startInputSchema", () => {
  it("refuse une question vide ou trop longue", () => {
    expect(startInputSchema.safeParse({ history: [], question: "  " }).success).toBe(false);
    expect(startInputSchema.safeParse({ history: [], question: "a".repeat(2001) }).success).toBe(
      false,
    );
    expect(startInputSchema.safeParse({ history: [], question: "Bonjour" }).success).toBe(true);
  });
});

describe("systemPrompt", () => {
  it("dit que rien n'est fait sans le clic du coach, ni santé ni diagnostic", () => {
    const prompt = systemPrompt("Gianluca", "2026-11-13");
    expect(prompt).toContain("Le coach s'appelle Gianluca.");
    expect(prompt).toContain("Rien n'est fait avant ce clic");
    expect(prompt).toContain("N'invente jamais d'identifiant");
    expect(prompt).toContain("Tu ne notes jamais de données de santé");
    expect(prompt).toContain("aucun diagnostic médical");
    expect(systemPrompt(" ", "2026-11-13")).not.toContain("s'appelle");
  });
});

describe("limite mensuelle", () => {
  it("commence le 1er du mois à minuit, heure de Bruxelles", () => {
    expect(brusselsMonthStart("2026-11-13")).toBe("2026-10-31T23:00:00.000Z");
    expect(brusselsMonthStart("2027-07-31")).toBe("2027-06-30T22:00:00.000Z");
    expect(brusselsMonthStart("2027-03-31")).toBe("2027-02-28T23:00:00.000Z");
    expect(brusselsMonthStart("2027-04-02")).toBe("2027-03-31T22:00:00.000Z");
  });

  it("traduit les refus de la base", () => {
    expect(reserveErrorKind("abonnement_requis")).toBe("locked");
    expect(reserveErrorKind("limite_mensuelle")).toBe("quota");
    expect(reserveErrorKind("autre chose")).toBe("unavailable");
    expect(ASSISTANT_ERRORS.quota).toContain(`${ASSISTANT_MONTHLY_LIMIT} demandes`);
  });
});

// Demande d'Antonino du 13/11 : sans clé Claude sur le serveur, un coach autorisé voit quand même
// toute l'interface ; une demande envoyée répond « pas encore branché » (rien ne part, rien n'est
// décompté). Sans abonnement ni adresse autorisée, le verrou reste.
describe("assistantComposerOpen", () => {
  it("ouvre la saisie quand l'assistant est prêt ou pas encore branché", () => {
    expect(assistantComposerOpen({ status: "ready", remaining: 12 })).toBe(true);
    expect(assistantComposerOpen({ status: "unconfigured" })).toBe(true);
  });

  it("garde le verrou sans abonnement ni adresse autorisée", () => {
    expect(assistantComposerOpen({ status: "locked" })).toBe(false);
  });
});
