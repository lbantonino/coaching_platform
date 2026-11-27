import type Anthropic from "@anthropic-ai/sdk";

import { docxText, xlsxText } from "./file-text";
import { READ_MAX_BYTES, type AssistantAttachment } from "./rules";

export { READ_MAX_BYTES };

// Le fichier joint, tel que Claude le lit (D-209) : un PDF en document, une image en image, un Word
// ou un Excel en texte extrait (file-text.ts), un texte brut tel quel. Sinon, une note dit pourquoi il
// n'est pas lu (trop lourd, format inconnu, fichier abîmé) : l'assistant ne l'invente jamais.
const IMAGE_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp" | "image/gif"> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};
const TEXT_EXTENSIONS = new Set(["txt", "csv", "md", "json", "tsv"]);
const MAX_PLAIN_TEXT = 100_000;

const note = (text: string): Anthropic.ContentBlockParam[] => [{ type: "text", text }];
const textDocument = (name: string, text: string): Anthropic.ContentBlockParam[] => [
  {
    type: "document",
    source: { type: "text", media_type: "text/plain", data: text.trim() || "(fichier vide)" },
    title: name,
  },
];

export function attachmentBlocks(file: AssistantAttachment): Anthropic.ContentBlockParam[] {
  if (!file.data) {
    return note(
      file.size > READ_MAX_BYTES
        ? "(Fichier joint non lu : plus de 3 Mo. Tu peux seulement le ranger dans les Documents.)"
        : "(Fichier joint non lu : son contenu n'a pas été transmis.)",
    );
  }
  const extension = file.name.toLowerCase().split(".").at(-1) ?? "";
  const type = file.type.toLowerCase();
  try {
    if (type === "application/pdf" || extension === "pdf") {
      return [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: file.data },
          title: file.name,
        },
      ];
    }
    const image = (Object.values(IMAGE_TYPES) as string[]).includes(type)
      ? (type as (typeof IMAGE_TYPES)[string])
      : IMAGE_TYPES[extension];
    if (image) {
      return [{ type: "image", source: { type: "base64", media_type: image, data: file.data } }];
    }
    const bytes = Buffer.from(file.data, "base64");
    if (extension === "docx" || type.includes("wordprocessingml")) {
      return textDocument(file.name, docxText(bytes));
    }
    if (extension === "xlsx" || type.includes("spreadsheetml")) {
      return textDocument(file.name, xlsxText(bytes));
    }
    if (type.startsWith("text/") || TEXT_EXTENSIONS.has(extension)) {
      const text = bytes.toString("utf8");
      return textDocument(
        file.name,
        text.length > MAX_PLAIN_TEXT ? `${text.slice(0, MAX_PLAIN_TEXT)}\n… (texte coupé)` : text,
      );
    }
    return note("(Fichier joint non lu : format non pris en charge.)");
  } catch {
    return note("(Fichier joint non lu : il semble abîmé ou protégé.)");
  }
}

// Le fichier se place juste avant la question du coach (son dernier message écrit), à chaque étape :
// la conversation renvoyée au navigateur ne le contient pas (elle reste légère), et le début de la
// demande, identique d'une étape à l'autre, reste en cache chez Claude.
export function withAttachment(
  messages: Anthropic.MessageParam[],
  blocks: Anthropic.ContentBlockParam[],
): Anthropic.MessageParam[] {
  if (blocks.length === 0) return messages;
  let index = messages.length - 1;
  while (
    index >= 0 &&
    !(messages[index].role === "user" && typeof messages[index].content === "string")
  )
    index -= 1;
  if (index < 0) return messages;
  const question = messages[index].content as string;
  return messages.map((message, at) =>
    at === index
      ? { role: "user", content: [...blocks, { type: "text", text: question }] }
      : message,
  );
}
