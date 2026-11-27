import { brusselsDayOf, formatDate, formatDay } from "@/lib/format";

import type { CardStatus } from "./cards";
import { expiresOn, type AssistantMessage } from "./conversation-rules";

// PDF d'une conversation de l'Assistant IA (D-212, 27/11/2026) : le contenu, règle PURE ; la mise
// en page est dans conversation-pdf.tsx. Ce que le coach a vu, dans l'ordre : ses questions, les
// réponses, les cartes avec leur état ; jamais les notes cachées pour l'assistant (« [Fait : …] »).
// Un fichier joint n'apparaît que par son nom (il n'est pas gardé).

export type ConversationPdfBlock =
  | { kind: "message"; from: "Toi" | "Assistant IA"; text: string; error: boolean }
  | { kind: "card"; title: string; lines: string[]; state: string; result: string | null }
  | { kind: "failure"; text: string };

export type ConversationPdf = {
  documentTitle: string;
  fileName: string;
  title: string;
  subtitle: string;
  note: string;
  footer: string;
  blocks: ConversationPdfBlock[];
};

export const CARD_STATES: Record<CardStatus, string> = {
  pending: "À valider",
  running: "En cours",
  done: "Validée",
  cancelled: "Annulée",
  error: "Échec",
  blocked: "Impossible",
};

export function conversationPdf(
  conversation: {
    title: string;
    createdAt: string;
    lastMessageAt: string;
    messages: AssistantMessage[];
  },
  coachName: string,
): ConversationPdf {
  const blocks: ConversationPdfBlock[] = [];
  for (const message of conversation.messages) {
    if (message.hidden) continue;
    const assistant = message.from === "assistant";
    blocks.push({
      kind: "message",
      from: assistant ? "Assistant IA" : "Toi",
      text: message.text,
      error: assistant && message.failed === true,
    });
    for (const card of message.cards ?? []) {
      blocks.push({
        kind: "card",
        title: card.title,
        lines: card.summary,
        state: CARD_STATES[card.status],
        result: card.result ?? null,
      });
    }
    for (const failure of message.failures ?? []) {
      blocks.push({ kind: "failure", text: `Non préparée : ${failure}` });
    }
  }
  const safeTitle = conversation.title.replace(/[\\/:*?"<>|]/g, "").trim() || "Conversation";
  return {
    documentTitle: `${conversation.title} · Assistant IA`,
    fileName: `Conversation - ${safeTitle} - ${brusselsDayOf(conversation.lastMessageAt)}.pdf`,
    title: conversation.title,
    subtitle: `Commencée le ${formatDay(conversation.createdAt)} · dernier message le ${formatDay(conversation.lastMessageAt)}`,
    note: `Coory garde cette conversation jusqu'au ${formatDate(expiresOn(conversation.lastMessageAt))}, puis l'efface.`,
    footer: `Coory · Assistant IA · ${coachName}`,
    blocks,
  };
}
