// Recherche globale du coach (4e, D-62) : de la saisie au motif SQL `ilike`. Règles PURES, testées.
// Les caractères spéciaux d'ilike (% _ \) sont échappés ; virgules et parenthèses (syntaxe des
// filtres « or » de l'API) deviennent des espaces. Moins de 2 lettres : on ne cherche pas.
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 80;

export function cleanQuery(raw: string): string {
  return raw.replace(/[,()]/g, " ").replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX);
}

export function searchPattern(raw: string): string | null {
  const query = cleanQuery(raw);
  if (query.length < SEARCH_MIN) return null;
  return `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
