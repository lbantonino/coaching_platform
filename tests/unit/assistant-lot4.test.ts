import { describe, expect, it } from "vitest";

import {
  individualAthleteRefusal,
  seriesStartRefusal,
  stopExpenseRefusal,
  unpaidRefusal,
} from "@/features/assistant/daily";
import {
  documentFormData,
  mergeDocumentChanges,
  mergeSessionChanges,
  mergeTaskChanges,
  sessionInputFormData,
  taskFormData,
} from "@/features/assistant/form-data";
import { assistantActionSchema, summarize } from "@/features/assistant/proposals";
import { systemPrompt } from "@/features/assistant/rules";
import { readTaskForm } from "@/domain/tasks/task-form";
import { shapeDocuments, shapeTasks } from "@/features/assistant/tools/shape";
import type { CoachSession } from "@/features/sessions/queries";
import { newlyAddedAthletes, sessionFormInitial } from "@/features/sessions/schemas";

// Assistant IA, lot 4 (D-183) : le quotidien (agenda, comptabilité, tâches, documents) en cartes à
// valider. Règle d'Antonino du 14/11 : l'assistant fait tout ce que le coach fait à la main.

const group: CoachSession = {
  id: "cb000000-0000-4000-8000-000000000011",
  kind: "group",
  title: "Coaching force",
  discipline: "strength",
  location: "Parc",
  startsOn: "2026-11-03",
  startTime: "18:00",
  allDay: false,
  alerts: [],
  durationMinutes: 60,
  repeatsWeekly: true,
  recurrence: null,
  endsOn: null,
  notes: null,
  athletes: [
    { id: "db000000-0000-4000-8000-000000000001", name: "Sarah Vermeulen" },
    { id: "db000000-0000-4000-8000-000000000002", name: "Hugo Lefèvre" },
  ] as CoachSession["athletes"],
  exceptions: [],
  priceCents: 6550,
  priceVatIncluded: true,
  vatRate: 8.1,
  currency: "EUR",
  paymentMethod: "cash",
};

describe("Task 1 : « Modifier la séance » pré-remplie par une seule règle", () => {
  it("une séance collective répétée, payante, avec TVA", () => {
    expect(sessionFormInitial(group, ["db000000-0000-4000-8000-000000000001"])).toEqual({
      kind: "group",
      title: "Coaching force",
      discipline: "strength",
      location: "Parc",
      startsOn: "2026-11-03",
      startTime: "18:00",
      durationMinutes: "60",
      allDay: false,
      alerts: "",
      repeatsWeekly: true,
      // Série simple (chaque semaine) : pas de règle à garder, elle suit son début (D-203).
      recurrence: "",
      endsOn: "",
      athleteId: "",
      athleteIds: ["db000000-0000-4000-8000-000000000001"],
      newClient: false,
      newAthleteName: "",
      notes: "",
      price: "65,50",
      applyVat: true,
      vatRate: "8,1",
      vatIncluded: true,
      paymentMethod: "cash",
    });
  });

  it("une séance individuelle sans prix ni TVA", () => {
    const single = {
      ...group,
      kind: "individual" as const,
      athletes: group.athletes.slice(0, 1),
      priceCents: 6500,
      vatRate: 0,
      paymentMethod: null,
    };
    const initial = sessionFormInitial(single, []);
    expect(initial).toMatchObject({
      athleteId: "db000000-0000-4000-8000-000000000001",
      athleteIds: [],
      price: "65",
      applyVat: false,
      vatRate: "",
      paymentMethod: "transfer",
    });
    expect(sessionFormInitial({ ...single, priceCents: null }, []).price).toBe("");
  });
});

// --- Task 2 : règles pures du quotidien ----------------------------------------------------------
const id = "cb000000-0000-4000-8000-000000000011";
const ok = (kind: string, params: unknown) =>
  assistantActionSchema.safeParse({ kind, params }).success;

