import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";

import { FILES_ACK, FILES_TURN, withAttachment } from "@/features/assistant/attachment-content";

// Les fichiers joints dans la demande (D-209 ; depuis D-213, préparés à l'avance et cités par leur
// copie Anthropic ou leur texte : assistant-attachment-rules.test.ts). Ici : où ils se placent, et ce
// que la conversation renvoyée au navigateur garde.
describe("le fichier dans la demande", () => {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: "Bonjour" },
    { role: "assistant", content: "Bonjour !" },
    { role: "user", content: "[Fichier joint : bilan.pdf]\n\nRésume ce bilan" },
    { role: "assistant", content: [{ type: "text", text: "Je regarde." }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "x", content: "ok" }] },
  ];
  const blocks: Anthropic.ContentBlockParam[] = [{ type: "text", text: "(contenu)" }];

  // Relecture du 27/11 : en tête de la conversation, pour que les questions suivantes relisent les
  // fichiers depuis le cache de Claude.
  it("se placent en tête de la conversation, sans toucher au reste", () => {
    const next = withAttachment(messages, blocks);
    expect(next.slice(0, 2)).toEqual([
      { role: "user", content: [...blocks, { type: "text", text: FILES_TURN }] },
      { role: "assistant", content: FILES_ACK },
    ]);
    expect(next.slice(2)).toEqual(messages);
    expect(withAttachment(messages, [])).toBe(messages);
  });
});

describe("une étape de l'assistant avec un fichier joint", () => {
  it("Claude reçoit le fichier ; la conversation renvoyée au navigateur ne le contient pas", async () => {
    const { runAssistantStep } = await import("@/features/assistant/loop");
    const blocks: Anthropic.ContentBlockParam[] = [{ type: "text", text: "(contenu du PDF)" }];
    let seen: Anthropic.MessageParam[] = [];
    const result = await runAssistantStep(
      {
        firstName: "Gianluca",
        todayIso: "2026-11-27",
        model: async ({ messages }) => {
          seen = messages;
          return {
            content: [{ type: "tool_use", id: "t1", name: "voir_agenda", input: {} }],
            stop_reason: "tool_use",
            usage: { input_tokens: 1, output_tokens: 1 },
          } as unknown as Anthropic.Message;
        },
        runTool: async () => ({ type: "result", content: "ok" }),
        attachmentBlocks: blocks,
      },
      [{ role: "user", content: "Résume ce bilan" }],
    );
    expect(seen.slice(0, 3)).toEqual([
      { role: "user", content: [...blocks, { type: "text", text: FILES_TURN }] },
      { role: "assistant", content: FILES_ACK },
      { role: "user", content: "Résume ce bilan" },
    ]);
    expect(result.kind === "continue" ? result.messages[0] : null).toEqual({
      role: "user",
      content: "Résume ce bilan",
    });
  });
});
