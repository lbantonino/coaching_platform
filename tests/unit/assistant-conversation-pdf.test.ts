import { describe, expect, it } from "vitest";

import { conversationPdf } from "@/features/assistant/conversation-pdf-model";
import { renderConversationPdf } from "@/features/assistant/conversation-pdf";
import type { AssistantMessage } from "@/features/assistant/conversation-rules";

// PDF d'une conversation de l'Assistant IA (D-212) : ce que le coach a vu, cartes et leur état
// compris ; jamais les notes cachées pour l'assistant.
const messages: AssistantMessage[] = [
  { id: 0, from: "coach", text: "Crée une tâche : appeler Marc\nFichier joint : plan.pdf" },
  {
    id: 1,
    from: "assistant",
    text: "Voici la tâche.",
    cards: [
      {
        id: "c1",
        kind: "creer_tache",
        params: { title: "Appeler Marc" },
        title: "Nouvelle tâche",
        summary: ["Appeler Marc", "Pour demain"],
        dependsOn: null,
        status: "done",
        href: "/coach/o/x/taches",
      },
      {
        id: "c2",
        kind: "preparer_pdf",
        params: { programId: "p" },
        title: "PDF du programme",
        summary: ["Prépa HYROX"],
        dependsOn: null,
        status: "pending",
        links: [{ label: "PDF du programme", href: "/coach/o/x/programmes/p/pdf" }],
      },
    ],
    failures: ["Montant manquant."],
  },
  { id: 2, from: "coach", text: "[Fait : Nouvelle tâche · Appeler Marc]", hidden: true },
  { id: 3, from: "coach", text: "Et la suite ?", failed: true },
  { id: 4, from: "assistant", text: "L'assistant est indisponible.", failed: true },
];
const conversation = {
  title: "Crée une tâche : appeler Marc",
  createdAt: "2026-11-27T09:00:00Z",
  lastMessageAt: "2026-11-27T10:00:00Z",
  messages,
};

describe("PDF d'une conversation", () => {
  it("les messages visibles, les cartes avec leur état, sans les notes cachées", () => {
    const model = conversationPdf(conversation, "Gianluca");
    expect(model.blocks).toEqual([
      {
        kind: "message",
        from: "Toi",
        text: "Crée une tâche : appeler Marc\nFichier joint : plan.pdf",
        error: false,
      },
      { kind: "message", from: "Assistant IA", text: "Voici la tâche.", error: false },
      {
        kind: "card",
        title: "Nouvelle tâche",
        lines: ["Appeler Marc", "Pour demain"],
        state: "Validée",
        result: null,
      },
      {
        kind: "card",
        title: "PDF du programme",
        lines: ["Prépa HYROX"],
        state: "À valider",
        result: null,
      },
      { kind: "failure", text: "Non préparée : Montant manquant." },
      { kind: "message", from: "Toi", text: "Et la suite ?", error: false },
      { kind: "message", from: "Assistant IA", text: "L'assistant est indisponible.", error: true },
    ]);
  });

  it("titre, dates, effacement prévu et nom du fichier", () => {
    const model = conversationPdf(conversation, "Gianluca");
    expect(model.title).toBe("Crée une tâche : appeler Marc");
    expect(model.subtitle).toBe(
      "Commencée le 27 novembre 2026 · dernier message le 27 novembre 2026",
    );
    expect(model.note).toBe(
      "Coory garde cette conversation jusqu'au 27 novembre 2027, puis l'efface.",
    );
    expect(model.fileName).toBe("Conversation - Crée une tâche  appeler Marc - 2026-11-27.pdf");
    expect(model.footer).toBe("Coory · Assistant IA · Gianluca");
  });

  it("un vrai PDF", async () => {
    const pdf = await renderConversationPdf(conversationPdf(conversation, "Gianluca"));
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect((pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(0);
  }, 30_000);
});
