import {
  CONVERSATION_ERRORS,
  conversationTooLarge,
  type AssistantMessage,
  type ConversationError,
} from "./conversation-rules";

// File d'enregistrement des conversations de l'Assistant IA (D-212), sans React : testable seule.
// Relecture du 27/11 : la même conversation ouverte sur deux appareils ne doit JAMAIS faire exécuter une
// carte deux fois, ni ressusciter une conversation supprimée, ni écraser une version plus récente.
//
// - Un envoi à la fois, dans l'ordre ; rien si rien n'a changé.
// - Chaque conversation a une « génération » : elle change quand la conversation est relue en base
//   (rouverte, plus récente ailleurs) ou supprimée. Un envoi préparé à partir d'une génération passée
//   (l'écran d'avant) est abandonné sans rien écrire : il répond « conflict ».
// - Une conversation supprimée (ici ou ailleurs) est « enterrée » : plus aucun envoi ne la recrée.
// - Réponse perdue (réseau instable) : la base a déjà ce qu'on a envoyé ; ce n'est pas un conflit.

export type SaveResult =
  { ok: true; version: number } | { ok: false; kind: ConversationError; error: string };

export type StoredConversation = { id: string; version: number; messages: AssistantMessage[] };

// « off » : rien n'est enregistré (démo, pas d'organisation) ; « failed » : pas enregistré (trop
// long, réseau) ; « conflict » / « gone » : écran périmé / conversation supprimée.
export type SaveOutcome = "ok" | "conflict" | "gone" | "failed" | "off";

export type SaverHooks = {
  save: (input: {
    id: string;
    version: number;
    messages: AssistantMessage[];
  }) => Promise<SaveResult>;
  load: (id: string) => Promise<StoredConversation | null>;
  // La conversation est-elle celle affichée ?
  isShown: (id: string) => boolean;
  // Plus récente ailleurs : l'afficher (elle vient d'être relue en base).
  onConflict: (stored: StoredConversation) => void;
  // Supprimée ailleurs : repartir d'une conversation vide.
  onGone: () => void;
  notice: (text: string | null) => void;
  saved: () => void;
};

export class ConversationSaver {
  private versions = new Map<string, number>();
  private stored = new Map<string, string>();
  private attempted = new Map<string, string>();
  private generations = new Map<string, number>();
  private buried = new Set<string>();
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private hooks: SaverHooks) {}

  generation(id: string): number {
    return this.generations.get(id) ?? 0;
  }

  private bump(id: string) {
    this.generations.set(id, this.generation(id) + 1);
  }

  // Ce que la base contient (conversation rouverte ou rechargée) : les envois préparés avant sont
  // abandonnés.
  remember(conversation: StoredConversation) {
    this.buried.delete(conversation.id);
    this.versions.set(conversation.id, conversation.version);
    this.stored.set(conversation.id, JSON.stringify(conversation.messages));
    this.bump(conversation.id);
  }

  // Supprimée par le coach : elle ne revient jamais, même par un envoi déjà en file.
  forget(id: string) {
    this.buried.add(id);
    this.versions.delete(id);
    this.stored.delete(id);
    this.bump(id);
  }

  // `from` : la génération de l'écran à partir duquel la liste a été construite (par défaut,
  // l'actuelle).
  persist(id: string, list: AssistantMessage[], from = this.generation(id)): Promise<SaveOutcome> {
    const run = this.queue
      .catch(() => undefined)
      .then(() => this.send(id, list, from))
      .catch((): SaveOutcome => "failed");
    this.queue = run;
    return run;
  }

  private async send(id: string, list: AssistantMessage[], from: number): Promise<SaveOutcome> {
    if (this.buried.has(id)) return "gone";
    if (from !== this.generation(id)) return "conflict";
    const json = JSON.stringify(list);
    if (this.stored.get(id) === json) return "ok";
    const shown = this.hooks.isShown(id);
    if (conversationTooLarge(list)) {
      if (shown) this.hooks.notice(CONVERSATION_ERRORS["too-large"]);
      return "failed";
    }
    this.attempted.set(id, json);
    const result = await this.hooks.save({
      id,
      version: this.versions.get(id) ?? 0,
      messages: list,
    });
    if (result.ok) {
      this.versions.set(id, result.version);
      this.stored.set(id, json);
      if (shown) this.hooks.notice(null);
      this.hooks.saved();
      return "ok";
    }
    if (result.kind === "conflict") {
      const latest = await this.hooks.load(id);
      if (!latest) return this.gone(id, shown);
      // Notre propre envoi précédent est passé, mais sa réponse s'est perdue : rien n'a changé ailleurs.
      if (JSON.stringify(latest.messages) === json) {
        this.versions.set(id, latest.version);
        this.stored.set(id, json);
        return "ok";
      }
      this.remember(latest);
      if (this.hooks.isShown(id)) {
        this.hooks.onConflict(latest);
        this.hooks.notice(result.error);
      }
      return "conflict";
    }
    if (result.kind === "gone") return this.gone(id, shown);
    if (shown) this.hooks.notice(result.error);
    return "failed";
  }

  private gone(id: string, shown: boolean): SaveOutcome {
    this.forget(id);
    if (shown) {
      this.hooks.onGone();
      this.hooks.notice(CONVERSATION_ERRORS.gone);
    }
    this.hooks.saved();
    return "gone";
  }
}
