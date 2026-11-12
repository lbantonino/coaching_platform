"use client";

import { ArrowRight, Check, Link2 } from "lucide-react";
import { useActionState } from "react";

import { ThemedCooryLogo } from "@/components/brand/themed-logo";
import { SplitShell } from "@/components/layout/entry-shell";
import {
  entryPrimaryTallClass,
  welcomeColumnClass,
  welcomeContentClass,
  EntryTitle,
  FormAlert,
  InfoCard,
} from "@/components/layout/entry-ui";
import { AuthCardImage } from "@/components/layout/entry-visuals";
import { Spinner } from "@/components/ui/spinner";
import {
  completeSignup,
  type OnboardingState,
  type SignupValues,
} from "@/features/auth/signup-actions";
import type { BillingSetupInput } from "@/features/auth/signup-schemas";

import { BillingSetupFields, useBillingSetup } from "./billing-setup-fields";

// Bienvenue (maquette d'Antonino du 06/11/2026, écran 03, D-139), après une inscription par e-mail :
// type de compte, nom et conditions sont connus. Le coach règle son pays et sa devise (D-163 : la TVA se choisit à chaque paiement)
// (D-69, D-90) ; à droite sur ordinateur, l'image 7c d'Antonino (7d pour un sportif, D-143). Le bouton finalise le compte
// (complete_signup : organisation du coach, ou compte sportif en attente d'invitation) puis ouvre
// l'espace. Le sportif n'a rien à régler (version proposée, la maquette ne la dessine pas).

type Step = { label: string; state: "done" | "current" | "todo" };

