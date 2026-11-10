// Adresses de l'éditeur de séance, utilisées côté serveur ET navigateur (module sans "use client").

// Retour à l'éditeur du programme, ouvert sur la semaine et la séance qu'on vient de modifier.
export function programHref(meta: {
  base: string;
  programId: string;
  weekIndex: number;
  sessionKey: string;
}): string {
  return `${meta.base}/${meta.programId}?semaine=${meta.weekIndex}&seance=${meta.sessionKey}`;
}
