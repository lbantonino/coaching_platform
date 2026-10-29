import { z } from "zod";

// Documents du coach (4e, D-60) : règles PURES, testées par Vitest, répétées par la base (migration
// 20261028160000). On ne croit ni le type annoncé par le navigateur ni le nom du fichier seul : on
// lit les premiers octets (signature du format) ; Word et Excel sont des archives ZIP, distinguées
// par leur extension.
export const DOCUMENT_CATEGORIES = ["programme", "facture", "contrat", "bilan", "autre"] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  programme: "Programme",
  facture: "Facture",
  contrat: "Contrat",
  bilan: "Bilan",
  autre: "Autre",
};

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_NAME_MAX = 160;

export type DocumentKind = "pdf" | "image" | "word" | "excel";
export type DocumentFormat = { mime: string; ext: string; kind: DocumentKind };

const WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Ce que le sélecteur de fichier propose (le serveur revérifie de toute façon).
export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx";

export function kindOfMime(mime: string): DocumentKind {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime === WORD) return "word";
  return "excel";
}

export function detectDocumentFormat(bytes: Uint8Array, fileName: string): DocumentFormat | null {
  const starts = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (starts(0x25, 0x50, 0x44, 0x46)) return { mime: "application/pdf", ext: "pdf", kind: "pdf" };
  if (starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg", kind: "image" };
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { mime: "image/png", ext: "png", kind: "image" };
  }
  const webp = [0x57, 0x45, 0x42, 0x50];
  if (starts(0x52, 0x49, 0x46, 0x46) && webp.every((byte, i) => bytes[8 + i] === byte)) {
    return { mime: "image/webp", ext: "webp", kind: "image" };
  }
  // Archive ZIP (« PK\x03\x04 ») : un .docx ou un .xlsx, d'après son extension.
  if (starts(0x50, 0x4b, 0x03, 0x04)) {
    if (ext === "docx") return { mime: WORD, ext: "docx", kind: "word" };
    if (ext === "xlsx") return { mime: EXCEL, ext: "xlsx", kind: "excel" };
  }
  return null;
}

export type DocumentCheck = ({ ok: true } & DocumentFormat) | { ok: false; error: string };

export function checkDocument(bytes: Uint8Array, fileName: string): DocumentCheck {
  if (bytes.length === 0) return { ok: false, error: "Choisis un fichier." };
  if (bytes.length > DOCUMENT_MAX_BYTES) {
    return { ok: false, error: "Fichier trop lourd : 10 Mo maximum." };
  }
  const format = detectDocumentFormat(bytes, fileName);
  if (!format) {
    return {
      ok: false,
      error: "Format non accepté : PDF, image (JPEG, PNG, WebP), Word ou Excel.",
    };
  }
  return { ok: true, ...format };
}

// Nom proposé à partir du nom du fichier : sans l'extension, tirets et soulignés remplacés.
export function nameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ");
  return base.replace(/\s+/g, " ").trim().slice(0, DOCUMENT_NAME_MAX);
}

// Un document se sert uniquement depuis le dossier de son organisation (jamais un chemin libre).
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PATH = new RegExp(`^org/${UUID}/${UUID}\\.(pdf|jpg|png|webp|docx|xlsx)$`, "i");

export function isDocumentPath(path: string): boolean {
  return PATH.test(path);
}

export type DocumentFormValues = { name: string; category: string; athleteId: string };
export type DocumentInput = {
  name: string;
  category: DocumentCategory;
  athleteId: string | null;
};

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Donne un nom au document." })
    .max(DOCUMENT_NAME_MAX, { error: `Nom trop long (${DOCUMENT_NAME_MAX} caractères maximum).` }),
  category: z.enum(DOCUMENT_CATEGORIES, { error: "Choisis une catégorie." }),
  athleteId: z.union([z.literal(""), z.uuid({ error: "Sportif invalide." })]),
});

export function parseDocumentForm(
  values: DocumentFormValues,
): { ok: true; document: DocumentInput } | { ok: false; error: string } {
  const result = schema.safeParse(values);
  if (!result.success) return { ok: false, error: result.error.issues[0].message };
  return {
    ok: true,
    document: {
      name: result.data.name,
      category: result.data.category,
      athleteId: result.data.athleteId === "" ? null : result.data.athleteId,
    },
  };
}

// « 1,2 Mo », « 340 Ko » : la taille lisible d'un fichier.
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toLocaleString("fr-BE", { maximumFractionDigits: 1 })} Mo`;
}