// Étapes « Compte créé — Configuration — Espace prêt » : ligne de pastilles reliées.
export function WelcomeSteps({ middle = "Configuration" }: { middle?: string }) {
  const steps: Step[] = [
    { label: "Compte créé", state: "done" },
    { label: middle, state: "current" },
    { label: "Espace prêt", state: "todo" },
  ];
  const dot = (state: Step["state"], size: string) =>
    `flex ${size} shrink-0 items-center justify-center rounded-full ${
      state === "done"
        ? "bg-violet text-on-accent"
        : state === "current"
          ? "bg-dlg inset-ring-[1.5px] inset-ring-violet"
          : "bg-dlg inset-ring-[1.5px] inset-ring-dlg-check-line"
    }`;
  return (
    <>
      {/* Ordinateur : pastilles et libellés sur une ligne. */}
      <ol aria-label="Étapes de l'inscription" className="flex items-center gap-2.5 max-lg:hidden">
        {steps.map((step, index) => (
          <li
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
            className={`flex items-center gap-2 text-[12.5px] font-semibold whitespace-nowrap ${
              step.state === "todo" ? "text-dlg-faint" : "text-text"
            }`}
          >
            <span className={dot(step.state, "size-5")}>
              {step.state === "done" ? <Check size={11} strokeWidth={3.2} /> : null}
            </span>
            {step.label}
            {index < steps.length - 1 ? (
              <span aria-hidden className="h-[1.5px] w-7 bg-violet/30" />
            ) : null}
          </li>
        ))}
      </ol>
      {/* Téléphone : pastilles reliées sur toute la largeur, libellés dessous. */}
      <div className="lg:hidden">
        <div aria-hidden className="flex items-center px-1.5">
          {steps.map((step, index) => (
            <span
              key={step.label}
              className={`flex items-center ${index < steps.length - 1 ? "flex-1" : "flex-none"}`}
            >
              <span className={dot(step.state, "size-[22px]")}>
                {step.state === "done" ? <Check size={12} strokeWidth={3.2} /> : null}
              </span>
              {index < steps.length - 1 ? (
                <span className="mx-1.5 h-[1.5px] flex-1 bg-violet/30" />
              ) : null}
            </span>
          ))}
        </div>
        <ol
          aria-label="Étapes de l'inscription"
          className="flex justify-between pt-1.5 text-[11px] font-semibold text-muted"
        >
          {steps.map((step) => (
            <li
              key={step.label}
              aria-current={step.state === "current" ? "step" : undefined}
              className={step.state === "current" ? "text-text" : undefined}
            >
              {step.label}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

// Logo (et, sur téléphone, la pastille verte « compte créé »).
export function WelcomeLogoRow() {
  return (
    <div className="flex items-center justify-between pt-6 lg:pt-0">
      <span className="flex lg:hidden">
        <ThemedCooryLogo height={17} />
      </span>
      <span className="flex max-lg:hidden">
        <ThemedCooryLogo height={20} />
      </span>
      <span
        aria-hidden
        className="flex size-[30px] items-center justify-center rounded-[9px] bg-ok-soft text-ok lg:hidden"
      >
        <Check size={16} strokeWidth={2.8} />
      </span>
    </div>
  );
}

// « Bienvenue, Antonino. 🎉 » : sur téléphone, le prénom passe à la ligne (maquette).
export function WelcomeTitle({ firstName, sub }: { firstName: string; sub: string }) {
  return (
    <EntryTitle
      dot={false}
      size="sm"
      sub={sub}
      className="gap-2 pt-[18px] lg:gap-2.5 lg:pt-0"
      subClassName="lg:max-w-[400px] lg:text-[15px]"
    >
      <span className="text-[29px] leading-[1.06] lg:text-[36px]">
        Bienvenue,
        <br className="lg:hidden" /> {firstName}. 🎉
      </span>
    </EntryTitle>
  );
}

export function WelcomeReady({
  values,
  billing,
}: {
  values: SignupValues;
  billing: BillingSetupInput;
}) {
  const [state, formAction, pending] = useActionState(completeSignup, {
    error: null,
    attempt: 0,
    values: null,
  } satisfies OnboardingState);
  const setup = useBillingSetup(state.billing ?? billing);
  const coach = values.kind === "coach";

  return (
    <SplitShell
      visual={<AuthCardImage card={coach ? "configuration" : "sportif"} />}
      columnClassName={welcomeColumnClass}
      contentClassName={welcomeContentClass}
    >
      <WelcomeSteps middle={coach ? "Configuration" : "Invitation"} />
      <WelcomeLogoRow />
      <WelcomeTitle
        firstName={values.firstName}
        sub={
          coach
            ? "Ton compte est créé. Choisis ton pays et ta devise, tu pourras les modifier ensuite."
            : "Ton compte est créé. Ton coach va te rattacher à son espace."
        }
      />

      <form
        action={formAction}
        data-account-kind={values.kind}
        className="flex flex-col lg:max-w-[432px] lg:gap-[22px]"
      >
        {state.error ? (
          <div className="pt-4 lg:pt-0">
            <FormAlert>{state.error}</FormAlert>
          </div>
        ) : null}

        {coach ? (
          <BillingSetupFields initial={billing} setup={setup} />
        ) : (
          <div className="pt-5 lg:pt-0">
            <InfoCard>
              <div className="flex items-start gap-3">
                <Link2
                  aria-hidden
                  size={19}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-violet-text"
                />
                <p className="text-[14.5px] leading-[1.55]">
                  <strong>Ton coach te rattachera à son espace par une invitation.</strong> Tu
                  recevras un lien personnel. Tu as déjà un lien ? Ouvre-le simplement.
                </p>
              </div>
            </InfoCard>
          </div>
        )}

        {/* Ce qui a été saisi à l'inscription (et accepté : conditions, version en cours). */}
        <input type="hidden" name="kind" value={values.kind} />
        <input type="hidden" name="firstName" value={values.firstName} />
        <input type="hidden" name="lastName" value={values.lastName} />
        <input type="hidden" name="phone" value={values.phone} />
        <input type="hidden" name="organizationName" value={values.organizationName} />
        <input type="hidden" name="terms" value="on" />

        <button
          type="submit"
          disabled={pending}
          className={`${entryPrimaryTallClass} mt-[22px] lg:mt-[26px]`}
        >
          {pending ? (
            <>
              <Spinner />
              Ouverture…
            </>
          ) : (
            <>
              {coach ? "Ouvrir mon espace" : "Compris"}
              <ArrowRight aria-hidden size={18} strokeWidth={2} />
            </>
          )}
        </button>
      </form>
    </SplitShell>
  );
}
