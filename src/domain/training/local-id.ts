// Identifiant local court, unique dans le programme (clé d'une séance, d'une phase, d'un élément).
// Module à part (revue MVP du 13/11) : plan-edit et scheduling s'en servent tous les deux sans
// dépendre l'un de l'autre en boucle.
export function localId(prefix: string, taken: ReadonlySet<string> = new Set()): string {
  for (;;) {
    const id = `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    if (!taken.has(id)) return id;
  }
}
