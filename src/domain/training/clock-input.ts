// Saisie des allures et des durées au téléphone (demande d'Antonino du 10/11). Le pavé numérique
// d'iOS n'a pas de « : » et ne permet pas de changer de clavier : on le pose tout seul. Règles
// PURES, testées par Vitest.

// Allure (toujours en m:ss : min/km, min/500 m) : « 455 » -> « 4:55 », « 1045 » -> « 10:45 » ;
// « 4,55 » ou « 4.55 » (clavier complet) -> « 4:55 » ; un « : » déjà écrit est gardé tel quel, pour
// qu'on puisse effacer et corriger sans que le champ se réécrive sous les doigts.
export function maskPace(input: string): string {
  const value = input.replace(/[.,]/g, ":");
  if (value.includes(":")) return value;
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, -2)}:${digits.slice(-2)}`;
}

// Durée tapée au pavé décimal (un nombre seul reste des minutes) : « 2,30 » -> « 2:30 » (min:s) ;
// « 1,5 » -> une minute et demie, écrite « 1:30 ». Le reste est rendu tel quel.
export function decimalClock(input: string): string {
  const value = input.trim();
  const seconds = /^(\d+)[.,](\d{2})$/.exec(value);
  if (seconds) return `${seconds[1]}:${seconds[2]}`;
  const tenths = /^(\d+)[.,](\d)$/.exec(value);
  if (tenths) return `${tenths[1]}:${String(Number(tenths[2]) * 6).padStart(2, "0")}`;
  return value;
}
