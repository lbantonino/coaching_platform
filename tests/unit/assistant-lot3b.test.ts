import { describe, expect, it } from "vitest";

import {
  programDraftSchema,
  programPlanSchema,
  type ProgramDraft,
} from "@/domain/training/program-plan";
import { duplicateWeekTo, removeSession, removeWeek } from "@/domain/training/plan-edit";
import { applySessionDay } from "@/domain/training/scheduling";
import {
  applyProgramEdits,
  draftReading,
  draftReadInput,
  editCardNames,
  outlineDraft,
  programEditRefusal,
  programEditSchema,
  programEditsToolSchema,
  revisionConflict,
  staleReading,
  templateEditRefusal,
  weekDetail,
  type ProgramEdit,
} from "@/features/assistant/program-edit";
import { assistantActionSchema, summarize } from "@/features/assistant/proposals";
import { systemPrompt } from "@/features/assistant/rules";
import {
  actionCardNames,
  pendingConflict,
  programActionRefusal,
  publicationRefusal,
  templateActionRefusal,
} from "@/features/assistant/program-actions";
import { groupPublishIssues, type PublishIssue } from "@/domain/training/program-publication";
import { copyStartDate } from "@/domain/training/program-status";
import { shapeSessionTemplates } from "@/features/assistant/tools/shape";

import { GENERATED_TEMPLATES } from "../../scripts/modeles-coory/modeles";

// Assistant IA, lot 3b (D-182) : l'assistant fait TOUT sur un programme et ses modèles (règle
// d'Antonino du 14/11), par carte validée. Ici : ce qu'il lit d'un programme, borné en taille.
const hybrid = GENERATED_TEMPLATES[6]!.plan;

describe("voir_brouillon : lecture d'un programme", () => {
  it("le sommaire : chaque séance en une ligne, sans son contenu, en peu de caractères", () => {
    const outline = outlineDraft(hybrid, { revision: 3, status: "draft" });
    expect(outline.titre).toBe("Hybride : 3 running + 2 musculation");
    expect(outline.revision).toBe(3);
    expect(outline.semaines).toHaveLength(8);
    expect(outline.semaines[0]?.seances).toHaveLength(5);
    expect(outline.semaines[0]?.seances[1]).toMatchObject({
      cle: "t11-s1-2",
      titre: "Force · Full body A",
      discipline: "strength",
    });
    expect(outline.semaines[0]?.seances[1]?.resume).toBeTruthy();
    expect(JSON.stringify(outline)).not.toContain('"content"');
    expect(JSON.stringify(outline).length).toBeLessThan(15_000);
  });

  it("le détail de 1 ou 2 semaines : le contenu complet de leurs séances", () => {
    const detail = weekDetail(hybrid, [2, 3]);
    expect(detail.map((week) => week.semaine)).toEqual([2, 3]);
    expect(detail[0]?.seances[1]?.content).toEqual(hybrid.weeks[1]?.sessions[1]?.content);
  });

  it("jamais plus de 2 semaines détaillées à la fois", () => {
    const id = "fb000000-0000-4000-8000-000000000002";
    expect(draftReadInput.safeParse({ programme_id: id, semaines: [2, 3] }).success).toBe(true);
    expect(draftReadInput.safeParse({ programme_id: id, semaines: [1, 2, 3] }).success).toBe(false);
    expect(draftReadInput.safeParse({ programme_id: id }).success).toBe(true);
  });
});

// --- Task 2 : chaque geste par la fonction de l'éditeur ---------------------------------------
const draft: ProgramDraft = { ...hybrid, startDate: "2026-11-16" };
const at = (week: number, slot: number) => hybrid.weeks[week - 1]!.sessions[slot]!;
const run = (edits: ProgramEdit[], plan = draft) => {
  const result = applyProgramEdits(plan, edits, { today: "2026-11-14" });
  if (!result.ok) throw new Error(result.error);
  return result;
};