describe("Task 2 : schémas stricts du lot 4", () => {
  it("chaque carte accepte ses champs, et seulement eux", () => {
    expect(
      ok("modifier_seance_agenda", {
        sessionId: id,
        changes: { title: "Coaching force", startTime: "19:00" },
      }),
    ).toBe(true);
    expect(ok("modifier_seance_agenda", { sessionId: id, changes: {} })).toBe(false);
    expect(ok("modifier_seance_agenda", { sessionId: id, changes: { kind: "group" } })).toBe(false);
    expect(ok("supprimer_seance_agenda", { sessionId: "pas-un-id" })).toBe(false);
    expect(ok("marquer_seance_non_payee", { sessionId: id, sessionDate: "2026-11-10" })).toBe(true);
    expect(ok("supprimer_paiement", { paymentId: id })).toBe(true);
    expect(ok("supprimer_depense", { expenseId: id })).toBe(true);
    expect(ok("arreter_depense", { expenseId: id, date: "2026-11-14" })).toBe(false);
    expect(ok("categorie_depenses", { action: "creer", nom: "Matériel" })).toBe(true);
    expect(ok("categorie_depenses", { action: "renommer", categoryId: id, nom: "Loyer" })).toBe(
      true,
    );
    expect(ok("categorie_documents", { action: "couleur", categoryId: id, couleur: "blue" })).toBe(
      true,
    );
    expect(ok("categorie_documents", { action: "couleur", categoryId: id, couleur: "noir" })).toBe(
      false,
    );
    expect(ok("categorie_documents", { action: "supprimer", categoryId: id })).toBe(true);
    expect(ok("cocher_tache", { taskId: id, faite: true })).toBe(true);
    expect(ok("modifier_tache", { taskId: id, changes: { dueOn: null, listId: null } })).toBe(true);
    expect(ok("modifier_tache", { taskId: id, changes: {} })).toBe(false);
    expect(ok("supprimer_tache", { taskId: id })).toBe(true);
    expect(ok("supprimer_taches_terminees", {})).toBe(true);
    expect(ok("supprimer_taches_terminees", { listId: id })).toBe(false);
    expect(ok("modifier_liste_de_taches", { listId: id, couleur: "amber" })).toBe(true);
    expect(ok("modifier_liste_de_taches", { listId: id })).toBe(false);
    expect(ok("supprimer_liste_de_taches", { listId: id })).toBe(true);
    expect(
      ok("modifier_document", {
        documentId: id,
        changes: { name: "Bilan novembre", categoryId: null },
      }),
    ).toBe(true);
    expect(ok("supprimer_document", { documentId: id, fichier: true })).toBe(false);
  });
});

