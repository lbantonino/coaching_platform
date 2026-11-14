import { describe, expect, it } from "vitest";

import { EQUIPMENT_KEYS, equipmentInfo } from "@/domain/exercises/vocabulary";
import { noteFor } from "@/features/assistant/cards";
import {
  athleteUpdateFormData,
  formRuleError,
  toCoachExerciseInput,
} from "@/features/assistant/form-data";
import { assistantActionSchema, pdfRefusal, summarize } from "@/features/assistant/proposals";
import { progressFor } from "@/features/assistant/loop";
import {
  askAssistantSchema,
  attachmentLine,
  systemPrompt,
  toApiMessages,
} from "@/features/assistant/rules";
import { shapeAthleteSheet } from "@/features/assistant/tools/shape";

// Assistant IA, lot 2 (D-181) : compléter une fiche, créer un exercice, donner les PDF, importer un
// document. Toujours une carte à valider ; jamais de santé, de statut ni d'organisation.
const ATHLETE = "ab000000-0000-4000-8000-000000000001";
const parse = (kind: string, params: unknown) =>
  assistantActionSchema.safeParse({ kind, params }).success;

describe("completer_fiche", () => {
  it("accepte des champs de la fiche, et seulement eux", () => {
    expect(
      parse("completer_fiche", { athleteId: ATHLETE, changes: { phone: "0470 12 34 56" } }),
    ).toBe(true);
    expect(
      parse("completer_fiche", {
        athleteId: ATHLETE,
        changes: { level: "advanced", trainingPlaces: ["gym", "track"], city: "Gand" },
      }),
    ).toBe(true);
    // Jamais le statut (archiver), la santé ni un champ inconnu ; au moins un champ.
    expect(parse("completer_fiche", { athleteId: ATHLETE, changes: { status: "archived" } })).toBe(
      false,
    );
    expect(parse("completer_fiche", { athleteId: ATHLETE, changes: { health: "genou" } })).toBe(
      false,
    );
    expect(parse("completer_fiche", { athleteId: ATHLETE, changes: {} })).toBe(false);
    expect(
      parse("completer_fiche", {
        athleteId: ATHLETE,
        organizationId: ATHLETE,
        changes: { city: "x" },
      }),
    ).toBe(false);
  });

  it("le formulaire envoyé garde chaque champ actuel et ne change que ceux de la carte", () => {
    const current = {
      firstName: "Sarah",
      lastName: "Vermeulen",
      sex: "female",
      email: "sarah@example.test",
      phone: "",
      status: "active",
      preferredContact: "email",
      level: "beginner",
      experience: "2 ans de course",
      trainingPlaces: ["outdoor"],
      equipment: "",
      addressLine: "Rue de test 1",
      postalCode: "1000",
      city: "Bruxelles",
      country: "BE",
    };
    const form = athleteUpdateFormData(current, {
      phone: "0470 12 34 56",
      trainingPlaces: ["outdoor", "gym"],
    });
    expect(form.get("phone")).toBe("0470 12 34 56");
    expect(form.getAll("trainingPlaces")).toEqual(["outdoor", "gym"]);
    // Inchangés : niveau, adresse, statut, e-mail.
    expect(form.get("level")).toBe("beginner");
    expect(form.get("addressLine")).toBe("Rue de test 1");
    expect(form.get("city")).toBe("Bruxelles");
    expect(form.get("status")).toBe("active");
    expect(form.get("email")).toBe("sarah@example.test");
  });

  it("la carte montre chaque changement « ancien → nouveau »", () => {
    const { title, summary } = summarize(
      {
        kind: "completer_fiche",
        params: { athleteId: ATHLETE, changes: { phone: "0470 12 34 56", level: "advanced" } },
      },
      { [ATHLETE]: "Sarah Vermeulen", "avant:phone": "", "avant:level": "beginner" },
      "EUR",
    );
    expect(title).toBe("Compléter la fiche");
    expect(summary).toEqual([
      "Sarah Vermeulen",
      "Téléphone : — → 0470 12 34 56",
      "Niveau : Débutant → Confirmé",
    ]);
  });
});

