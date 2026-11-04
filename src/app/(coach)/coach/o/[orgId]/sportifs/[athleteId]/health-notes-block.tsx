import { ShieldCheck } from "lucide-react";

import { AccordionChevron, accordionClass, accordionSummaryClass } from "@/components/ui/accordion";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import type { AthleteDetail } from "@/features/athletes/queries";
import { withdrawHealthConsentByCoach } from "@/features/consents/actions";
import { listConsentEvents } from "@/features/consents/queries";
import { consentEventLabel, consentGrantDetail } from "@/features/consents/schemas";
import { formatDateTime } from "@/lib/format";

import { HealthConsentForm } from "./health-consent-form";
import { HealthNotesForm } from "./health-notes-form";

// Carte « Blessures et points d'attention » de l'onglet Notes (D-56), d'après la maquette « Sportifs »
// du 03/11/2026 (page 2i) : bandeau vert de l'accord, champ, « Enregistrer les blessures » et
// « Retirer l'accord » côte à côte, aide, historique de l'accord replié. Donnée de santé : on ne la
// voit et ne la saisit que pendant qu'un accord du sportif est en cours. Chaque accord et chaque
// retrait sont journalisés en base (D-20). Sur ordinateur, la carte descend jusqu'au bas du menu de
// gauche (demande d'Antonino du 04/11) : le champ prend la hauteur libre.
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
      className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft lg:flex-1"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="health-notes-title"
          className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
        >
          Blessures et points d&apos;attention
        </h2>
        <p id="health-hint" className="text-[13.5px] leading-[1.5] text-pretty text-muted">
          Ce qui change l&apos;entraînement : blessures, douleurs, zones à ménager. Pas de
          diagnostic ni de traitement.
        </p>
      </div>

      {hasConsent && athlete.healthConsentAt ? (
        <>
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl bg-ok-soft px-3.5 py-3 text-[13px] leading-[1.5] text-ok-text"
          >
            <ShieldCheck
              aria-hidden
              size={15}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-ok"
            />
            <span>
              Accord en cours depuis le {formatDateTime(athlete.healthConsentAt)}
              {lastGrant ? ` · ${consentGrantDetail(lastGrant.source, lastGrant.proof)}` : null}.
            </span>
          </p>
          <HealthNotesForm
            organizationId={organizationId}
            athleteId={athlete.id}
            value={athlete.healthConstraints ?? ""}
            besideSave={
              <form action={withdrawHealthConsentByCoach.bind(null, organizationId, athlete.id)}>
                <ConfirmSubmitButton
                  title="Retirer l'accord ?"
                  message="Les blessures et points d'attention notés seront effacés."
                  confirmLabel="Retirer l'accord"
                  icon="shield"
                  className="flex h-[38px] items-center rounded-[10px] px-3.5 text-[13.5px] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2 active:scale-[0.97]"
                >
                  Retirer l&apos;accord
                </ConfirmSubmitButton>
              </form>
            }
          />
          <p className="text-[12.5px] leading-4 text-muted">
            Retirer l&apos;accord à la demande du sportif efface ce qui a été noté.
          </p>
        </>
      ) : (
        <>
          <p className="text-[13.5px] leading-[1.5] text-pretty text-muted">
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
        <details className={accordionClass}>
          <summary className={accordionSummaryClass}>
            <AccordionChevron />
            Historique de l&apos;accord ({events.length})
          </summary>
          <ul aria-label="Historique de l'accord" className="flex flex-col border-t border-line">
            {events.map((event) => (
              <li
                key={event.id}
                className="border-b border-line px-3.5 py-2.5 text-[13.5px] leading-[1.5] last:border-b-0"
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
