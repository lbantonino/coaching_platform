import { ShieldCheck } from "lucide-react";

import { buttonClass } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { hintClass } from "@/components/ui/form-styles";
import type { AthleteDetail } from "@/features/athletes/queries";
import { withdrawHealthConsentByCoach } from "@/features/consents/actions";
import { listConsentEvents } from "@/features/consents/queries";
import { consentEventLabel } from "@/features/consents/schemas";
import { formatDateTime } from "@/lib/format";

import { AvailabilityForm } from "./availability-form";
import { HealthConsentForm } from "./health-consent-form";

// Section « Disponibilités & contraintes » de la fiche (P2-02 partie 3, D-20).
// Les contraintes physiques sont des données de santé : on ne les voit et ne les saisit que pendant
// qu'un accord du sportif est en cours. Chaque accord et chaque retrait sont journalisés en base.
export async function AvailabilitySection({
  organizationId,
  athlete,
}: {
  organizationId: string;
  athlete: AthleteDetail;
}) {
  const events = await listConsentEvents(organizationId, athlete.id);
  const hasConsent = athlete.healthConsentAt !== null;
  const lastGrant = events.find((event) => event.action === "granted");

  return (
    <section
      aria-labelledby="availability-title"
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="availability-title" className="text-title font-medium">
          Disponibilités &amp; contraintes
        </h2>
        <p className="text-small text-muted">
          Le temps dont le sportif dispose. Ce sont des repères pour construire son programme, pas
          une prescription.
        </p>
      </div>

      <AvailabilityForm
        organizationId={organizationId}
        athleteId={athlete.id}
        hasConsent={hasConsent}
        values={{
          sessionsPerWeek: athlete.sessionsPerWeek?.toString() ?? "",
          maxSessionMinutes: athlete.maxSessionMinutes?.toString() ?? "",
          availableDays: athlete.availableDays,
          scheduleConstraints: athlete.scheduleConstraints ?? "",
          healthConstraints: athlete.healthConstraints ?? "",
        }}
      />

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <h3 className="text-small font-medium">Contraintes physiques : accord du sportif</h3>
        {hasConsent && athlete.healthConsentAt ? (
          <>
            <p role="status" className="flex items-start gap-2 text-small">
              <ShieldCheck
                aria-hidden
                size={16}
                strokeWidth={1.7}
                className="mt-0.5 shrink-0 text-ok"
              />
              <span>
                Accord en cours depuis le {formatDateTime(athlete.healthConsentAt)}
                {lastGrant
                  ? ` · ${consentEventLabel(lastGrant.action, lastGrant.source, lastGrant.proof)}`
                  : null}
                .
              </span>
            </p>
            <form action={withdrawHealthConsentByCoach.bind(null, organizationId, athlete.id)}>
              <ConfirmSubmitButton
                message="Retirer l'accord efface les contraintes physiques notées. Continuer ?"
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                Retirer l&apos;accord
              </ConfirmSubmitButton>
            </form>
            <p className={hintClass}>
              À faire si le sportif te demande de retirer son accord : ce qui a été noté est effacé.
            </p>
          </>
        ) : (
          <>
            <p className="text-small text-muted">
              Les blessures et contraintes physiques sont des données de santé : on ne les note
              qu&apos;avec l&apos;accord explicite du sportif.{" "}
              {athlete.hasAccount
                ? "Il peut le donner lui-même depuis son espace sportif, ou tu peux noter ici l'accord qu'il t'a donné."
                : "Note ici l'accord qu'il t'a donné ; une fois son compte activé, il pourra aussi le gérer depuis son espace."}
            </p>
            <HealthConsentForm organizationId={organizationId} athleteId={athlete.id} />
          </>
        )}

        {events.length > 0 ? (
          <details className="rounded-[14px] border border-line">
            <summary className="cursor-pointer px-4 py-3 text-small text-muted hover:text-text">
              Historique de l&apos;accord ({events.length})
            </summary>
            <ul aria-label="Historique de l'accord" className="flex flex-col border-t border-line">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="border-b border-line px-4 py-2.5 text-small last:border-b-0"
                >
                  <span className="text-muted">{formatDateTime(event.recordedAt)} · </span>
                  {consentEventLabel(event.action, event.source, event.proof)}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  );
}