describe("creer_exercice", () => {
  const params = {
    name: "Fentes sautées",
    category: "strength",
    muscleGroups: ["quads", "glutes"],
    instructions: ["Pieds écartés de la largeur des hanches.", "Saute et change de jambe."],
  };
  it("un exercice du coach, sans photo ni champ inconnu", () => {
    expect(parse("creer_exercice", params)).toBe(true);
    expect(parse("creer_exercice", { ...params, category: "yoga" })).toBe(false);
    expect(parse("creer_exercice", { ...params, photo: "x.jpg" })).toBe(false);
  });
  it("passe par les règles du formulaire « Créer un exercice »", () => {
    expect(toCoachExerciseInput(params)).toEqual({
      name: "Fentes sautées",
      category: "strength",
      muscleGroups: ["quads", "glutes"],
      equipment: "",
      instructions: "Pieds écartés de la largeur des hanches.\nSaute et change de jambe.",
      videoUrl: "",
    });
    const bad = { kind: "creer_exercice", params: { ...params, muscleGroups: ["oreilles"] } };
    expect(formRuleError(bad as never, "2026-11-14")).toMatch(/musculaire/i);
    const http = { kind: "creer_exercice", params: { ...params, videoUrl: "http://x.test/v" } };
    expect(formRuleError(http as never, "2026-11-14")).not.toBeNull();
  });
  it("la carte dit le nom, la catégorie, les muscles et le matériel", () => {
    const { title, summary } = summarize(
      { kind: "creer_exercice", params: { ...params, equipment: "dumbbell" } },
      {},
      "EUR",
    );
    expect(title).toBe("Nouvel exercice");
    expect(summary).toEqual([
      "Fentes sautées",
      "Musculation · Quadriceps, Fessiers",
      "Matériel : Haltères",
      "2 consignes",
    ]);
    // Sans matériel : poids du corps ; un exercice du même nom existe déjà : la carte le dit.
    expect(
      summarize({ kind: "creer_exercice", params }, { doublon: "oui" }, "EUR").summary,
    ).toEqual([
      "Fentes sautées",
      "Musculation · Quadriceps, Fessiers",
      "Poids du corps",
      "2 consignes",
      "Un exercice porte déjà ce nom dans ta Bibliothèque",
    ]);
  });
});

describe("preparer_pdf", () => {
  const PROGRAM = "fb000000-0000-4000-8000-000000000001";
  it("seulement l'identifiant d'un programme", () => {
    expect(parse("preparer_pdf", { programId: PROGRAM })).toBe(true);
    expect(parse("preparer_pdf", { programId: PROGRAM, envoyer: true })).toBe(false);
  });
  it("un programme introuvable ou jamais publié n'a pas de PDF", () => {
    expect(pdfRefusal(null)).toMatch(/^Programme introuvable/);
    expect(pdfRefusal({ published: false })).toBe(
      "Ce programme n'est pas encore publié : publie-le d'abord dans l'éditeur.",
    );
    expect(pdfRefusal({ published: true })).toBeNull();
  });
  it("la carte dit le programme, le sportif et la version", () => {
    const { title, summary } = summarize(
      { kind: "preparer_pdf", params: { programId: PROGRAM } },
      {
        [PROGRAM]: "Programme test PDF",
        sportif: "Sarah Vermeulen",
        version: "Version 1 publiée le 4 janvier 2026",
      },
      "EUR",
    );
    expect(title).toBe("PDF du programme");
    expect(summary).toEqual([
      "Programme test PDF",
      "Sarah Vermeulen",
      "Version 1 publiée le 4 janvier 2026",
    ]);
  });
});

describe("importer_document", () => {
  const file = { name: "bilan-avril.pdf", type: "application/pdf", size: 12_345 };
  it("Claude ne reçoit que le nom, le type et la taille du fichier joint", () => {
    expect(attachmentLine(file)).toBe(
      "[Fichier joint : bilan-avril.pdf · application/pdf · 12 Ko]",
    );
    const [turn] = toApiMessages({ history: [], question: "Range ce document", attachment: file });
    // La ligne précède la question (qui reste le dernier paragraphe).
    expect(turn?.content).toBe(
      "[Fichier joint : bilan-avril.pdf · application/pdf · 12 Ko]\n\nRange ce document",
    );
  });
  it("la demande refuse tout contenu de fichier et un fichier de plus de 4 Mo", () => {
    const ask = (attachment: unknown) =>
      askAssistantSchema.safeParse({ start: { history: [], question: "x", attachment } }).success;
    expect(ask(file)).toBe(true);
    expect(ask({ ...file, content: "JVBERi0..." })).toBe(false);
    expect(ask({ ...file, size: 5 * 1024 * 1024 })).toBe(false);
  });
  it("la carte : le nom du document, le fichier, la catégorie et le sportif ; jamais de contenu", () => {
    const CATEGORY = "dc000000-0000-4000-8000-000000000001";
    expect(parse("importer_document", { name: "Bilan avril", categoryId: CATEGORY })).toBe(true);
    expect(parse("importer_document", { name: "Bilan avril", file: "x" })).toBe(false);
    const { title, summary } = summarize(
      {
        kind: "importer_document",
        params: { name: "Bilan avril", categoryId: CATEGORY, athleteId: ATHLETE },
      },
      {
        fichier: "bilan-avril.pdf (12 Ko)",
        [CATEGORY]: "Bilans",
        [ATHLETE]: "Sarah Vermeulen",
      },
      "EUR",
    );
    expect(title).toBe("Importer un document");
    expect(summary).toEqual([
      "Bilan avril",
      "Fichier : bilan-avril.pdf (12 Ko)",
      "Catégorie : Bilans",
      "Sportif : Sarah Vermeulen",
    ]);
  });
});