describe("moteur des opérations (même logique que l'éditeur)", () => {
  it("modifier une séance : seul son contenu change, la carte dit l'exercice remplacé", () => {
    const force = at(1, 1);
    if (force.content.discipline !== "strength") throw new Error("séance de musculation attendue");
    const items = force.content.items.map((item, i) =>
      i === 0 && item.kind === "exercise"
        ? { ...item, exerciseId: "e9844c81-7922-5862-b902-f3daa687154f", name: "Presse à cuisses" }
        : item,
    );
    const seance = {
      title: force.title,
      sessionType: force.sessionType,
      durationMinutes: force.durationMinutes,
      content: { ...force.content, items },
    };
    const result = run([{ op: "modifier_seance", cle: force.key, seance }]);
    expect(result.lines).toEqual([
      "Semaine 1 · Force · Full body A : Back squat → Presse à cuisses",
    ]);
    expect(result.plan.weeks[0]!.sessions[1]!.content).toEqual(seance.content);
    expect(result.plan.weeks[0]!.sessions[0]).toEqual(draft.weeks[0]!.sessions[0]);
    expect(programDraftSchema.safeParse(result.plan).success).toBe(true);
  });

  it("modifier une séance de course : la carte écrit l'allure comme l'app (« 5:00 /km »)", () => {
    const session = draft.weeks
      .flatMap((week) => week.sessions)
      .find(
        (item) =>
          item.content.discipline === "running" &&
          item.content.items.some(
            (part) =>
              (part.kind === "step" && part.target?.kind === "pace") ||
              (part.kind === "repeat" && part.steps.some((step) => step.target?.kind === "pace")),
          ),
      );
    if (!session || session.content.discipline !== "running") throw new Error("course attendue");
    const five = { kind: "pace" as const, fromSecPerKm: 300, toSecPerKm: 300 };
    const items = session.content.items.map((part) =>
      part.kind === "step" && part.target?.kind === "pace"
        ? { ...part, target: five }
        : part.kind === "repeat"
          ? {
              ...part,
              steps: part.steps.map((step) =>
                step.target?.kind === "pace" ? { ...step, target: five } : step,
              ),
            }
          : part,
    );
    const seance = {
      title: session.title,
      sessionType: session.sessionType,
      durationMinutes: session.durationMinutes,
      content: { ...session.content, items },
    };
    const text = run([{ op: "modifier_seance", cle: session.key, seance }]).lines.join("\n");
    expect(text).toContain("5:00 /km");
    expect(text).not.toMatch(/@|min\/km/);
  });

  it("supprimer une séance et retirer une semaine : comme removeSession et removeWeek", () => {
    const quality = at(3, 2);
    const removed = run([{ op: "supprimer_seance", cle: quality.key }]);
    expect(removed.plan.weeks).toEqual(removeSession(draft, 3, quality.key).weeks);
    expect(removed.lines[0]).toBe(`Semaine 3 : « ${quality.title} » supprimée (définitif)`);
    const week = run([{ op: "retirer_semaine", semaine: 4 }]);
    const direct = removeWeek(draft, 4);
    expect(week.plan.weeks).toEqual(direct.weeks);
    expect(week.plan.phases).toEqual(direct.phases);
    expect(week.lines[0]).toBe(
      "Semaine 4 retirée (5 séances, définitif) ; les suivantes remontent d'un cran",
    );
  });

  it("dupliquer une semaine vers d'autres : les mêmes séances que duplicateWeekTo", () => {
    const result = run([{ op: "dupliquer_semaine", source: 2, vers: [5, 6] }]);
    const titles = (plan: ProgramDraft, i: number) => plan.weeks[i]!.sessions.map((x) => x.title);
    const direct = duplicateWeekTo(draft, 2, [5, 6]);
    expect(titles(result.plan, 4)).toEqual(titles(direct, 4));
    expect(titles(result.plan, 5)).toEqual(titles(direct, 5));
    expect(result.lines[0]).toBe(
      "Semaine 2 copiée vers les semaines 5, 6 (remplace leurs séances)",
    );
  });

  it("ajouter une séance, la déplacer vers une autre semaine, fixer un jour", () => {
    const longRun = at(1, 4);
    const added = run([
      {
        op: "ajouter_seance",
        semaine: 4,
        seance: {
          title: "Sortie longue",
          sessionType: "Sortie longue",
          durationMinutes: 60,
          content: longRun.content,
        },
      },
    ]);
    expect(added.plan.weeks[3]!.sessions).toHaveLength(6);
    expect(added.lines[0]).toMatch(/^Semaine 4 : nouvelle séance « Sortie longue » \(\d+ min\)$/);

    const quality = at(3, 2);
    const moved = run([{ op: "deplacer_seance", cle: quality.key, semaine: 4, position: 1 }]);
    expect(moved.plan.weeks[3]!.sessions[0]!.key).toBe(quality.key);
    expect(moved.plan.weeks[2]!.sessions.some((x) => x.key === quality.key)).toBe(false);
    expect(moved.lines[0]).toBe(`« ${quality.title} » : semaine 3 → semaine 4`);

    const day = run([
      { op: "organisation_semaine", semaine: 1, mode: "fixed" },
      { op: "jour_seance", cle: longRun.key, jour: "sat" },
    ]);
    const fixed = run([{ op: "organisation_semaine", semaine: 1, mode: "fixed" }]).plan;
    const direct = applySessionDay(
      fixed.weeks,
      fixed.phases,
      1,
      4,
      { day: "sat", athleteCanMove: false },
      "week",
      { startDate: draft.startDate, today: "2026-11-14" },
    );
    expect(day.plan.weeks).toEqual(direct);
    expect(day.lines[1]).toBe("Semaine 1 · Sortie longue : samedi");
  });

  it("phases, titre, discipline, début, objectif et façon de viser", () => {
    const result = run([
      { op: "retirer_phase", phase: "p2" },
      { op: "ajouter_phase", nom: "Affûtage" },
      { op: "titre", titre: "Hybride de Sarah" },
      { op: "discipline", discipline: "running" },
      { op: "debut", date: "2026-11-25" },
      { op: "objectif", course: "10 km de Bruxelles", date: "2027-01-10" },
      { op: "viser", running: "pace" },
    ]);
    expect(result.plan.phases.map((phase) => phase.name)).toEqual(["Base", "Affûtage"]);
    expect(result.plan.title).toBe("Hybride de Sarah");
    expect(result.plan.discipline).toBe("running");
    // Un mercredi revient au lundi de sa semaine, comme « Modifier les dates ».
    expect(result.plan.startDate).toBe("2026-11-23");
    expect(result.plan.goal).toMatchObject({
      raceName: "10 km de Bruxelles",
      raceDate: "2027-01-10",
    });
    expect(result.plan.aimDefaults.running).toBe("pace");
    expect(result.lines).toContain("Discipline : Hybride → Running");
    expect(result.lines).toContain(
      "Titre : « Hybride : 3 running + 2 musculation » → « Hybride de Sarah »",
    );
    expect(result.lines).toContain("Début : lundi 23 novembre 2026");
    expect(programDraftSchema.safeParse(result.plan).success).toBe(true);
  });

  it("refuse une séance, une semaine ou une phase inconnue, et plus de 20 opérations", () => {
    const fail = (edits: ProgramEdit[], plan: ProgramDraft | typeof hybrid = draft) =>
      applyProgramEdits(plan, edits, { today: "2026-11-14" });
    expect(fail([{ op: "supprimer_seance", cle: "inconnue" }])).toMatchObject({
      ok: false,
      error: expect.stringContaining("inconnue"),
    });
    expect(fail([{ op: "retirer_semaine", semaine: 9 }])).toMatchObject({
      ok: false,
      error: expect.stringContaining("semaine 9"),
    });
    expect(fail([{ op: "renommer_phase", phase: "p9", nom: "x" }])).toMatchObject({
      ok: false,
      error: expect.stringContaining("p9"),
    });
    const many = Array.from({ length: 21 }, () => ({ op: "ajouter_semaine" as const }));
    expect(programEditSchema.array().max(20).safeParse(many).success).toBe(false);
    // Un modèle n'a ni dates ni objectif (pas de sportif).
    expect(fail([{ op: "debut", date: "2026-11-23" }], hybrid)).toMatchObject({ ok: false });
    const template = applyProgramEdits(hybrid, [
      { op: "semaine_allegee", semaine: 2, allegee: true },
    ]);
    expect(template.ok && programPlanSchema.safeParse(template.plan).success).toBe(true);
  });
});