describe("Task 2 : ce que disent les cartes du quotidien", () => {
  const card = (kind: string, params: object, names: Record<string, string> = {}) =>
    summarize(
      { kind: kind as "supprimer_paiement", params: params as Record<string, unknown> },
      names,
      "EUR",
    );

  it("modifier une séance répétée : ancien → nouveau, et toute la série", () => {
    const result = card(
      "modifier_seance_agenda",
      { sessionId: id, changes: { title: "Coaching force", startTime: "19:00" } },
      {
        seance: "Coaching · collective",
        "avant:title": "Coaching",
        "avant:startTime": "18:00",
        serie: "oui",
      },
    );
    expect(result.title).toBe("Modifier la séance");
    expect(result.summary).toEqual([
      "Coaching · collective",
      "Titre : Coaching → Coaching force",
      "Heure : 18:00 → 19:00",
      "Toute la série (chaque semaine)",
    ]);
  });

  it("supprimer une séance : toutes ses dates si elle se répète ; les paiements restent", () => {
    expect(
      card(
        "supprimer_seance_agenda",
        { sessionId: id },
        { seance: "Coaching · collective", serie: "oui" },
      ).summary,
    ).toEqual([
      "Coaching · collective",
      "Toutes ses dates seront supprimées (définitif)",
      "Les paiements déjà notés restent",
    ]);
    expect(
      card("supprimer_seance_agenda", { sessionId: id }, { seance: "Bilan · Sarah Vermeulen" })
        .summary[1],
    ).toBe("Elle disparaîtra de l'agenda et des sportifs inscrits (définitif)");
  });

  it("supprimer un paiement lié à une date : la séance redevient à encaisser", () => {
    const result = card(
      "supprimer_paiement",
      { paymentId: id },
      { paiement: "Sarah Vermeulen · 65,00 € · virement", seanceDate: "2026-11-10" },
    );
    expect(result.title).toBe("Supprimer le paiement");
    expect(result.summary).toEqual([
      "Sarah Vermeulen · 65,00 € · virement",
      "La séance du mardi 10 novembre 2026 redevient à encaisser",
      "Il disparaît des chiffres (définitif)",
    ]);
  });

  it("arrêter une dépense mensuelle : plus rien après aujourd'hui, le passé reste", () => {
    expect(
      card(
        "arreter_depense",
        { expenseId: id },
        { depense: "Loyer · 400,00 € · chaque mois", aujourdhui: "2026-11-14" },
      ).summary,
    ).toEqual([
      "Loyer · 400,00 € · chaque mois",
      "Ne compte plus après aujourd'hui (samedi 14 novembre 2026) ; le passé reste",
    ]);
  });

  it("supprimer une catégorie : ses lignes restent, sans catégorie", () => {
    const result = card(
      "categorie_depenses",
      { action: "supprimer", categoryId: id },
      { categorie: "Matériel", lignes: "3" },
    );
    expect(result.title).toBe("Supprimer la catégorie");
    expect(result.summary).toEqual([
      "« Matériel »",
      "Ses 3 dépenses restent, sans catégorie (définitif)",
    ]);
    expect(
      card(
        "categorie_documents",
        { action: "supprimer", categoryId: id },
        { categorie: "Bilans", lignes: "1" },
      ).summary[1],
    ).toBe("Son document reste, sans catégorie (définitif)");
  });

  it("vider les tâches terminées, et supprimer une liste", () => {
    const done = card("supprimer_taches_terminees", {}, { lignes: "4" });
    expect(done.title).toBe("Vider les tâches terminées");
    expect(done.summary).toEqual(["4 tâches terminées (définitif)"]);
    expect(
      card("supprimer_liste_de_taches", { listId: id }, { liste: "Admin", lignes: "2" }).summary,
    ).toEqual(["« Admin »", "Ses 2 tâches restent, sans liste (définitif)"]);
  });

  it("modifier une tâche : chaque champ « ancien → nouveau », « — » pour un champ vide", () => {
    expect(
      card(
        "modifier_tache",
        { taskId: id, changes: { dueOn: "2026-11-16", listId: null } },
        { tache: "Appeler Sarah", "avant:dueOn": "", "avant:listId": "Admin" },
      ).summary,
    ).toEqual(["Appeler Sarah", "Échéance : — → lundi 16 novembre 2026", "Liste : Admin → —"]);
  });
});

describe("Task 2 : refus purs (rien que l'action ne ferait pas)", () => {
  it("arrêter : seulement une dépense mensuelle commencée et pas déjà arrêtée", () => {
    const today = "2026-11-14";
    expect(stopExpenseRefusal(null, today)).toContain("introuvable");
    expect(
      stopExpenseRefusal({ repeatsMonthly: false, spentOn: "2026-11-01", endsOn: null }, today),
    ).toContain("pas mensuelle");
    expect(
      stopExpenseRefusal({ repeatsMonthly: true, spentOn: "2026-12-01", endsOn: null }, today),
    ).toContain("commence");
    expect(
      stopExpenseRefusal(
        { repeatsMonthly: true, spentOn: "2026-01-01", endsOn: "2026-10-31" },
        today,
      ),
    ).toContain("déjà arrêtée");
    expect(
      stopExpenseRefusal({ repeatsMonthly: true, spentOn: "2026-01-01", endsOn: null }, today),
    ).toBeNull();
    expect(
      stopExpenseRefusal(
        { repeatsMonthly: true, spentOn: "2026-01-01", endsOn: "2026-12-31" },
        today,
      ),
    ).toBeNull();
  });

  it("le sportif d'une séance individuelle ne change pas ; « plus payée » seulement si payée", () => {
    const athleteIds = ["db000000-0000-4000-8000-000000000002"];
    expect(individualAthleteRefusal({ kind: "individual" }, { athleteIds })).toContain(
      "individuelle",
    );
    expect(individualAthleteRefusal({ kind: "group" }, { athleteIds })).toBeNull();
    expect(individualAthleteRefusal({ kind: "individual" }, { title: "Bilan" })).toBeNull();
    expect(unpaidRefusal([{ sessionDate: "2026-11-03" }], "2026-11-10")).toContain(
      "pas marquée payée",
    );
    expect(unpaidRefusal([{ sessionDate: "2026-11-10" }], "2026-11-10")).toBeNull();
  });
});

