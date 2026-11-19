import { describe, expect, it } from "vitest";

import { localId, recordIds, replayIds } from "@/domain/training/local-id";

// Un geste rejoué sur une version plus récente du brouillon (EditorProvider, bug du 19/11) doit créer
// les MÊMES clés que la première fois : l'éditeur ouvre la séance par la clé qu'il vient de créer.
describe("recordIds / replayIds", () => {
  const gesture = () => [localId("s"), localId("ph")];

  it("rejoué, un geste reprend les identifiants tirés la première fois, dans l'ordre", () => {
    const first = recordIds(gesture);
    expect(first.ids).toEqual(first.value);
    expect(replayIds(first.ids, gesture)).toEqual(first.value);
  });

  it("hors enregistrement, chaque tirage est nouveau", () => {
    expect(localId("s")).not.toBe(localId("s"));
  });

  it("un identifiant déjà pris dans la version récente n'est pas réutilisé", () => {
    const first = recordIds(() => localId("s"));
    const taken = new Set([first.value]);
    const again = replayIds(first.ids, () => localId("s", taken));
    expect(again).not.toBe(first.value);
    expect(again.startsWith("s-")).toBe(true);
  });
});
