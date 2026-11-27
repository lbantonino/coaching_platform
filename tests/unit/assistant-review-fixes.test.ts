import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";

import { checkAgainstSession, formRuleError } from "@/features/assistant/form-data";
import { runAssistantStep, type StepContext } from "@/features/assistant/loop";
import {
  assistantActionSchema,
  prepareToolInput,
  summarize,
  type AssistantProposal,
} from "@/features/assistant/proposals";
import { toApiMessages, trimHistory } from "@/features/assistant/rules";

// Corrections de la relecture finale du lot 1 : la carte montre exactement ce qui sera fait, et une
// carte qui s'affiche passe les mêmes règles que le formulaire (sinon l'erreur repart à Claude).
const LUCAS = "00000000-0000-4000-8000-000000000001";
const SARAH = "00000000-0000-4000-8000-000000000002";
const SEANCE = "ca000000-0000-4000-8000-000000000001";

const series = {
  startsOn: "2026-11-03",
  repeatsWeekly: true,
  endsOn: null,
  startTime: "18:00",
  durationMinutes: 60,
  priceCents: 6500 as number | null,
};
const move = (params: {
  originalDate: string;
  newDate: string;
  scope: "single" | "series";
  newTime?: string;
}) => ({
  kind: "deplacer_seance" as const,
  params: { sessionId: SEANCE, newTime: "19:00", ...params },
});

describe("n°1 : déplacer toute une série", () => {
  it("refuse un écart de plus de 3 jours pour toute la série", () => {
    for (const newDate of ["2026-11-21", "2026-11-24"]) {
      expect(
        assistantActionSchema.safeParse(
          move({ originalDate: "2026-11-17", newDate, scope: "series" }),
        ).success,
      ).toBe(false);
    }
    expect(
      assistantActionSchema.safeParse(
        move({ originalDate: "2026-11-17", newDate: "2026-11-20", scope: "series" }),
      ).success,
    ).toBe(true);
  });

  it("vérifie la date d'origine et minuit sur la séance", () => {
    expect(
      checkAgainstSession(
        move({ originalDate: "2026-11-18", newDate: "2026-11-19", scope: "series" }),
        series,
      ),
    ).toEqual({ ok: false, error: expect.stringContaining("n'a pas lieu") });
    expect(
      checkAgainstSession(
        move({
          originalDate: "2026-11-17",
          newDate: "2026-11-17",
          newTime: "23:30",
          scope: "single",
        }),
        series,
      ),
    ).toEqual({ ok: false, error: "La séance finirait après minuit." });
  });

  it("ramène une séance unique à « cette date seulement »", () => {
    const once = { ...series, repeatsWeekly: false, startsOn: "2026-11-17" };
    expect(
      checkAgainstSession(
        move({ originalDate: "2026-11-17", newDate: "2026-11-19", scope: "series" }),
        once,
      ),
    ).toEqual({
      ok: true,
      params: {
        sessionId: SEANCE,
        newTime: "19:00",
        originalDate: "2026-11-17",
        newDate: "2026-11-19",
        scope: "single",
      },
    });
  });

  it("refuse de marquer payée une séance sans prix", () => {
    expect(
      checkAgainstSession(
        { kind: "marquer_seance_payee", params: { sessionId: SEANCE, sessionDate: "2026-11-10" } },
        { ...series, priceCents: null },
      ).ok,
    ).toBe(false);
  });
});

