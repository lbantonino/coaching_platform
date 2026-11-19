// Identifiant local court, unique dans le programme (clé d'une séance, d'une phase, d'un élément).
// Module à part (revue MVP du 13/11) : plan-edit et scheduling s'en servent tous les deux sans
// dépendre l'un de l'autre en boucle.
//
// Rejouer un geste (EditorProvider, bug du 19/11) : un geste fait pendant que l'éditeur attend une
// version plus récente du brouillon est rejoué sur elle. Il doit alors créer les MÊMES clés que la
// première fois (l'éditeur ouvre la séance par la clé qu'il vient de créer) : recordIds note les
// identifiants tirés pendant le geste, replayIds les lui redonne dans le même ordre.

type Tape = { ids: string[]; replay: boolean; at: number };
let tape: Tape | null = null;

function withTape<T>(next: Tape, run: () => T): T {
  const previous = tape;
  tape = next;
  try {
    return run();
  } finally {
    tape = previous;
  }
}

export function recordIds<T>(run: () => T): { value: T; ids: string[] } {
  const next: Tape = { ids: [], replay: false, at: 0 };
  const value = withTape(next, run);
  return { value, ids: next.ids };
}

export function replayIds<T>(ids: readonly string[], run: () => T): T {
  return withTape({ ids: [...ids], replay: true, at: 0 }, run);
}

export function localId(prefix: string, taken: ReadonlySet<string> = new Set()): string {
  if (tape?.replay) {
    const id = tape.ids[tape.at];
    tape.at += 1;
    // Le même identifiant, s'il a le bon préfixe et n'est pas déjà pris dans la version récente.
    if (id !== undefined && id.startsWith(`${prefix}-`) && !taken.has(id)) return id;
  }
  for (;;) {
    const id = `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    if (taken.has(id)) continue;
    if (tape && !tape.replay) tape.ids.push(id);
    return id;
  }
}
