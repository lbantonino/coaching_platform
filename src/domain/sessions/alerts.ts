// Alertes des séances (D-205, phase C ; fiche validée le 24/11/2026), comme le Calendrier d'Apple : une
// ou deux par séance, rangées en minutes AVANT le début (base : coach_sessions.alerts, contrainte
// private.alerts_are_valid). Une séance « Jour entier » commence à 00:00 (D-204) : « le jour même à
// 09:00 » = -540 min, « 1 jour avant à 09:00 » = 900 min.

const TIMED = [0, 5, 10, 15, 30, 60, 120, 1440, 2880];
const ALL_DAY = [-540, 900, 2340, 9540];
export const MAX_ALERTS = 2;

export function alertOptions(allDay: boolean): number[] {
  return allDay ? [...ALL_DAY] : [...TIMED];
}

const TIMED_LABELS: Record<number, string> = {
  0: "À l'heure de la séance",
  5: "5 min avant",
  10: "10 min avant",
  15: "15 min avant",
  30: "30 min avant",
  60: "1 h avant",
  120: "2 h avant",
  1440: "1 jour avant",
  2880: "2 jours avant",
};
const ALL_DAY_LABELS: Record<number, string> = {
  [-540]: "Le jour même (09:00)",
  900: "1 jour avant (09:00)",
  2340: "2 jours avant (09:00)",
  9540: "1 semaine avant (09:00)",
};

export function alertLabel(offset: number, allDay: boolean): string {
  return (allDay ? ALL_DAY_LABELS : TIMED_LABELS)[offset] ?? `${offset} min avant`;
}

// « 1440,15 » -> [1440, 15] ; vide -> [] ; plus de deux, doublon ou valeur non permise -> null.
export function parseAlerts(text: string, allDay: boolean): number[] | null {
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  if (parts.length > MAX_ALERTS) return null;
  const allowed = new Set(alertOptions(allDay));
  const values = parts.map(Number);
  if (values.some((value) => !Number.isInteger(value) || !allowed.has(value))) return null;
  return new Set(values).size === values.length ? values : null;
}

// Décalage du fuseau (minutes) à un instant donné : heure locale affichée moins l'heure UTC.
function zoneOffsetMinutes(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((local - Math.floor(instant / 60_000) * 60_000) / 60_000);
}

// Instant (UTC) d'une heure locale du fuseau : « 2026-12-02 », « 19:00 », Europe/Brussels.
function localToInstant(date: string, time: string, timeZone: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const first = asUtc - zoneOffsetMinutes(asUtc, timeZone) * 60_000;
  // Au changement d'heure, le décalage de l'instant trouvé peut différer : on le reprend une fois.
  return asUtc - zoneOffsetMinutes(first, timeZone) * 60_000;
}

// Heure de l'alerte : le début de la séance (heure locale du fuseau de l'organisation) moins le délai.
// Les délais en jours gardent l'heure locale (la veille à 09:00, même au changement d'heure).
export function alertMoment(
  date: string,
  startTime: string,
  offset: number,
  timeZone: string,
): Date {
  const days = Math.floor(offset / 1440);
  const minutes = offset - days * 1440;
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10);
  return new Date(localToInstant(shifted, startTime.slice(0, 5), timeZone) - minutes * 60_000);
}

// Initiale du nom : « Sarah Vermeulen » -> « Sarah V. ».
const shortName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length > 0 ? `${first} ${rest[0].charAt(0).toUpperCase()}.` : first;
};

const WHEN_ALL_DAY: Record<number, string> = {
  [-540]: "Aujourd'hui, toute la journée",
  900: "Demain, toute la journée",
  2340: "Dans 2 jours, toute la journée",
  9540: "Dans 1 semaine, toute la journée",
};

// Texte de la notification, sans donnée de santé : « Coaching force avec Sarah V. » ; « Dans 15 min ·
// 18:00 · Salle Aspria ». Une séance individuelle sans titre à elle (titre = nom du sportif) garde
// le nom seul.
export function alertText(input: {
  title: string;
  athleteName: string | null;
  location: string | null;
  startTime: string;
  allDay: boolean;
  offset: number;
}): { title: string; body: string } {
  const { athleteName, offset } = input;
  const title =
    athleteName && input.title.trim() !== athleteName.trim()
      ? `${input.title} avec ${shortName(athleteName)}`
      : input.title;
  const time = input.startTime.slice(0, 5);
  const when = input.allDay
    ? (WHEN_ALL_DAY[offset] ?? "Toute la journée")
    : offset === 0
      ? `Maintenant · ${time}`
      : offset === 1440
        ? `Demain · ${time}`
        : offset === 2880
          ? `Dans 2 jours · ${time}`
          : `Dans ${offset >= 60 ? `${offset / 60} h` : `${offset} min`} · ${time}`;
  return { title, body: [when, input.location].filter(Boolean).join(" · ") };
}
