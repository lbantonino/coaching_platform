import "server-only";

import { kindOfMime, type DocumentCategory, type DocumentKind } from "@/domain/documents/documents";
import { createClient } from "@/lib/supabase/server";

// Documents du coach (4e, D-60), pour une organisation DÉJÀ vérifiée (requireOrgAccess, requireCoach).
export type CoachDocument = {
  id: string;
  name: string;
  category: DocumentCategory;
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
  category: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  athlete: { id: string; first_name: string; display_name: string | null } | null;
};

const SELECT =
  "id, name, category, mime_type, size_bytes, created_at, updated_at, athlete:athlete_profiles ( id, first_name, display_name )";

const toDocument = (row: Row): CoachDocument => ({
  id: row.id,
  name: row.name,
  // Listes fermées garanties par les contraintes CHECK en base.
  category: row.category as DocumentCategory,
  kind: kindOfMime(row.mime_type),
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  athleteId: row.athlete?.id ?? null,
  athleteName: row.athlete ? (row.athlete.display_name ?? row.athlete.first_name) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Les plus récemment modifiés d'abord. Bornée : au-delà, la recherche globale prendra le relais.
export async function listDocuments(organizationId: string): Promise<CoachDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_documents")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("Lecture des documents impossible.");
  return ((data ?? []) as unknown as Row[]).map(toDocument);
}
