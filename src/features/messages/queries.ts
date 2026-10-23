import "server-only";

import type { Sex } from "@/features/athletes/schemas";
import { createClient } from "@/lib/supabase/server";

export type MessagePerson = {
  id: string;
  name: string;
  photoPath: string | null;
  sex: Sex | null;
};

// Une conversation = le fil d'un sportif : son dernier message et le nombre de messages non lus reçus.
export type Conversation = {
  athlete: MessagePerson;
  lastBody: string;
  lastAt: string;
  lastFromCoach: boolean;
  unread: number;
};

export type ThreadMessage = {
  id: string;
  fromCoach: boolean;
  body: string;
  createdAt: string;
};

type Profile = {
  id: string;
  first_name: string;
  display_name: string | null;
  photo_path: string | null;
  sex: string | null;
};
type Row = {
  id: string;
  sender: string;
  body: string;
  created_at: string;
  read_at: string | null;
  athlete: Profile | null;
};

const PROFILE = "athlete:athlete_profiles ( id, first_name, display_name, photo_path, sex )";
const SELECT = `id, sender, body, created_at, read_at, ${PROFILE}`;

const toPerson = (profile: Profile): MessagePerson => ({
  id: profile.id,
  name: profile.display_name ?? profile.first_name,
  photoPath: profile.photo_path,
  // La contrainte CHECK en base garantit cette liste fermée.
  sex: profile.sex as Sex | null,
});

// Regroupe des messages (les plus récents d'abord) en conversations, une par sportif.
function toConversations(rows: Row[]): Conversation[] {
  const byAthlete = new Map<string, Conversation>();
  for (const row of rows) {
    if (!row.athlete) continue;
    let conversation = byAthlete.get(row.athlete.id);
    if (!conversation) {
      conversation = {
        athlete: toPerson(row.athlete),
        lastBody: row.body,
        lastAt: row.created_at,
        lastFromCoach: row.sender === "coach",
        unread: 0,
      };
      byAthlete.set(row.athlete.id, conversation);
    }
    if (row.sender === "athlete" && row.read_at === null) conversation.unread += 1;
  }
  return [...byAthlete.values()];
}

// Carte Messages du tableau de bord, pour une organisation DÉJÀ vérifiée (requireOrgAccess) : le nombre
// de messages reçus non lus et les `limit` conversations qui en ont, les plus récentes d'abord.
export async function getDashboardMessages(
  organizationId: string,
  limit = 3,
): Promise<{ unreadCount: number; items: Conversation[] }> {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("athlete_messages")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .eq("sender", "athlete")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Lecture des messages impossible.");
  return {
    unreadCount: count ?? 0,
    items: toConversations((data ?? []) as unknown as Row[]).slice(0, limit),
  };
}

// Page Messages : les conversations de l'organisation, la plus récente d'abord. Calculées sur les
// derniers messages (bornés) : suffisant tant qu'il n'y a pas de table de conversations.
export async function listConversations(organizationId: string): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_messages")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("Lecture des conversations impossible.");
  return toConversations((data ?? []) as unknown as Row[]);
}

// Fil d'un sportif de l'organisation, du plus ancien au plus récent (les 200 derniers messages).
export async function getThread(
  organizationId: string,
  athleteId: string,
): Promise<ThreadMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_messages")
    .select("id, sender, body, created_at")
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Lecture de la conversation impossible.");
  return (data ?? [])
    .map((row) => ({
      id: row.id,
      fromCoach: row.sender === "coach",
      body: row.body,
      createdAt: row.created_at,
    }))
    .reverse();
}