// --- Task 3 : cartes « Modifier le programme » et « Modifier le modèle » ---------------------
describe("modifier_programme et modifier_modele : schémas stricts", () => {
  const programId = "fb000000-0000-4000-8000-000000000002";
  const operations = [{ op: "titre", titre: "Bloc 2" }];
  const parse = (kind: string, params: unknown) =>
    assistantActionSchema.safeParse({ kind, params }).success;

  it("accepte une carte valable, y compris un programme publié sans brouillon (révision 0)", () => {
    expect(parse("modifier_programme", { programId, revision: 2, operations })).toBe(true);
    expect(parse("modifier_programme", { programId, revision: 0, operations })).toBe(true);
    expect(parse("modifier_modele", { templateId: programId, version: 1, operations })).toBe(true);
  });

  it("refuse une opération inconnue, plus de 20 opérations et tout champ inconnu", () => {
    const many = Array.from({ length: 21 }, () => ({ op: "ajouter_semaine" }));
    expect(
      parse("modifier_programme", { programId, revision: 2, operations: [{ op: "effacer" }] }),
    ).toBe(false);
    expect(parse("modifier_programme", { programId, revision: 2, operations: many })).toBe(false);
    expect(parse("modifier_programme", { programId, revision: 2, operations: [] })).toBe(false);
    expect(
      parse("modifier_programme", { programId, revision: 2, operations, organizationId: "x" }),
    ).toBe(false);
    expect(
      parse("modifier_programme", {
        programId,
        revision: 2,
        operations: [{ op: "titre", titre: "Bloc 2", sportif: "x" }],
      }),
    ).toBe(false);
    // La révision lue est obligatoire : sans elle, rien ne protège un brouillon modifié entre-temps.
    expect(parse("modifier_programme", { programId, operations })).toBe(false);
    expect(parse("modifier_modele", { templateId: programId, version: 0, operations })).toBe(false);
  });

  it("l'outil donné à Claude reste court : la séance renvoie au format de creer_programme", () => {
    const json = JSON.stringify(programEditsToolSchema);
    expect(json.length).toBeLessThan(8_000);
    expect(json).toContain("modifier_seance");
    expect(json).toContain("retirer_phase");
    expect(json).not.toContain('"$schema"');
  });
});

