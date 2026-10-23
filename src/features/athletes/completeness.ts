// Fiche « à compléter » (D-35) : une fiche créée d'un simple nom depuis « Nouvelle séance » n'a pas
// encore de quoi suivre et joindre le sportif. Calculé, jamais stocké : le repère disparaît tout seul
// une fois la fiche complétée (nom de famille, et un e-mail ou un téléphone).
export type ContactFields = { lastName: string | null; email: string | null; phone: string | null };

export function missingProfileInfo(athlete: ContactFields): string[] {
  const missing: string[] = [];
  if (!athlete.lastName) missing.push("nom de famille");
  if (!athlete.email && !athlete.phone) missing.push("e-mail ou téléphone");
  return missing;
}

// « Fiche à compléter : nom de famille, e-mail ou téléphone »
export function completionLabel(missing: string[]): string {
  return `Fiche à compléter : ${missing.join(", ")}`;
}
