import { Clock3 } from "lucide-react";

// Heures de coaching de la période affichée (panneau de l'Agenda sur ordinateur, demandes d'Antonino du
// 02/11 ; elles ne sont plus sous la grille) : le nom de la période en gras avec son icône (« Cette
// semaine »), une barre qui montre la part des séances individuelles (violet plein) et collectives
// (violet léger), puis une ligne par type et le total. Mêmes chiffres que la grille (durée des
// séances), filtres compris. La barre est décorative : les lignes disent tout, avec leurs mots.
export type HoursSplit = { individual: number; group: number };

// « 30H15 », « 7H00 » : le H en majuscule (demande d'Antonino du 02/11).
export function hoursLabel(minutes: number): string {
  return `${Math.floor(minutes / 60)}H${String(minutes % 60).padStart(2, "0")}`;
}

export function CoachingHours({ label, split }: { label: string; split: HoursSplit }) {
  const total = split.individual + split.group;
  const share = total > 0 ? (split.individual / total) * 100 : 0;
  const row = "flex items-center justify-between gap-3";
  return (
    <section aria-label="Heures de coaching" className="px-1.5">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
        <Clock3 aria-hidden size={15} strokeWidth={2} className="shrink-0 text-violet-text" />
        {label}
      </h2>
      <div aria-hidden className="mt-2.5 flex h-1.5 gap-0.5">
        {total === 0 ? (
          <span className="flex-1 rounded-full bg-surface-2" />
        ) : (
          <>
            {split.individual > 0 ? (
              <span className="rounded-full bg-violet" style={{ width: `${share}%` }} />
            ) : null}
            {split.group > 0 ? <span className="flex-1 rounded-full bg-violet/35" /> : null}
          </>
        )}
      </div>
      <dl className="mt-3 flex flex-col gap-2 text-[13px]">
        <div className={row}>
          <dt className="flex items-center gap-2 text-text-2">
            <span aria-hidden className="size-2 rounded-full bg-violet" />
            Individuelles
          </dt>
          <dd className="font-medium tabular">{hoursLabel(split.individual)}</dd>
        </div>
        <div className={row}>
          <dt className="flex items-center gap-2 text-text-2">
            <span aria-hidden className="size-2 rounded-full bg-violet/35" />
            Collectives
          </dt>
          <dd className="font-medium tabular">{hoursLabel(split.group)}</dd>
        </div>
        <div className={`${row} mt-0.5 border-t border-line-soft pt-2.5`}>
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold tabular">{hoursLabel(total)}</dd>
        </div>
      </dl>
    </section>
  );
}
