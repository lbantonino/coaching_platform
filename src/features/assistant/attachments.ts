"use server";

import { z } from "zod";

import { requireOrgAccess } from "@/features/auth/guards";
import { isDemoAccount } from "@/features/demo/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  ATTACHMENTS_MAX,
  ATTACHMENT_MAX_BYTES,
  IMAGE_MAX_BYTES,
  TEXT_MAX_CHARS,
  attachmentKind,
  attachmentProblem,
  pdfPageCount,
  textPages,
} from "./attachment-rules";
import { removeStored } from "./attachments-store";
import { docxText, xlsxText } from "./file-text";
import { getAnthropicFiles } from "./model";
import { inflateSync } from "node:zlib";

// Fichiers joints à l'Assistant IA (D-213, 27/11/2026). Le navigateur ne fait jamais passer un
// fichier par Vercel (4,5 Mo au plus) : le serveur RÉSERVE la place en base (300 Mo par coach sur
// 24 h, verrou par coach, chemin fixé par la base), signe une adresse de dépôt avec la clé de service,
// le navigateur y dépose le fichier, puis demande sa préparation (un appel par fichier, jamais dans
// une étape de la demande : aucune fonction ne dépasse 300 s). Les champs préparés (identifiant
// Anthropic, texte) sont écrits par le serveur seul. Relecture du 27/11 : taille réelle vérifiée,
// retraits sans fichier oublié dans le stockage.

const BUCKET = "assistant-files";
const DEMO = "Désactivé sur le compte de démonstration.";
const FULL =
  "Plus de place : 300 Mo de fichiers au plus sur 24 h. Retire des fichiers ou réessaie demain.";

type Ticket = { ok: true; id: string; uploadUrl: string } | { ok: false; error: string };
type Prepared = { ok: true; pages: number } | { ok: false; error: string };

const metaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().max(120),
  size: z.number().int().min(1).max(ATTACHMENT_MAX_BYTES),
});

// 1. Une adresse de dépôt pour un fichier.
export async function requestAttachmentUpload(
  organizationId: string,
  input: unknown,
): Promise<Ticket> {
  const { membership } = await requireOrgAccess(organizationId);
  const parsed = metaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Fichier refusé." };
  const problem = attachmentProblem(parsed.data, 0);
  if (problem) return { ok: false, error: problem };
  const supabase = await createClient();
  if (await isDemoAccount(supabase)) return { ok: false, error: DEMO };
  const { data, error } = await supabase.rpc("reserve_assistant_file", {
    p_organization_id: membership.organizationId,
    p_name: parsed.data.name,
    p_mime: parsed.data.type,
    p_size: parsed.data.size,
  });
  const row = data?.[0];
  if (error || !row) {
    return {
      ok: false,
      error:
        error?.message === "place_epuisee" ? FULL : "Le fichier n'a pas pu être préparé. Réessaie.",
    };
  }
  const admin = createAdminClient();
  const { data: signed } = await admin.storage.from(BUCKET).createSignedUploadUrl(row.storage_path);
  if (!signed) {
    await admin.from("assistant_files").delete().eq("id", row.id);
    return { ok: false, error: "Le fichier n'a pas pu être préparé. Réessaie." };
  }
  return { ok: true, id: row.id, uploadUrl: signed.signedUrl };
}

const startsWith = (bytes: Uint8Array, ...prefix: number[]) =>
  prefix.every((value, index) => bytes[index] === value);

