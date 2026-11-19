"use client";

import { History, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";

import {
  AssistantComposer,
  AssistantLockTile,
  AssistantOrb,
  AssistantThread,
  assistantLockText,
  remainingLabel,
  SHORTCUTS,
  useAssistant,
} from "@/components/blocks/assistant";
import { MobileBarTool } from "@/components/layout/mobile-bar";
import { DialogBody, Sheet } from "@/components/ui/overlay";
import { assistantComposerOpen } from "@/features/assistant/rules";

// Page de l'Assistant IA (kit « Coory Pages », 02, D-132). Ordinateur : une carte, la colonne
// « Historique » (250 px : « Nouvelle conversation », puis les conversations par date) et la
// conversation (accueil : orbe, salutation, saisie, trois raccourcis ; sinon le fil centré à 720 px
// et « Répondre… » en bas). Téléphone : « Historique » et « Nouvelle conversation » dans la barre du
// haut, la saisie collée en bas. Les conversations ne sont pas enregistrées : l'historique le dit,
// sans fausses lignes. Sans abonnement Coory (D-168) : le verrou à la place de la saisie.
// Téléphone, façon messagerie (19/11, demande d'Antonino sur le modèle de ChatGPT) : pas de carte, tout
// l'écran sur un seul fond ; au centre une seule phrase ; les raccourcis en simples lignes juste
// au-dessus de la saisie, collée en bas (elle remonte avec le clavier). L'ordinateur ne change pas.
const NO_HISTORY =
  "Les conversations ne sont pas enregistrées : « Nouvelle conversation » efface celle en cours.";

export function AssistantView() {
  const assistant = useAssistant();
  const [history, setHistory] = useState(false);
  // Fond uni de tout l'écran (téléphone, globals.css), seulement pendant que la page est affichée.
  useEffect(() => {
    document.documentElement.setAttribute("data-assistant-screen", "");
    return () => document.documentElement.removeAttribute("data-assistant-screen");
  }, []);
  if (!assistant) return null;
  const empty = assistant.messages.length === 0;
  const ready = assistantComposerOpen(assistant.access);
  const lock = assistantLockText(assistant.access);
  const remaining = remainingLabel(assistant.access);

  return (
    <>
      {/* Téléphone : Historique · Nouvelle conversation, dans la barre du haut. */}
      {/* Verrouillé (D-168) : rien à ouvrir dans la barre du téléphone. */}
      {ready ? (
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
            className="grid size-10 place-items-center rounded-xl text-text-2"
          >
            <SquarePen aria-hidden size={16} strokeWidth={1.9} />
          </button>
        </MobileBarTool>
      ) : null}

      <section
        aria-label="Assistant IA"
        className="flex min-h-0 flex-1 lg:overflow-hidden lg:rounded-[20px] lg:bg-surface lg:inset-ring lg:inset-ring-line"
      >
        {/* Verrouillé (D-168) : pas d'historique ni de « Nouvelle conversation ». */}
        {ready ? (
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
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {!ready ? (
            // Sans abonnement : le verrou, ni saisie ni raccourcis (aucune demande ne peut partir).
            <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center lg:px-10">
              <AssistantLockTile />
              <h2 className="text-[24px] leading-[1.2] font-bold tracking-[-0.025em] text-balance lg:text-[28px]">
                {lock.title}
              </h2>
              <p className="max-w-[460px] text-[14.5px] leading-[1.5] text-muted">{lock.detail}</p>
            </div>
          ) : empty ? (
            // Téléphone : la phrase au centre, puis (ordre inversé) les raccourcis en lignes et la saisie
            // en bas ; ordinateur : orbe, salutation, saisie, trois cartes de raccourcis.
            <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-3 pb-1 lg:justify-center lg:gap-6 lg:px-10 lg:py-8">
              <div className="flex flex-col items-center gap-3 text-center max-lg:flex-1 max-lg:justify-center max-lg:px-4">
                <span className="flex max-lg:hidden">
                  <AssistantOrb size={72} />
                </span>
                <h2 className="text-[22px] leading-[1.25] font-semibold tracking-[-0.02em] text-balance lg:text-[32px] lg:leading-[1.2] lg:font-bold lg:tracking-[-0.025em]">
                  Bonjour {assistant.firstName}. Comment puis-je t&apos;aider ?
                </h2>
                <p className="max-w-[460px] text-[14.5px] leading-[1.5] text-muted max-lg:hidden">
                  Séances, programmes, messages : je propose, tu décides. Mes réponses peuvent
                  contenir des erreurs.
                </p>
              </div>
              <div className="flex flex-col gap-2 max-lg:order-3">
                <AssistantComposer rows={3} placeholder="Demande à ton assistant…" />
                <p className="text-center text-[12px] leading-[normal] text-faint">{remaining}</p>
              </div>
              <ul
                aria-label="Raccourcis"
                className="flex flex-col max-lg:order-2 max-lg:px-1 lg:grid lg:grid-cols-3 lg:gap-3"
              >
                {SHORTCUTS.map((shortcut) => (
                  <li key={shortcut.title}>
                    <button
                      type="button"
                      onClick={() => assistant.send(`${shortcut.title} : ${shortcut.text}`)}
                      className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2 lg:h-full lg:flex-col lg:items-start lg:gap-2 lg:rounded-[16px] lg:p-4 lg:inset-ring lg:inset-ring-line"
                    >
                      <span
                        aria-hidden
                        className="grid shrink-0 place-items-center text-violet-text lg:size-9 lg:rounded-[10px] lg:bg-status-accent-soft"
                      >
                        <shortcut.icon size={16} strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0 truncate text-[14.5px] leading-[normal] text-muted lg:contents lg:whitespace-normal">
                        <span className="font-medium text-text lg:text-[15px] lg:font-semibold">
                          {shortcut.title}
                        </span>
                        <span className="lg:hidden"> · </span>
                        <span className="lg:text-[13px] lg:leading-[1.45] lg:text-muted">
                          {shortcut.text}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div className="mx-auto flex min-h-0 w-full max-w-[720px] flex-1 flex-col pt-2 lg:px-10 lg:pt-6">
                <AssistantThread className="flex-1 pb-4 max-lg:px-1" />
              </div>
              <div className="mx-auto flex w-full max-w-[720px] flex-col gap-2 pb-1 lg:px-10 lg:pb-7">
                <AssistantComposer rows={2} placeholder="Répondre…" />
                <p className="text-center text-[12px] leading-[normal] text-faint">{remaining}</p>
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