describe("carte de modification : ce que le coach lit avant « Valider »", () => {
  const quality = at(3, 2);
  const applied = run([
    { op: "supprimer_seance", cle: quality.key },
    { op: "titre", titre: "Bloc 2" },
  ]);
  const params = { programId: "fb000000-0000-4000-8000-000000000002", revision: 2 };

  it("titre, sportif, une ligne par changement, « définitif », puis la mention du brouillon", () => {
    const names = editCardNames({
      title: draft.title,
      athlete: "Sarah Vermeulen",
      status: "published",
      lines: applied.lines,
    });
    const card = summarize({ kind: "modifier_programme", params }, names, "EUR");
    expect(card.title).toBe("Modifier le programme");
    expect(card.summary).toEqual([
      "Hybride : 3 running + 2 musculation",
      "Sarah Vermeulen",
      `Semaine 3 : « ${quality.title} » supprimée (définitif)`,
      "Titre : « Hybride : 3 running + 2 musculation » → « Bloc 2 »",
      "Programme publié : les changements vont dans son brouillon ; la version publiée ne change pas avant « Publier »",
    ]);
  });

  it("brouillon et modèle : leur propre mention", () => {
    const asDraft = summarize(
      { kind: "modifier_programme", params },
      editCardNames({ title: "Bloc", athlete: "Hugo Lefèvre", status: "draft", lines: ["x"] }),
      "EUR",
    );
    expect(asDraft.summary.at(-1)).toBe("Brouillon : à relire et publier dans l'éditeur");
    const asTemplate = summarize(
      { kind: "modifier_modele", params: { templateId: params.programId, version: 1 } },
      editCardNames({ title: "Mon modèle", athlete: null, status: "template", lines: ["x"] }),
      "EUR",
    );
    expect(asTemplate.title).toBe("Modifier le modèle");
    expect(asTemplate.summary).toEqual([
      "Mon modèle",
      "x",
      "Mes modèles : les programmes déjà créés depuis ce modèle ne changent pas",
    ]);
  });
});

describe("révision : jamais écraser un brouillon modifié entre-temps", () => {
  it("à l'exécution : une autre révision refuse la carte, rien n'est modifié", () => {
    expect(revisionConflict(3, 3)).toBeNull();
    expect(revisionConflict(3, 4)).toBe(
      "Le brouillon a changé depuis la proposition : rien n'a été modifié. Redemande à l'assistant.",
    );
    expect(revisionConflict(1, 2, "modele")).toBe(
      "Le modèle a changé depuis la proposition : rien n'a été modifié. Redemande à l'assistant.",
    );
  });

  it("à la proposition : une lecture dépassée fait relire le brouillon", () => {
    expect(staleReading(3, 3)).toBeNull();
    expect(staleReading(3, 4)).toBe(
      "Le brouillon a changé depuis ta lecture (révision 3, maintenant 4) : relis-le avec voir_brouillon, puis propose à nouveau.",
    );
    expect(staleReading(1, 2, "modele")).toBe(
      "Le modèle a changé depuis ta lecture (version 1, maintenant 2) : relis-le avec voir_modele, puis propose à nouveau.",
    );
  });
});

describe("refus : programme archivé ou introuvable, modèle Coory", () => {
  it("un programme introuvable, archivé ou sans brouillon lisible ne reçoit aucune carte", () => {
    expect(programEditRefusal(null)).toContain("introuvable");
    expect(programEditRefusal({ status: "archived", hasDraft: true })).toContain("archivé");
    expect(programEditRefusal({ status: "draft", hasDraft: false })).toContain("éditeur");
    expect(programEditRefusal({ status: "draft", hasDraft: true })).toBeNull();
    expect(programEditRefusal({ status: "published", hasDraft: true })).toBeNull();
  });

  it("un modèle Coory est en lecture seule, comme dans l'interface", () => {
    expect(templateEditRefusal(null)).toContain("introuvable");
    expect(templateEditRefusal({ source: "coory", hasPlan: true })).toContain("Coory");
    expect(templateEditRefusal({ source: "mine", hasPlan: false })).toContain("éditeur");
    expect(templateEditRefusal({ source: "mine", hasPlan: true })).toBeNull();
  });
});

