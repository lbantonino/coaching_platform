// Nouveau sportif tapé dans la liste de « Créer un programme » (règle d'Antonino du 24/11/2026) : un seul
// mot est le prénom, traits d'union compris (« Jean-Baptiste ») ; avec deux mots ou plus, le premier est
// le prénom et la suite le nom de famille (« Antonino Lo Bianco »). Mêmes limites que la fiche (80).
// Règle pure : la liste l'affiche dans le navigateur, l'action serveur la revérifie.
const MAX = 80;

export function quickAthleteName(
  text: string,
): { ok: true; firstName: string; lastName: string } | { ok: false; error: string } {
  const [firstName = "", ...rest] = text.trim().split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ");
  if (!firstName) return { ok: false, error: "Écris le prénom du sportif." };
  if (firstName.length > MAX) {
    return { ok: false, error: "Le prénom est trop long (80 caractères maximum)." };
  }
  if (lastName.length > MAX) {
    return { ok: false, error: "Le nom est trop long (80 caractères maximum)." };
  }
  return { ok: true, firstName, lastName };
}
