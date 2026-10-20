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