// --- Task 4 : publier, archiver, désarchiver, dupliquer, enregistrer comme modèle ------------
describe("actions de programme et de modèle : schémas stricts", () => {
  const programId = "fb000000-0000-4000-8000-000000000004";
  const ok = (kind: string, params: unknown) =>
    assistantActionSchema.safeParse({ kind, params }).success;

  it("chaque carte accepte ses champs, et seulement eux", () => {
    expect(ok("publier_programme", { programId })).toBe(true);
    expect(ok("archiver_programme", { programId })).toBe(true);
    expect(ok("desarchiver_programme", { programId })).toBe(true);
    expect(ok("dupliquer_programme", { programId })).toBe(true);
    expect(ok("enregistrer_comme_modele", { programId, titre: "Bloc force" })).toBe(true);
    expect(
      ok("enregistrer_seance_comme_modele", { programId, cle: "ta-s1-1", titre: "Force A" }),
    ).toBe(true);
    expect(ok("dupliquer_modele", { templateId: programId })).toBe(true);
    expect(ok("dupliquer_modele", { templateId: programId, sorte: "seance" })).toBe(true);
    expect(ok("archiver_modele", { templateId: programId, sorte: "programme" })).toBe(true);
    expect(
      ok("creer_modele", {
        titre: "Base",
        discipline: "hybrid",
        semaines: 8,
        seancesParSemaine: 5,
      }),
    ).toBe(true);

    expect(ok("publier_programme", { programId, organizationId: "x" })).toBe(false);
    expect(ok("archiver_programme", { programId, definitif: true })).toBe(false);
    expect(ok("enregistrer_comme_modele", { programId })).toBe(false);
    expect(ok("dupliquer_modele", { templateId: programId, sorte: "semaine" })).toBe(false);
    expect(
      ok("creer_modele", { titre: "x", discipline: "yoga", semaines: 8, seancesParSemaine: 5 }),
    ).toBe(false);
    expect(
      ok("creer_modele", { titre: "x", discipline: "running", semaines: 53, seancesParSemaine: 5 }),
    ).toBe(false);
  });
});

describe("refus : un programme archivé ne fait que « Désarchiver »", () => {
  const archived = { status: "archived" as const, hasDraft: true, revision: 2 };
  const kinds = [
    "publier_programme",
    "archiver_programme",
    "dupliquer_programme",
    "enregistrer_comme_modele",
    "enregistrer_seance_comme_modele",
  ] as const;

  it("toute action sauf désarchiver est refusée sur un programme archivé", () => {
    for (const kind of kinds) expect(programActionRefusal(kind, archived)).toContain("archivé");
    expect(programActionRefusal("desarchiver_programme", archived)).toBeNull();
    expect(
      programActionRefusal("desarchiver_programme", { ...archived, status: "draft" }),
    ).toContain("n'est pas archivé");
    expect(programActionRefusal("publier_programme", null)).toContain("introuvable");
    expect(
      programActionRefusal("archiver_programme", { ...archived, status: "published" }),
    ).toBeNull();
  });

  it("publier : rien à publier sans brouillon modifié ; un problème bloquant refuse la carte", () => {
    expect(
      programActionRefusal("publier_programme", {
        status: "published",
        hasDraft: true,
        revision: 0,
      }),
    ).toContain("Rien à publier");
    const overlap: PublishIssue = {
      level: "blocking",
      code: "overlap",
      message: "Les dates chevauchent « Prépa 10 km ».",
    };
    expect(publicationRefusal([overlap])).toBe(
      "Publication impossible : Les dates chevauchent « Prépa 10 km ». Corrige-le d'abord dans l'éditeur.",
    );
    expect(publicationRefusal([{ ...overlap, level: "warning", code: "empty_week" }])).toBeNull();
  });

  it("un modèle Coory se duplique, mais ne s'archive pas", () => {
    expect(templateActionRefusal("dupliquer_modele", { source: "coory" })).toBeNull();
    expect(templateActionRefusal("archiver_modele", { source: "coory" })).toContain("Coory");
    expect(templateActionRefusal("archiver_modele", { source: "mine" })).toBeNull();
    expect(templateActionRefusal("archiver_modele", null)).toContain("introuvable");
  });
});

