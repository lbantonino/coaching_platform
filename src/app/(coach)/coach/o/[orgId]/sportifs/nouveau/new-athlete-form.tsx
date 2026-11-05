"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import { FieldCheck } from "@/components/ui/field-check";
import {
  kitHintClass,
  kitInputBaseClass,
  kitInputClass,
  kitLabelClass,
  kitOptionalClass,
} from "@/components/ui/form-styles";
import {
  MobileActionBar,
  mobileActionPrimaryClass,
  mobileActionSecondaryClass,
} from "@/components/ui/mobile-action-bar";
import { ConfirmDialog } from "@/components/ui/overlay";
import { Segmented } from "@/components/ui/segmented";
import { DISCIPLINES, disciplineLabels } from "@/domain/training/discipline";
import { createAthlete, type NewAthleteState } from "@/features/athletes/actions";
import type { NewAthleteFormInput } from "@/features/athletes/new-athlete";
import type { AthleteStatus } from "@/features/athletes/schemas";
import { COACH_PROOFS, coachProofLabels } from "@/features/consents/schemas";
import { goalTypeGroups, goalTypeLabels } from "@/features/goals/schemas";

import {
  AvailabilityFields,
  CoachNoteField,
  ContactFields,
  HealthConstraintsField,
  IdentityFields,
  SportProfileFields,
} from "../athlete-fields";

// Page « Nouveau sportif » (D-54, refaite au kit « Coory Pages », page 10, D-126) : la fiche complète
// en une fois, en six cartes numérotées empilées sur toute la largeur (plafond 1 120 px) ; les champs
// sur deux colonnes à partir de 900 px. Seul le prénom est obligatoire : « Enregistrer le sportif »
// reste grisé tant qu'il est vide (le serveur le revérifie). Ordinateur : sous les cartes, le rappel
// « Données de santé » à gauche, le bouton à droite. Téléphone : barre fixe « Annuler / Enregistrer
// le sportif ». Notes (D-56) : les blessures n'existent qu'avec l'accord du sportif (interrupteur),
// puis des notes libres, privées au coach.
const emptyValues: NewAthleteFormInput = {
  firstName: "",
  lastName: "",
  sex: "",
  email: "",
  phone: "",
  status: "active",
  preferredContact: "",
  level: "",
  experience: "",
  trainingPlaces: [],
  equipment: "",
  programType: "",
  sessionsPerWeek: "",
  maxSessionMinutes: "",
  availableDays: [],
  scheduleConstraints: "",
  healthConstraints: "",
  goalType: "",
  goalDate: "",
  competitionName: "",
  healthConsent: false,
  consentProof: "",
  coachNote: "",
};

const initialState: NewAthleteState = { error: null, attempt: 0, values: null };

export function NewAthleteForm({
  organizationId,
  cancelHref,
}: {
  organizationId: string;
  // « Annuler » (barre du téléphone) : l'écran précédent, la liste des sportifs.
  cancelHref: string;
}) {
  // L'organisation est liée à l'action ; l'action la revérifie de toute façon côté serveur.
  const [state, formAction, pending] = useActionState(
    createAthlete.bind(null, organizationId),
    initialState,
  );
  return (
    // Reconstruit après chaque réponse : la saisie renvoyée s'affiche partout, menus et cases compris.
    <NewAthleteFields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.error}
      values={state.values ?? emptyValues}
      cancelHref={cancelHref}
    />
  );
}