describe("Task 2 : lectures bornées, sans contenu de document", () => {
  it("voir_taches : 100 tâches au plus, champs choisis", () => {
    const tasks = Array.from({ length: 150 }, (_, i) => ({
      id: `t${i}`,
      title: `Tâche ${i}`,
      priority: "normal" as const,
      dueOn: null,
      list: null,
      notes: null,
      athleteId: null,
      athleteName: null,
      done: false,
      doneAt: null,
    }));
    const rows = shapeTasks(tasks);
    expect(rows).toHaveLength(100);
    expect(Object.keys(rows[0]!)).toEqual([
      "id",
      "titre",
      "echeance",
      "priorite",
      "liste",
      "sportif",
      "faite",
      "note",
    ]);
  });

  it("voir_documents : la fiche du document, jamais son fichier", () => {
    const rows = shapeDocuments([
      {
        id: "d1",
        name: "Bilan",
        categoryId: null,
        categoryName: "Bilans",
        categoryColor: "blue",
        kind: "pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
        athleteId: null,
        athleteName: "Sarah Vermeulen",
        createdAt: "2026-11-01T10:00:00Z",
        updatedAt: "2026-11-02T10:00:00Z",
      },
    ] as never);
    expect(rows).toEqual([
      {
        id: "d1",
        nom: "Bilan",
        categorie: "Bilans",
        sportif: "Sarah Vermeulen",
        taille: "2 Ko",
        modifie_le: "2026-11-02",
      },
    ]);
  });
});

// --- Task 3 : au « Valider », les changements de la carte dans les valeurs ACTUELLES ---------------
describe("Task 3 : fusion des changements dans le formulaire habituel", () => {
  it("séance : prix, TVA, fin et lieu effacés ; le reste ne bouge pas", () => {
    const merged = mergeSessionChanges(
      sessionFormInitial(group, ["db000000-0000-4000-8000-000000000001"]),
      {
        title: "Coaching force du soir",
        startTime: "19:00",
        price: 70,
        vatRate: 0,
        endsOn: null,
        location: null,
      },
    );
    expect(merged).toMatchObject({
      title: "Coaching force du soir",
      startTime: "19:00",
      price: "70,00",
      applyVat: false,
      vatRate: "",
      endsOn: "",
      location: "",
      durationMinutes: "60",
      athleteIds: ["db000000-0000-4000-8000-000000000001"],
    });
    expect(mergeSessionChanges(sessionFormInitial(group, []), { price: null }).price).toBe("");
    const form = sessionInputFormData(merged);
    expect(form.get("title")).toBe("Coaching force du soir");
    expect(form.get("repeatsWeekly")).toBe("on");
    expect(form.get("applyVat")).toBeNull();
    expect(form.getAll("athleteIds")).toEqual(["db000000-0000-4000-8000-000000000001"]);
  });

  it("tâche : null efface l'échéance, la liste ou le sportif ; le formulaire relu est le même", () => {
    const task = {
      id: "t1",
      title: "Appeler Sarah",
      priority: "high" as const,
      dueOn: "2026-11-20",
      list: { id: "71000000-0000-4000-8000-0000000000b1", name: "Admin", color: "indigo" as const },
      notes: "Avant vendredi",
      athleteId: "db000000-0000-4000-8000-000000000001",
      athleteName: "Sarah Vermeulen",
      done: false,
      doneAt: null,
    };
    const values = mergeTaskChanges(task as never, {
      dueOn: null,
      listId: null,
      title: "Rappeler Sarah",
    });
    expect(values).toEqual({
      title: "Rappeler Sarah",
      priority: "high",
      dueOn: "",
      listId: "",
      athleteId: "db000000-0000-4000-8000-000000000001",
      notes: "Avant vendredi",
    });
    expect(readTaskForm(taskFormData(values))).toEqual(values);
  });

  it("document : seulement nom, catégorie et sportif", () => {
    const values = mergeDocumentChanges(
      {
        name: "Bilan",
        categoryId: "dc000000-0000-4000-8000-0000000000b1",
        athleteId: null,
      } as never,
      { name: "Bilan novembre", categoryId: null },
    );
    expect(values).toEqual({ name: "Bilan novembre", categoryId: "", athleteId: "" });
    expect(documentFormData(values).get("name")).toBe("Bilan novembre");
  });
});

