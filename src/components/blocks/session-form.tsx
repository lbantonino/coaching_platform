"use client";

import { useActionState, useEffect, type ReactNode } from "react";

import type { SessionFormState } from "@/features/sessions/actions";
import type { SessionFormInput } from "@/features/sessions/schemas";

import { SessionAppleFields, type SessionDraft } from "./session-apple-fields";

// Formulaire d'une séance encadrée : la fenêtre « Nouvelle séance » (feuille façon iPhone ou bulle du
// Mac, D-204) et la page « Modifier la séance » (D-206), toutes deux façon Calendrier d'Apple. L'action
// serveur, les champs envoyés et les règles (TVA, nouveau sportif, alertes) sont les mêmes partout.
type Action = (previous: SessionFormState, formData: FormData) => Promise<SessionFormState>;

// Sportif proposé : photo et sexe pour l'avatar du récapitulatif (page Modifier).
type SessionAthleteChoice = {
  id: string;
  name: string;
  photoPath?: string | null;
  sex?: "female" | "male" | null;
};

type Props = {
  action: Action;
  athletes: SessionAthleteChoice[];
  initial: SessionFormInput;
  // Modification : le type (et le sportif d'une séance individuelle) ne changent pas. La page
  // « Modifier » est toujours verrouillée, la fenêtre « Nouvelle séance » jamais (ses propres champs).
  locked: boolean;
  submitLabel: string;
  // Page « Modifier la séance » : retour (Annuler), chemin des fiches (« Voir la fiche ») et bloc de
  // suppression (formulaire de l'action serveur, rendu par la page).
  cancelHref?: string;
  athletesPath?: string;
  footer?: ReactNode;
  // Fenêtre de l'agenda : la création reste sur la page et prévient la fenêtre (sinon : page de la séance).
  onCreated?: (created: { id: string; title: string; newAthleteName: string | null }) => void;
  // Fenêtre : « Annuler » (✕ de la feuille, Échap de la bulle).
  onCancel?: () => void;
  // Fenêtre : feuille façon iPhone, ou bulle accrochée au créneau de l'agenda (ordinateur, D-204).
  layout?: "sheet" | "popover";
  // Bulle de l'ordinateur : la grille de l'agenda montre la séance provisoire pendant la saisie.
  onDraft?: (draft: SessionDraft) => void;
};

export function SessionForm({
  action,
  athletes,
  initial,
  submitLabel,
  onCreated,
  onCancel,
  layout = "sheet",
  onDraft,
  cancelHref = "",
  athletesPath = "",
  footer,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    attempt: 0,
    values: null,
  });
  const created = state.created ?? null;
  useEffect(() => {
    if (created) onCreated?.(created);
  }, [created, onCreated]);
  if (onCreated) {
    return (
      <SessionAppleFields
        key={state.attempt}
        formAction={formAction}
        pending={pending}
        error={state.error}
        values={state.values ?? initial}
        athletes={athletes}
        submitLabel={submitLabel}
        onCancel={onCancel ?? (() => {})}
        layout={layout}
        onDraft={onDraft}
      />
    );
  }
  // Page « Modifier la séance » (D-206) : les mêmes cartes façon Apple, reconstruites après chaque
  // réponse (la saisie renvoyée s'affiche partout).
  return (
    <SessionAppleFields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.error}
      values={state.values ?? initial}
      athletes={athletes}
      submitLabel={submitLabel}
      onCancel={() => {}}
      layout="page"
      cancelHref={cancelHref}
      athletesPath={athletesPath}
      footer={footer}
    />
  );
}
