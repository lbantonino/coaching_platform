import { Trash2 } from "lucide-react";

import { AccordionChevron, accordionClass, accordionSummaryClass } from "@/components/ui/accordion";
import { deleteRecord } from "@/features/records/actions";
import { listRecords, type RecordEntry } from "@/features/records/queries";
import { formatRaceTime, recordPace, recordTitle } from "@/features/records/schemas";
import { formatDate } from "@/lib/format";

import { AddRecordForm } from "./add-record-form";

// Section « Records personnels » de l'onglet Repères (P2-02 partie 4, OPEN-01), d'après la maquette
// « Sportifs » du 03/11/2026 (page 2g). Serveur : la RLS filtre.
export async function RecordsSection({
  organizationId,
  athleteId,
  today,
}: {
  organizationId: string;
  athleteId: string;
  today: string;
}) {
  const { best, history } = await listRecords(organizationId, athleteId);
  const bestIds = new Set(best.map((entry) => entry.id));

  return (
    <section
      aria-labelledby="records-title"
      className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="records-title"
          className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
        >
          Records personnels
        </h2>
        <p className="text-[13.5px] leading-[1.5] text-pretty text-muted">
          Meilleur temps par épreuve, calculé sur toutes les performances enregistrées. Un Hyrox se
          compare dans sa catégorie.
        </p>
      </div>

      {best.length === 0 ? (
        <p
          role="status"
          className="rounded-2xl border border-dashed border-line-2 p-[18px] text-[14px] leading-[1.5] text-muted"
        >
          Aucune performance pour l&apos;instant. Ajoute un temps sur 5 km, 10 km, semi, marathon ou
          Hyrox.
        </p>
      ) : (
        <ul aria-label="Records actuels" className="flex flex-wrap gap-2.5">
          {best.map((entry) => (
            <RecordTile key={entry.id} entry={entry} />
          ))}
        </ul>
      )}

      {history.length > 0 ? (
        <details className={accordionClass}>
          <summary className={accordionSummaryClass}>
            <AccordionChevron />
            Toutes les performances ({history.length})
          </summary>
          <ul
            aria-label="Historique des performances"
            className="flex flex-col border-t border-line"
          >
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 border-b border-line py-2.5 pr-2 pl-3.5 text-[13.5px] last:border-b-0"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted">{formatDate(entry.achievedOn)} ·</span>
                  {recordTitle(entry.event, entry.hyroxCategory)} :
                  <span className="font-medium tabular-nums">
                    {formatRaceTime(entry.timeSeconds)}
                  </span>
                  {entry.raceName ? <span className="text-muted">· {entry.raceName}</span> : null}
                  {bestIds.has(entry.id) ? (
                    <span className="text-[12.5px] font-medium text-violet-text">Record</span>
                  ) : null}
                </span>
                <form action={deleteRecord.bind(null, organizationId, athleteId, entry.id)}>
                  <button
                    type="submit"
                    aria-label={`Supprimer la performance ${recordTitle(entry.event, entry.hyroxCategory)} du ${formatDate(entry.achievedOn)}`}
                    className="grid size-[38px] place-items-center rounded-[10px] text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-alert"
                  >
                    <Trash2 aria-hidden size={15} strokeWidth={1.8} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <span aria-hidden className="h-px bg-line" />
      <AddRecordForm organizationId={organizationId} athleteId={athleteId} today={today} />
    </section>
  );
}

// Record (maquette « Sportifs », page 2g) : point de couleur et épreuve, temps, allure ou course et
// date. Course à pied en bleu Running, Hyrox en ambre.
function RecordTile({ entry }: { entry: RecordEntry }) {
  const pace = recordPace(entry.event, entry.timeSeconds);
  return (
    <li className="flex min-w-0 flex-[1_1_220px] flex-col gap-1.5 rounded-[14px] bg-surface-2 p-4">
      {/* L'épreuve dans la couleur de sa discipline (16/11/2026 : plus de pastilles). */}
      <span
        className={`text-[13px] leading-[16.5px] font-semibold ${
          entry.event === "hyrox" ? "text-hyrox" : "text-run-text"
        }`}
      >
        {recordTitle(entry.event, entry.hyroxCategory)}
      </span>
      <span className="text-[24px] leading-[1.1] font-semibold tracking-[-0.02em] whitespace-nowrap tabular-nums">
        {formatRaceTime(entry.timeSeconds)}
      </span>
      <span className="text-[12.5px] leading-[1.45] text-muted">
        {[pace, entry.raceName, formatDate(entry.achievedOn)].filter(Boolean).join(" · ")}
      </span>
    </li>
  );
}
