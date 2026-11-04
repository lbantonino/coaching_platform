// Dates affichées en français, fuseau de Bruxelles (stockées en UTC en base).
const dateTimeFormatter = new Intl.DateTimeFormat("fr-BE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Brussels",
});

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}

// Date et heure en abrégé (« 18 sept. 2026 à 19:00 »), fuseau de Bruxelles : métadonnées discrètes
// (« Mise à jour le … » des notes libres, maquette « Sportifs » 2i).
const shortDateFormatter = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Brussels",
});
const shortTimeFormatter = new Intl.DateTimeFormat("fr-BE", {
  timeStyle: "short",
  timeZone: "Europe/Brussels",
});

export function formatDateTimeShort(isoDate: string): string {
  const date = new Date(isoDate);
  return `${shortDateFormatter.format(date)} à ${shortTimeFormatter.format(date)}`;
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

// Jour en abrégé (« 3 nov. 2026 »), fuseau de Bruxelles, à partir d'un horodatage : dates de la frise
// de l'historique (maquette « Sportifs », pages 2a et 2k).
const shortDayFormatter = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Brussels",
});

export function formatDayShort(isoTimestamp: string): string {
  return shortDayFormatter.format(new Date(isoTimestamp));
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

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const shortDay = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  timeZone: "UTC",
});

// Jour court d'une date AAAA-MM-JJ : « Aujourd'hui », « Demain », « Hier », sinon « Mar 27 ».
export function dayShortLabel(isoDay: string, today: string): string {
  const gap = daysBetween(today, isoDay);
  if (gap === 0) return "Aujourd'hui";
  if (gap === 1) return "Demain";
  if (gap === -1) return "Hier";
  return capitalize(shortDay.format(new Date(`${isoDay}T00:00:00Z`)).replace(".", ""));
}

// Échéance d'une tâche : rien, « En retard », ou le jour court.
export function dueLabel(isoDay: string | null, today: string): string | null {
  if (isoDay === null) return null;
  return isoDay < today ? "En retard" : dayShortLabel(isoDay, today);
}

const brusselsDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" });
const brusselsTime = new Intl.DateTimeFormat("fr-BE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Brussels",
});

// Jour (AAAA-MM-JJ) d'un horodatage, au fuseau de Bruxelles.
export function brusselsDayOf(isoTimestamp: string): string {
  return brusselsDay.format(new Date(isoTimestamp));
}

// Heure d'un message : « 09:12 » aujourd'hui, sinon le jour court (« Hier », « Mar 20 »), à Bruxelles.
export function messageTime(isoTimestamp: string, today: string): string {
  const date = new Date(isoTimestamp);
  const day = brusselsDay.format(date);
  return day === today ? brusselsTime.format(date) : dayShortLabel(day, today);
}