describe("cartes d'action : ce que le coach lit avant « Valider »", () => {
  const params = { programId: "fb000000-0000-4000-8000-000000000004" };
  const card = (kind: string, names: Record<string, string>, p: object = params) =>
    summarize(
      { kind: kind as "publier_programme", params: p as Record<string, unknown> },
      names,
      "EUR",
    );
  const pct: PublishIssue = {
    level: "warning",
    code: "pct_without_max",
    message: "Back squat en % sans max connu.",
  };

  it("publier : titre, version, sportif, avertissements regroupés comme dans « Publier »", () => {
    const names = actionCardNames.publier({
      title: "Préparation 10 km",
      athlete: "Sarah Vermeulen",
      version: 2,
      issues: [pct, { ...pct, message: "Presse en % sans max connu." }],
    });
    const published = card("publier_programme", names);
    expect(published.title).toBe("Publier le programme");
    expect(published.summary).toEqual([
      "« Préparation 10 km » · version 2 · Sarah Vermeulen",
      "Attention : 2 exercices en % sans max connu (les kg ne sont pas calculés).",
      "Les PDF seront tirés de cette version.",
    ]);
  });

  it("archiver, désarchiver, dupliquer un programme", () => {
    const who = { title: "Bloc force", athlete: "Hugo Lefèvre" };
    expect(card("archiver_programme", actionCardNames.programme(who)).summary).toEqual([
      "« Bloc force » · Hugo Lefèvre",
      "Il quitte la liste des programmes et la fiche du sportif. Ses versions publiées restent conservées.",
    ]);
    expect(
      card("desarchiver_programme", actionCardNames.desarchiver({ ...who, version: 3 })).summary,
    ).toEqual(["« Bloc force » · Hugo Lefèvre", "Il redevient publié (version 3)"]);
    expect(
      card("desarchiver_programme", actionCardNames.desarchiver({ ...who, version: null }))
        .summary[1],
    ).toBe("Il redevient un brouillon");
    const copy = card(
      "dupliquer_programme",
      actionCardNames.dupliquer({ ...who, startDate: "2027-04-05" }),
    );
    expect(copy.title).toBe("Dupliquer le programme");
    expect(copy.summary).toEqual([
      "« Bloc force (copie) » · Hugo Lefèvre",
      "Nouveau brouillon dès le lundi 5 avril 2027",
      "Les rendez-vous du coach ne se copient pas",
    ]);
  });

  it("enregistrer comme modèle, dupliquer, archiver et créer un modèle", () => {
    expect(
      card(
        "enregistrer_comme_modele",
        actionCardNames.versModele({ title: "Bloc force", weeks: 4 }),
        { ...params, titre: "Force 4 semaines" },
      ).summary,
    ).toEqual([
      "« Force 4 semaines » dans Mes modèles",
      "Depuis « Bloc force » : 4 semaines, sans sportif ni dates",
    ]);
    expect(
      card(
        "enregistrer_seance_comme_modele",
        actionCardNames.seanceVersModele({ session: "Force A", week: 1, program: "Bloc force" }),
        { ...params, cle: "ta-s1-1", titre: "Force A" },
      ).summary,
    ).toEqual([
      "« Force A » dans Mes modèles (séances)",
      "Depuis « Force A », semaine 1 de « Bloc force »",
    ]);
    const template = { templateId: params.programId };
    expect(
      card(
        "dupliquer_modele",
        actionCardNames.modele({ title: "Base 10 km", source: "coory" }),
        template,
      ).summary,
    ).toEqual([
      "« Base 10 km » · modèle Coory",
      "La copie va dans Mes modèles ; l'original ne change pas",
    ]);
    expect(
      card(
        "archiver_modele",
        actionCardNames.modele({ title: "Base 10 km", source: "mine" }),
        template,
      ).summary,
    ).toEqual([
      "« Base 10 km » · Mes modèles",
      "Il ne sera plus proposé. Les programmes déjà créés avec lui ne changent pas.",
    ]);
    expect(
      card(
        "creer_modele",
        {},
        {
          titre: "Base hybride",
          discipline: "hybrid",
          semaines: 8,
          seancesParSemaine: 5,
        },
      ).summary,
    ).toEqual([
      "« Base hybride »",
      "Hybride · 8 semaines · 5 séances par semaine",
      "Vide, à remplir dans l'éditeur",
    ]);
  });
});

describe("règles partagées avec l'interface (jamais recopiées)", () => {
  it("les avertissements de publication se regroupent par genre, bloquants d'abord", () => {
    const issues: PublishIssue[] = [
      { level: "warning", code: "empty_week", message: "Semaine 3 sans séance.", weekIndex: 3 },
      { level: "warning", code: "empty_week", message: "Semaine 4 sans séance.", weekIndex: 4 },
      { level: "blocking", code: "no_session", message: "Aucune séance." },
    ];
    expect(groupPublishIssues(issues).map((issue) => issue.message)).toEqual([
      "Aucune séance.",
      "2 semaines sans séance.",
    ]);
    expect(groupPublishIssues(issues)[1]?.weekIndex).toBe(3);
  });

  it("une copie commence le lundi qui suit l'original, ou le prochain lundi", () => {
    expect(copyStartDate({ startDate: "2027-03-01", weeksCount: 4 }, "2026-11-14")).toBe(
      "2027-03-29",
    );
    expect(copyStartDate({ startDate: "2026-01-05", weeksCount: 2 }, "2026-11-14")).toBe(
      "2026-11-16",
    );
  });
});

describe("voir_modeles_de_seance : Mes modèles de séance et ceux de Coory", () => {
  it("résume les modèles de séance (pas ceux de programme)", () => {
    const base = { footer: "", weeksCount: null, sessionsPerWeek: null, version: 1, updatedAt: "" };
    const rows = shapeSessionTemplates([
      {
        ...base,
        kind: "program",
        id: "p",
        source: "coory",
        title: "10 km",
        discipline: "running",
        detail: "",
      },
      {
        ...base,
        kind: "session",
        id: "s",
        source: "mine",
        title: "Force A",
        discipline: "strength",
        detail: "55 min · Force",
      },
    ]);
    expect(rows).toEqual([
      {
        id: "s",
        titre: "Force A",
        discipline: "strength",
        detail: "55 min · Force",
        origine: "mine",
      },
    ]);
  });
});

