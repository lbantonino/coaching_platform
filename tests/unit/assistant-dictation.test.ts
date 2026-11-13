import { describe, expect, it } from "vitest";

import {
  dictationErrorText,
  mergeDictation,
  speechRecognitionCtor,
} from "@/features/assistant/dictation";

// Dictée de l'Assistant IA (D-173, demande d'Antonino du 13/11) : la voix du coach s'écrit dans la
// saisie, qu'il relit avant d'envoyer. Règles pures ; la reconnaissance elle-même est celle du
// navigateur (Chrome, Safari).
describe("mergeDictation", () => {
  it("écrit la dictée dans une saisie vide, avec une majuscule", () => {
    expect(mergeDictation("", "crée une séance avec Sarah mardi")).toBe(
      "Crée une séance avec Sarah mardi",
    );
  });

  it("ajoute la dictée après ce qui est déjà écrit, avec un seul espace", () => {
    expect(mergeDictation("Crée une séance ", "  avec Sarah   mardi à 18h ")).toBe(
      "Crée une séance avec Sarah mardi à 18h",
    );
  });

  it("ne change rien quand rien n'est entendu", () => {
    expect(mergeDictation("Note un paiement", "   ")).toBe("Note un paiement");
  });

  it("ne dépasse jamais la longueur d'une demande", () => {
    expect(mergeDictation("a".repeat(1995), "bonjour Sarah", 2000)).toHaveLength(2000);
  });
});

describe("speechRecognitionCtor", () => {
  class Fake {}

  it("trouve la reconnaissance standard ou celle préfixée de Chrome et Safari", () => {
    expect(speechRecognitionCtor({ SpeechRecognition: Fake })).toBe(Fake);
    expect(speechRecognitionCtor({ webkitSpeechRecognition: Fake })).toBe(Fake);
  });

  it("ne propose pas la dictée sur une adresse non sécurisée (le navigateur refuserait le micro)", () => {
    expect(
      speechRecognitionCtor({ webkitSpeechRecognition: Fake, isSecureContext: false }),
    ).toBeNull();
    expect(speechRecognitionCtor({ webkitSpeechRecognition: Fake, isSecureContext: true })).toBe(
      Fake,
    );
  });

  it("ne trouve rien dans un navigateur sans dictée (le bouton est alors caché)", () => {
    expect(speechRecognitionCtor({})).toBeNull();
    expect(speechRecognitionCtor(undefined)).toBeNull();
  });
});

describe("dictationErrorText", () => {
  it("explique au coach ce qui bloque, en français", () => {
    expect(dictationErrorText("not-allowed")).toBe(
      "Micro refusé : autorise-le dans les réglages du navigateur.",
    );
    expect(dictationErrorText("no-speech")).toBe("Je n'ai rien entendu. Réessaie.");
    expect(dictationErrorText("audio-capture")).toBe("Aucun micro trouvé.");
    expect(dictationErrorText("inconnu")).toBe("La dictée n'a pas marché. Réessaie.");
  });

  it("ne montre rien quand la dictée est simplement interrompue", () => {
    expect(dictationErrorText("aborted")).toBeNull();
  });
});
