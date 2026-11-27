"use server";

import { z } from "zod";

import { requireOrgAccess } from "@/features/auth/guards";
import { isDemoAccount } from "@/features/demo/queries";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import {
  CONVERSATION_ERRORS,
  conversationTitle,
  conversationTooLarge,
  expiresOn,
  restoreMessages,
  saveConversationSchema,
  visibleCount,
  type AssistantMessage,
  type ConversationError,
} from "./conversation-rules";

// Conversations de l'Assistant IA enregistrées (D-212, 27/11/2026). Liées à l'organisation comme
// askAssistant (layout coach) ; chaque action revérifie l'accès, puis la RLS ne laisse voir et
// écrire au coach QUE ses conversations. Aucun appel à Claude ici. Ouvertes même quand l'assistant
// est verrouillé (pas d'abonnement) : lire, télécharger et supprimer restent possibles.

export type SaveConversationResult =
  { ok: true; version: number } | { ok: false; kind: ConversationError; error: string };

export type ConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string;
  expiresOn: string;
};

export type StoredConversation = { id: string; version: number; messages: AssistantMessage[] };

const fail = (kind: ConversationError): SaveConversationResult => ({
  ok: false,
  kind,
  error: CONVERSATION_ERRORS[kind],
});

const idSchema = z.uuid();

// Enregistre la conversation telle que le coach la voit : création (version 0) ou mise à jour depuis
// la DERNIÈRE version. Refusée sinon : « conflict » (plus récente ailleurs : le navigateur la recharge)
// ou « gone » (supprimée : elle ne revient pas).
export async function saveConversation(
  organizationId: string,
  input: unknown,
): Promise<SaveConversationResult> {
  const { membership } = await requireOrgAccess(organizationId);
  const parsed = saveConversationSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const { id, version } = parsed.data;
  const messages = parsed.data.messages as AssistantMessage[];
  if (conversationTooLarge(messages)) return fail("too-large");
  const supabase = await createClient();
  if (await isDemoAccount(supabase)) return fail("demo");
  const { data, error } = await supabase.rpc("save_assistant_conversation", {
    p_id: id,
    p_organization_id: membership.organizationId,
    p_version: version,
    p_title: conversationTitle(messages),
    p_messages: messages as unknown as Json,
    p_message_count: visibleCount(messages),
  });
  if (error) return fail("invalid");
  if (typeof data === "number") return { ok: true, version: data };
  const { data: row } = await supabase
    .from("assistant_conversations")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  return fail(row ? "conflict" : "gone");
}

// L'historique : les conversations du coach, la plus récente d'abord.
export async function listConversations(organizationId: string): Promise<ConversationSummary[]> {
  const { membership } = await requireOrgAccess(organizationId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("assistant_conversations")
    .select("id, title, last_message_at")
    .eq("organization_id", membership.organizationId)
    .order("last_message_at", { ascending: false })
    .limit(500);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    lastMessageAt: row.last_message_at,
    expiresOn: expiresOn(row.last_message_at),
  }));
}

// Rouvrir : la conversation et sa version (une carte restée « en cours » devient un échec).
export async function loadConversation(
  organizationId: string,
  conversationId: unknown,
): Promise<StoredConversation | null> {
  const { membership } = await requireOrgAccess(organizationId);
  const id = idSchema.safeParse(conversationId);
  if (!id.success) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("assistant_conversations")
    .select("id, version, messages")
    .eq("organization_id", membership.organizationId)
    .eq("id", id.data)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    version: data.version,
    messages: restoreMessages(data.messages as unknown as AssistantMessage[]),
  };
}

export async function deleteConversation(
  organizationId: string,
  conversationId: unknown,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  const id = idSchema.safeParse(conversationId);
  if (!id.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("assistant_conversations")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", id.data);
  return { ok: !error };
}