describe("consigne du lot 3b", () => {
  const prompt = systemPrompt("Gianluca", "2026-11-14");

  it("lire un programme : le sommaire, puis 1 ou 2 semaines ; une seule carte par programme", () => {
    expect(prompt).toContain("voir_brouillon");
    expect(prompt).toContain("1 ou 2 semaines");
    expect(prompt).toContain("UNE seule carte modifier_programme");
    expect(prompt).toContain("relis le brouillon");
  });

  it("publier seulement quand le coach le demande ; plus de « tu ne publies rien »", () => {
    expect(prompt).toContain("publier_programme seulement quand le coach le demande");
    expect(prompt).not.toContain("tu ne publies rien");
    expect(prompt).not.toContain("Tu ne supprimes rien");
    expect(prompt).toContain("définitive");
  });

  it("publier ou copier dans la réponse qui suit une modification ; numéros de semaine lus", () => {
    expect(prompt).toContain("dans ta réponse suivante");
    expect(prompt).toContain("numéros de semaine de voir_brouillon");
  });

  it("garde les deux exceptions d'Antonino : santé et sécurité du compte", () => {
    expect(prompt).toContain("données de santé");
    expect(prompt).toContain("mot de passe");
  });
});

// --- Relecture finale du lot 3b : une carte ne promet jamais autre chose que ce que « Valider » fait --
describe("relecture n°1 : les numéros de semaine sont ceux du programme LU", () => {
  it("retirer les semaines 3 puis 4 retire les semaines 3 et 4 lues, pas la 5", () => {
    const result = run([
      { op: "retirer_semaine", semaine: 3 },
      { op: "retirer_semaine", semaine: 4 },
    ]);
    expect(result.plan.weeks).toEqual(removeWeek(removeWeek(draft, 4), 3).weeks);
    expect(result.lines).toEqual([
      "Semaine 3 retirée (5 séances, définitif) ; les suivantes remontent d'un cran",
      "Semaine 4 retirée (5 séances, définitif) ; les suivantes remontent d'un cran",
    ]);
  });

  it("après un retrait, « semaine 6 » reste la semaine 6 lue ; une semaine retirée n'existe plus", () => {
    const result = run([
      { op: "retirer_semaine", semaine: 2 },
      { op: "semaine_allegee", semaine: 6, allegee: true },
    ]);
    expect(result.plan.weeks[4]!.light).toBe(true);
    expect(result.lines[1]).toBe("Semaine 6 : allégée");
    expect(
      applyProgramEdits(draft, [
        { op: "retirer_semaine", semaine: 3 },
        { op: "semaine_allegee", semaine: 3, allegee: true },
      ]),
    ).toMatchObject({ ok: false, error: expect.stringContaining("retirée") });
  });

  it("la dernière semaine retirée ne fait rien remonter ; une semaine ajoutée va à la fin", () => {
    expect(run([{ op: "retirer_semaine", semaine: 8 }]).lines[0]).toBe(
      "Semaine 8 retirée (5 séances, définitif)",
    );
    const added = run([
      { op: "ajouter_semaine" },
      { op: "semaine_allegee", semaine: 9, allegee: true },
    ]);
    expect(added.lines[0]).toBe("Nouvelle semaine à la fin (semaine 9)");
    expect(added.plan.weeks[8]!.light).toBe(true);
  });
});

describe("relecture n°2 : « modifier une séance » dit ce qui change vraiment", () => {
  const force = at(1, 1);
  if (force.content.discipline !== "strength") throw new Error("séance de musculation attendue");
  const content = force.content;
  const body = (changes: Partial<typeof force>) => ({
    title: force.title,
    sessionType: force.sessionType,
    durationMinutes: force.durationMinutes,
    ...(force.objective ? { objective: force.objective } : {}),
    ...(force.coachTip ? { coachTip: force.coachTip } : {}),
    content,
    ...changes,
  });

  it("des séries changées : l'exercice, son volume avant et après", () => {
    const items = content.items.map((item, i) =>
      i === 0 && item.kind === "exercise"
        ? { ...item, sets: item.sets.slice(0, 1).map((set) => ({ ...set, repsMin: 1, kg: 200 })) }
        : item,
    );
    const result = run([
      { op: "modifier_seance", cle: force.key, seance: body({ content: { ...content, items } }) },
    ]);

    expect(result.lines).toEqual([
      expect.stringMatching(/^Semaine 1 · Force · Full body A : durée \d+ → \d+ min$/),
      "Semaine 1 · Force · Full body A : Back squat : 3 × 6-8 · repos 2:30 → 1 × 1-8 · 200 kg · repos 2:30",
    ]);
  });

  it("titre et conseil du coach réécrits ; un réglage invisible est quand même signalé", () => {
    const renamed = run([
      {
        op: "modifier_seance",
        cle: force.key,
        seance: body({ title: "Full body lourd", coachTip: "Pousse fort." }),
      },
    ]);
    expect(renamed.lines).toContain(
      "Semaine 1 · Force · Full body A : titre « Force · Full body A » → « Full body lourd »",
    );
    expect(renamed.lines).toContain("Semaine 1 · Force · Full body A : conseil du coach réécrit");
    const items = content.items.map((item, i) =>
      i === 0 && item.kind === "exercise"
        ? { ...item, exerciseId: "e9844c81-7922-5862-b902-f3daa687154f" }
        : item,
    );
    const hidden = run([
      { op: "modifier_seance", cle: force.key, seance: body({ content: { ...content, items } }) },
    ]);
    expect(hidden.lines).toEqual(["Semaine 1 · Force · Full body A : autres réglages modifiés"]);
  });
});

