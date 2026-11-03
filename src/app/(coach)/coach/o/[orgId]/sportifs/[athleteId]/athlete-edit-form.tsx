"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, ficheHintClass, ficheOvertitleClass } from "@/components/ui/form-styles";
import { Segmented } from "@/components/ui/segmented";
import {
  updateAthlete,
  type AddressFormValues,
  type AthleteFormValues,
  type UpdateAthleteState,
} from "@/features/athletes/actions";
import type { AthleteStatus } from "@/features/athletes/schemas";

import {
  AddressFields,
  ContactFields,
  IdentityFields,
  Part,
  SportProfileFields,
} from "../athlete-fields";

type Props = {
  organizationId: string;
  athleteId: string;
  hasAccount: boolean;
  // Valeurs enregistrées, en chaînes (« » = non renseigné), au même format que la saisie.
  values: AthleteFormValues & AddressFormValues;
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
    // Habillage de la maquette « Sportifs » du 03/11/2026 (onglet Profil) : groupes sous sur-titres,
    // champs en grille, statut en contrôle segmenté, « Enregistrer » en bas à gauche.
    <form key={state.attempt} action={formAction} className="flex flex-col gap-4" noValidate>
      <Part title="Identité" look="fiche">
        <IdentityFields values={shown} look="fiche" />
      </Part>

      <Part title="Contact" look="fiche">
        <ContactFields values={shown} hasAccount={hasAccount} look="fiche" />
      </Part>

      <Part title="Adresse" look="fiche">
        <AddressFields values={shown} look="fiche" />
      </Part>

      <Part title="Profil sportif" look="fiche">
        <SportProfileFields values={shown} look="fiche" />
      </Part>

      <div className="flex flex-col gap-2">
        {/* Le sur-titre seul ; le groupe garde son nom « Statut » pour les lecteurs d'écran. */}
        <p aria-hidden className={`${ficheOvertitleClass} mb-2`}>
          Statut
        </p>
        <Segmented
          name="status"
          legend="Statut"
          look="track"
          defaultValue={shown.status as AthleteStatus}
          options={[
            { value: "active", label: "Actif" },
            { value: "paused", label: "En pause" },
            { value: "archived", label: "Archivé" },
          ]}
        />
        <p className={ficheHintClass}>
          Archiver retire le sportif de la liste active sans rien effacer ; tu peux le restaurer à
          tout moment.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({
            variant: "primary",
            size: "md",
            className: "rounded-[12px]! text-[14px]! font-medium!",
          })}
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-[13px] font-medium text-ok">
            Modifications enregistrées.
          </p>
        ) : null}
      </div>
    </form>
  );
}
