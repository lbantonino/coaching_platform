// Calendrier du coach (P2-05) : règles PURES de date, testées par Vitest. Tout est calculé en UTC
// sur des dates AAAA-MM-JJ : pas de décalage d'un jour au passage à l'heure d'été.

// Mois affiché : « 2026-10 » depuis l'URL (?mois=), sinon le mois d'aujourd'hui.
export function parseMonth(param: string | undefined, today: string): string {
  if (param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param)) {
    const year = Number(param.slice(0, 4));
    if (year >= 2000 && year <= 2100) return param;
  }
  return today.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const date = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1),
  );
  return date.toISOString().slice(0, 7);
}

const monthFormatter = new Intl.DateTimeFormat("fr-BE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// « octobre 2026 »
export function monthLabel(month: string): string {
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
}

export type CalendarDay = { iso: string; day: number; inMonth: boolean };

// Semaines du mois, du lundi au dimanche, complétées par les jours des mois voisins.
export function monthGrid(month: string): CalendarDay[][] {
  const first = new Date(`${month}-01T00:00:00Z`);
  // getUTCDay : 0 = dimanche. On recule jusqu'au lundi précédent (ou au jour même).
  const offset = (first.getUTCDay() + 6) % 7;
  const cursor = new Date(first);
  cursor.setUTCDate(1 - offset);

  const weeks: CalendarDay[][] = [];
  do {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i += 1) {
      const iso = cursor.toISOString().slice(0, 10);
      week.push({ iso, day: cursor.getUTCDate(), inMonth: iso.startsWith(month) });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  } while (cursor.toISOString().startsWith(month));
  return weeks;
}

// Regroupe des éléments datés par jour (AAAA-MM-JJ), dans l'ordre des dates.
export function groupByDay<T extends { date: string }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of [...items].sort((a, b) => a.date.localeCompare(b.date))) {
    const list = groups.get(item.date) ?? [];
    list.push(item);
    groups.set(item.date, list);
  }
  return groups;
}

const dayFormatter = new Intl.DateTimeFormat("fr-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const shortMonthFormatter = new Intl.DateTimeFormat("fr-BE", { month: "short", timeZone: "UTC" });

// « samedi 12 décembre » (titres de la liste sur téléphone).
export function dayLabel(iso: string): string {
  return dayFormatter.format(new Date(`${iso}T00:00:00Z`));
}

// « déc. » (bloc de date des prochaines échéances).
export function shortMonth(iso: string): string {
  return shortMonthFormatter.format(new Date(`${iso}T00:00:00Z`));
}
