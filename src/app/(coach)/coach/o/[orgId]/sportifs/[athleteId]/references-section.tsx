import { Trash2 } from "lucide-react";

import { AccordionChevron, accordionClass, accordionSummaryClass } from "@/components/ui/accordion";
import { deleteReference } from "@/features/references/actions";
import {
  formatReferenceDetail,
  formatReferenceValue,
  splitReferenceValue,
} from "@/features/references/format";
import { listReferences } from "@/features/references/queries";
import {
  referenceGroup,
  referenceKindLabels,
  referenceSourceLabels,
} from "@/features/references/schemas";
import { buildReferenceSeries, referenceTone, seriesKey } from "@/features/references/series";
import { formatDate } from "@/lib/format";

import { AddReferenceForm } from "./add-reference-form";
import { ReferencesBoard, type ReferenceCardData } from "./references-board";
import { TestCalculator } from "./test-calculator";

// Section « Allures et repères » de la fiche (P2-03), d'après la maquette « Sportifs » du 03/11/2026
// (page 2g) : deux cartes de repère interchangeables, le graphique d'évolution, les accordéons
// (valeurs en tableau, historique et corrections, calcul depuis un test), puis « Ajouter une
// mesure ». Serveur : lit l'historique, déjà filtré par la RLS.
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
  const cards: ReferenceCardData[] = current.map((entry) => {
    const { value, unit } = splitReferenceValue(entry);
    const group = referenceGroup(entry.kind);
    const detail = group === "strength" ? null : formatReferenceDetail(entry);
    return {
      key: seriesKey(entry),
      group,
      tone: referenceTone(entry.kind),
      name:
        entry.kind === "strength_load" && entry.exercise
          ? entry.exercise
          : referenceKindLabels[entry.kind],
      value,
      unit,
      detail: [detail, referenceSourceLabels[entry.source], formatDate(entry.measuredOn)]
        .filter(Boolean)
        .join(" · "),
      measuredOn: entry.measuredOn,
    };
  });

  return (
    <section
      aria-labelledby="references-title"
      className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="references-title"
          className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
        >
          Allures et repères
        </h2>
        <p className="text-[13.5px] leading-[1.5] text-pretty text-muted">
          Valeurs propres à ce sportif, datées. Une nouvelle mesure ne remplace pas l&apos;ancienne
          : l&apos;historique est conservé.
        </p>
      </div>

      {current.length === 0 ? (
        <p
          role="status"
          className="rounded-2xl border border-dashed border-line-2 p-[18px] text-[14px] leading-[1.5] text-muted"
        >
          Aucun repère pour l&apos;instant. Ajoute une allure, une fréquence cardiaque ou une charge
          de référence.
        </p>
      ) : null}

      <ReferencesBoard
        cards={cards}
        series={buildReferenceSeries(history)}
        todayDay={Math.round(Date.parse(`${today}T00:00:00Z`) / 86_400_000)}
        accordions={
          <>
            {history.length > 0 ? (
              <details className={accordionClass}>
                <summary className={accordionSummaryClass}>
                  <AccordionChevron />
                  Historique et corrections ({history.length}{" "}
                  {history.length > 1 ? "mesures" : "mesure"})
                </summary>
                <HistoryList
                  organizationId={organizationId}
                  athleteId={athleteId}
                  entries={history}
                />
              </details>
            ) : null}
            <details className={accordionClass}>
              <summary className={accordionSummaryClass}>
                <AccordionChevron />
                {/* Téléphone (demande d'Antonino du 04/11) : « (Cooper ou 5 km) » toujours seul sur
                    la deuxième ligne, jamais coupé ; ordinateur : une seule ligne. */}
                <span>
                  Calculer les allures depuis un test{" "}
                  <span className="whitespace-nowrap max-lg:block">(Cooper ou 5 km)</span>
                </span>
              </summary>
              <div className="border-t border-line p-3.5">
                <TestCalculator
                  organizationId={organizationId}
                  athleteId={athleteId}
                  today={today}
                />
              </div>
            </details>
          </>
        }
      />

      <span aria-hidden className="h-px bg-line" />
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
          className="flex items-center justify-between gap-3 border-b border-line py-2.5 pr-2 pl-3.5 text-[13.5px] last:border-b-0"
        >
          <span className="min-w-0">
            <span className="text-muted">{formatDate(entry.measuredOn)} · </span>
            {referenceKindLabels[entry.kind]} :{" "}
            <span className="font-medium tabular-nums">{formatReferenceValue(entry)}</span>
            {entry.exercise ? <span className="text-muted"> · {entry.exercise}</span> : null}
            {entry.note ? (
              <span className="block text-[12.5px] text-muted">{entry.note}</span>
            ) : null}
          </span>
          <form action={deleteReference.bind(null, organizationId, athleteId, entry.id)}>
            <button
              type="submit"
              aria-label={`Supprimer la mesure ${referenceKindLabels[entry.kind]} du ${formatDate(entry.measuredOn)}`}
              className="grid size-[38px] place-items-center rounded-[10px] text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-alert"
            >
              <Trash2 aria-hidden size={15} strokeWidth={1.8} />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
