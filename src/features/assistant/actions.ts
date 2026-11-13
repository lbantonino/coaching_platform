"use server";

import type Anthropic from "@anthropic-ai/sdk";
import AnthropicSdk from "@anthropic-ai/sdk";

import { requireOrgAccess } from "@/features/auth/guards";
import { getCoachProfile } from "@/features/coach/profile";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { runAssistantStep, type StepResult } from "./loop";
import { getAssistantModel } from "./model";
import { remainingThisMonth } from "./queries";
import {
  ASSISTANT_ERRORS,
  ASSISTANT_MODEL,
  askAssistantSchema,
  reserveErrorKind,
  toApiMessages,
  type AssistantErrorKind,
} from "./rules";
import { assistantTools, runAssistantTool } from "./toolbox";

export type AskAssistantResult =
  | { ok: true; step: StepResult; usageId: string; remaining: number }
  | { ok: false; kind: AssistantErrorKind; error: string; remaining: number | null };

const fail = (kind: AssistantErrorKind, remaining: number | null = null): AskAssistantResult => ({
  ok: false,
  kind,
  error: ASSISTANT_ERRORS[kind],
  remaining,
});

// UNE étape d'une demande à l'Assistant IA (D-168, lot 1 des actions). Ordre voulu : accès à
// l'organisation, saisie valide, modèle présent, puis la base RÉSERVE la demande (« start » :
// abonnement Coory et 100 par mois) ou la POURSUIT (« next » : même coach, 6 étapes et 5 minutes au
// plus) AVANT tout appel à Claude. Une étape = un appel au modèle ; les outils de lecture sont
// exécutés ici, les outils d'écriture deviennent des cartes que le coach valide (rien n'est exécuté
// sans son clic). La clé reste sur le serveur ; rien du contenu n'est enregistré, seulement les
// étapes et les jetons.
export async function askAssistant(
  organizationId: string,
  input: unknown,
): Promise<AskAssistantResult> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const parsed = askAssistantSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const supabase = await createClient();
  const orgId = membership.organizationId;

  const model = getAssistantModel();
  if (!model) {
    const { data: allowed } = await supabase.rpc("assistant_access_allowed", {
      p_organization_id: orgId,
    });
    return fail(allowed === true ? "unconfigured" : "locked");
  }

  let usageId: string;
  let messages: Anthropic.MessageParam[];
  if ("start" in parsed.data) {
    const { data, error } = await supabase.rpc("reserve_assistant_use", {
      p_organization_id: orgId,
    });
    if (error || !data) {
      const kind = reserveErrorKind(error?.message);
      return fail(kind, kind === "quota" ? 0 : null);
    }
    usageId = data;
    messages = toApiMessages(parsed.data.start);
  } else {
    // La réservation doit être celle de CETTE organisation (relecture n°5).
    const { error } = await supabase.rpc("continue_assistant_use", {
      p_id: parsed.data.next.usageId,
      p_organization_id: orgId,
    });
    if (error) return fail(reserveErrorKind(error.message));
    usageId = parsed.data.next.usageId;
    messages = parsed.data.next.messages as Anthropic.MessageParam[];
  }

  const finish = (status: "step" | "done" | "failed", tokens = { input: 0, output: 0 }) =>
    supabase.rpc("finish_assistant_use", {
      p_id: usageId,
      p_status: status,
      p_model: ASSISTANT_MODEL,
      p_input_tokens: tokens.input,
      p_output_tokens: tokens.output,
    });

  const profile = await getCoachProfile(user);
  try {
    const step = await runAssistantStep(
      {
        firstName: profile.firstName ?? "",
        todayIso: todayIsoInBrussels(),
        model,
        runTool: (name, toolInput, pending) =>
          runAssistantTool(orgId, name, toolInput, pending, user.id),
      },
      messages,
      assistantTools(),
    );
    await finish(
      step.kind === "continue" ? "step" : step.kind === "error" ? "failed" : "done",
      step.usage,
    );
    const remaining = await remainingThisMonth(supabase);
    if (step.kind === "error") return fail(step.error, remaining);
    return { ok: true, step, usageId, remaining };
  } catch (error) {
    await finish("failed");
    const remaining = await remainingThisMonth(supabase);
    if (error instanceof AnthropicSdk.RateLimitError) return fail("busy", remaining);
    // Le détail reste dans les journaux du serveur (clé refusée, service surchargé…), jamais à l'écran.
    console.error(
      "Assistant IA : étape échouée",
      error instanceof AnthropicSdk.APIError ? `(${error.status ?? "réseau"})` : error,
    );
    return fail("unavailable", remaining);
  }
}
