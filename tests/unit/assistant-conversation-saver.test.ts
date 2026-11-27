import { describe, expect, it } from "vitest";

import type { AssistantMessage } from "@/features/assistant/conversation-rules";
import {
  ConversationSaver,
  type SaveResult,
  type StoredConversation,
} from "@/features/assistant/conversation-saver";

// File d'enregistrement des conversations (D-212), relecture du 27/11 : la même conversation sur
// deux appareils. Une « base » simulée avec contrôle de version, comme save_assistant_conversation.
const ID = "c0000000-0000-4000-8000-00000000000a";

function fakeBase() {
  const rows = new Map<string, { version: number; messages: AssistantMessage[] }>();
  const writes: string[] = [];
  return {
    rows,
    writes,
    save: async ({
      id,
      version,
      messages,
    }: {
      id: string;
      version: number;
      messages: AssistantMessage[];
    }): Promise<SaveResult> => {
      const row = rows.get(id);
      const ok = version === 0 ? !row : row?.version === version;
      if (!ok)
        return row
          ? { ok: false, kind: "conflict", error: "conflit" }
          : { ok: false, kind: "gone", error: "supprimée" };
      rows.set(id, { version: (row?.version ?? 0) + 1, messages });
      writes.push(JSON.stringify(messages));
      return { ok: true, version: (row?.version ?? 0) + 1 };
    },
    load: async (id: string): Promise<StoredConversation | null> => {
      const row = rows.get(id);
      return row ? { id, version: row.version, messages: row.messages } : null;
    },
  };
}

function saverOn(base: ReturnType<typeof fakeBase>) {
  const events: string[] = [];
  const saver = new ConversationSaver({
    save: base.save,
    load: base.load,
    isShown: () => true,
    onConflict: () => events.push("rechargée"),
    onGone: () => events.push("vide"),
    notice: (text) => (text ? events.push(`note:${text}`) : undefined),
    saved: () => undefined,
  });
  return { saver, events };
}

const card = (id: string, status: "pending" | "running" | "done") => ({
  id,
  kind: "creer_tache" as const,
  params: { title: id },
  title: "Nouvelle tâche",
  summary: [id],
  dependsOn: null,
  status,
});
const answer = (k1: "pending" | "running" | "done", k2: "pending" | "running" | "done") => [
  { id: 0, from: "coach" as const, text: "Deux tâches" },
  { id: 1, from: "assistant" as const, text: "Voici.", cards: [card("K1", k1), card("K2", k2)] },
];

describe("enregistrer une conversation", () => {
  it("crée, met à jour, et n'envoie rien quand rien n'a changé", async () => {
    const base = fakeBase();
    const { saver } = saverOn(base);
    expect(await saver.persist(ID, answer("pending", "pending"))).toBe("ok");
    expect(await saver.persist(ID, answer("done", "pending"))).toBe("ok");
    expect(await saver.persist(ID, answer("done", "pending"))).toBe("ok");
    expect(base.rows.get(ID)!.version).toBe(2);
    expect(base.writes).toHaveLength(2);
  });

  it("supprimée sur l'autre appareil : un envoi déjà en file ne la recrée jamais", async () => {
    const base = fakeBase();
    const phone = saverOn(base);
    await phone.saver.persist(ID, answer("pending", "pending"));
    base.rows.delete(ID); // supprimée sur le Mac
    // « Valider » sur le téléphone : l'envoi « en cours », puis celui de l'écran.
    const first = phone.saver.persist(ID, answer("running", "pending"));
    const second = phone.saver.persist(ID, answer("running", "pending"));
    expect(await first).toBe("gone");
    expect(await second).toBe("gone");
    expect(base.rows.has(ID)).toBe(false);
    expect(phone.events).toContain("vide");
  });

  it("supprimée ici : rien ne la recrée ensuite", async () => {
    const base = fakeBase();
    const { saver } = saverOn(base);
    await saver.persist(ID, answer("pending", "pending"));
    const queued = saver.persist(ID, answer("done", "pending"));
    saver.forget(ID);
    base.rows.delete(ID);
    expect(await queued).toBe("gone");
    expect(await saver.persist(ID, answer("done", "done"))).toBe("gone");
    expect(base.rows.has(ID)).toBe(false);
  });

  it("écran périmé : deux « Valider » rapides ne passent pas, rien n'est écrasé", async () => {
    const base = fakeBase();
    const phone = saverOn(base);
    await phone.saver.persist(ID, answer("pending", "pending")); // v1, les deux appareils
    // Le Mac a validé K1 et K2 depuis (v3).
    base.rows.set(ID, { version: 3, messages: answer("done", "done") });
    // Le téléphone, resté sur v1 : Valider K1, puis K2, avant la première réponse.
    const from = phone.saver.generation(ID);
    const k1 = phone.saver.persist(ID, answer("running", "pending"), from);
    const k1Screen = phone.saver.persist(ID, answer("running", "pending"), from);
    const k2 = phone.saver.persist(ID, answer("running", "running"), from);
    expect(await k1).toBe("conflict");
    expect(await k1Screen).toBe("conflict");
    expect(await k2).toBe("conflict");
    // La base garde la version du Mac, intacte.
    expect(base.rows.get(ID)).toEqual({ version: 3, messages: answer("done", "done") });
    expect(phone.events).toContain("rechargée");
  });

  it("réponse perdue (réseau instable) : la base a déjà notre envoi, ce n'est pas un conflit", async () => {
    const base = fakeBase();
    const { saver, events } = saverOn(base);
    await saver.persist(ID, answer("pending", "pending"));
    // L'envoi suivant arrive en base, mais sa réponse se perd.
    const lost = answer("done", "pending");
    base.rows.set(ID, { version: 2, messages: lost });
    expect(await saver.persist(ID, lost)).toBe("ok");
    expect(events).not.toContain("rechargée");
    // Et l'envoi suivant part de la bonne version.
    expect(await saver.persist(ID, answer("done", "done"))).toBe("ok");
    expect(base.rows.get(ID)!.version).toBe(3);
  });

  it("trop longue : rien n'est envoyé au serveur, le coach est prévenu", async () => {
    const base = fakeBase();
    const { saver, events } = saverOn(base);
    const huge = [{ id: 0, from: "coach" as const, text: "x".repeat(2_100_000) }];
    expect(await saver.persist(ID, huge)).toBe("failed");
    expect(base.writes).toHaveLength(0);
    expect(events.some((event) => event.includes("trop longue"))).toBe(true);
  });
});
