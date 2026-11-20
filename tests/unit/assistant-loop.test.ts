import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";

import { runAssistantStep, type StepContext } from "@/features/assistant/loop";
import { reserveErrorKind, systemPrompt } from "@/features/assistant/rules";

// Une étape de l'Assistant IA (lot 1 des actions) : UN appel au modèle, puis réponse, poursuite
// (outils de lecture) ou erreur. Le modèle et les outils sont écrits ici : aucun appel réseau.
function message(
  content: Anthropic.ContentBlock[],
  stop: Anthropic.Message["stop_reason"],
): Anthropic.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content,
    stop_reason: stop,
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  } as unknown as Anthropic.Message;
}

const context = (reply: Anthropic.Message, calls: string[] = []): StepContext => ({
  firstName: "Gianluca",
  todayIso: "2026-11-13",
  model: async () => reply,
  runTool: async (name) => {
    calls.push(name);
    return { type: "error", content: `Outil inconnu : ${name}` };
  },
});

const question: Anthropic.MessageParam[] = [{ role: "user", content: "Bonjour" }];

describe("runAssistantStep", () => {
  it("rend la réponse en texte quand le modèle a fini", async () => {
    const step = await runAssistantStep(
      context(message([{ type: "text", text: "Salut !", citations: null }], "end_turn")),
      question,
    );
    expect(step).toEqual({ kind: "answer", text: "Salut !", usage: { input: 0, output: 0 } });
  });

  it("répond une erreur à Claude pour un outil inconnu et continue", async () => {
    const calls: string[] = [];
    const step = await runAssistantStep(
      context(
        message(
          [
            {
              type: "tool_use",
              id: "toolu_1",
              name: "outil_inconnu",
              input: {},
              caller: { type: "direct" },
            },
          ],
          "tool_use",
        ),
        calls,
      ),
      question,
    );
    expect(calls).toEqual(["outil_inconnu"]);
    expect(step.kind).toBe("continue");
    if (step.kind !== "continue") return;
    expect(step.progress).toBe("Je prépare ta demande…");
    const last = step.messages.at(-1);
    expect(last?.role).toBe("user");
    expect(last?.content).toEqual([
      {
        type: "tool_result",
        tool_use_id: "toolu_1",
        content: "Outil inconnu : outil_inconnu",
        is_error: true,
      },
    ]);
  });

  it("transforme un outil d'écriture en carte, sans rien exécuter", async () => {
    const proposal = {
      id: "carte-1",
      kind: "creer_liste_de_taches" as const,
      params: { name: "Facturation" },
      title: "Nouvelle liste de tâches",
      summary: ["Facturation"],
      dependsOn: null,
    };
    const ctx: StepContext = {
      ...context(
        message(
          [
            { type: "text", text: "Je te propose cette liste.", citations: null },
            {
              type: "tool_use",
              id: "toolu_2",
              name: "creer_liste_de_taches",
              input: { name: "Facturation" },
              caller: { type: "direct" },
            },
          ],
          "tool_use",
        ),
      ),
      runTool: async () => ({ type: "proposal", proposal }),
    };
    const step = await runAssistantStep(ctx, question);
    expect(step.kind).toBe("proposals");
    if (step.kind !== "proposals") return;
    expect(step.text).toBe("Je te propose cette liste.");
    expect(step.proposals).toEqual([proposal]);
    expect(step.messages.at(-1)?.content).toEqual([
      {
        type: "tool_result",
        tool_use_id: "toolu_2",
        // Claude apprend ce que dit la carte (relecture du lot 3a, n°11).
        content:
          "Proposition affichée au coach, en attente de sa validation. Carte « Nouvelle liste de tâches » : Facturation",
      },
    ]);
  });

  it("signale un refus du modèle", async () => {
    const step = await runAssistantStep(context(message([], "refusal")), question);
    expect(step).toEqual({ kind: "error", error: "refusal", usage: { input: 0, output: 0 } });
  });
});

describe("consigne et refus", () => {
  it("donne la date du jour à Bruxelles, en toutes lettres", () => {
    expect(systemPrompt("Gianluca", "2026-11-13")).toContain("vendredi 13 novembre 2026");
  });

  it("traduit les refus d'étape de la base", () => {
    expect(reserveErrorKind("etapes_epuisees")).toBe("steps");
    expect(reserveErrorKind("demande_expiree")).toBe("expired");
  });
});
