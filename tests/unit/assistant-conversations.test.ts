import { describe, expect, it } from "vitest";

import {
  CONVERSATION_MAX_BYTES,
  INTERRUPTED,
  conversationTitle,
  conversationTooLarge,
  expiresOn,
  expiresSoon,
  historyGroups,
  restoreMessages,
  saveConversationSchema,
  visibleCount,
  type AssistantMessage,
} from "@/features/assistant/conversation-rules";
import { assistantKey, isNotificationKey } from "@/domain/notifications/keys";

// Conversations de l'Assistant IA enregistrées (D-212, 27/11/2026) : règles pures.
const coach = (
  id: number,
  text: string,
  extra: Partial<AssistantMessage> = {},
): AssistantMessage => ({
  id,
  from: "coach",
  text,
  ...extra,
});
const card = (status: "pending" | "running" | "done", href?: string) => ({
  id: "c1",
  kind: "creer_tache" as const,
  params: { title: "Appeler" },
  title: "Nouvelle tâche",
  summary: ["Appeler"],
  dependsOn: null,
  status,
  ...(href ? { href } : {}),
});

describe("titre d'une conversation", () => {
  it("le début de la première question du coach, sans la ligne du fichier joint", () => {
    expect(
      conversationTitle([
        coach(0, "[Fait : Nouvelle tâche]", { hidden: true }),
        coach(1, "Crée le programme HYROX de Marc\nFichier joint : plan.pdf"),
        { id: 2, from: "assistant", text: "Voici." },
        coach(3, "Autre chose"),
      ]),
    ).toBe("Crée le programme HYROX de Marc");
  });

  it("80 caractères au plus, espaces ramassés ; sans question : « Conversation »", () => {
    const long = conversationTitle([coach(0, `Bonjour   ${"x".repeat(200)}`)]);
    expect(long).toHaveLength(80);
    expect(long.endsWith("…")).toBe(true);
    expect(long.startsWith("Bonjour x")).toBe(true);
    expect(conversationTitle([{ id: 0, from: "assistant", text: "Salut" }])).toBe("Conversation");
  });
});

describe("messages visibles et cartes rouvertes", () => {
  it("les notes cachées ne comptent pas (elles ne prolongent pas la conversation)", () => {
    expect(
      visibleCount([coach(0, "a"), coach(1, "[Fait : x]", { hidden: true }), coach(2, "b")]),
    ).toBe(2);
  });

  it("une carte « en cours » rouverte devient un échec, jamais « à valider » (pas de double exécution)", () => {
    const [restored] = restoreMessages([
      {
        id: 0,
        from: "assistant",
        text: "Voici.",
        cards: [card("running"), { ...card("done"), id: "c2" }],
      },
    ]);
    expect(restored!.cards!.map((c) => c.status)).toEqual(["error", "done"]);
    expect(restored!.cards![0]!.result).toBe(INTERRUPTED);
  });
});

describe("effacement à 12 mois", () => {
  it("le jour anniversaire, à la date de Bruxelles du dernier message", () => {
    expect(expiresOn("2026-11-27T15:00:00Z")).toBe("2027-11-27");
    // 23:30 UTC le 31/12 = 00:30 le 1er janvier à Bruxelles.
    expect(expiresOn("2026-12-31T23:30:00Z")).toBe("2028-01-01");
    // Un 29 février devient le 28 (comme la base).
    expect(expiresOn("2028-02-29T10:00:00Z")).toBe("2029-02-28");
  });

  it("prévenu dans les 30 derniers jours", () => {
    expect(expiresSoon("2027-11-27", "2027-10-28")).toBe(true);
    expect(expiresSoon("2027-11-27", "2027-10-27")).toBe(false);
    expect(expiresSoon("2027-11-27", "2027-11-27")).toBe(true);
  });

  it("clé de notification « assistant:<id>:<date> », acceptée comme les autres", () => {
    const key = assistantKey("c0000000-0000-4000-8000-00000000000a", "2027-11-27");
    expect(key).toBe("assistant:c0000000-0000-4000-8000-00000000000a:2027-11-27");
    expect(isNotificationKey(key)).toBe(true);
  });
});

