import "server-only";

import type Anthropic from "@anthropic-ai/sdk";

import type { ToolOutcome } from "./loop";
import type { AssistantProposal } from "./proposals";
import type { AssistantAttachment } from "./rules";
import { READ_TOOL_NAMES, READ_TOOLS } from "./tools/definitions";
import { runReadTool, type ReadToolName } from "./tools/read";
import { proposeAction, WRITE_TOOL_NAMES, WRITE_TOOLS } from "./tools/write";

// Outils de l'Assistant IA (lot 1 des actions) : la liste donnée à Claude et leur exécution, liée à
// l'organisation du coach (jamais d'organisation venant de Claude ni du navigateur). Lecture :
// exécutée tout de suite ; écriture (tâche 4) : une proposition, jamais exécutée ici.
export function assistantTools(): Anthropic.Tool[] {
  return [...READ_TOOLS, ...WRITE_TOOLS];
}

export async function runAssistantTool(
  organizationId: string,
  name: string,
  input: unknown,
  pending: AssistantProposal[] = [],
  userId = "",
  attachment?: AssistantAttachment,
): Promise<ToolOutcome> {
  if (READ_TOOL_NAMES.has(name)) {
    try {
      const result = await runReadTool(organizationId, name as ReadToolName, input, userId);
      return result.ok
        ? { type: "result", content: result.content }
        : { type: "error", content: result.content };
    } catch {
      return { type: "error", content: "Lecture impossible pour le moment." };
    }
  }
  if (WRITE_TOOL_NAMES.has(name)) {
    try {
      const result = await proposeAction(organizationId, name, input, pending, { attachment });
      return result.ok
        ? { type: "proposal", proposal: result.proposal }
        : { type: "error", content: result.error };
    } catch {
      return { type: "error", content: "Proposition impossible pour le moment." };
    }
  }
  return { type: "error", content: `Outil inconnu : ${name}` };
}