describe("n°2 : les règles du formulaire dès la proposition", () => {
  const seance = {
    kind: "individual" as const,
    title: "Coaching",
    athlete: { athleteId: LUCAS },
    startsOn: "2026-11-17",
    startTime: "18:00",
    durationMinutes: 60,
  };

  it("un prix demande son mode de paiement, comme dans « Nouvelle séance »", () => {
    expect(
      formRuleError({ kind: "creer_seance", params: { ...seance, price: 65 } }, "2026-11-13"),
    ).toBe("Choisis espèces ou virement.");
    expect(
      formRuleError(
        { kind: "creer_seance", params: { ...seance, price: 65, paymentMethod: "cash" } },
        "2026-11-13",
      ),
    ).toBeNull();
  });

  it("refuse une durée, un titre de tâche ou une date d'objectif que le formulaire refuse", () => {
    expect(
      formRuleError(
        { kind: "creer_seance", params: { ...seance, durationMinutes: 5 } },
        "2026-11-13",
      ),
    ).not.toBeNull();
    expect(
      formRuleError({ kind: "creer_tache", params: { title: "x".repeat(150) } }, "2026-11-13"),
    ).not.toBeNull();
    expect(
      formRuleError(
        {
          kind: "creer_sportif",
          params: { firstName: "Lucas", goalType: "run_half", goalDate: "2020-01-01" },
        },
        "2026-11-13",
      ),
    ).not.toBeNull();
    expect(
      formRuleError(
        {
          kind: "noter_paiement",
          params: {
            athlete: { athleteId: LUCAS },
            receivedOn: "2026-11-13",
            amount: 60,
            vatRate: 21.555,
            method: "cash",
          },
        },
        "2026-11-13",
      ),
    ).not.toBeNull();
  });
});

describe("n°4 et n°7 : la carte montre tout", () => {
  it("nomme les inscrits d'une séance collective et la fin de la série", () => {
    const { summary } = summarize(
      {
        kind: "creer_seance",
        params: {
          kind: "group",
          title: "Run club",
          athleteIds: [LUCAS, SARAH],
          startsOn: "2026-11-21",
          startTime: "08:30",
          durationMinutes: 60,
          repeatsWeekly: true,
          endsOn: "2026-12-26",
        },
      },
      { [LUCAS]: "Lucas Janssens", [SARAH]: "Sarah Vermeulen" },
      "EUR",
    );
    expect(summary).toContain("Inscrits : Lucas Janssens, Sarah Vermeulen");
    expect(summary).toContain(
      "samedi 21 novembre 2026 · 08:30 · 60 min · chaque semaine jusqu'au samedi 26 décembre 2026",
    );
  });

  it("montre la TVA d'une séance et d'un paiement, et le type d'objectif", () => {
    const seance = summarize(
      {
        kind: "creer_seance",
        params: {
          kind: "individual",
          title: "Coaching",
          athlete: { athleteId: LUCAS },
          startsOn: "2026-11-17",
          startTime: "18:00",
          durationMinutes: 60,
          price: 65,
          vatRate: 21,
          paymentMethod: "transfer",
        },
      },
      { [LUCAS]: "Lucas Janssens" },
      "EUR",
    ).summary;
    expect(seance).toContain("65,00 € HTVA + TVA 21 % · virement");
    const paiement = summarize(
      {
        kind: "noter_paiement",
        params: {
          athlete: { athleteId: LUCAS },
          receivedOn: "2026-11-13",
          amount: 60,
          vatRate: 21,
          method: "cash",
        },
      },
      { [LUCAS]: "Lucas Janssens" },
      "EUR",
    ).summary;
    expect(paiement).toContain("60,00 € dont TVA 21 % · espèces");
    expect(
      summarize(
        {
          kind: "creer_sportif",
          params: { firstName: "Lucas", goalType: "run_half", goalDate: "2027-04-11" },
        },
        {},
        "EUR",
      ).summary,
    ).toContain("Semi-marathon le dimanche 11 avril 2027");
  });

  it("montre le montant d'une séance marquée payée", () => {
    expect(
      summarize(
        { kind: "marquer_seance_payee", params: { sessionId: SEANCE, sessionDate: "2026-11-10" } },
        { [SEANCE]: "Coaching force · Lucas Janssens", [`${SEANCE}:montant`]: "65,00 €" },
        "EUR",
      ).summary,
    ).toEqual(["Coaching force · Lucas Janssens", "Séance du mardi 10 novembre 2026", "65,00 €"]);
  });
});

describe("n°11 : jamais de renvoi brut à une carte venant de Claude", () => {
  it("refuse { fromCard } dans les paramètres d'un outil", () => {
    expect(
      prepareToolInput("creer_tache", { title: "x", athlete: { fromCard: "abc" } }, []).ok,
    ).toBe(false);
  });
});