describe("Task 4 : consigne du lot 4", () => {
  const prompt = systemPrompt("Gianluca", "2026-11-14");
  it("lire avant d'agir, et une série se modifie en entier", () => {
    for (const tool of ["voir_taches", "voir_paiements", "voir_depenses", "voir_documents"]) {
      expect(prompt).toContain(tool);
    }
    expect(prompt).toContain("modifier_seance_agenda change toute la série");
    expect(prompt).toContain("une seule date : deplacer_seance");
    expect(prompt).toContain("supprimer, arrêter ou cocher");
  });
});

// --- Relecture indépendante du lot 4 -------------------------------------------------------------
describe("relecture n°1 : un inscrit archivé ne bloque plus la séance", () => {
  it("seuls les sportifs AJOUTÉS doivent être actifs ; ceux déjà inscrits restent", () => {
    const enrolled = [
      "db000000-0000-4000-8000-000000000001",
      "db000000-0000-4000-8000-000000000002",
    ];
    expect(newlyAddedAthletes(enrolled, enrolled)).toEqual([]);
    expect(
      newlyAddedAthletes(enrolled, [enrolled[0]!, "db000000-0000-4000-8000-000000000003"]),
    ).toEqual(["db000000-0000-4000-8000-000000000003"]);
  });
});

describe("relecture n°2 : « Vider les tâches terminées » supprime ce que la carte annonce", () => {
  it("la carte porte les tâches comptées (notées par le serveur), rien d'autre", () => {
    expect(
      ok("supprimer_taches_terminees", { taskIds: ["e4000000-0000-4000-8000-000000000071"] }),
    ).toBe(true);
    expect(ok("supprimer_taches_terminees", { taskIds: ["pas-un-id"] })).toBe(false);
    expect(ok("supprimer_taches_terminees", { listId: id })).toBe(false);
  });
});

describe("relecture n°6 : une série déjà commencée ne change pas de début", () => {
  const series = { repeatsWeekly: true, startsOn: "2026-11-02" };
  it("refus avec le bon geste ; une série à venir ou une séance unique se modifient", () => {
    expect(seriesStartRefusal(series, { startsOn: "2026-11-03" }, "2026-11-14")).toContain(
      "deplacer_seance",
    );
    expect(seriesStartRefusal(series, { startTime: "19:00" }, "2026-11-14")).toBeNull();
    expect(seriesStartRefusal(series, { startsOn: "2026-11-02" }, "2026-11-14")).toBeNull();
    expect(
      seriesStartRefusal(
        { ...series, startsOn: "2026-12-07" },
        { startsOn: "2026-12-08" },
        "2026-11-14",
      ),
    ).toBeNull();
    expect(
      seriesStartRefusal(
        { ...series, repeatsWeekly: false },
        { startsOn: "2026-11-20" },
        "2026-11-14",
      ),
    ).toBeNull();
  });
});
