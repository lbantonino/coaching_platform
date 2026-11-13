"use client";

import { ArrowRight, KeyRound, Lock, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { ThemedCooryLogo } from "@/components/brand/themed-logo";
import { SplitShell } from "@/components/layout/entry-shell";
import {
  AuthCheckbox,
  AuthField,
  AuthLegalLinks,
  entryLinkClass,
  entryPrimaryCompactClass,
  EntryTitle,
  FormAlert,
  Spark,
} from "@/components/layout/entry-ui";
import { AuthCardImage } from "@/components/layout/entry-visuals";
import { authInputCompactClass, authPasswordCompactClass } from "@/components/ui/form-styles";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { FEATURES } from "@/config/features";
import { signUp, type SignupState } from "@/features/auth/signup-actions";
import type { AccountKind } from "@/features/auth/signup-schemas";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";
import { useWideScreen } from "@/lib/use-wide-screen";

const initialState: SignupState = {
  status: "idle",
  message: null,
  fields: {},
  attempt: 0,
  values: null,
};

// Inscription (maquette d'Antonino du 06/11/2026, écran 02, D-139). Le type de compte vit ici : il
// change aussi la carte de l'ordinateur (7b coach, 7d sportif, D-143). Logique serveur inchangée (action signUp,
// validation Zod), sauf : plus de téléphone, d'entreprise ni de confirmation du mot de passe
// (décision d'Antonino), et le code d'accès de la bêta privée (D-140). Le bouton reste grisé tant
// que les conditions ne sont pas acceptées (la validation serveur les exige de toute façon).
export function SignupView({ social }: { social: ReactNode }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [kind, setKind] = useState<AccountKind>("coach");
  // Gardée ici (hors du formulaire reconstruit après une erreur) : la case reste cochée.
  const [terms, setTerms] = useState(false);
  return (
    <SplitShell
      // Ordinateur : la carte suit le type de compte (7b coach, 7d sportif), en fondu.
      visual={
        <AuthCardImage
          card={kind === "athlete" ? "sportif" : "inscription"}
          choices={["inscription", "sportif"]}
        />
      }
      columnClassName="px-[26px] pt-[max(53px,calc(env(safe-area-inset-top)+20px))] pb-7 lg:px-[60px] lg:pt-[38px] lg:pb-[34px]"
      contentClassName="lg:max-w-[400px] lg:gap-[15px]"
    >
      <div className="flex items-center justify-between">
        <Link href="/login" aria-label="Coory, connexion" className="flex rounded-sm">
          <span className="flex lg:hidden">
            <ThemedCooryLogo height={17} />
          </span>
          <span className="flex max-lg:hidden">
            <ThemedCooryLogo height={20} />
          </span>
        </Link>
        <span className="flex h-7 items-center gap-1.5 rounded-full bg-dlg-accent-tile px-[11px] text-[11.5px] font-bold text-violet-text lg:hidden">
          <Spark size={12} className="text-violet" />
          Copilote IA
        </span>
      </div>

      <EntryTitle
        sub="Rejoins Coory et commence à planifier tes entraînements."
        size="sm"
        className="pt-6 lg:pt-1.5"
      >
        Créer ton compte
      </EntryTitle>

      {/* Reconstruit après chaque réponse : la saisie renvoyée s'affiche (jamais le mot de passe). */}
      <SignupFields
        key={state.attempt}
        kind={kind}
        onKind={setKind}
        terms={terms}
        onTerms={setTerms}
        formAction={formAction}
        pending={pending}
        state={state}
      />

      {social}

      <p className="pt-4 text-center text-[14px] font-medium text-dlg-ink-2 lg:pt-0 lg:text-[13.5px]">
        Déjà inscrit ?{" "}
        <Link href="/login" className={entryLinkClass}>
          Se connecter
        </Link>
      </p>
      {/* Liens légaux en bas de la colonne (sur ordinateur aussi depuis D-143 : les images 7a / 7b ne
          les dessinent plus). */}
      <div aria-hidden className="min-h-3.5 flex-1 lg:min-h-6" />
      <AuthLegalLinks />
    </SplitShell>
  );
}

const roles: { value: AccountKind; label: string; short: string }[] = [
  { value: "coach", label: "Je suis coach", short: "Coach" },
  { value: "athlete", label: "Je suis sportif", short: "Sportif" },
];

// Choix Coach / Sportif : groupe de boutons radio (flèches du clavier pour changer), valeur envoyée
// par un champ caché. Ordinateur : deux boutons ; téléphone : segment sur une piste grise.
function RoleSwitch({
  value,
  onChange,
}: {
  value: AccountKind;
  onChange: (k: AccountKind) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  // MVP espace coach seul (D-167) : pas de choix « Je suis sportif », le compte est un compte coach.
  if (!FEATURES.athleteSpace) return <input type="hidden" name="kind" value="coach" />;
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const next = (index + 1) % roles.length;
    onChange(roles[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label="Type de compte"
      className="mt-[18px] grid grid-cols-2 gap-1.5 rounded-[14px] bg-dlg-segment p-1 lg:mt-0 lg:gap-2 lg:rounded-none lg:bg-transparent lg:p-0"
    >
      <input type="hidden" name="kind" value={value} />
      {roles.map((role, index) => {
        const on = role.value === value;
        return (
          <button
            key={role.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(role.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[11px] text-[14.5px] font-bold transition-colors duration-200 lg:rounded-[12px] lg:text-[14px] ${
              on ? "bg-cta text-on-cta" : "text-dlg-ink-2 hover:text-text lg:bg-dlg-segment"
            }`}
          >
            <UserRound aria-hidden size={16} strokeWidth={1.8} />
            <span className="lg:hidden">{role.short}</span>
            <span className="max-lg:hidden">{role.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SignupFields({
  kind,
  onKind,
  terms,
  onTerms,
  formAction,
  pending,
  state,
}: {
  kind: AccountKind;
  onKind: (kind: AccountKind) => void;
  terms: boolean;
  onTerms: (accepted: boolean) => void;
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: SignupState;
}) {
  const v = state.values;
  const errors = state.fields;
  const [shown, setShown] = useState(false);
  const wide = useWideScreen();
  const invalid = (name: string) =>
    errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    <form action={formAction} className="flex flex-col lg:gap-[15px]" noValidate>
      {state.message ? (
        <div className="pt-4 lg:pt-0">
          <FormAlert>{state.message}</FormAlert>
        </div>
      ) : null}

      <RoleSwitch value={kind} onChange={onKind} />

      <div className="flex flex-col gap-2.5 pt-3.5 lg:gap-[15px] lg:pt-0">
        <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3">
          <AuthField
            id="firstName"
            label="Prénom"
            icon={UserRound}
            error={errors.firstName}
            compact
          >
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              maxLength={80}
              placeholder={wide ? "Camille" : "Prénom"}
              defaultValue={v?.firstName}
              {...invalid("firstName")}
              className={authInputCompactClass}
            />
          </AuthField>
          <AuthField id="lastName" label="Nom" icon={UserRound} error={errors.lastName} compact>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              maxLength={80}
              placeholder={wide ? "Moreau" : "Nom"}
              defaultValue={v?.lastName}
              {...invalid("lastName")}
              className={authInputCompactClass}
            />
          </AuthField>
        </div>

        <AuthField id="email" label="Adresse e-mail" icon={Mail} error={errors.email} compact>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="ton@email.com"
            defaultValue={v?.email}
            {...invalid("email")}
            className={authInputCompactClass}
          />
        </AuthField>

        <AuthField id="password" label="Mot de passe" icon={Lock} error={errors.password} compact>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder={wide ? `Minimum ${PASSWORD_MIN_LENGTH} caractères` : "Mot de passe"}
            {...invalid("password")}
            shown={shown}
            onToggle={() => setShown((value) => !value)}
            iconSize={18}
            className={authPasswordCompactClass}
          />
        </AuthField>

        {/* Code d'accès de la bêta privée (D-140) : absent de la maquette, même style que les champs. */}
        <AuthField
          id="accessCode"
          label="Code d'accès"
          icon={KeyRound}
          error={errors.accessCode}
          compact
        >
          <input
            id="accessCode"
            name="accessCode"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={64}
            placeholder={wide ? "Le code reçu pour tester Coory" : "Code d'accès"}
            defaultValue={v?.accessCode}
            {...invalid("accessCode")}
            className={authInputCompactClass}
          />
        </AuthField>
      </div>

      <div className="flex flex-col gap-2 pt-3.5 lg:pt-0">
        <AuthCheckbox
          name="terms"
          multiline
          tone="violet"
          checked={terms}
          onChange={(event) => onTerms(event.target.checked)}
          {...invalid("terms")}
          label={
            <>
              J&apos;ai 18 ans ou plus et j&apos;accepte les{" "}
              <Link
                href="/conditions"
                target="_blank"
                className="font-bold text-text underline-offset-2 hover:underline"
              >
                <span className="lg:hidden">conditions</span>
                <span className="max-lg:hidden">conditions d&apos;utilisation</span>
              </Link>{" "}
              et la{" "}
              <Link
                href="/confidentialite"
                target="_blank"
                className="font-bold text-text underline-offset-2 hover:underline"
              >
                <span className="lg:hidden">confidentialité</span>
                <span className="max-lg:hidden">politique de confidentialité</span>
              </Link>
              .
            </>
          }
        />
        {errors.terms ? (
          <p id="terms-error" role="alert" className="text-[13px] font-medium text-alert">
            {errors.terms}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending || !terms}
        className={`${entryPrimaryCompactClass} mt-[18px] lg:mt-0`}
      >
        {pending ? (
          <>
            <Spinner />
            Création du compte…
          </>
        ) : (
          <>
            Créer mon compte
            <ArrowRight aria-hidden size={18} strokeWidth={2} />
          </>
        )}
      </button>
    </form>
  );
}
