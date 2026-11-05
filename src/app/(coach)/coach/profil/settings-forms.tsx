"use client";

import { useActionState, useEffect, useId, useRef, type ReactNode } from "react";

import { DlgField } from "@/components/ui/dialog-fields";
import {
  dlgFormGridClass,
  dlgInputClass,
  dlgPrimaryButtonClass,
} from "@/components/ui/dialog-styles";
import { FieldCheck } from "@/components/ui/field-check";
import { DialogFooter } from "@/components/ui/overlay";
import { errorTextClass } from "@/components/ui/form-styles";
import {
  renameOrganization,
  updateProfile,
  type SettingsState,
} from "@/features/coach/settings-actions";
import type { ProfileInput } from "@/features/coach/settings";

// Rubrique Profil de la fenêtre des Paramètres (kit des boîtes, 33), déjà faite : à ne pas modifier
// (kit « Coory Pages », page 13). Les autres rubriques sont dans settings-sections.tsx (D-127).
// Le formulaire garde la saisie après une erreur (`attempt` le reconstruit) et confirme dessous.
function initial<T>(): SettingsState<T> {
  return { error: null, saved: false, attempt: 0, values: null };
}

function Feedback({ state, saved }: { state: SettingsState<unknown>; saved: string }) {
  if (state.error) {
    return (
      <p role="alert" className={errorTextClass}>
        {state.error}
      </p>
    );
  }
  return state.saved ? (
    <p role="status" className="text-small text-ok">
      {state.message ?? saved}
    </p>
  ) : null;
}

// Section Profil de la fenêtre des Paramètres (kit, boîte 33) : la photo, puis une seule grille de
// champs (prénom, nom, entreprise, téléphone, nom de l'organisation) et un pied « Annuler /
// Enregistrer ». Deux enregistrements restent distincts (profil ; nom de l'organisation, réservé au
// propriétaire) : chaque champ est relié à son formulaire par l'attribut `form`, et « Enregistrer »
// envoie le profil, plus le nom de l'organisation s'il a changé.
export function ProfileDialogSection({
  values,
  organization,
  photo,
  onSaved,
  onCancel,
}: {
  values: ProfileInput;
  organization: { id: string; name: string; isOwner: boolean };
  photo: ReactNode;
  onSaved?: () => void;
  onCancel: () => void;
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    initial<ProfileInput>(),
  );
  const [orgState, orgAction, orgPending] = useActionState(
    renameOrganization.bind(null, organization.id),
    initial<{ name: string }>(),
  );
  const profileForm = useRef<HTMLFormElement>(null);
  const orgForm = useRef<HTMLFormElement>(null);
  const orgInput = useRef<HTMLInputElement>(null);
  const profileId = useId();
  const orgId = useId();
  useEffect(() => {
    if (profileState.saved) onSaved?.();
  }, [profileState, onSaved]);
  const v = profileState.values ?? values;
  const orgName = orgState.values?.name ?? organization.name;
  const pending = profilePending || orgPending;
  const save = () => {
    profileForm.current?.requestSubmit();
    if (organization.isOwner && orgInput.current && orgInput.current.value !== orgName) {
      orgForm.current?.requestSubmit();
    }
  };

  return (
    <>
      <div
        data-dialog-body
        className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-6 md:px-6 md:py-4"
      >
        {/* Téléphone (kit « Coory Pages », page 13, D-127) : le contenu, inchangé, dans une carte
            blanche sur le fond de la fenêtre, comme les autres rubriques. */}
        <div className="flex flex-col gap-[22px] max-md:rounded-[22px] max-md:bg-surface max-md:px-4 max-md:py-[18px]">
          {photo}
          {/* Formulaires sans contenu (les champs y sont reliés par `form`) : hors de la mise en page. */}
          <form
            ref={profileForm}
            id={profileId}
            key={profileState.attempt}
            action={profileAction}
            noValidate
            hidden
          />
          <form
            ref={orgForm}
            id={orgId}
            key={`org-${orgState.attempt}`}
            action={orgAction}
            noValidate
            hidden
          />
          <section
            aria-label="Identité"
            key={`${profileState.attempt}-${orgState.attempt}`}
            className={dlgFormGridClass}
          >
            <DlgField label="Prénom" htmlFor="coach-first-name" half>
              <input
                id="coach-first-name"
                form={profileId}
                name="firstName"
                autoComplete="given-name"
                maxLength={80}
                defaultValue={v.firstName}
                className={dlgInputClass}
              />
            </DlgField>
            <DlgField label="Nom" htmlFor="coach-last-name" optional half>
              <input
                id="coach-last-name"
                form={profileId}
                name="lastName"
                autoComplete="family-name"
                maxLength={80}
                defaultValue={v.lastName}
                className={dlgInputClass}
              />
            </DlgField>
            <DlgField label="Entreprise" htmlFor="coach-company" optional half>
              <input
                id="coach-company"
                form={profileId}
                name="companyName"
                autoComplete="organization"
                maxLength={120}
                placeholder="Ex. : nom de ton activité"
                defaultValue={v.companyName}
                className={dlgInputClass}
              />
            </DlgField>
            <DlgField label="Téléphone" htmlFor="coach-phone" optional half>
              <input
                id="coach-phone"
                form={profileId}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+32 …"
                defaultValue={v.phone}
                className={dlgInputClass}
              />
              <FieldCheck htmlFor="coach-phone" rule="phone" />
            </DlgField>
            <DlgField label="Nom de l'organisation" htmlFor="organization-name">
              <input
                ref={orgInput}
                id="organization-name"
                form={orgId}
                name="organizationName"
                maxLength={120}
                defaultValue={orgName}
                disabled={!organization.isOwner}
                aria-describedby={organization.isOwner ? undefined : "organization-owner-hint"}
                className={dlgInputClass}
              />
              {organization.isOwner ? null : (
                <p id="organization-owner-hint" className="text-[13px] leading-[1.5] text-muted">
                  Seul le propriétaire peut renommer l&apos;organisation.
                </p>
              )}
            </DlgField>
          </section>
          <div className="flex flex-col gap-1 empty:hidden">
            <Feedback state={profileState} saved="Profil enregistré." />
            <Feedback state={orgState} saved="Organisation renommée." />
          </div>
        </div>
      </div>
      <DialogFooter
        onCancel={onCancel}
        primary={
          <button type="button" onClick={save} disabled={pending} className={dlgPrimaryButtonClass}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        }
      />
    </>
  );
}
