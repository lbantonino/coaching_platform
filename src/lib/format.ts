// Dates affichées en français, fuseau de Bruxelles (stockées en UTC en base).
const dateTimeFormatter = new Intl.DateTimeFormat("fr-BE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Brussels",
});

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}

// Date seule (« 15 octobre 2026 ») à partir d'une date SQL AAAA-MM-JJ, sans décalage de fuseau.
const dateFormatter = new Intl.DateTimeFormat("fr-BE", { dateStyle: "long", timeZone: "UTC" });

export function formatDate(isoDay: string): string {
  return dateFormatter.format(new Date(`${isoDay}T00:00:00Z`));
}

// Date du jour à Bruxelles (AAAA-MM-JJ). À appeler uniquement dans du code exécuté à la requête.
export function todayIsoInBrussels(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());
}

// Nombre de jours entre deux dates AAAA-MM-JJ (négatif si `to` est avant `from`). Calcul en UTC :
// pas de décalage d'une heure au passage à l'heure d'été.
export function daysBetween(fromIsoDay: string, toIsoDay: string): number {
  const from = Date.parse(`${fromIsoDay}T00:00:00Z`);
  const to = Date.parse(`${toIsoDay}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

// Date seule (« 15 septembre 2026 ») d'un horodatage, au fuseau de Bruxelles.
const dayFormatter = new Intl.DateTimeFormat("fr-BE", {
  dateStyle: "long",
  timeZone: "Europe/Brussels",
});

export function formatDay(isoTimestamp: string): string {
  return dayFormatter.format(new Date(isoTimestamp));
}

// Heure actuelle à Bruxelles (« 14:05 »). À appeler uniquement dans du code exécuté à la requête.
export function nowTimeInBrussels(): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Brussels",
  }).format(new Date());
}
