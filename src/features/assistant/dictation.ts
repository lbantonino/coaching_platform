import { MAX_QUESTION_LENGTH } from "./rules";

// Dictée de l'Assistant IA (D-173, demande d'Antonino du 13/11/2026) : règles PURES, testées par
// Vitest. La reconnaissance vocale est celle du navigateur (Chrome : serveurs de Google ; Safari :
// Apple) ; Coory ne reçoit que le texte, que le coach relit avant d'envoyer. Rien n'est envoyé seul.

// Interface minimale de SpeechRecognition (Web Speech API), commune à Chrome et Safari.
export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

// Le constructeur du navigateur (standard, ou préfixé dans Chrome et Safari) ; null sans dictée
// (Firefox) ou sur une adresse non sécurisée (http hors localhost, ex. l'iPhone sur l'IP du Mac),
// où le navigateur refuse le micro : le bouton micro n'apparaît pas.
export function speechRecognitionCtor(scope: unknown): SpeechRecognitionCtor | null {
  if (!scope || typeof scope !== "object") return null;
  const source = scope as Record<string, unknown>;
  if (source.isSecureContext === false) return null;
  const ctor = source.SpeechRecognition ?? source.webkitSpeechRecognition;
  return typeof ctor === "function" ? (ctor as SpeechRecognitionCtor) : null;
}

// Ce qui était écrit avant la dictée, suivi de ce qui est entendu (un seul espace, majuscule si la
// saisie était vide), jamais plus long qu'une demande.
export function mergeDictation(base: string, spoken: string, max = MAX_QUESTION_LENGTH): string {
  const words = spoken.replace(/\s+/g, " ").trim();
  if (!words) return base.slice(0, max);
  const before = base.trimEnd();
  const text = before
    ? `${before} ${words}`
    : `${words.charAt(0).toLocaleUpperCase("fr")}${words.slice(1)}`;
  return text.slice(0, max);
}

// Message montré sous la saisie selon l'erreur du navigateur ; null si la dictée est juste coupée.
export function dictationErrorText(code: string): string | null {
  switch (code) {
    case "aborted":
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "Micro refusé : autorise-le dans les réglages du navigateur.";
    case "no-speech":
      return "Je n'ai rien entendu. Réessaie.";
    case "audio-capture":
      return "Aucun micro trouvé.";
    case "network":
      return "La dictée a besoin d'une connexion. Réessaie.";
    default:
      return "La dictée n'a pas marché. Réessaie.";
  }
}
