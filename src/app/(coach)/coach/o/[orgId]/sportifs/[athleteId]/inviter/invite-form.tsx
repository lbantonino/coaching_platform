"use client";

import { useActionState, useState } from "react";

import { errorTextClass, inputClass, primaryButtonClass } from "@/components/ui/form-styles";
import { createInvitation, type CreateInvitationState } from "@/features/invitations/actions";

const initialState: CreateInvitationState = { error: null, link: null, expiresAt: null };

type Props = {
  organizationId: string;
  athleteId: string;
  hasPendingInvite: boolean;
  hasEmail: boolean;
};

export function InviteForm({ organizationId, athleteId, hasPendingInvite, hasEmail }: Props) {
  const [state, formAction, pending] = useActionState(
    createInvitation.bind(null, organizationId, athleteId),
    initialState,
  );
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
    } catch {
      // Presse-papiers indisponible (navigateur, permissions) : le lien reste sélectionnable à la main.
      setCopied(false);
    }
  }

  if (state.link) {
    return (
      <div className="flex flex-col gap-3">
        <label htmlFor="invite-link" className="text-small font-medium">
          Lien d&apos;invitation (affiché une seule fois)
        </label>
        <input
          id="invite-link"
          readOnly
          value={state.link}
          onFocus={(event) => event.currentTarget.select()}
          className={`${inputClass} font-mono text-small`}
        />
        <button type="button" onClick={copyLink} className={primaryButtonClass}>
          {copied ? "Lien copié" : "Copier le lien"}
        </button>
        <p role="status" className="text-small text-muted">
          {copied
            ? "Colle-le dans ton message au sportif (WhatsApp, e-mail…)."
            : "Copie ce lien maintenant : il ne pourra pas être réaffiché."}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      ) : null}
      {!hasEmail ? (
        <p className={errorTextClass}>
          Cette fiche n&apos;a pas d&apos;adresse e-mail : il faut en ajouter une avant de pouvoir
          inviter le sportif.
        </p>
      ) : null}
      <button type="submit" disabled={pending || !hasEmail} className={primaryButtonClass}>
        {pending
          ? "Création du lien…"
          : hasPendingInvite
            ? "Générer un nouveau lien (remplace l'ancien)"
            : "Générer le lien d'invitation"}
      </button>
    </form>
  );
}
