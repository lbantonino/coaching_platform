import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";

import {
  ASSISTANT_MAX_RETRIES,
  ASSISTANT_MAX_TOKENS,
  ASSISTANT_MODEL,
  ASSISTANT_TIMEOUT_MS,
} from "./rules";

// Le modèle de l'Assistant IA : Claude (clé ANTHROPIC_API_KEY, serveur seulement), ou un modèle
// SIMULÉ pour les tests de bout en bout (ASSISTANT_FAKE_SCRIPT), qui ne coûte rien et n'est jamais
// actif sur Vercel. Sans l'un ni l'autre : pas de modèle, l'assistant n'est « pas branché ».
export type AssistantModel = (params: {
  system: Anthropic.TextBlockParam[];
  tools: Anthropic.Tool[];
  messages: Anthropic.MessageParam[];
}) => Promise<Anthropic.Message>;

export function getAssistantModel(): AssistantModel | null {
  const script = process.env.ASSISTANT_FAKE_SCRIPT;
  if (script && process.env.VERCEL !== "1") return scriptedModel(script);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const client = new Anthropic({
    apiKey,
    maxRetries: ASSISTANT_MAX_RETRIES,
    timeout: ASSISTANT_TIMEOUT_MS,
  });
  return ({ system, tools, messages }) =>
    client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: ASSISTANT_MAX_TOKENS,
      system,
      ...(tools.length > 0 ? { tools } : {}),
      messages,
      output_config: { effort: "medium" },
      // Consigne, outils et début de conversation identiques d'une étape à l'autre : mis en cache.
      cache_control: { type: "ephemeral" },
    });
}

// Modèle simulé : un fichier JSON { « question du coach » : [contenu de l'étape 1, de l'étape 2…] }.
// La n-ième étape d'une question rend le n-ième contenu ; une question inconnue reçoit une réponse
// fixe. La question est le dernier message texte du coach (son dernier paragraphe : l'historique
// fusionné le précède) ; l'étape, le nombre de réponses du modèle qui le suivent.
type Script = Record<string, Anthropic.ContentBlock[][]>;

function scriptedModel(file: string): AssistantModel {
  const script = JSON.parse(readFileSync(path.resolve(file), "utf8")) as Script;
  return async ({ messages }) => {
    let index = messages.length - 1;
    while (
      index > 0 &&
      !(messages[index].role === "user" && typeof messages[index].content === "string")
    )
      index--;
    const asked = messages[index]?.content;
    const question = typeof asked === "string" ? lastQuestion(asked) : "";
    const step = messages.slice(index).filter((message) => message.role === "assistant").length;
    const content = script[question]?.[step] ?? [
      { type: "text", text: "Réponse simulée.", citations: null },
    ];
    return {
      id: `msg_simule_${step}`,
      type: "message",
      role: "assistant",
      model: "simule",
      content,
      stop_reason: content.some((block) => block.type === "tool_use") ? "tool_use" : "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    } as unknown as Anthropic.Message;
  };
}

// Dernier paragraphe d'un message du coach : sa question.
const lastQuestion = (text: string) => text.split("\n\n").at(-1)?.trim() ?? "";
