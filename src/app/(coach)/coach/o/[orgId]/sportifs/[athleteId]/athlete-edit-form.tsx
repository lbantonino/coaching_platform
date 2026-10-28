"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass } from "@/components/ui/form-styles";
import { Segmented } from "@/components/ui/segmented";
import {
  updateAthlete,
  type AthleteFormValues,
  type UpdateAthleteState,
} from "@/features/athletes/actions";
import type { AthleteStatus } from "@/features/athletes/schemas";

import { ContactFields, IdentityFields, Part, SportProfileFields } from "../athlete-fields";

type Props = {
  organizationId: string;
  athleteId: string;
  hasAccount: boolean;
  // Valeurs enregistrées, en chaînes (« » = non renseigné), au même format que la saisie.
  values: AthleteFormValues;
};

const initialState: UpdateAthleteState = { error: null, saved: false, attempt: 0, values: null };

export function AthleteEditForm({ organizationId, athleteId, hasAccount, values }: Props) {
  // Organisation et fiche liées à l'action ; l'action les revérifie côté serveur.
  const [state, formAction, pending] = useActionState(
    updateAthlete.bind(null, organizationId, athleteId),
    initialState,
  );
  // Après une erreur, on réaffiche la saisie ; sinon les valeurs enregistrées.
  const shown = state.values ?? values;

  return (
    // Reconstruit après chaque réponse : la saisie renvoyée (ou enregistrée) s'affiche partout.
    <form key={state.attempt} action={formAction} className="flex flex-col gap-7" noValidate>
      <Part title="Identité">
        <IdentityFields values={shown} />
      </Part>

      <Part title="Contact">
        <ContactFields values={shown} hasAccount={hasAccount} />
      </Part>

      <Part title="Profil sportif">
        <SportProfileFields values={shown} />
      </Part>

      <div className="flex flex-col gap-1.5">
        <Segmented
          name="status"
          legend="Statut"
          defaultValue={shown.status as AthleteStatus}
          options={[
            { value: "active", label: "Actif" },
            { value: "paused", label: "En pause" },
            { value: "archived", label: "Archivé" },
          ]}
        />
        <p className={hintClass}>
          Archiver retire le sportif de la liste active sans rien effacer ; tu peux le restaurer à
          tout moment.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "primary", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-small text-ok">
            Modifications enregistrées.
          </p>
        ) : null}
      </div>
    </form>
  );
}
