"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  checkDocument,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MAX_LABEL,
  isCategoryColor,
  nextCategoryColor,
  parseCategoryName,
  parseDocumentForm,
  type DocumentFormValues,
} from "@/domain/documents/documents";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Documents du coach (4e, D-60) : importer, renommer / reclasser, supprimer ; et leurs catégories
// (D-67) : créer, renommer, supprimer. Chaque action revérifie l'accès à l'organisation ; la RLS de
// la table ET du stockage protège en plus (une catégorie d'une autre organisation est refusée par
// la clé étrangère composée).
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
  categoryId: String(formData.get("categoryId") ?? ""),
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
  // Onglet Documents de la fiche sportif (D-67).
  revalidatePath("/coach/o", "layout");
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
  if (file.size > DOCUMENT_MAX_BYTES)
    return fail(`Fichier trop lourd : ${DOCUMENT_MAX_LABEL} maximum.`);
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
    category_id: parsed.document.categoryId,
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
      category_id: parsed.document.categoryId,
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

// --- Catégories (D-67) --------------------------------------------------------------------------
export type CategoryResult = { ok: boolean; error: string | null };

const duplicate = "Une catégorie porte déjà ce nom.";

export async function createDocumentCategory(
  organizationId: string,
  rawName: string,
): Promise<CategoryResult> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const parsed = parseCategoryName(String(rawName ?? ""));
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("document_categories")
    .select("color")
    .eq("organization_id", membership.organizationId);
  const { error } = await supabase.from("document_categories").insert({
    organization_id: membership.organizationId,
    name: parsed.name,
    color: nextCategoryColor((existing ?? []).map((row) => row.color)),
    created_by: user.id,
  });
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? duplicate : "La catégorie n'a pas pu être créée.",
    };
  }
  revalidateDocuments();
  return { ok: true, error: null };
}

export async function renameDocumentCategory(
  organizationId: string,
  categoryId: string,
  rawName: string,
): Promise<CategoryResult> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(categoryId).success)
    return { ok: false, error: "Catégorie introuvable." };
  const parsed = parseCategoryName(String(rawName ?? ""));
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_categories")
    .update({ name: parsed.name })
    .eq("id", categoryId)
    .eq("organization_id", membership.organizationId)
    .select("id");
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? duplicate : "La catégorie n'a pas pu être renommée.",
    };
  }
  if (!data?.length) return { ok: false, error: "Catégorie introuvable." };
  revalidateDocuments();
  return { ok: true, error: null };
}

// Couleur d'une catégorie (D-68) : l'icône de ses documents la prend.
export async function setDocumentCategoryColor(
  organizationId: string,
  categoryId: string,
  color: string,
): Promise<CategoryResult> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(categoryId).success)
    return { ok: false, error: "Catégorie introuvable." };
  if (!isCategoryColor(color)) return { ok: false, error: "Couleur invalide." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_categories")
    .update({ color })
    .eq("id", categoryId)
    .eq("organization_id", membership.organizationId)
    .select("id");
  if (error || !data?.length) {
    return { ok: false, error: "La couleur n'a pas pu être changée." };
  }
  revalidateDocuments();
  return { ok: true, error: null };
}

// Supprimer une catégorie : ses documents restent, « sans catégorie » (clé étrangère SET NULL).
export async function deleteDocumentCategory(
  organizationId: string,
  categoryId: string,
): Promise<CategoryResult> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(categoryId).success)
    return { ok: false, error: "Catégorie introuvable." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_categories")
    .delete()
    .eq("id", categoryId)
    .eq("organization_id", membership.organizationId)
    .select("id");
  if (error || !data?.length) {
    return { ok: false, error: "La catégorie n'a pas pu être supprimée." };
  }
  revalidateDocuments();
  return { ok: true, error: null };
}