describe("consigne du lot 2", () => {
  it("présente les quatre actions et leurs limites", () => {
    const prompt = systemPrompt("Gianluca", "2026-11-14");
    expect(prompt).toContain("compléter la fiche d'un sportif");
    expect(prompt).toContain("voir_fiche");
    expect(prompt).toContain("tu ne vois jamais son contenu");
    expect(prompt).toContain("seulement d'un programme publié");
    expect(prompt).toContain("créer un exercice");
  });
  it("dit ce que l'assistant regarde", () => {
    expect(progressFor("voir_fiche")).toBe("Je regarde la fiche du sportif…");
    expect(progressFor("voir_categories_de_documents")).toBe(
      "Je regarde tes catégories de documents…",
    );
  });
});

// Relecture du lot 2 : le matériel d'un exercice vient de la liste complète de la Bibliothèque (Claude
// la reçoit dans l'outil) ; une valeur inventée est refusée en nommant les valeurs permises.
describe("creer_exercice : matériel", () => {
  const base = { name: "Box jump", category: "strength" };
  it("toute clé de la Bibliothèque est acceptée, une valeur inventée non", () => {
    expect(parse("creer_exercice", { ...base, equipment: "plyo_box" })).toBe(true);
    const refused = assistantActionSchema.safeParse({
      kind: "creer_exercice",
      params: { ...base, equipment: "box" },
    });
    expect(refused.success).toBe(false);
    expect(refused.error?.issues[0]?.message).toContain("plyo_box");
  });
  it("la liste partagée (schéma de l'action et outil de Claude) est celle de la Bibliothèque", () => {
    expect(EQUIPMENT_KEYS).toEqual(Object.keys(equipmentInfo));
    expect(EQUIPMENT_KEYS.length).toBeGreaterThan(50);
  });
});

// Décision d'Antonino du 14/11 : pour compléter une fiche, Claude sait seulement si l'e-mail, le
// téléphone et l'adresse sont remplis, jamais leur valeur ; la note « [Fait : …] » renvoyée à Claude ne
// garde que les noms des champs changés.
describe("compléter une fiche : contact jamais envoyé à Claude", () => {
  it("la fiche lue par Claude dit « rempli » ou « vide » pour le contact et l'adresse", () => {
    const sheet = shapeAthleteSheet({
      id: ATHLETE,
      firstName: "Sarah",
      lastName: "Vermeulen",
      sex: "female",
      email: "sarah@example.test",
      phone: null,
      preferredContact: "email",
      level: "intermediate",
      experience: null,
      trainingPlaces: ["outdoor"],
      equipment: null,
      addressLine: "Rue de test 1",
      postalCode: "1000",
      city: null,
      country: "BE",
      status: "active",
      hasAccount: false,
      // Lot 5 : discipline et disponibilités (jamais les blessures).
      programType: "running",
      sessionsPerWeek: null,
      maxSessionMinutes: null,
      availableDays: [],
      scheduleConstraints: null,
    });
    expect(sheet).toMatchObject({
      prenom: "Sarah",
      email: "rempli",
      telephone: "vide",
      adresse: "rempli",
      code_postal: "rempli",
      ville: "vide",
      niveau: "intermediate",
    });
    expect(JSON.stringify(sheet)).not.toContain("sarah@example.test");
    expect(JSON.stringify(sheet)).not.toContain("Rue de test");
  });
  it("la note d'une fiche complétée ne garde que les noms des champs", () => {
    const note = noteFor(
      {
        id: "c1",
        kind: "completer_fiche",
        params: { athleteId: ATHLETE, changes: { phone: "0470 12 34 56" } },
        title: "Compléter la fiche",
        summary: ["Sarah Vermeulen", "Téléphone : 0479 00 00 00 → 0470 12 34 56"],
        dependsOn: null,
      },
      "done",
    );
    expect(note).toBe("[Fait : Compléter la fiche · Sarah Vermeulen · Téléphone]");
  });
});
