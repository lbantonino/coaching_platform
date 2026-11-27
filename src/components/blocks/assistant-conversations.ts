"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AssistantMessage } from "@/features/assistant/conversation-rules";
import {
  ConversationSaver,
  type SaveOutcome,
  type StoredConversation,
} from "@/features/assistant/conversation-saver";
import type {
  ConversationSummary,
  SaveConversationResult,
} from "@/features/assistant/conversations";

export type { SaveOutcome };

// Conversations de l'Assistant IA enregistrées (D-212, 27/11/2026), côté navigateur : chaque
// changement de la conversation affichée part au serveur par la file de ConversationSaver (un envoi à
// la fois ; écran périmé, conversation supprimée ailleurs ou réponse perdue : voir conversation-saver).

// Actions serveur liées à l'organisation (layout coach) ; absentes pour le compte de démonstration.
export type ConversationActions = {
  save: (input: {
    id: string;
    version: number;
    messages: AssistantMessage[];
  }) => Promise<SaveConversationResult>;
  list: () => Promise<ConversationSummary[]>;
  load: (id: string) => Promise<StoredConversation | null>;
  remove: (id: string) => Promise<{ ok: boolean }>;
  // « …/assistant/conversations » : le PDF d'une conversation est à « <pdfBase>/<id>/pdf ».
  pdfBase: string;
};

// Identifiant d'une nouvelle conversation (uuid v4). crypto.randomUUID n'existe que sur une page
// sécurisée (https) : l'iPhone qui teste en http://<IP du Mac> ne l'a pas, getRandomValues si.
export function newConversationId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function useConversationSync({
  actions,
  conversationId,
  messages,
  onConflict,
  onGone,
}: {
  actions: ConversationActions | undefined;
  conversationId: string | null;
  messages: AssistantMessage[];
  // Plus récente ailleurs : la remplacer à l'écran (elle vient d'être relue en base).
  onConflict: (stored: StoredConversation) => void;
  // Supprimée ailleurs : repartir d'une conversation vide (elle ne revient pas).
  onGone: () => void;
}) {
  const [history, setHistory] = useState<ConversationSummary[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Les dernières valeurs, lues par la file au moment de chaque envoi.
  const latest = useRef({ actions, conversationId, onConflict, onGone });
  useEffect(() => {
    latest.current = { actions, conversationId, onConflict, onGone };
  });

  const refreshHistory = useCallback(async () => {
    const current = latest.current.actions;
    if (!current) return;
    try {
      setHistory(await current.list());
    } catch {
      // Historique indisponible un instant : la liste affichée reste.
    }
  }, []);

  // La file, créée à la première utilisation (jamais pendant l'affichage).
  const saverRef = useRef<ConversationSaver | null>(null);
  const saver = useCallback((): ConversationSaver => {
    saverRef.current ??= new ConversationSaver({
      save: (input) =>
        latest.current.actions
          ? latest.current.actions.save(input)
          : Promise.resolve({ ok: false, kind: "invalid", error: "" }),
      load: (id) => latest.current.actions?.load(id) ?? Promise.resolve(null),
      isShown: (id) => latest.current.conversationId === id,
      onConflict: (stored) => latest.current.onConflict(stored),
      onGone: () => latest.current.onGone(),
      notice: setNotice,
      saved: () => void refreshHistory(),
    });
    return saverRef.current;
  }, [refreshHistory]);

  const persist = useCallback(
    (id: string, list: AssistantMessage[], from?: number): Promise<SaveOutcome> =>
      latest.current.actions ? saver().persist(id, list, from) : Promise.resolve("off"),
    [saver],
  );
  const remember = useCallback((stored: StoredConversation) => saver().remember(stored), [saver]);
  const forget = useCallback((id: string) => saver().forget(id), [saver]);
  const generation = useCallback((id: string) => saver().generation(id), [saver]);

  // Chaque changement de la conversation affichée part au serveur (les messages ne changent qu'à un
  // message ou un geste sur une carte, jamais à la frappe).
  useEffect(() => {
    if (actions && conversationId && messages.length > 0) void persist(conversationId, messages);
  }, [actions, conversationId, messages, persist]);

  // Objet stable entre deux rendus tant que rien ne change (l'état partagé de l'assistant en dépend).
  return useMemo(
    () => ({ history, refreshHistory, notice, setNotice, persist, remember, forget, generation }),
    [history, refreshHistory, notice, persist, remember, forget, generation],
  );
}