describe("relecture n°3 : pas de publication ni de copie à côté d'une modification en attente", () => {
  const id = "fb000000-0000-4000-8000-000000000004";
  const card = (kind: string, programId = id) =>
    ({ id: kind, kind, params: { programId }, title: "", summary: [], dependsOn: null }) as never;

  it("refuse publier ou copier un programme dont une carte « Modifier » attend, et l'inverse", () => {
    expect(pendingConflict("publier_programme", id, [card("modifier_programme")])).toContain(
      "Modifier le programme",
    );
    expect(pendingConflict("dupliquer_programme", id, [card("modifier_programme")])).not.toBeNull();
    expect(pendingConflict("modifier_programme", id, [card("publier_programme")])).not.toBeNull();
    expect(
      pendingConflict("publier_programme", id, [
        card("modifier_programme", "fb000000-0000-4000-8000-000000000005"),
      ]),
    ).toBeNull();
    expect(pendingConflict("archiver_programme", id, [])).toBeNull();
  });
});

describe("relecture n°4 et n°5 : semaines passées et jours, comme l'éditeur", () => {
  const started: ProgramDraft = { ...hybrid, startDate: "2026-11-02" };
  const today = { today: "2026-11-14" };

  it("une semaine passée ne reçoit pas de copie de semaine (BR-07)", () => {
    expect(
      applyProgramEdits(started, [{ op: "dupliquer_semaine", source: 3, vers: [1, 4] }], today),
    ).toMatchObject({ ok: false, error: expect.stringContaining("semaine 1 est passée") });
    expect(applyProgramEdits(hybrid, [{ op: "dupliquer_semaine", source: 3, vers: [1] }]).ok).toBe(
      true,
    );
  });

  it("un jour se fixe seulement dans une semaine à jours fixes, jamais sur un rendez-vous du coach", () => {
    expect(
      applyProgramEdits(started, [{ op: "jour_seance", cle: at(3, 0).key, jour: "tue" }], today),
    ).toMatchObject({ ok: false, error: expect.stringContaining("dans l'ordre") });
    const withCoach: ProgramDraft = {
      ...started,
      weeks: started.weeks.map((week) =>
        week.index !== 3
          ? week
          : {
              ...week,
              scheduling: "fixed",
              sessions: week.sessions.map((session, slot) =>
                slot === 1
                  ? {
                      ...session,
                      withCoach: {
                        coachSessionId: "cb000000-0000-4000-8000-000000000001",
                        date: "2026-11-18",
                      },
                    }
                  : session,
              ),
            },
      ),
    };
    expect(
      applyProgramEdits(withCoach, [{ op: "jour_seance", cle: at(3, 1).key, jour: "thu" }], today),
    ).toMatchObject({ ok: false, error: expect.stringContaining("rendez-vous") });
  });

  it("la carte dit combien d'autres semaines changent, comme le message de l'éditeur", () => {
    const result = run([
      { op: "organisation_semaine", semaine: 3, mode: "fixed" },
      { op: "jour_seance", cle: at(3, 1).key, jour: "tue", portee: "programme" },
    ]);
    expect(result.lines[1]).toMatch(
      /^Semaine 3 · Force · Full body A : mardi, et dans \d+ autres semaines/,
    );
    const alone = run([
      { op: "organisation_semaine", semaine: 3, mode: "fixed" },
      { op: "jour_seance", cle: at(3, 1).key, jour: "tue" },
    ]);
    expect(alone.lines[1]).toBe("Semaine 3 · Force · Full body A : mardi");
  });
});

describe("relecture n°6 et n°9 : rien à publier, et la révision dans chaque lecture", () => {
  it("un programme publié sans changement : « Rien à publier »", () => {
    expect(
      programActionRefusal("publier_programme", {
        status: "published",
        hasDraft: true,
        revision: 4,
        upToDate: true,
      }),
    ).toContain("Rien à publier");
  });

  it("le détail de 2 semaines porte aussi la révision lue", () => {
    const detail = draftReading(hybrid, { revision: 7, status: "draft" }, [2, 3]);
    expect(detail).toMatchObject({ revision: 7 });
    expect("semaines" in detail && detail.semaines.map((week) => week.semaine)).toEqual([2, 3]);
    expect(draftReading(hybrid, { revision: 7, status: "draft" })).toMatchObject({
      titre: hybrid.title,
      revision: 7,
    });
  });
});
