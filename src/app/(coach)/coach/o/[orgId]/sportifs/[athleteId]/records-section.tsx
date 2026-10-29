import { Trash2, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { deleteRecord } from "@/features/records/actions";
import { listRecords, type RecordEntry } from "@/features/records/queries";
import { formatRaceTime, recordPace, recordTitle } from "@/features/records/schemas";
import { formatDate } from "@/lib/format";

import { AddRecordForm } from "./add-record-form";
import { tileTones } from "./reference-tile";

// Section « Records personnels » de l'onglet Repères (P2-02 partie 4, OPEN-01). Serveur : la RLS filtre.
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
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="records-title" className="text-title font-medium">
          Records personnels
        </h2>
        <p className="text-small text-muted">
          Meilleur temps par épreuve, calculé sur toutes les performances enregistrées. Un Hyrox se
          compare dans sa catégorie.
        </p>
      </div>

      {best.length === 0 ? (
        <p
          role="status"
          className="rounded-[14px] border border-dashed border-line-2 p-4 text-muted"
        >
          Aucune performance pour l&apos;instant. Ajoute un temps sur 5 km, 10 km, semi, marathon ou
          Hyrox.
        </p>
      ) : (
        <ul aria-label="Records actuels" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {best.map((entry) => (
            <RecordTile key={entry.id} entry={entry} />
          ))}
        </ul>
      )}

      {history.length > 0 ? (
        <details className="rounded-[14px] border border-line">
          <summary className="cursor-pointer px-4 py-3 text-small text-muted hover:text-text">
            Toutes les performances ({history.length})
          </summary>
          <ul
            aria-label="Historique des performances"
            className="flex flex-col border-t border-line"
          >
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-small last:border-b-0"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted">{formatDate(entry.achievedOn)} ·</span>
                  {recordTitle(entry.event, entry.hyroxCategory)} :
                  <span className="font-mono tabular">{formatRaceTime(entry.timeSeconds)}</span>
                  {entry.raceName ? <span className="text-muted">· {entry.raceName}</span> : null}
                  {bestIds.has(entry.id) ? <Badge tone="live">Record</Badge> : null}
                </span>
                <form action={deleteRecord.bind(null, organizationId, athleteId, entry.id)}>
                  <button
                    type="submit"
                    aria-label={`Supprimer la performance ${recordTitle(entry.event, entry.hyroxCategory)} du ${formatDate(entry.achievedOn)}`}
                    className="inline-flex size-8 items-center justify-center rounded-[7px] text-muted hover:bg-surface-2 hover:text-alert"
                  >
                    <Trash2 aria-hidden size={15} strokeWidth={1.7} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <AddRecordForm organizationId={organizationId} athleteId={athleteId} today={today} />
    </section>
  );
}

// Tuile d'un record : course à pied en bleu Running, Hyrox en orange (mêmes couleurs que les repères).
function RecordTile({ entry }: { entry: RecordEntry }) {
  const colors = tileTones[entry.event === "hyrox" ? "hyrox" : "run"];
  const pace = recordPace(entry.event, entry.timeSeconds);
  return (
    <li className={`flex flex-col gap-1.5 rounded-[14px] border p-4 ${colors.tile}`}>
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full ${colors.icon}`}
        >
          <Trophy size={14} strokeWidth={1.75} />
        </span>
        <span className="text-small text-muted">
          {recordTitle(entry.event, entry.hyroxCategory)}
        </span>
      </span>
      <span className={`font-mono text-h3 font-medium tabular ${colors.text}`}>
        {formatRaceTime(entry.timeSeconds)}
      </span>
      <span className="text-caption text-muted">
        {[pace, entry.raceName, formatDate(entry.achievedOn)].filter(Boolean).join(" · ")}
      </span>
    </li>
  );
}