describe("historique par date", () => {
  it("Aujourd'hui, Hier, 7 derniers jours, 30 derniers jours, Plus ancien (dans l'ordre reçu)", () => {
    const at = (day: string) => ({ id: day, lastMessageAt: `${day}T10:00:00Z` });
    const groups = historyGroups(
      [at("2026-11-27"), at("2026-11-26"), at("2026-11-22"), at("2026-11-05"), at("2026-09-01")],
      "2026-11-27",
    );
    expect(groups.map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([
      ["Aujourd'hui", ["2026-11-27"]],
      ["Hier", ["2026-11-26"]],
      ["7 derniers jours", ["2026-11-22"]],
      ["30 derniers jours", ["2026-11-05"]],
      ["Plus ancien", ["2026-09-01"]],
    ]);
    expect(historyGroups([], "2026-11-27")).toEqual([]);
  });
});

describe("ce qui est enregistré", () => {
  const ID = "c0000000-0000-4000-8000-00000000000a";
  const parse = (messages: unknown) =>
    saveConversationSchema.safeParse({ id: ID, version: 0, messages }).success;

  it("une conversation normale passe, cartes et liens internes compris", () => {
    expect(
      parse([
        coach(0, "Crée une tâche"),
        {
          id: 1,
          from: "assistant",
          text: "Voici.",
          cards: [
            {
              ...card("done", "/coach/o/x/taches"),
              links: [{ label: "PDF du programme", href: "/coach/o/x/programmes/y/pdf" }],
            },
          ],
          failures: ["Montant manquant."],
        },
      ]),
    ).toBe(true);
  });

  it("refuse un lien vers un autre site dans une carte", () => {
    for (const href of [
      "https://exemple.test",
      "//exemple.test",
      "/\\exemple.test",
      "javascript:alert(1)",
    ])
      expect(
        parse([{ id: 1, from: "assistant", text: "x", cards: [card("done", href)] }]),
        href,
      ).toBe(false);
  });

  it("refuse un expéditeur inconnu ou un identifiant qui n'est pas un uuid", () => {
    expect(parse([{ id: 0, from: "admin", text: "x" }])).toBe(false);
    expect(
      saveConversationSchema.safeParse({ id: "pas-un-uuid", version: 0, messages: [] }).success,
    ).toBe(false);
  });

  it("au-delà de 2 Mo, la conversation est trop longue pour être enregistrée", () => {
    expect(conversationTooLarge([coach(0, "petit")])).toBe(false);
    expect(conversationTooLarge([coach(0, "é".repeat(CONVERSATION_MAX_BYTES / 2))])).toBe(true);
  });
});

describe("identifiant d'une nouvelle conversation", () => {
  it("un uuid v4 accepté par le serveur, même sans crypto.randomUUID (iPhone en http)", async () => {
    const { newConversationId } = await import("@/components/blocks/assistant-conversations");
    const ids = new Set(Array.from({ length: 50 }, () => newConversationId()));
    expect(ids.size).toBe(50);
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(
        saveConversationSchema.safeParse({ id, version: 0, messages: [coach(0, "x")] }).success,
      ).toBe(true);
    }
  });
});

describe("relecture du 27/11", () => {
  it("le résultat d'une carte va à sa réponse, avec la note pour l'assistant", async () => {
    const { updateMessageCards } = await import("@/features/assistant/conversation-rules");
    const messages: AssistantMessage[] = [
      coach(0, "Crée une tâche"),
      { id: 1, from: "assistant", text: "Voici.", cards: [card("running")] },
    ];
    const next = updateMessageCards(
      messages,
      1,
      (cards) => cards.map((c) => ({ ...c, status: "done" as const })),
      coach(2, "[Fait : Nouvelle tâche]", { hidden: true }),
    );
    expect(next[1]!.cards![0]!.status).toBe("done");
    expect(next[2]).toEqual(coach(2, "[Fait : Nouvelle tâche]", { hidden: true }));
    expect(messages[1]!.cards![0]!.status).toBe("running");
  });

  it("une grosse carte « Modifier le programme » (20 changements) s'enregistre", () => {
    const big = {
      ...card("pending"),
      summary: Array.from({ length: 123 }, (_, i) => `Ligne ${i}`),
    };
    expect(
      saveConversationSchema.safeParse({
        id: "c0000000-0000-4000-8000-00000000000a",
        version: 0,
        messages: [coach(0, "x"), { id: 1, from: "assistant", text: "y", cards: [big] }],
      }).success,
    ).toBe(true);
  });
});
