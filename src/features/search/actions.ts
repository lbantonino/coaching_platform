"use server";

import { searchPattern } from "@/domain/search/search";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Recherche globale du coach (4e, D-62, prompt §7 `/coach/recherche`) : sportifs, programmes,
// séances, documents et tâches de SON organisation, 6 résultats par groupe. Lecture seule ; l'accès
// est revérifié, la RLS protège en plus.
const LIMIT = 6;

export type SearchResults = {
  athletes: {
    id: string;
    name: string;
    status: string;
    photoPath: string | null;
    sex: string | null;
  }[];
  programs: { id: string; title: string; athleteId: string; athleteName: string; status: string }[];
  sessions: {
    id: string;
    title: string;
    kind: string;
    location: string | null;
    startsOn: string;
  }[];
  // Catégorie du coach (D-67) ; null = sans catégorie.
  documents: { id: string; name: string; category: string | null }[];
  tasks: {
    id: string;
    title: string;
    priority: "high" | "normal";
    dueOn: string | null;
    listId: string | null;
    athleteId: string | null;
    notes: string | null;
    done: boolean;
  }[];
};

const EMPTY: SearchResults = { athletes: [], programs: [], sessions: [], documents: [], tasks: [] };

type Person = { display_name: string | null; first_name: string } | null;
const personName = (person: Person) => (person ? (person.display_name ?? person.first_name) : "");

export async function searchCoory(organizationId: string, query: string): Promise<SearchResults> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const pattern = typeof query === "string" ? searchPattern(query) : null;
  if (!pattern) return EMPTY;

  const supabase = await createClient();
  const [athletes, programs, sessions, documents, tasks] = await Promise.all([
    supabase
      .from("athlete_profiles")
      .select("id, display_name, first_name, status, photo_path, sex")
      .eq("organization_id", orgId)
      .or(`display_name.ilike.${pattern},email.ilike.${pattern}`)
      .order("display_name")
      .limit(LIMIT),
    supabase
      .from("programs")
      .select(
        "id, title, status, athlete_id, athlete:athlete_profiles ( display_name, first_name )",
      )
      .eq("organization_id", orgId)
      .ilike("title", pattern)
      .order("start_date", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("coach_sessions")
      .select("id, title, kind, location, starts_on")
      .eq("organization_id", orgId)
      .or(`title.ilike.${pattern},location.ilike.${pattern}`)
      .order("starts_on", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("coach_documents")
      .select("id, name, category:document_categories ( name )")
      .eq("organization_id", orgId)
      .ilike("name", pattern)
      .order("updated_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("coach_tasks")
      .select("id, title, priority, due_on, list_id, athlete_id, notes, done_at")
      .eq("organization_id", orgId)
      .or(`title.ilike.${pattern},notes.ilike.${pattern}`)
      // Les tâches à faire d'abord.
      .order("done_at", { nullsFirst: true })
      .order("due_on", { nullsFirst: false })
      .limit(LIMIT),
  ]);
  if (athletes.error || programs.error || sessions.error || documents.error || tasks.error) {
    throw new Error("Recherche impossible.");
  }

  return {
    athletes: (athletes.data ?? []).map((row) => ({
      id: row.id,
      name: row.display_name ?? row.first_name,
      status: row.status,
      photoPath: row.photo_path,
      sex: row.sex,
    })),
    programs: (programs.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      athleteId: row.athlete_id,
      athleteName: personName(row.athlete as unknown as Person),
    })),
    sessions: (sessions.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      kind: row.kind,
      location: row.location,
      startsOn: row.starts_on,
    })),
    documents: (documents.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      category: (row.category as { name: string } | null)?.name ?? null,
    })),
    tasks: (tasks.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      // Listes fermées garanties par les contraintes CHECK en base.
      priority: row.priority as "high" | "normal",
      dueOn: row.due_on,
      listId: row.list_id,
      athleteId: row.athlete_id,
      notes: row.notes,
      done: row.done_at !== null,
    })),
  };
}
