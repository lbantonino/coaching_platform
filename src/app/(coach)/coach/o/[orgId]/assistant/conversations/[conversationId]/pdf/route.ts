import type { NextRequest } from "next/server";
import { z } from "zod";

import { conversationPdf } from "@/features/assistant/conversation-pdf-model";
import { renderConversationPdf } from "@/features/assistant/conversation-pdf";
import { restoreMessages, type AssistantMessage } from "@/features/assistant/conversation-rules";
import { requireOrgAccess } from "@/features/auth/guards";
import { getCoachProfile } from "@/features/coach/profile";
import { pdfResponse } from "@/features/programs/pdf/pdf-response";
import { createClient } from "@/lib/supabase/server";

// PDF d'une conversation de l'Assistant IA (D-212, 27/11/2026), à tout moment, même quand
// l'assistant est verrouillé. Session du coach : organisation vérifiée ici, puis la RLS ne lui laisse
// voir QUE ses conversations. Inconnue, d'un autre coach ou identifiant invalide : 404, sans rien
// révéler. Jamais mis en cache (pdfResponse).
export async function GET(
  request: NextRequest,
  context: RouteContext<"/coach/o/[orgId]/assistant/conversations/[conversationId]/pdf">,
) {
  const { orgId, conversationId } = await context.params;
  const { user, membership } = await requireOrgAccess(orgId);
  const id = z.uuid().safeParse(conversationId);
  if (!id.success) return new Response(null, { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase
    .from("assistant_conversations")
    .select("title, created_at, last_message_at, messages")
    .eq("organization_id", membership.organizationId)
    .eq("id", id.data)
    .maybeSingle();
  if (!data) return new Response(null, { status: 404 });
  const coach = await getCoachProfile(user);
  const model = conversationPdf(
    {
      title: data.title,
      createdAt: data.created_at,
      lastMessageAt: data.last_message_at,
      messages: restoreMessages(data.messages as unknown as AssistantMessage[]),
    },
    coach.displayName,
  );
  const pdf = await renderConversationPdf(model);
  return pdfResponse(pdf, model.fileName, request.nextUrl.searchParams.has("telecharger"));
}
