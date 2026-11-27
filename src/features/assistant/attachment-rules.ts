import type Anthropic from "@anthropic-ai/sdk";

import { formatBytes } from "@/domain/documents/documents";

// Fichiers joints à l'Assistant IA (D-213, demande d'Antonino du 27/11/2026) : règles PURES. Jusqu'à
// 10 fichiers de 20 Mo par message, déposés directement dans le stockage de Coory (jamais par Vercel),
// puis préparés un par un : PDF et images envoyés une fois à Anthropic (copie d'1 h au plus), Word,
// Excel et texte lus en texte. 100 pages au plus par message : plus de pages, c'est plus de temps de
// lecture pour Claude, et une étape ne doit jamais dépasser les 300 s d'une fonction Vercel.

export const ATTACHMENTS_MAX = 10;
export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const PAGES_MAX = 100;
export const TEXT_PAGE_CHARS = 3_000;
export const TEXT_MAX_CHARS = 200_000;
// La copie chez Anthropic expire au bout d'1 h. Le serveur la refuse au-delà de 50 min (une étape
// dure au plus 270 s, et l'envoi lui-même prend du temps) ; le navigateur la refait dès 40 min.
export const ANTHROPIC_FILE_SECONDS = 3_600;
export const PREPARED_FOR_MS = 50 * 60 * 1_000;
export const REFRESH_AFTER_MS = 40 * 60 * 1_000;
// Claude refuse une image de plus de 5 Mo.
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
// Côté le plus long d'une image envoyée (Claude refuse plus de 8 000 px ou 5 Mo ; il lit très bien
// une image de cette taille).
export const IMAGE_MAX_SIDE = 2_576;

export type AttachmentKind = "pdf" | "image" | "word" | "excel" | "text";

const EXTENSIONS: Record<string, AttachmentKind> = {
  pdf: "pdf",
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  gif: "image",
  heic: "image",
  heif: "image",
  docx: "word",
  xlsx: "excel",
  csv: "text",
  tsv: "text",
  txt: "text",
  md: "text",
  json: "text",
};

export function attachmentKind(name: string, type: string): AttachmentKind | null {
  const extension = name.toLowerCase().split(".").at(-1) ?? "";
  if (EXTENSIONS[extension]) return EXTENSIONS[extension];
  const mime = type.toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("text/")) return "text";
  return null;
}

export type AttachmentMeta = { name: string; type: string; size: number };

// Refusé dans le navigateur, avant tout envoi, avec la raison.
export function attachmentProblem(file: AttachmentMeta, alreadyAttached: number): string | null {
  if (alreadyAttached >= ATTACHMENTS_MAX) return `${ATTACHMENTS_MAX} fichiers au plus par message.`;
  const name = file.name.trim();
  if (!name) return "Fichier sans nom : renomme-le, puis joins-le à nouveau.";
  if (name.length > 200) return "Nom de fichier trop long (200 caractères au plus).";
  if (file.size <= 0) return `« ${name} » est vide.`;
  if (file.size > ATTACHMENT_MAX_BYTES) return `« ${name} » : plus de 20 Mo.`;
  if (!attachmentKind(name, file.type)) {
    return `« ${name} » : format non lu (PDF, image, Word, Excel, CSV ou texte).`;
  }
  return null;
}

// Pages d'un PDF (relecture du 27/11) : le /Count de la racine de l'arbre des pages (le plus grand
// /Count près d'un « /Type /Pages »), y compris dans les flux d'objets compressés (/ObjStm, la règle
// chez LaTeX ou Acrobat) quand `inflate` est fourni ; sinon les objets « /Type /Page » ; sinon une
// estimation par la taille (100 Ko par page). Approximatif mais sûr pour une limite.
const latin1 = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);

