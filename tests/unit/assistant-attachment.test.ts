import { deflateRawSync } from "node:zlib";

import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";

import {
  READ_MAX_BYTES,
  attachmentBlocks,
  withAttachment,
} from "@/features/assistant/attachment-content";
import { attachmentSchema } from "@/features/assistant/rules";

// L'Assistant IA lit le fichier joint (D-209, accord d'Antonino du 27/11) : PDF et images tels quels,
// Word et Excel en texte extrait, texte brut ; sinon une note qui dit pourquoi il n'est pas lu.
const b64 = (text: string | Buffer) => Buffer.from(text).toString("base64");

// Word minimal (une entrée compressée), comme tests/unit/assistant-file-text.test.ts.
function docx(text: string): Buffer {
  const name = Buffer.from("word/document.xml");
  const raw = Buffer.from(`<w:document><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:document>`);
  const data = deflateRawSync(raw);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt16LE(name.length, 28);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(30 + name.length + data.length, 16);
  return Buffer.concat([local, name, data, central, name, end]);
}

describe("contenu du fichier joint pour Claude", () => {
  it("un PDF est lu tel quel", () => {
    expect(
      attachmentBlocks({ name: "bilan.pdf", type: "application/pdf", size: 10, data: b64("%PDF") }),
    ).toEqual([
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: b64("%PDF") },
        title: "bilan.pdf",
      },
    ]);
  });

  it("une image est lue telle quelle", () => {
    expect(
      attachmentBlocks({ name: "photo.png", type: "image/png", size: 10, data: b64("png") }),
    ).toEqual([
      { type: "image", source: { type: "base64", media_type: "image/png", data: b64("png") } },
    ]);
  });

  it("un Word devient son texte", () => {
    const [block] = attachmentBlocks({
      name: "plan.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 100,
      data: b64(docx("Semaine 1 : 3 séances")),
    });
    expect(block).toEqual({
      type: "document",
      source: { type: "text", media_type: "text/plain", data: "Semaine 1 : 3 séances" },
      title: "plan.docx",
    });
  });

  it("un texte brut est lu, un format inconnu ou un fichier abîmé le dit", () => {
    expect(
      attachmentBlocks({ name: "notes.csv", type: "text/csv", size: 5, data: b64("a;b") })[0],
    ).toMatchObject({ type: "document", source: { type: "text", data: "a;b" } });
    expect(
      attachmentBlocks({ name: "archive.zip", type: "application/zip", size: 5, data: b64("zz") }),
    ).toEqual([{ type: "text", text: "(Fichier joint non lu : format non pris en charge.)" }]);
    expect(
      attachmentBlocks({ name: "abime.docx", type: "", size: 5, data: b64("pas un zip") }),
    ).toEqual([{ type: "text", text: "(Fichier joint non lu : il semble abîmé ou protégé.)" }]);
  });

  it("au-delà de 3 Mo, le fichier n'est pas envoyé : l'assistant le sait", () => {
    expect(
      attachmentBlocks({ name: "gros.pdf", type: "application/pdf", size: READ_MAX_BYTES + 1 }),
    ).toEqual([
      {
        type: "text",
        text: "(Fichier joint non lu : plus de 3 Mo. Tu peux seulement le ranger dans les Documents.)",
      },
    ]);
  });
});

describe("le fichier dans la demande", () => {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: "Bonjour" },
    { role: "assistant", content: "Bonjour !" },
    { role: "user", content: "[Fichier joint : bilan.pdf]\n\nRésume ce bilan" },
    { role: "assistant", content: [{ type: "text", text: "Je regarde." }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "x", content: "ok" }] },
  ];
  const blocks: Anthropic.ContentBlockParam[] = [{ type: "text", text: "(contenu)" }];

  it("va juste avant la question du coach, sans toucher au reste", () => {
    const next = withAttachment(messages, blocks);
    expect(next[2]).toEqual({
      role: "user",
      content: [
        { type: "text", text: "(contenu)" },
        { type: "text", text: "[Fichier joint : bilan.pdf]\n\nRésume ce bilan" },
      ],
    });
    expect([next[0], next[1], next[3], next[4]]).toEqual([
      messages[0],
      messages[1],
      messages[3],
      messages[4],
    ]);
    expect(messages[2].content).toBe("[Fichier joint : bilan.pdf]\n\nRésume ce bilan");
    expect(withAttachment(messages, [])).toBe(messages);
  });

  it("le navigateur envoie le fichier en base64, 3 Mo au plus", () => {
    const ok = (data: string) =>
      attachmentSchema.safeParse({ name: "a.pdf", type: "application/pdf", size: 3, data }).success;
    expect(ok(b64("%PDF"))).toBe(true);
    expect(ok("pas du base64 !")).toBe(false);
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
    expect(seen[0]).toEqual({
      role: "user",
      content: [...blocks, { type: "text", text: "Résume ce bilan" }],
    });
    expect(result.kind === "continue" ? result.messages[0] : null).toEqual({
      role: "user",
      content: "Résume ce bilan",
    });
  });
});
