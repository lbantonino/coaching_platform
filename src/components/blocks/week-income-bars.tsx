// Encaissés de la semaine, jour par jour (tableau de bord, demande d'Antonino du 01/11) : sept barres
// fines du lundi au dimanche, à droite du total. Aujourd'hui en violet plein, les jours passés en violet
// doux, un jour sans paiement en simple trait. Au survol d'un jour, son montant. Le total écrit à côté
// et la page Comptabilité donnent les chiffres : le graphique n'est pas lu par les lecteurs d'écran.
// Il ne s'affiche que si la carte a la place (requête de conteneur @container sur la carte).
export type IncomeDay = {
  date: string;
  letter: string;
  // « Lundi 27 octobre : 120,00 € », au survol.
  title: string;
  cents: number;
};

const PLOT = 48;

export function WeekIncomeBars({ days, today }: { days: IncomeDay[]; today: string }) {
  const max = Math.max(0, ...days.map((day) => day.cents));
  return (
    <div aria-hidden className="hidden shrink-0 items-end gap-1 @[280px]:flex">
      {days.map((day) => {
        const isToday = day.date === today;
        const height = max > 0 && day.cents > 0 ? Math.max(4, (day.cents / max) * PLOT) : 0;
        return (
          <div key={day.date} title={day.title} className="flex w-3 flex-col items-center gap-1.5">
            <div className="flex w-full items-end justify-center" style={{ height: PLOT }}>
              {height > 0 ? (
                <span
                  className={`w-2 rounded-t-[4px] ${isToday ? "bg-violet" : "bg-violet/55"}`}
                  style={{ height }}
                />
              ) : (
                <span className="h-0.5 w-2 rounded-full bg-line-2" />
              )}
            </div>
            <span
              className={`text-[11px] leading-none ${isToday ? "font-semibold text-text" : "text-faint"}`}
            >
              {day.letter}
            </span>
          </div>
        );
      })}
    </div>
  );
}