export function pdfPageCount(
  bytes: Uint8Array,
  inflate?: (data: Uint8Array) => Uint8Array,
): number {
  const raw = latin1(bytes);
  const texts = [raw];
  if (inflate) {
    const streams = /\/Type\s*\/ObjStm[\s\S]*?stream\r?\n/g;
    for (let match = streams.exec(raw); match; match = streams.exec(raw)) {
      const start = match.index + match[0].length;
      const end = raw.indexOf("endstream", start);
      if (end < 0) break;
      try {
        texts.push(latin1(inflate(bytes.subarray(start, end))));
      } catch {
        // Flux illisible : ignoré.
      }
    }
  }
  let root = 0;
  for (const text of texts) {
    for (const node of text.matchAll(/\/Type\s*\/Pages(?![a-zA-Z])/g)) {
      const around = text.slice(Math.max(0, node.index - 400), node.index + 400);
      for (const count of around.matchAll(/\/Count\s+(\d+)/g))
        root = Math.max(root, Number(count[1]));
    }
  }
  if (root > 0) return root;
  const leaves = texts.reduce(
    (sum, text) => sum + (text.match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length,
    0,
  );
  return leaves > 0 ? leaves : Math.max(1, Math.ceil(bytes.length / (100 * 1024)));
}

export const textPages = (text: string): number =>
  Math.max(1, Math.ceil(text.length / TEXT_PAGE_CHARS));

// Un fichier prêt (préparé par le serveur) : sa copie Anthropic (PDF, image) ou son texte.
export type PreparedAttachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  pages: number;
  text: string | null;
  fileId: string | null;
};

export function pagesProblem(files: Pick<PreparedAttachment, "pages">[]): string | null {
  const total = files.reduce((sum, file) => sum + file.pages, 0);
  return total > PAGES_MAX
    ? `${total} pages en tout : ${PAGES_MAX} au plus par message. Découpe en plusieurs messages.`
    : null;
}

// Ce que Claude reçoit, juste avant la question (withAttachment). Jamais un identifiant venu du
// navigateur : fileId est lu en base, écrit par le serveur seul.
export function attachmentBlocksFor(files: PreparedAttachment[]): Anthropic.ContentBlockParam[] {
  return files.map((file): Anthropic.ContentBlockParam => {
    if (file.text !== null) {
      return {
        type: "document",
        source: { type: "text", media_type: "text/plain", data: file.text.trim() || "(vide)" },
        title: file.name,
      };
    }
    if (file.fileId && attachmentKind(file.name, file.mime) === "image") {
      return { type: "image", source: { type: "file", file_id: file.fileId } };
    }
    if (file.fileId) {
      return { type: "document", source: { type: "file", file_id: file.fileId }, title: file.name };
    }
    return { type: "text", text: `(Fichier joint non lu : « ${file.name} ».)` };
  });
}

// La ligne qui précède la question (l'assistant sait quels fichiers sont joints, pour « Ranger »).
export function attachmentsLine(files: AttachmentMeta[]): string {
  const parts = files.map(
    (file) => `${file.name} · ${file.type || "type inconnu"} · ${formatBytes(file.size)}`,
  );
  return files.length === 1
    ? `[Fichier joint : ${parts[0]}]`
    : `[Fichiers joints : ${parts.join(" ; ")}]`;
}

// « Ranger dans les Documents » / « Photo » : le fichier nommé par l'assistant (« fichier »), ou le
// seul joint.
export function pickAttachment<T extends AttachmentMeta>(
  files: T[],
  wanted: string | undefined,
): { ok: true; file: T } | { ok: false; error: string } {
  if (files.length === 0) {
    return {
      ok: false,
      error:
        "Aucun fichier joint : demande au coach de le joindre avec le bouton « Joindre », puis de redemander.",
    };
  }
  if (wanted) {
    const key = wanted.trim().toLowerCase();
    const file = files.find((item) => item.name.trim().toLowerCase() === key);
    // Un seul fichier joint : c'est lui, même si le nom donné diffère un peu.
    if (!file && files.length === 1) return { ok: true, file: files[0]! };
    return file
      ? { ok: true, file }
      : {
          ok: false,
          error: `Aucun fichier joint ne s'appelle « ${wanted} » (${files.map((f) => f.name).join(", ")}).`,
        };
  }
  if (files.length === 1) return { ok: true, file: files[0]! };
  return {
    ok: false,
    error: `Plusieurs fichiers joints : précise lequel avec « fichier » (${files.map((f) => f.name).join(", ")}).`,
  };
}
