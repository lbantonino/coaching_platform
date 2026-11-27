import type Anthropic from "@anthropic-ai/sdk";

import { withAttachment } from "./attachment-content";
import type { AssistantModel } from "./model";
import { summaryForClaude, type AssistantProposal } from "./proposals";
import { systemPrompt, type AssistantErrorKind } from "./rules";

// UNE étape d'une demande à l'Assistant IA (lot 1 des actions, spec §5.1) : un appel au modèle.
// - Réponse en texte : la demande est finie.
// - Outils de lecture : exécutés, leurs résultats ajoutés à la conversation ; le navigateur relance
//   l'étape suivante.
// - Outils d'écriture : rien n'est exécuté ; chacun devient une PROPOSITION (carte à valider) et la
//   demande s'arrête là. Claude apprend que la carte attend la validation du coach.
// Le modèle et l'exécution des outils sont injectés : cette étape se teste sans réseau ni base.

export type ToolOutcome =
  | { type: "result"; content: string }
  | { type: "error"; content: string }
  | { type: "proposal"; proposal: AssistantProposal };

export type StepContext = {
  firstName: string;
  todayIso: string;
  model: AssistantModel;
  // `pending` : propositions déjà faites dans cette étape (pour relier une carte à une fiche à créer).
  runTool: (name: string, input: unknown, pending: AssistantProposal[]) => Promise<ToolOutcome>;
  // Le fichier joint, tel que Claude le lit (D-209) : placé avant la question à chaque appel, jamais
  // dans la conversation renvoyée au navigateur.
  attachmentBlocks?: Anthropic.ContentBlockParam[];
};

export type StepUsage = { input: number; output: number };

export type StepResult =
  | { kind: "continue"; messages: Anthropic.MessageParam[]; progress: string; usage: StepUsage }
  | {
      kind: "proposals";
      text: string;
      proposals: AssistantProposal[];
      // Actions qui n'ont pas pu être préparées dans la même réponse (relecture n°3) : montrées au
      // coach sous les cartes, plutôt que perdues.
      failures: string[];
      messages: Anthropic.MessageParam[];
      usage: StepUsage;
    }
  | { kind: "answer"; text: string; usage: StepUsage }
  | { kind: "error"; error: AssistantErrorKind; usage: StepUsage };

export const PROPOSAL_PENDING = "Proposition affichée au coach, en attente de sa validation.";

// Relecture du lot 3a, n°11 : Claude apprend ce que dit la carte (titre, lignes, avertissements comme
// un chevauchement), pour ne pas la contredire dans la suite de la conversation. Jamais l'ancienne
// valeur des coordonnées d'un sportif (summaryForClaude).
export function proposalToolResult(
  proposal: Pick<AssistantProposal, "kind" | "params" | "title" | "summary">,
): string {
  return `${PROPOSAL_PENDING} Carte « ${proposal.title} » : ${summaryForClaude(proposal).join(" · ")}`;
}

// Ce que voit le coach pendant qu'une étape cherche quelque chose.
const PROGRESS: Record<string, string> = {
  chercher_sportifs: "Je cherche le sportif…",
  voir_agenda: "Je regarde l'agenda…",
  voir_a_encaisser: "Je regarde les séances à encaisser…",
  voir_listes_de_taches: "Je regarde tes listes de tâches…",
  voir_categories_de_depenses: "Je regarde tes catégories de dépenses…",
  voir_modeles: "Je regarde tes modèles de programme…",
  voir_modeles_de_seance: "Je regarde tes modèles de séance…",
  voir_taches: "Je regarde tes tâches…",
  voir_paiements: "Je regarde tes paiements…",
  voir_depenses: "Je regarde tes dépenses…",
  voir_documents: "Je regarde tes documents…",
  voir_objectifs: "Je regarde les objectifs du sportif…",
  voir_reperes: "Je regarde les repères du sportif…",
  voir_parametres: "Je regarde tes réglages…",
  voir_notifications: "Je regarde tes notifications…",
  voir_programmes: "Je regarde les programmes du sportif…",
  chercher_exercices: "Je cherche les exercices dans ta Bibliothèque…",
  voir_fiche: "Je regarde la fiche du sportif…",
  voir_brouillon: "Je regarde le programme…",
  voir_modele: "Je regarde le modèle…",
  voir_categories_de_documents: "Je regarde tes catégories de documents…",
};
export const progressFor = (name: string) => PROGRESS[name] ?? "Je prépare ta demande…";

const textOf = (content: Anthropic.ContentBlock[]) =>
  content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("")
    .trim();

export async function runAssistantStep(
  ctx: StepContext,
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[] = [],
): Promise<StepResult> {
  const response = await ctx.model({
    system: [{ type: "text", text: systemPrompt(ctx.firstName, ctx.todayIso) }],
    tools,
    messages: withAttachment(messages, ctx.attachmentBlocks ?? []),
  });
  const usage = { input: response.usage.input_tokens, output: response.usage.output_tokens };
  // Un refus peut couper un appel d'outil en plein milieu : on n'exécute rien de cette réponse.
  if (response.stop_reason === "refusal") return { kind: "error", error: "refusal", usage };

  const calls = response.content.filter(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  const text = textOf(response.content);
  // Réponse coupée par la longueur : un appel d'outil peut être incomplet, on n'en exécute aucun
  // (relecture n°8). Coupée pendant la réflexion (ni texte ni outil, 27/11) : même message, pas
  // « indisponible ».
  if (response.stop_reason === "max_tokens" && (calls.length > 0 || !text)) {
    return { kind: "error", error: "truncated", usage };
  }
  if (calls.length === 0) {
    return text ? { kind: "answer", text, usage } : { kind: "error", error: "unavailable", usage };
  }

  // Les fiches de sportif d'abord : une carte liée (« … et une tâche pour l'appeler ») doit trouver
  // sa fiche, quel que soit l'ordre choisi par Claude (relecture n°3).
  const ordered = [...calls].sort(
    (a, b) => Number(a.name !== "creer_sportif") - Number(b.name !== "creer_sportif"),
  );
  const byId = new Map<string, Anthropic.ToolResultBlockParam>();
  const proposals: AssistantProposal[] = [];
  const failures: string[] = [];
  for (const call of ordered) {
    const outcome = await ctx.runTool(call.name, call.input, proposals);
    if (outcome.type === "proposal") {
      proposals.push(outcome.proposal);
      byId.set(call.id, {
        type: "tool_result",
        tool_use_id: call.id,
        content: proposalToolResult(outcome.proposal),
      });
    } else {
      if (outcome.type === "error") failures.push(outcome.content);
      byId.set(call.id, {
        type: "tool_result",
        tool_use_id: call.id,
        content: outcome.content,
        ...(outcome.type === "error" ? { is_error: true } : {}),
      });
    }
  }
  const results = calls.map((call) => byId.get(call.id) as Anthropic.ToolResultBlockParam);
  const next: Anthropic.MessageParam[] = [
    ...messages,
    { role: "assistant", content: response.content },
    { role: "user", content: results },
  ];
  if (proposals.length > 0) {
    return { kind: "proposals", text, proposals, failures, messages: next, usage };
  }
  return { kind: "continue", messages: next, progress: progressFor(calls[0].name), usage };
}
