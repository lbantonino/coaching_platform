import "server-only";

import { kindOfMime, type DocumentCategory, type DocumentKind } from "@/domain/documents/documents";
import { createClient } from "@/lib/supabase/server";

// Documents du coach (4e, D-60), pour une organisation DÉJÀ vérifiée (requireOrgAccess, requireCoach).
export type CoachDocument = {
  id: string;
  name: string;
  // Catégorie du coach (D-67) ; null = sans catégorie.
  categoryId: string | null;
  categoryName: string | null;
  kind: DocumentKind;
  mimeType: string;
  sizeBytes: number;
  athleteId: string | null;
  athleteName: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  name: string;
  category: { id: string; name: string } | null;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  athlete: { id: string; first_name: string; display_name: string | null } | null;
};

const SELECT =
  "id, name, category:document_categories ( id, name ), mime_type, size_bytes, created_at, updated_at, athlete:athlete_profiles ( id, first_name, display_name )";

const toDocument = (row: Row): CoachDocument => ({
  id: row.id,
  name: row.name,
  categoryId: row.category?.id ?? null,
  categoryName: row.category?.name ?? null,
  kind: kindOfMime(row.mime_type),
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  athleteId: row.athlete?.id ?? null,
  athleteName: row.athlete ? (row.athlete.display_name ?? row.athlete.first_name) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Les plus récemment modifiés d'abord. Bornée : au-delà, la recherche globale prendra le relais.
// `athleteId` : seulement les documents de ce sportif (onglet Documents de sa fiche, D-67).
export async function listDocuments(
  organizationId: string,
  athleteId?: string,
): Promise<CoachDocument[]> {
  const supabase = await createClient();
  let query = supabase
    .from("coach_documents")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (athleteId) query = query.eq("athlete_id", athleteId);
  const { data, error } = await query;
  if (error) throw new Error("Lecture des documents impossible.");
  return ((data ?? []) as unknown as Row[]).map(toDocument);
}

// Catégories de l'organisation (D-67), par ordre alphabétique.
export async function listDocumentCategories(organizationId: string): Promise<DocumentCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_categories")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) throw new Error("Lecture des catégories impossible.");
  return (data ?? []).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
