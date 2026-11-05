"use client";

import { History, SquarePen } from "lucide-react";
import { useState } from "react";

import {
  AssistantComposer,
  AssistantOrb,
  AssistantThread,
  SHORTCUTS,
  useAssistant,
} from "@/components/blocks/assistant";
import { MobileBarTool } from "@/components/layout/mobile-bar";
import { DialogBody, Sheet } from "@/components/ui/overlay";

// Page de l'Assistant IA (kit « Coory Pages », 02, D-132). Ordinateur : une carte, la colonne
// « Historique » (250 px : « Nouvelle conversation », puis les conversations par date) et la
// conversation (accueil : orbe, salutation, saisie, trois raccourcis ; sinon le fil centré à 720 px
// et « Répondre… » en bas). Téléphone : « Historique » et « Nouvelle conversation » dans la barre du
// haut, la saisie collée en bas. Les conversations ne sont pas encore enregistrées (décision 15) :
// l'historique le dit, sans fausses lignes.
const NO_HISTORY =
  "Tes conversations apparaîtront ici quand l'assistant sera branché. Pour l'instant, rien n'est enregistré.";

export function AssistantView() {
  const assistant = useAssistant();
  const [history, setHistory] = useState(false);
  if (!assistant) return null;
  const empty = assistant.messages.length === 0;

  return (
    <>
      {/* Téléphone : Historique · Nouvelle conversation, dans la barre du haut. */}
      <MobileBarTool>
        <button
          type="button"
          aria-label="Historique"
          onClick={() => setHistory(true)}
          className="grid size-10 place-items-center rounded-xl text-text-2"
        >
          <History aria-hidden size={17} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          aria-label="Nouvelle conversation"
          onClick={assistant.restart}
          className="grid size-10 place-items-center rounded-xl bg-cta text-on-cta"
        >
          <SquarePen aria-hidden size={16} strokeWidth={1.9} />
        </button>
      </MobileBarTool>

      <section
        aria-label="Assistant IA"
        className="flex min-h-[70vh] flex-1 overflow-hidden rounded-[22px] bg-surface inset-ring inset-ring-line lg:min-h-0 lg:rounded-[20px]"
      >
        <nav
          aria-label="Historique des conversations"
          className="flex w-[250px] shrink-0 flex-col gap-5 border-r border-line px-3.5 py-5 max-lg:hidden"
        >
          <button
            type="button"
            onClick={assistant.restart}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-cta text-[13.5px] leading-[normal] font-semibold text-on-cta transition-[scale,opacity] duration-150 hover:opacity-90 active:scale-[0.98]"
          >
            <SquarePen aria-hidden size={15} strokeWidth={1.9} />
            Nouvelle conversation
          </button>
          <p className="px-1.5 text-[13px] leading-[1.5] text-faint">{NO_HISTORY}</p>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          {empty ? (
            <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-6 px-4 py-8 lg:px-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <AssistantOrb size={72} />
                <h2 className="text-[26px] leading-[1.2] font-bold tracking-[-0.025em] text-balance lg:text-[32px]">
                  Bonjour {assistant.firstName}. Comment puis-je t&apos;aider ?
                </h2>
                <p className="max-w-[460px] text-[14.5px] leading-[1.5] text-muted">
                  Je prépare tes programmes, ton agenda et ton admin. Tu valides.
                </p>
              </div>
              <AssistantComposer rows={3} placeholder="Demande à ton assistant…" />
              <ul aria-label="Raccourcis" className="grid gap-3 sm:grid-cols-3">
                {SHORTCUTS.map((shortcut) => (
                  <li key={shortcut.title}>
                    <button
                      type="button"
                      onClick={() => assistant.send(`${shortcut.title} : ${shortcut.text}`)}
                      className="flex h-full w-full flex-col gap-2 rounded-[16px] p-4 text-left inset-ring inset-ring-line transition-colors duration-150 hover:bg-surface-2"
                    >
                      <span
                        aria-hidden
                        className="grid size-9 place-items-center rounded-[10px] bg-status-accent-soft text-violet-text"
                      >
                        <shortcut.icon size={16} strokeWidth={1.9} />
                      </span>
                      <span className="text-[15px] leading-[normal] font-semibold">
                        {shortcut.title}
                      </span>
                      <span className="text-[13px] leading-[1.45] text-muted">{shortcut.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div className="mx-auto flex min-h-0 w-full max-w-[720px] flex-1 flex-col px-4 pt-6 lg:px-10">
                <AssistantThread className="flex-1 pb-4" />
              </div>
              <div className="mx-auto w-full max-w-[720px] px-4 pb-4 max-lg:sticky max-lg:bottom-0 lg:px-10 lg:pb-7">
                <AssistantComposer rows={2} placeholder="Répondre…" />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Téléphone : l'historique (le kit dessine le bouton, pas le panneau). */}
      <Sheet open={history} onClose={() => setHistory(false)} title="Historique" bare>
        <DialogBody>
          <p className="text-[14px] leading-[1.5] text-muted">{NO_HISTORY}</p>
        </DialogBody>
      </Sheet>
    </>
  );
}
