import { ShieldCheck } from "lucide-react";

import { buttonClass } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { hintClass } from "@/components/ui/form-styles";
import type { AthleteDetail } from "@/features/athletes/queries";
import { withdrawHealthConsentByCoach } from "@/features/consents/actions";
import { listConsentEvents } from "@/features/consents/queries";
import { consentEventLabel } from "@/features/consents/schemas";
import { formatDateTime } from "@/lib/format";

import { HealthConsentForm } from "./health-consent-form";
import { HealthNotesForm } from "./health-notes-form";

// Blessures et points d'attention (D-56, onglet Notes ; avant : « Contraintes physiques » dans
// Disponibilités). Donnée de santé : on ne la voit et ne la saisit que pendant qu'un accord du
// sportif est en cours. Chaque accord et chaque retrait sont journalisés en base (D-20).
export async function HealthNotesBlock({
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
    <div
      role="group"
      aria-labelledby="health-notes-title"
      className="flex flex-col gap-3 rounded-[14px] border border-line p-4"
    >
      <h3 id="health-notes-title" className="text-block font-medium">
        Blessures et points d&apos;attention
      </h3>
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
          <HealthNotesForm
            organizationId={organizationId}
            athleteId={athlete.id}
            value={athlete.healthConstraints ?? ""}
          />
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <form action={withdrawHealthConsentByCoach.bind(null, organizationId, athlete.id)}>
              <ConfirmSubmitButton
                title="Retirer l'accord ?"
                message="Les blessures et points d'attention notés seront effacés."
                confirmLabel="Retirer l'accord"
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                Retirer l&apos;accord
              </ConfirmSubmitButton>
            </form>
            <p className={hintClass}>
              À faire si le sportif te demande de retirer son accord : ce qui a été noté est effacé.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-small text-muted">
            Les blessures sont des données de santé : on ne les note qu&apos;avec l&apos;accord
            explicite du sportif.{" "}
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
  );
}