function reply(content: Anthropic.ContentBlock[], stop: Anthropic.Message["stop_reason"]) {
  return {
    id: "m",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content,
    stop_reason: stop,
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  } as unknown as Anthropic.Message;
}
const call = (
  id: string,
  name: string,
  input: Record<string, unknown>,
): Anthropic.ContentBlock => ({
  type: "tool_use",
  id,
  name,
  input,
  caller: { type: "direct" },
});

describe("n°3 et n°8 : étape de la boucle", () => {
  it("traite les fiches avant les cartes qui en dépendent, et garde les échecs", async () => {
    const order: string[] = [];
    const ctx: StepContext = {
      firstName: "",
      todayIso: "2026-11-13",
      model: async () =>
        reply(
          [
            call("t1", "creer_tache", { title: "Appeler" }),
            call("t2", "creer_sportif", { firstName: "Zoé" }),
            call("t3", "noter_depense", { label: "x" }),
          ],
          "tool_use",
        ),
      runTool: async (name) => {
        order.push(name);
        if (name === "noter_depense") return { type: "error", content: "Montant manquant." };
        return {
          type: "proposal",
          proposal: {
            id: name,
            kind: name,
            params: {},
            title: name,
            summary: [],
            dependsOn: null,
          } as AssistantProposal,
        };
      },
    };
    const step = await runAssistantStep(ctx, [{ role: "user", content: "x" }]);
    expect(order[0]).toBe("creer_sportif");
    expect(step.kind).toBe("proposals");
    if (step.kind !== "proposals") return;
    expect(step.proposals.map((p) => p.id).sort()).toEqual(["creer_sportif", "creer_tache"]);
    expect(step.failures).toEqual(["Montant manquant."]);
  });

  it("n'exécute rien d'une réponse coupée par la longueur", async () => {
    const used: string[] = [];
    const step = await runAssistantStep(
      {
        firstName: "",
        todayIso: "2026-11-13",
        model: async () => reply([call("t1", "creer_tache", { title: "App" })], "max_tokens"),
        runTool: async (name) => {
          used.push(name);
          return { type: "error", content: "" };
        },
      },
      [{ role: "user", content: "x" }],
    );
    expect(used).toEqual([]);
    expect(step).toMatchObject({ kind: "error", error: "truncated" });
  });

  // 27/11 : une demande lourde (programme tiré d'un PDF de 7 pages) a passé toute sa réponse à
  // réfléchir ; sans texte ni outil, l'écran disait « indisponible », comme une panne.
  it("une réponse coupée pendant la réflexion, sans texte ni outil, dit qu'elle a été coupée", async () => {
    const step = await runAssistantStep(
      {
        firstName: "",
        todayIso: "2026-11-27",
        model: async () =>
          reply(
            [{ type: "thinking", thinking: "", signature: "s" } as Anthropic.ContentBlock],
            "max_tokens",
          ),
        runTool: async () => ({ type: "error", content: "" }),
      },
      [{ role: "user", content: "x" }],
    );
    expect(step).toMatchObject({ kind: "error", error: "truncated" });
  });
});

describe("n°6 et n°14 : la taille de ce qui part chez Claude", () => {
  it("garde au plus 60 000 caractères d'historique, la question en dernier", () => {
    const history = Array.from({ length: 30 }, (_, index) => ({
      from: index % 2 === 0 ? ("coach" as const) : ("assistant" as const),
      text: "x".repeat(12000),
    }));
    const messages = toApiMessages({ history, question: "dernière question" });
    const size = messages.reduce((total, message) => total + message.content.length, 0);
    expect(size).toBeLessThanOrEqual(60_000);
    expect(messages.at(-1)?.content.endsWith("dernière question")).toBe(true);
    expect(messages[0].role).toBe("user");
  });

  it("le navigateur n'envoie que les 20 derniers messages, raccourcis", () => {
    const history = Array.from({ length: 50 }, () => ({
      from: "coach" as const,
      text: "y".repeat(9000),
    }));
    const trimmed = trimHistory(history);
    expect(trimmed).toHaveLength(20);
    expect(trimmed.every((message) => message.text.length <= 4000)).toBe(true);
  });
});