// Type réel d'une image d'après ses premiers octets (le navigateur l'a réduite en JPEG d'habitude).
function imageMime(bytes: Uint8Array): string | null {
  if (startsWith(bytes, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(bytes, 0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (startsWith(bytes, 0x47, 0x49, 0x46)) return "image/gif";
  if (
    startsWith(bytes, 0x52, 0x49, 0x46, 0x46) &&
    startsWith(bytes.subarray(8), 0x57, 0x45, 0x42, 0x50)
  )
    return "image/webp";
  return null;
}

// Texte brut : UTF-16 (« texte Unicode » d'Excel) reconnu par son en-tête ; jamais de caractère nul
// (la base le refuse).
function plainText(buffer: Buffer): string {
  const text =
    buffer[0] === 0xff && buffer[1] === 0xfe
      ? buffer.subarray(2).toString("utf16le")
      : buffer[0] === 0xfe && buffer[1] === 0xff
        ? Buffer.from(buffer.subarray(2)).swap16().toString("utf16le")
        : buffer.toString("utf8");
  return text.replace(/\u0000/g, "");
}

// 2. Préparer un fichier déposé : PDF et image envoyés une fois à Anthropic (copie d'1 h), Word,
// Excel et texte lus en texte. Refaite quand la copie vieillit (le navigateur le demande).
export async function prepareAttachment(
  organizationId: string,
  fileId: unknown,
): Promise<Prepared> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const id = z.uuid().safeParse(fileId);
  if (!id.success) return { ok: false, error: "Fichier introuvable." };
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("assistant_files")
    .select("id, storage_path, name, mime_type, size_bytes, anthropic_file_id")
    .eq("organization_id", membership.organizationId)
    .eq("id", id.data)
    .maybeSingle();
  if (!row) return { ok: false, error: "Fichier introuvable : joins-le à nouveau." };
  const { data: blob } = await supabase.storage.from(BUCKET).download(row.storage_path);
  if (!blob) return { ok: false, error: `« ${row.name} » n'est pas arrivé : joins-le à nouveau.` };
  // La taille réservée fait foi (la place se compte sur elle) : un fichier plus gros est refusé.
  if (blob.size > row.size_bytes || blob.size > ATTACHMENT_MAX_BYTES) {
    await removeStored([row]);
    return {
      ok: false,
      error: `« ${row.name} » ne correspond pas au fichier annoncé : joins-le à nouveau.`,
    };
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const kind = attachmentKind(row.name, row.mime_type);
  const files = getAnthropicFiles();
  const unreadable = { ok: false as const, error: `« ${row.name} » semble abîmé ou protégé.` };
  // Copie Anthropic datée du DÉBUT de l'envoi : son heure d'expiration n'est jamais sous-estimée.
  const startedAt = new Date().toISOString();

  let prepared: { pages: number; text_content: string | null; anthropic_file_id: string | null };
  try {
    if (kind === "pdf" || kind === "image") {
      const mime = kind === "pdf" ? "application/pdf" : imageMime(bytes);
      if (kind === "pdf" && !startsWith(bytes, 0x25, 0x50, 0x44, 0x46)) return unreadable;
      if (!mime) {
        return { ok: false, error: `« ${row.name} » : image non lue (JPEG, PNG, GIF ou WebP).` };
      }
      // Claude refuse une image de plus de 5 Mo (le navigateur la réduit d'habitude).
      if (kind === "image" && bytes.length > IMAGE_MAX_BYTES) {
        return { ok: false, error: `« ${row.name} » : image trop lourde (5 Mo au plus).` };
      }
      if (!files)
        return { ok: false, error: "L'assistant n'est pas branché pour lire ce fichier." };
      prepared = {
        pages: kind === "pdf" ? pdfPageCount(bytes, (data) => inflateSync(data)) : 1,
        text_content: null,
        anthropic_file_id: await files.upload({ bytes, name: row.name, mime }),
      };
    } else if (kind) {
      const buffer = Buffer.from(bytes);
      const text = (
        kind === "word" ? docxText(buffer) : kind === "excel" ? xlsxText(buffer) : plainText(buffer)
      )
        .replace(/\u0000/g, "")
        .slice(0, TEXT_MAX_CHARS);
      prepared = { pages: textPages(text), text_content: text, anthropic_file_id: null };
    } else {
      return { ok: false, error: `« ${row.name} » : format non lu.` };
    }
  } catch {
    return kind === "word" || kind === "excel"
      ? unreadable
      : { ok: false, error: `« ${row.name} » n'a pas pu être envoyé à l'assistant. Réessaie.` };
  }
  // Champs préparés : écrits par le serveur seul, sur le fichier de CE coach.
  const admin = createAdminClient();
  const { data: saved } = await admin
    .from("assistant_files")
    .update({ ...prepared, prepared_at: startedAt })
    .eq("id", row.id)
    .eq("user_id", user.id)
    .select("id");
  // Retiré pendant la préparation : la nouvelle copie Anthropic est effacée aussitôt.
  if (!saved || saved.length === 0) {
    if (prepared.anthropic_file_id && files) void files.remove(prepared.anthropic_file_id);
    return { ok: false, error: `« ${row.name} » a été retiré.` };
  }
  // L'ancienne copie (préparation refaite) est effacée sans attendre.
  if (row.anthropic_file_id && files) void files.remove(row.anthropic_file_id);
  return { ok: true, pages: prepared.pages };
}

// 3. Retirer des fichiers (pastille ×, nouvelle conversation) : copie Anthropic, stockage, ligne.
export async function removeAttachments(
  organizationId: string,
  fileIds: unknown,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  const ids = z
    .array(z.uuid())
    .max(ATTACHMENTS_MAX * 2)
    .safeParse(fileIds);
  if (!ids.success || ids.data.length === 0) return { ok: ids.success };
  const supabase = await createClient();
  // Seulement les fichiers de CE coach (RLS), relus en base.
  const { data: rows } = await supabase
    .from("assistant_files")
    .select("id, storage_path, anthropic_file_id, prepared_at")
    .eq("organization_id", membership.organizationId)
    .in("id", ids.data);
  if (!rows || rows.length === 0) return { ok: true };
  return { ok: await removeStored(rows) };
}
