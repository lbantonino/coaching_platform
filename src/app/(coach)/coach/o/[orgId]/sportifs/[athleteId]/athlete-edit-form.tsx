"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { Segmented } from "@/components/ui/segmented";
import { updateAthlete, type UpdateAthleteState } from "@/features/athletes/actions";
import type { AthleteStatus } from "@/features/athletes/schemas";

type Props = {
  organizationId: string;
  athlete: {
    id: string;
    displayName: string;
    email: string;
    phone: string;
    status: AthleteStatus;
    hasAccount: boolean;
  };
};

const initialState: UpdateAthleteState = { error: null, saved: false, values: null };

export function AthleteEditForm({ organizationId, athlete }: Props) {
  // Organisation et fiche liées à l'action ; l'action les revérifie côté serveur.
  const [state, formAction, pending] = useActionState(
    updateAthlete.bind(null, organizationId, athlete.id),
    initialState,
  );
  // Après une erreur, on réaffiche la saisie ; sinon les valeurs enregistrées.
  const shown = state.values ?? athlete;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="displayName" className={labelClass}>
            Nom du sportif
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="off"
            required
            maxLength={120}
            defaultValue={shown.displayName}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelClass}>
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            inputMode="email"
            defaultValue={shown.email}
            readOnly={athlete.hasAccount}
            aria-describedby={athlete.hasAccount ? "email-hint" : undefined}
            className={inputClass}
          />
          {athlete.hasAccount ? (
            <p id="email-hint" className={hintClass}>
              Identifiant de connexion du sportif : non modifiable ici.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className={labelClass}>
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="off"
            inputMode="tel"
            placeholder="+32 …"
            defaultValue={shown.phone}
            className={inputClass}
          />
        </div>
      </div>

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