// Carte numérotée du kit : pastille violette de 26 px, titre 16 px demi-gras.
function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  const id = `new-athlete-section-${n}`;
  return (
    <section
      aria-labelledby={id}
      className="flex min-w-0 flex-col gap-4 rounded-[22px] bg-surface px-4 py-[18px] lg:gap-[18px] lg:rounded-[20px] lg:px-6 lg:pt-[22px] lg:pb-6 lg:inset-ring lg:inset-ring-line"
    >
      <h2 id={id} className="flex items-center gap-2.5 text-[16px] leading-[normal] font-semibold">
        <span
          aria-hidden
          className="grid size-[26px] shrink-0 place-items-center rounded-[8px] bg-dlg-accent-soft text-[12px] font-semibold text-violet-text"
        >
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function NewAthleteFields({
  formAction,
  pending,
  error,
  values: v,
  cancelHref,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: NewAthleteFormInput;
  cancelHref: string;
}) {
  const [hasFirstName, setHasFirstName] = useState(v.firstName.trim() !== "");
  const [consent, setConsent] = useState(v.healthConsent);
  // Blessures déjà écrites : retirer l'accord les efface, après confirmation (kit, interactions).
  const [healthDefault, setHealthDefault] = useState(v.healthConstraints);
  const [hasHealthText, setHasHealthText] = useState(v.healthConstraints.trim() !== "");
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  // Erreur renvoyée par le serveur : amenée au milieu de l'écran (sur téléphone, le bouton est dans la
  // barre fixe, loin de la fin du formulaire).
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "center" });
  }, [error]);

  // Saisie suivie au niveau du formulaire : les champs partagés restent non contrôlés.
  const track = (event: ChangeEvent<HTMLFormElement>) => {
    const field = event.target as unknown as HTMLInputElement | HTMLTextAreaElement;
    if (field.name === "firstName") setHasFirstName(field.value.trim() !== "");
    if (field.name === "healthConstraints") setHasHealthText(field.value.trim() !== "");
  };

  const withdrawConsent = () => {
    setConsent(false);
    setHealthDefault("");
    setHasHealthText(false);
    setConfirmWithdraw(false);
  };

  const submitLabel = pending ? "Enregistrement…" : "Enregistrer le sportif";
  const disabled = pending || !hasFirstName;

  return (
    <form
      action={formAction}
      noValidate
      onChange={track}
      className="flex w-full max-w-[1120px] flex-col gap-3 lg:gap-3.5"
    >
      <Section n={1} title="Identité">
        <IdentityFields values={v} optionalLastName look="kit" />
      </Section>

      <Section n={2} title="Contact">
        <ContactFields values={v} optional look="kit" />
      </Section>

      <Section n={3} title="Profil sportif">
        <SportProfileFields
          values={v}
          look="kit"
          besideLevel={
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="programType" className={kitLabelClass}>
                Type de programme
              </label>
              <select
                id="programType"
                name="programType"
                defaultValue={v.programType}
                className={kitInputClass}
              >
                <option value="">Non précisé</option>
                {DISCIPLINES.map((discipline) => (
                  <option key={discipline} value={discipline}>
                    {disciplineLabels[discipline]}
                  </option>
                ))}
              </select>
            </div>
          }
        />
        <Segmented
          name="status"
          legend="Statut"
          look="kit"
          defaultValue={(v.status || "active") as AthleteStatus}
          options={[
            { value: "active", label: "Actif" },
            { value: "paused", label: "En pause" },
            { value: "archived", label: "Archivé" },
          ]}
        />
      </Section>

      <Section n={4} title="Objectif principal">
        <div className="grid gap-4 min-[56.25rem]:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="goalType" className={kitLabelClass}>
              Type d&apos;objectif <span className={kitOptionalClass}>facultatif</span>
            </label>
            <select
              id="goalType"
              name="goalType"
              defaultValue={v.goalType}
              className={kitInputClass}
            >
              <option value="">Pas encore défini</option>
              {goalTypeGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.types.map((type) => (
                    <option key={type} value={type}>
                      {goalTypeLabels[type]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="goalDate" className={kitLabelClass}>
              Date visée <span className={kitOptionalClass}>facultatif</span>
            </label>
            <input
              id="goalDate"
              name="goalDate"
              type="date"
              defaultValue={v.goalDate}
              className={kitInputClass}
            />
            <FieldCheck htmlFor="goalDate" rule="future-date" />
          </div>
          <div className="col-span-full flex min-w-0 flex-col gap-2">
            <label htmlFor="competitionName" className={kitLabelClass}>
              Prochaine compétition <span className={kitOptionalClass}>facultatif</span>
            </label>
            <input
              id="competitionName"
              name="competitionName"
              autoComplete="off"
              maxLength={120}
              placeholder="Ex. : Hyrox Bruxelles"
              defaultValue={v.competitionName}
              aria-describedby="competition-hint"
              className={kitInputClass}
            />
            <p id="competition-hint" className={kitHintClass}>
              Avec un nom, l&apos;objectif devient une compétition : indique alors sa date.
            </p>
          </div>
        </div>
      </Section>

      <Section n={5} title="Disponibilités">
        <AvailabilityFields values={v} look="kit" />
      </Section>

      <Section n={6} title="Notes">
        {/* Blessures (D-20, D-56) : donnée de santé, seulement avec l'accord explicite du sportif. Sans
            accord, le champ n'existe pas (rien ne peut partir au serveur). */}
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className={`${kitLabelClass} mb-2`}>Blessures et points d&apos;attention</legend>
          <div className="flex flex-col gap-3 rounded-[14px] bg-surface-2 p-3.5">
            {/* Toute la ligne est l'interrupteur ; -my-2 / py-2 : 44 px à toucher sans grandir l'encadré. */}
            <label className="-my-2 flex cursor-pointer items-center gap-3 rounded-[10px] py-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
              <span className="min-w-0 flex-1 text-[14px] leading-[1.45] text-text-2 lg:text-[13.5px]">
                <span className="lg:hidden">Accord explicite du sportif</span>
                <span className="max-lg:hidden">
                  Le sportif m&apos;a donné son accord explicite pour noter ses blessures et points
                  d&apos;attention.
                </span>
              </span>
              {/* La vraie case, invisible, couvre le dessin de l'interrupteur : le doigt la touche là
                  où il la voit ; le clavier et les lecteurs d'écran l'utilisent comme une case. */}
              <span
                className={`relative flex h-7 w-12 shrink-0 rounded-full p-[3px] transition-colors duration-200 lg:h-[26px] lg:w-11 ${
                  consent ? "bg-violet" : "bg-dlg-check-line"
                }`}
              >
                <input
                  type="checkbox"
                  role="switch"
                  name="healthConsent"
                  checked={consent}
                  onChange={(event) => {
                    if (event.target.checked) setConsent(true);
                    else if (hasHealthText) setConfirmWithdraw(true);
                    else withdrawConsent();
                  }}
                  className="absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-full opacity-0"
                />
                <span
                  aria-hidden
                  className={`pointer-events-none size-[22px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-out motion-reduce:transition-none lg:size-5 ${
                    consent ? "translate-x-5 lg:translate-x-[18px]" : ""
                  }`}
                />
              </span>
            </label>
            {consent ? (
              <>
                <div className="flex min-w-0 flex-col gap-2 min-[56.25rem]:w-[calc(50%-8px)]">
                  <label htmlFor="consentProof" className={kitLabelClass}>
                    Comment ?
                  </label>
                  <select
                    id="consentProof"
                    name="consentProof"
                    defaultValue={v.consentProof}
                    className={`${kitInputBaseClass} bg-field`}
                  >
                    <option value="" disabled>
                      Choisir…
                    </option>
                    {COACH_PROOFS.map((proof) => (
                      <option key={proof} value={proof}>
                        {coachProofLabels[proof]}
                      </option>
                    ))}
                  </select>
                </div>
                <HealthConstraintsField value={healthDefault} look="kit" />
              </>
            ) : null}
          </div>
          <p id="health-hint" className={kitHintClass}>
            {consent
              ? "Ce qui change l'entraînement : blessures, douleurs, zones à ménager. Pas de diagnostic ni de traitement."
              : "Sans accord, tu pourras le faire plus tard depuis sa fiche."}
          </p>
        </fieldset>
        <CoachNoteField value={v.coachNote} look="kit" />
      </Section>

      {error ? (
        <p
          ref={errorRef}
          role="alert"
          className="rounded-[14px] bg-surface px-4 py-3 text-[13px] leading-[1.45] font-medium text-alert"
        >
          {error}
        </p>
      ) : null}

      {/* Pied de page : le rappel « Données de santé » (D-20, D-56) ; sur ordinateur, le bouton et la
          règle du prénom à sa droite (colonne de 280 px). */}
      <div className="grid gap-x-4 gap-y-2 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <div className="flex flex-col gap-2 rounded-[22px] bg-surface px-[18px] py-4 lg:row-span-2 lg:rounded-[20px]">
          <h2 className="flex items-center gap-2 text-[14px] leading-[normal] font-semibold">
            <ShieldCheck
              aria-hidden
              size={15}
              strokeWidth={2}
              className="shrink-0 text-status-ok"
            />
            Données de santé
          </h2>
          <p className="text-[13px] leading-[1.5] text-muted lg:text-[12.5px]">
            Les blessures ne se notent qu&apos;avec l&apos;accord explicite du sportif. Il peut le
            retirer à tout moment : ce qui a été noté est alors effacé.
          </p>
        </div>
        <button
          type="submit"
          disabled={disabled}
          aria-describedby="new-athlete-required"
          className="inline-flex h-[46px] w-full items-center justify-center rounded-[12px] bg-cta px-5 text-[14.5px] leading-[normal] font-semibold text-on-cta transition-[scale,opacity] duration-150 not-disabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 max-lg:hidden"
        >
          {submitLabel}
        </button>
        <p
          id="new-athlete-required"
          className="text-center text-[12px] leading-[normal] text-faint max-lg:hidden"
        >
          Seul le prénom est obligatoire.
        </p>
      </div>

      {/* Téléphone : barre fixe (kit) ; « Annuler » revient à la liste. */}
      <MobileActionBar>
        <Link href={cancelHref} className={mobileActionSecondaryClass}>
          Annuler
        </Link>
        <button type="submit" disabled={disabled} className={mobileActionPrimaryClass}>
          {pending ? (
            "Enregistrement…"
          ) : (
            // Un seul bloc de texte (le bouton est en flex : deux enfants seraient espacés). Sous 360 px,
            // « le sportif » n'est lu que par les lecteurs d'écran : « Annuler » garde sa place.
            <span>
              Enregistrer<span className="max-[359px]:sr-only"> le sportif</span>
            </span>
          )}
        </button>
      </MobileActionBar>

      <ConfirmDialog
        open={confirmWithdraw}
        onClose={() => setConfirmWithdraw(false)}
        onConfirm={withdrawConsent}
        title="Retirer l'accord ?"
        confirmLabel="Retirer l'accord"
      >
        Ce que tu as noté sur ses blessures et points d&apos;attention sera effacé.
      </ConfirmDialog>
    </form>
  );
}
