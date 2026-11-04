// Calendrier du coach (P2-05) : règles PURES de date, testées par Vitest. Tout est calculé en UTC
// sur des dates AAAA-MM-JJ : pas de décalage d'un jour au passage à l'heure d'été.

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

// « samedi 12 décembre » (titres de la liste sur téléphone).
export function dayLabel(iso: string): string {
  return dayFormatter.format(new Date(`${iso}T00:00:00Z`));
}

// Période d'une barre d'agenda (D-78 : déplacé depuis l'ancienne barre de l'agenda).
const capitalizeLabel = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const utcDay = (day: string) => new Date(`${day}T00:00:00Z`);
const monthYear = new Intl.DateTimeFormat("fr-BE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthShort = new Intl.DateTimeFormat("fr-BE", { month: "short", timeZone: "UTC" });
const monthOnly = new Intl.DateTimeFormat("fr-BE", { month: "long", timeZone: "UTC" });
const thisYear = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date()).slice(0, 4);

// « Octobre 2026 » ; une semaine à cheval : « Oct. – nov. 2026 » (ou « Déc. 2026 – janv. 2027 »).
// `short` (téléphone) : sans l'année quand c'est celle d'aujourd'hui (« Octobre », « Oct. – nov. »).
export function periodLabel(from: string, to: string, short = false): string {
  if (short && from.slice(0, 4) === to.slice(0, 4) && from.slice(0, 4) === thisYear()) {
    return from.slice(0, 7) === to.slice(0, 7)
      ? capitalizeLabel(monthOnly.format(utcDay(from)))
      : capitalizeLabel(`${monthShort.format(utcDay(from))} – ${monthShort.format(utcDay(to))}`);
  }
  if (from.slice(0, 7) === to.slice(0, 7)) return capitalizeLabel(monthYear.format(utcDay(from)));
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = monthShort.format(utcDay(from));
  const end = monthShort.format(utcDay(to));
  return capitalizeLabel(
    sameYear
      ? `${start} – ${end} ${to.slice(0, 4)}`
      : `${start} ${from.slice(0, 4)} – ${end} ${to.slice(0, 4)}`,
  );
}
