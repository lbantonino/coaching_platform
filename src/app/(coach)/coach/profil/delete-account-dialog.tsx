"use client";

import { Download, TriangleAlert } from "lucide-react";
import { useActionState, useId, useState, type ReactNode } from "react";

import {
  dlgCancelButtonClass,
  dlgDangerButtonClass,
  dlgInputClass,
  dlgLabelClass,
} from "@/components/ui/dialog-styles";
import { Overlay } from "@/components/ui/overlay";
import { deleteMyAccount, type DeleteAccountState } from "@/features/account/delete-account";
import { CONFIRMATION_WORD } from "@/features/account/rules";

// « Supprimer mon compte » (décisions d'Antonino du 18/11/2026) : la confirmation du kit (tuile rose,
// titre 21/700, texte gris, « Annuler » + action rouge), avec en plus le lien vers l'export et le mot
// à taper. Le bouton rouge ne s'active qu'avec « SUPPRIMER » exact ; le serveur revérifie le mot.
// Après la suppression, l'action renvoie vers la page de confirmation (le coach est déconnecté).

const INITIAL: DeleteAccountState = { error: null, attempt: 0 };

export function DeleteAccountButton({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {/* Remontée à chaque ouverture : le mot tapé et l'erreur d'avant ne restent pas. */}
      {open ? <DeleteAccountDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(deleteMyAccount, INITIAL);
  const [word, setWord] = useState("");
  const titleId = useId();
  const bodyId = useId();
  const fieldId = useId();
  const errorId = useId();
  const ready = word === CONFIRMATION_WORD;
  return (
    <Overlay
      open
      onClose={pending ? () => undefined : onClose}
      labelledBy={titleId}
      describedBy={bodyId}
      size="confirm"
    >
      {/* Pas de « data-sheet-grab » ni de « touch-none » ici (relecture du 18/11) : plus haute que la
          confirmation simple, la fenêtre doit défiler au doigt sur un petit téléphone ou clavier
          ouvert ; on la glisse vers le bas par sa poignée. */}
      <form
        action={formAction}
        className="flex min-h-0 flex-auto flex-col overflow-y-auto overscroll-contain px-5 pt-3.5 pb-[26px] md:p-7"
      >
        <span
          aria-hidden
          className="grid size-[52px] shrink-0 place-items-center rounded-[16px] bg-dlg-danger-soft text-dlg-danger-ink"
        >
          <TriangleAlert size={24} strokeWidth={1.9} />
        </span>
        <h2
          id={titleId}
          className="mt-[18px] text-[21px] leading-[1.25] font-bold tracking-[-0.02em]"
        >
          Supprimer ton compte ?
        </h2>
        <p id={bodyId} className="mt-2 text-[15px] leading-[1.55] text-pretty text-muted">
          Ton compte et toutes les données de ton organisation seront effacés définitivement :
          sportifs, programmes, agenda, paiements, dépenses, tâches, documents et photos. Rien ne
          pourra être récupéré.
        </p>
        <a
          href="/coach/profil/export"
          download
          className="mt-3.5 inline-flex min-h-11 items-center gap-2 self-start rounded-[10px] text-[15px] leading-[normal] font-semibold text-violet underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dlg-accent md:min-h-9"
        >
          <Download aria-hidden size={17} strokeWidth={2} />
          Télécharger mes données d&apos;abord
        </a>
        <div className="mt-4 flex flex-col gap-[7px]">
          <label htmlFor={fieldId} className={dlgLabelClass}>
            Tape {CONFIRMATION_WORD} pour confirmer
          </label>
          <input
            id={fieldId}
            name="confirmation"
            value={word}
            onChange={(event) => setWord(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            // Entrée (« OK » du clavier, qui fait penser à « fermer le clavier ») ne supprime rien :
            // seul le bouton rouge le fait (relecture du 18/11).
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? errorId : undefined}
            className={dlgInputClass}
          />
        </div>
        {state.error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-3 text-[13.5px] leading-[1.45] font-medium text-dlg-danger-ink"
          >
            {state.error}
          </p>
        ) : null}
        {/* « Supprimer définitivement » ne tient pas dans une demi-largeur : l'un sous l'autre sur
            téléphone (l'action en haut, « Annuler » au pouce), « Annuler » à sa largeur sur ordinateur. */}
        <div className="mt-[26px] flex flex-col-reverse gap-2.5 md:grid md:grid-cols-[auto_1fr]">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={pending}
            className={dlgCancelButtonClass}
          >
            Annuler
          </button>
          <button type="submit" disabled={!ready || pending} className={dlgDangerButtonClass}>
            {pending ? "Suppression…" : "Supprimer définitivement"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
