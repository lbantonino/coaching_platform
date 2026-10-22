import { Trash2 } from "lucide-react";

import { deleteReference } from "@/features/references/actions";
import { formatReferenceDetail, formatReferenceValue } from "@/features/references/format";
import { listReferences } from "@/features/references/queries";
import { referenceKindLabels, referenceSourceLabels } from "@/features/references/schemas";
import { formatDate } from "@/lib/format";

import { AddReferenceForm } from "./add-reference-form";
import { TestCalculator } from "./test-calculator";

// Section « Allures & repères » de la fiche (P2-03). Serveur : lit l'historique, déjà filtré par la RLS.
export async function ReferencesSection({
  organizationId,
  athleteId,
  today,
}: {
  organizationId: string;
  athleteId: string;
  today: string;
}) {
  const { current, history } = await listReferences(organizationId, athleteId);

  return (
    <section
      aria-labelledby="references-title"
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="references-title" className="text-title font-medium">
          Allures &amp; repères
        </h2>
        <p className="text-small text-muted">
          Valeurs propres à ce sportif, datées. Une nouvelle mesure ne remplace pas l&apos;ancienne
          : l&apos;historique est conservé.
        </p>
      </div>

      {current.length === 0 ? (
        <p
          role="status"
          className="rounded-[14px] border border-dashed border-line-2 p-4 text-muted"
        >
          Aucun repère pour l&apos;instant. Ajoute une allure, une fréquence cardiaque ou une charge
          de référence.
        </p>
      ) : (
        <ul aria-label="Repères actuels" className="grid gap-3 sm:grid-cols-2">
          {current.map((entry) => {
            const detail = formatReferenceDetail(entry);
            return (
              <li
                key={entry.id}
                className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-bg p-4"
              >
                <span className="text-small text-muted">{referenceKindLabels[entry.kind]}</span>
                <span className="font-mono text-h3 font-medium tabular">
                  {formatReferenceValue(entry)}
                </span>
                <span className="text-caption text-muted">
                  {detail ? `${detail} · ` : ""}
                  {referenceSourceLabels[entry.source]} · {formatDate(entry.measuredOn)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {history.length > 0 ? (
        <details className="rounded-[14px] border border-line">
          <summary className="cursor-pointer px-4 py-3 text-small text-muted hover:text-text">
            Historique et corrections ({history.length} {history.length > 1 ? "mesures" : "mesure"})
          </summary>
          <HistoryList organizationId={organizationId} athleteId={athleteId} entries={history} />
        </details>
      ) : null}

      <details className="rounded-[14px] border border-line">
        <summary className="cursor-pointer px-4 py-3 text-small font-medium hover:text-text">
          Calculer les allures depuis un test (Cooper ou 5 km)
        </summary>
        <div className="border-t border-line p-4">
          <TestCalculator organizationId={organizationId} athleteId={athleteId} today={today} />
        </div>
      </details>

      <AddReferenceForm organizationId={organizationId} athleteId={athleteId} today={today} />
    </section>
  );
}

function HistoryList({
  organizationId,
  athleteId,
  entries,
}: {
  organizationId: string;
  athleteId: string;
  entries: Awaited<ReturnType<typeof listReferences>>["history"];
}) {
  // Une mesure erronée se supprime (puis se ressaisit) : l'historique ne se modifie jamais en place.
  return (
    <ul aria-label="Historique des repères" className="flex flex-col border-t border-line">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-small last:border-b-0"
        >
          <span className="min-w-0">
            <span className="text-muted">{formatDate(entry.measuredOn)} · </span>
            {referenceKindLabels[entry.kind]} :{" "}
            <span className="font-mono tabular">{formatReferenceValue(entry)}</span>
            {entry.exercise ? <span className="text-muted"> · {entry.exercise}</span> : null}
            {entry.note ? (
              <span className="block text-caption text-muted">{entry.note}</span>
            ) : null}
          </span>
          <form action={deleteReference.bind(null, organizationId, athleteId, entry.id)}>
            <button
              type="submit"
              aria-label={`Supprimer la mesure ${referenceKindLabels[entry.kind]} du ${formatDate(entry.measuredOn)}`}
              className="inline-flex size-8 items-center justify-center rounded-[7px] text-muted hover:bg-surface-2 hover:text-accent-text"
            >
              <Trash2 aria-hidden size={15} strokeWidth={1.7} />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
