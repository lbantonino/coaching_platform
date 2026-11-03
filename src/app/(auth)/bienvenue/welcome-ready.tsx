"use client";

import { CalendarPlus, CircleCheck, FilePlus, Link2, UserPlus } from "lucide-react";
import { useActionState } from "react";

import {
  EntryIcon,
  entryPrimaryClass,
  EntryTitle,
  FormAlert,
  InfoCard,
} from "@/components/layout/entry-ui";
import { Spinner } from "@/components/ui/spinner";
import {
  completeSignup,
  type OnboardingState,
  type SignupValues,
} from "@/features/auth/signup-actions";
import type { BillingSetupInput } from "@/features/auth/signup-schemas";

import { BillingSetupFields } from "./billing-setup-fields";

// Bienvenue (prompt Claude Design §7.1) pour une inscription par e-mail : le type de compte, le nom
// et l'acceptation des conditions sont connus. Le coach règle encore son pays, sa devise et sa TVA
// (D-69, D-90). Le bouton finalise le compte (complete_signup : organisation du coach,
// ou compte sportif en attente d'invitation) puis ouvre l'espace.
const firstSteps = [
  { icon: UserPlus, label: "Ajoute ton premier sportif", time: "2 min" },
  { icon: CalendarPlus, label: "Planifie une séance", time: "1 min" },
  { icon: FilePlus, label: "Crée un programme", time: "5 min" },
];

const athleteSteps = [
  "Ton coach t'envoie un lien d'invitation",
  "Tu ouvres le lien et tu rejoins son espace",
  "Ta séance du jour t'attend dans « Aujourd'hui »",
];

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
  const coach = values.kind === "coach";
  const organization = values.organizationName.trim() || `${values.firstName} ${values.lastName}`;

  return (
    <form action={formAction} data-account-kind={values.kind} className="flex flex-col gap-[22px]">
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      <EntryIcon icon={CircleCheck} tone="ok" />
      <EntryTitle
        sub={
          coach
            ? "Ton e-mail est confirmé. Ton espace coach s'ouvre en un clic."
            : "Ton e-mail est confirmé. Il ne manque plus qu'une étape."
        }
      >
        Bienvenue, {values.firstName}.
      </EntryTitle>

      {coach ? (
        <>
          <InfoCard>
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-control bg-accent font-display text-[18px] font-bold text-on-accent"
              >
                {organization.charAt(0).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[16px] font-semibold">{organization}</span>
                <span className="text-[13px] text-muted">Ton organisation · 1 coach</span>
              </span>
            </div>
          </InfoCard>
          <BillingSetupFields key={state.attempt} initial={state.billing ?? billing} />
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[12px] font-medium tracking-[0.06em] text-muted uppercase">
              Pour bien démarrer
            </p>
            <ul className="flex flex-col gap-2">
              {firstSteps.map(({ icon: Icon, label, time }) => (
                <li
                  key={label}
                  className="flex min-h-14 items-center gap-3.5 rounded-wide border border-line px-3.5"
                >
                  <Icon aria-hidden size={19} strokeWidth={1.8} className="shrink-0 text-muted" />
                  <span className="flex-1 text-[15px] font-medium">{label}</span>
                  <span className="font-mono text-[12px] text-muted">{time}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <InfoCard>
            <div className="flex items-start gap-3">
              <Link2
                aria-hidden
                size={19}
                strokeWidth={1.8}
                className="mt-0.5 shrink-0 text-accent-text"
              />
              <p className="text-[15px] leading-[1.55]">
                <strong>Ton coach te rattachera à son espace par une invitation.</strong> Tu
                recevras un lien personnel par e-mail, WhatsApp ou SMS.
              </p>
            </div>
          </InfoCard>
          <ol className="flex flex-col">
            {athleteSteps.map((step, index) => (
              <li
                key={step}
                className="flex min-h-[52px] items-center gap-3.5 border-t border-line text-[15px]"
              >
                <span
                  aria-hidden
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[13px] font-semibold"
                >
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </>
      )}

      {/* Ce qui a été saisi à l'inscription (et accepté : conditions, version en cours). */}
      <input type="hidden" name="kind" value={values.kind} />
      <input type="hidden" name="firstName" value={values.firstName} />
      <input type="hidden" name="lastName" value={values.lastName} />
      <input type="hidden" name="phone" value={values.phone} />
      <input type="hidden" name="organizationName" value={values.organizationName} />
      <input type="hidden" name="terms" value="on" />

      <button type="submit" disabled={pending} className={entryPrimaryClass}>
        {pending ? (
          <>
            <Spinner />
            Ouverture…
          </>
        ) : coach ? (
          <>
            Accéder à mon tableau de bord
            <span aria-hidden className="text-[18px]">
              →
            </span>
          </>
        ) : (
          "Compris"
        )}
      </button>
      {coach ? null : (
        <p className="text-center text-[14px] text-muted">
          Tu as déjà un lien ? Ouvre-le simplement : il te mènera à son espace.
        </p>
      )}
    </form>
  );
}
