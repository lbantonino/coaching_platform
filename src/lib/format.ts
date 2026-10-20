// Dates affichées en français, fuseau de Bruxelles (stockées en UTC en base).
const dateTimeFormatter = new Intl.DateTimeFormat("fr-BE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Brussels",
});

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}
