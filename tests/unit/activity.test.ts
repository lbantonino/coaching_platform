import { describe, expect, it } from "vitest";

import { buildActivity, type ActivitySources } from "@/features/activity/build";

const empty: ActivitySources = {
  profile: { id: "p1", createdAt: "2026-09-15T08:00:00+00:00" },
  goals: [],
  references: [],
  records: [],
  consents: [],
  invites: [],
  notes: [],
};

describe("buildActivity (historique de la fiche)", () => {
  it("contient au moins la création de la fiche", () => {
    expect(buildActivity(empty)).toEqual([
      {
        id: "profile-p1",
        kind: "profile",
        at: "2026-09-15T08:00:00+00:00",
        title: "Fiche créée",
        detail: null,
      },
    ]);
  });

  it("ajoute la clôture d'un objectif seulement s'il est atteint ou abandonné", () => {
    const events = buildActivity({
      ...empty,
      goals: [
        {
          id: "g1",
          type: "hyrox",
          competitionName: "Hyrox Anvers",
          status: "achieved",
          createdAt: "2026-09-16T08:00:00+00:00",
          updatedAt: "2026-09-20T08:00:00+00:00",
        },
        {
          id: "g2",
          type: "fitness",
          competitionName: null,
          status: "active",
          createdAt: "2026-09-17T08:00:00+00:00",
          updatedAt: "2026-09-17T08:00:00+00:00",
        },
      ],
    });
    expect(events.map((event) => event.title)).toEqual([
      "Objectif atteint : Hyrox Anvers",
      "Objectif créé : Remise en forme / santé",
      "Objectif créé : Hyrox Anvers",
      "Fiche créée",
    ]);
  });

  it("décrit une mesure avec sa valeur, son exercice et sa date de mesure", () => {
    const [event] = buildActivity({
      ...empty,
      references: [
        {
          id: "r1",
          kind: "strength_load",
          paceMin: null,
          paceMax: null,
          bpm: null,
          exercise: "Squat",
          loadKg: 110,
          reps: 1,
          measuredOn: "2026-09-27",
          createdAt: "2026-09-27T17:00:00+00:00",
        },
      ],
    });
    expect(event).toMatchObject({
      kind: "reference",
      title: "Mesure ajoutée : Charge de référence",
      detail: "110 kg × 1 · Squat · mesurée le 27 septembre 2026",
    });
  });

  it("raconte l'invitation, l'activation du compte, les accords et les notes", () => {
    const events = buildActivity({
      ...empty,
      invites: [
        {
          id: "i1",
          createdAt: "2026-09-02T16:30:00+00:00",
          acceptedAt: "2026-09-03T05:50:00+00:00",
          revokedAt: null,
        },
      ],
      consents: [
        {
          id: "c1",
          action: "granted",
          source: "athlete",
          proof: null,
          recordedAt: "2026-10-01T10:00:00+00:00",
        },
      ],
      notes: [{ visibility: "athlete", updatedAt: "2026-10-06T18:00:00+00:00" }],
    });
    expect(events.map((event) => [event.kind, event.title])).toEqual([
      ["note", "Message au sportif mis à jour"],
      ["consent", "Accord donné par le sportif depuis son espace"],
      ["profile", "Fiche créée"],
      ["account", "Compte activé par le sportif"],
      ["invite", "Lien d'invitation créé"],
    ]);
  });

  it("raconte une performance ajoutée, avec son temps et sa course", () => {
    const [event] = buildActivity({
      ...empty,
      records: [
        {
          id: "r1",
          event: "hyrox",
          hyroxCategory: "open",
          timeSeconds: 4720,
          achievedOn: "2025-12-14",
          raceName: "Hyrox Gent",
          createdAt: "2026-10-01T10:00:00+00:00",
        },
      ],
    });
    expect(event).toMatchObject({
      kind: "record",
      title: "Performance ajoutée : Hyrox Open",
      detail: "1:18:40 · Hyrox Gent · le 14 décembre 2025",
    });
  });

  it("trie par date réelle, même si les dates sont écrites dans des fuseaux différents", () => {
    const events = buildActivity({
      ...empty,
      notes: [{ visibility: "coach", updatedAt: "2026-09-15T09:30:00+02:00" }],
    });
    // 09:30 à Bruxelles (UTC+2) = 07:30 UTC : AVANT la création de la fiche à 08:00 UTC.
    expect(events.map((event) => event.kind)).toEqual(["profile", "note"]);
  });
});
