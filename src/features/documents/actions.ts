"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  checkDocument,
  DOCUMENT_MAX_BYTES,
  parseDocumentForm,
  type DocumentFormValues,
} from "@/domain/documents/documents";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Documents du coach (4e, D-60) : importer, renommer / reclasser, supprimer. Chaque action revérifie
// l'accès à l'organisation ; la RLS de la table ET du stockage protège en plus.
const BUCKET = "coach-documents";

export type DocumentFormState = {
  error: string | null;
  attempt: number;
  values: DocumentFormValues | null;
  saved: boolean;
};

type Client = Awaited<ReturnType<typeof createClient>>;

const readValues = (formData: FormData): DocumentFormValues => ({
  name: String(formData.get("name") ?? ""),
  category: String(formData.get("category") ?? ""),
  athleteId: String(formData.get("athleteId") ?? ""),
});

async function athleteInOrg(supabase: Client, orgId: string, athleteId: string | null) {
  if (!athleteId) return true;
  const { data } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("id", athleteId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

function revalidateDocuments() {
  revalidatePath("/coach/documents");
}

export async function uploadDocument(
  organizationId: string,
  previous: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const values = readValues(formData);
  const fail = (error: string): DocumentFormState => ({
    error,
    attempt: previous.attempt + 1,
    values,
    saved: false,
  });

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Choisis un fichier.");
  // Refus avant lecture : on ne charge pas en mémoire un fichier déjà trop lourd.
  if (file.size > DOCUMENT_MAX_BYTES) return fail("Fichier trop lourd : 10 Mo maximum.");
  const parsed = parseDocumentForm(values);
  if (!parsed.ok) return fail(parsed.error);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkDocument(bytes, file.name);
  if (!check.ok) return fail(check.error);

  const supabase = await createClient();
  if (!(await athleteInOrg(supabase, orgId, parsed.document.athleteId))) {
    return fail("Sportif introuvable.");
  }
  // Nom de fichier tiré au hasard : jamais le nom envoyé par le navigateur dans le chemin.
  const path = `org/${orgId}/${crypto.randomUUID()}.${check.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: check.mime, upsert: false });
  if (uploadError) return fail("Le fichier n'a pas pu être envoyé. Réessaie.");

  const { error } = await supabase.from("coach_documents").insert({
    organization_id: orgId,
    athlete_id: parsed.document.athleteId,
    name: parsed.document.name,
    category: parsed.document.category,
    storage_path: path,
    mime_type: check.mime,
    size_bytes: bytes.length,
    created_by: user.id,
  });
  if (error) {
    // Pas de fichier orphelin : on retire ce qui vient d'être déposé.
    await supabase.storage.from(BUCKET).remove([path]);
    return fail("Le document n'a pas pu être enregistré. Réessaie.");
  }

  revalidateDocuments();
  return { error: null, attempt: previous.attempt + 1, values: null, saved: true };
}

export async function updateDocument(
  organizationId: string,
  documentId: string,
  previous: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const values = readValues(formData);
  const fail = (error: string): DocumentFormState => ({
    error,
    attempt: previous.attempt + 1,
    values,
    saved: false,
  });
  if (!z.uuid().safeParse(documentId).success) return fail("Document introuvable.");
  const parsed = parseDocumentForm(values);
  if (!parsed.ok) return fail(parsed.error);

  const supabase = await createClient();
  if (!(await athleteInOrg(supabase, orgId, parsed.document.athleteId))) {
    return fail("Sportif introuvable.");
  }
  const { data, error } = await supabase
    .from("coach_documents")
    .update({
      name: parsed.document.name,
      category: parsed.document.category,
      athlete_id: parsed.document.athleteId,
    })
    .eq("id", documentId)
    .eq("organization_id", orgId)
    .select("id");
  if (error) return fail("Le document n'a pas pu être enregistré. Réessaie.");
  if (!data?.length) return fail("Document introuvable : il a peut-être été supprimé.");

  revalidateDocuments();
  return { error: null, attempt: previous.attempt + 1, values: null, saved: true };
}

export async function deleteDocument(
  organizationId: string,
  documentId: string,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(documentId).success) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_documents")
    .delete()
    .eq("id", documentId)
    .eq("organization_id", membership.organizationId)
    .select("storage_path");
  if (error || !data?.length) return { ok: false };
  // Le document a disparu de la liste ; on retire aussi son fichier du stockage.
  await supabase.storage.from(BUCKET).remove([data[0].storage_path]);
  revalidateDocuments();
  return { ok: true };
}
