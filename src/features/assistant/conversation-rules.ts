import { z } from "zod";

import { brusselsDayOf, daysBetween } from "@/lib/format";

import type { CardState } from "./cards";

// Conversations de l'Assistant IA enregistrées (D-212, demande d'Antonino du 27/11/2026) : règles
// PURES. Le navigateur envoie la conversation telle que le coach la voit ; le serveur la valide
// (schéma ci-dessous) et la range dans assistant_conversations. Gardée 12 mois après son dernier
// message (même calcul que la base), prévenue 30 jours avant.

// `failed` : réponse d'erreur (ou la question qui l'a provoquée), jamais renvoyée à Claude.
// `hidden` : note pour l'assistant (« [Fait : …] »), envoyée avec la demande suivante, jamais affichée.
// `cards` : actions proposées par l'assistant, à valider (lot 1 des actions).
export type AssistantMessage = {
  id: number;
  from: "coach" | "assistant";
  text: string;
  failed?: boolean;
  hidden?: boolean;
  cards?: CardState[];
  // Actions de la même réponse qui n'ont pas pu être préparées (relecture n°3).
  failures?: string[];
};

export const CONVERSATION_MAX_BYTES = 2_000_000;
export const CONVERSATION_KEEP_MONTHS = 12;
export const CONVERSATION_NOTICE_DAYS = 30;
export const TITLE_MAX = 80;
export const INTERRUPTED = "Interrompue : vérifie dans Coory si c'est fait avant de redemander.";

// Le début de la première question du coach (pas de titre écrit par l'IA : il coûterait une demande).
export function conversationTitle(messages: AssistantMessage[]): string {
  const first = messages.find((message) => message.from === "coach" && !message.hidden);
  const text = (first?.text ?? "")
    .replace(/\nFichier joint : [\s\S]*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Conversation";
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX - 1).trimEnd()}…` : text;
}

// Change les cartes d'une réponse, et ajoute éventuellement une note cachée pour l'assistant (« [Fait :
// …] ») : à la conversation affichée, ou à une autre (carte finie après avoir changé de conversation).
export function updateMessageCards(
  messages: AssistantMessage[],
  messageId: number,
  change: (cards: CardState[]) => CardState[],
  note?: AssistantMessage,
): AssistantMessage[] {
  const updated = messages.map((message) =>
    message.id === messageId && message.cards
      ? { ...message, cards: change(message.cards) }
      : message,
  );
  return note ? [...updated, note] : updated;
}

// Les notes cachées ne comptent pas : valider une carte ne prolonge pas la conversation.
export const visibleCount = (messages: AssistantMessage[]): number =>
  messages.filter((message) => !message.hidden).length;

// Une carte « en cours » enregistrée (page fermée pendant « Valider ») ne redevient jamais « à
// valider » : l'action a peut-être été faite.
export function restoreMessages(messages: AssistantMessage[]): AssistantMessage[] {
  return messages.map((message) =>
    message.cards?.some((card) => card.status === "running")
      ? {
          ...message,
          cards: message.cards.map((card) =>
            card.status === "running" ? { ...card, status: "error", result: INTERRUPTED } : card,
          ),
        }
      : message,
  );
}

// Jour d'effacement : la date de Bruxelles du dernier message, 12 mois plus tard (un 29 février
// devient le 28, comme dans la base).
export function expiresOn(lastMessageAt: string): string {
  const [year, month, day] = brusselsDayOf(lastMessageAt).split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const target = year + CONVERSATION_KEEP_MONTHS / 12;
  const lastDay = new Date(Date.UTC(target, month, 0)).getUTCDate();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${target}-${pad(month)}-${pad(Math.min(day, lastDay))}`;
}

export const expiresSoon = (expires: string, today: string): boolean =>
  daysBetween(today, expires) <= CONVERSATION_NOTICE_DAYS;

// Historique (colonne de gauche, feuille du téléphone) : groupes par date du dernier message.
const GROUPS = [
  { label: "Aujourd'hui", upTo: 0 },
  { label: "Hier", upTo: 1 },
  { label: "7 derniers jours", upTo: 7 },
  { label: "30 derniers jours", upTo: 30 },
  { label: "Plus ancien", upTo: Number.POSITIVE_INFINITY },
] as const;

export function historyGroups<T extends { lastMessageAt: string }>(
  items: T[],
  today: string,
): { label: string; items: T[] }[] {
  const groups = GROUPS.map((group) => ({ ...group, items: [] as T[] }));
  for (const item of items) {
    const age = daysBetween(brusselsDayOf(item.lastMessageAt), today);
    groups.find((group) => age <= group.upTo)!.items.push(item);
  }
  return groups
    .filter((group) => group.items.length > 0)
    .map(({ label, items: list }) => ({ label, items: list }));
}

// ---------------------------------------------------------------------------
// Ce qui est enregistré (frontière serveur)
// ---------------------------------------------------------------------------
// Un lien de carte reste dans Coory : « /… », jamais « //site », « /\site » ni une autre adresse.
const internalHref = z
  .string()
  .max(500)
  .regex(/^\/(?![/\\])/);
const line = (max: number) => z.string().max(max);

const storedCardSchema = z.object({
  id: line(64),
  kind: line(64),
  params: z.record(z.string(), z.unknown()),
  title: line(200),
  // « Modifier le programme » : jusqu'à 20 changements de 6 lignes (relecture du 27/11).
  summary: z.array(line(2_000)).max(300),
  dependsOn: line(64).nullable(),
  links: z
    .array(z.object({ label: line(120), href: internalHref }))
    .max(20)
    .optional(),
  status: z.enum(["pending", "running", "done", "cancelled", "error", "blocked"]),
  result: line(2_000).optional(),
  href: internalHref.optional(),
});

const storedMessageSchema = z.object({
  id: z.number().int().min(0),
  from: z.enum(["coach", "assistant"]),
  text: line(200_000),
  failed: z.boolean().optional(),
  hidden: z.boolean().optional(),
  cards: z.array(storedCardSchema).max(60).optional(),
  failures: z.array(line(2_000)).max(60).optional(),
});

export const saveConversationSchema = z.object({
  id: z.uuid(),
  // 0 : nouvelle conversation ; sinon la version d'où part ce changement.
  version: z.number().int().min(0),
  messages: z.array(storedMessageSchema).min(1).max(1_000),
});

export const conversationTooLarge = (messages: AssistantMessage[]): boolean =>
  new TextEncoder().encode(JSON.stringify(messages)).length > CONVERSATION_MAX_BYTES;

export const CONVERSATION_ERRORS = {
  "too-large":
    "Cette conversation est trop longue pour être enregistrée : commence-en une nouvelle.",
  conflict: "Cette conversation a changé sur un autre appareil : elle est à jour.",
  gone: "Cette conversation a été supprimée.",
  demo: "Le compte de démonstration ne garde pas les conversations.",
  invalid: "La conversation n'a pas pu être enregistrée.",
} as const;
export type ConversationError = keyof typeof CONVERSATION_ERRORS;
