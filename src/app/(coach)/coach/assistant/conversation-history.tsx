"use client";

import { FileDown, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useAssistant } from "@/components/blocks/assistant";
import { navItemClass } from "@/components/ui/nav-item";
import { MoreMenu } from "@/components/ui/more-menu";
import { ConfirmDialog } from "@/components/ui/overlay";
import { Quoted } from "@/components/ui/quoted";
import { expiresSoon, historyGroups } from "@/features/assistant/conversation-rules";
import type { ConversationSummary } from "@/features/assistant/conversations";
import { formatDayMonth, todayIsoInBrussels } from "@/lib/format";

// Historique des conversations de l'Assistant IA (D-212, 27/11/2026) : la colonne de gauche de la
// page (ordinateur) et la feuille « Historique » (téléphone). Groupées par date du dernier message ;
// la conversation ouverte est surlignée ; « Effacée le … » dans ses 30 derniers jours ; « ⋯ » :
// télécharger le PDF, supprimer (avec confirmation). Visible même quand l'assistant est verrouillé.
export const EMPTY_HISTORY =
  "Tes conversations apparaîtront ici. Elles sont gardées 12 mois après leur dernier message.";
export const DEMO_HISTORY = "Le compte de démonstration ne garde pas les conversations.";

export function ConversationHistory({
  onPicked,
  large = false,
}: {
  // Téléphone : fermer la feuille une fois la conversation choisie.
  onPicked?: () => void;
  // Téléphone : lignes de 44 px pour le doigt.
  large?: boolean;
}) {
  const assistant = useAssistant();
  const [removing, setRemoving] = useState<ConversationSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = assistant?.refreshHistory;
  const mode = assistant?.historyMode;

  useEffect(() => {
    if (mode === "saved") void refresh?.();
  }, [mode, refresh]);

  if (!assistant || assistant.historyMode === "off") return null;
  if (assistant.historyMode === "demo") {
    return <p className="px-1.5 text-[13px] leading-[1.5] text-faint">{DEMO_HISTORY}</p>;
  }
  const list = assistant.history;
  if (list === null) {
    return <p className="px-1.5 text-[13px] leading-[1.5] text-faint">Chargement…</p>;
  }
  if (list.length === 0) {
    return <p className="px-1.5 text-[13px] leading-[1.5] text-faint">{EMPTY_HISTORY}</p>;
  }
  const today = todayIsoInBrussels();

  return (
    <>
      <div className="flex flex-col gap-4">
        {historyGroups(list, today).map((group) => (
          <section key={group.label} aria-label={group.label} className="flex flex-col gap-0.5">
            <h3 className="px-1.5 pb-1 text-[11.5px] font-semibold tracking-[0.06em] text-faint uppercase">
              {group.label}
            </h3>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.id === assistant.conversationId;
                const soon = expiresSoon(item.expiresOn, today);
                const pdf = assistant.pdfHref(item.id);
                return (
                  <li key={item.id} className="group relative flex items-center">
                    <button
                      type="button"
                      aria-current={active ? "true" : undefined}
                      onClick={() => {
                        void assistant.openConversation(item.id);
                        onPicked?.();
                      }}
                      className={`${navItemClass(active, large)} h-auto min-w-0 flex-1 flex-col items-start justify-center gap-0.5 py-2 text-left ${large ? "pr-14" : "pr-10"} ${large ? "min-h-11" : "min-h-[34px]"}`}
                    >
                      <span className="w-full truncate text-text">{item.title}</span>
                      {soon ? (
                        <span className="text-[12px] text-muted">
                          Effacée le {formatDayMonth(item.expiresOn)}
                        </span>
                      ) : null}
                    </button>
                    <div
                      className={`absolute right-1 ${large || active ? "" : "lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"}`}
                    >
                      <MoreMenu
                        label={`Plus d'actions sur la conversation « ${item.title} »`}
                        title="Conversation"
                        width={220}
                        items={[
                          ...(pdf
                            ? [
                                {
                                  label: "Télécharger le PDF",
                                  icon: FileDown,
                                  onSelect: () => window.open(pdf, "_blank", "noopener"),
                                },
                              ]
                            : []),
                          {
                            label: "Supprimer",
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => setRemoving(item),
                          },
                        ]}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        pending={busy}
        title="Supprimer cette conversation ?"
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (!removing) return;
          setBusy(true);
          void assistant.removeConversation(removing.id).finally(() => {
            setBusy(false);
            setRemoving(null);
          });
        }}
      >
        {removing ? (
          <>
            <Quoted>{removing.title}</Quoted> sera effacée tout de suite, sur tous tes appareils. Tu
            peux d&apos;abord la télécharger en PDF.
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
