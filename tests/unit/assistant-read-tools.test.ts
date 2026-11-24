import { describe, expect, it } from "vitest";

import {
  shapeAgenda,
  shapeAthletes,
  shapeExercises,
  shapePrograms,
  shapeTemplates,
  shapeUnpaid,
} from "@/features/assistant/tools/shape";
import type { AthleteListItem } from "@/features/athletes/queries";
import type { UnpaidDate } from "@/features/billing/collect-queries";
import type { CoachSession } from "@/features/sessions/queries";

// Outils de lecture de l'Assistant IA (lot 1 des actions) : ce qui part chez Anthropic doit être
// court, utile à l'action, et ne jamais contenir d'e-mail, de téléphone ni de donnée de santé.

const athlete = (over: Partial<AthleteListItem>): AthleteListItem =>
  ({
    id: "00000000-0000-4000-8000-000000000001",
    displayName: "Lucas Janssens",
    email: "lucas@example.test",
    status: "active",
    hasAccount: false,
    hasPendingInvite: false,
    sex: "male",
    photoPath: null,
    programType: "hybrid",
    missingInfo: [],
    level: "intermediate",
    createdAt: "2026-09-22",
    ...over,
  }) as AthleteListItem;

const session = (over: Partial<CoachSession>): CoachSession => ({
  id: "ca000000-0000-4000-8000-000000000001",
  kind: "individual",
  title: "Coaching force",
  discipline: "strength",
  location: "Salle",
  startsOn: "2026-11-03",
  startTime: "18:00",
  allDay: false,
  durationMinutes: 60,
  repeatsWeekly: true,
  recurrence: null,
  endsOn: null,
  notes: "note privée",
  athletes: [{ id: "00000000-0000-4000-8000-000000000001", name: "Lucas Janssens" }],
  exceptions: [],
  priceCents: 6500,
  priceVatIncluded: true,
  vatRate: 0,
  currency: "EUR",
  paymentMethod: "transfer",
  ...over,
});

describe("chercher_sportifs", () => {
  const items = [
    athlete({}),
    athlete({ id: "00000000-0000-4000-8000-000000000002", displayName: "Lucie Martin" }),
    athlete({
      id: "00000000-0000-4000-8000-000000000003",
      displayName: "Luc Archivé",
      status: "archived",
    }),
    athlete({ id: "00000000-0000-4000-8000-000000000004", displayName: "Inès Benali" }),
  ];

  it("trouve par début de prénom ou de nom, sans accent ni majuscule, sans les archivés", () => {
    expect(shapeAthletes(items, "luc").map((row) => row.nom)).toEqual([
      "Lucas Janssens",
      "Lucie Martin",
    ]);
    expect(shapeAthletes(items, "INES").map((row) => row.nom)).toEqual(["Inès Benali"]);
  });

  it("n'envoie ni e-mail, ni téléphone, ni santé", () => {
    const json = JSON.stringify(shapeAthletes(items, "lucas"));
    expect(json).not.toMatch(/email|phone|telephone|health|sante|@example/);
    expect(shapeAthletes(items, "lucas")[0]).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      nom: "Lucas Janssens",
      statut: "actif",
      discipline: "hybrid",
      manque: [],
    });
  });
});

describe("voir_agenda", () => {
  it("donne une ligne par date, avec la date d'origine d'une date déplacée", () => {
    const rows = shapeAgenda(
      [
        session({
          exceptions: [
            { originalDate: "2026-11-17", newDate: "2026-11-19", newStartTime: "19:00" },
          ],
        }),
      ],
      "2026-11-16",
      "2026-11-22",
    );
    expect(rows).toEqual([
      {
        seance_id: "ca000000-0000-4000-8000-000000000001",
        date: "2026-11-19",
        date_originale: "2026-11-17",
        heure: "19:00",
        duree_min: 60,
        titre: "Coaching force",
        sportif: "Lucas Janssens",
        repetee: true,
        // La règle en clair (D-203), pour que Claude sache comment la série se répète.
        repetition: "chaque semaine le mardi",
      },
    ]);
    expect(JSON.stringify(rows)).not.toContain("note privée");
  });

  it("présente une séance collective par son nombre d'inscrits", () => {
    const [row] = shapeAgenda(
      [session({ kind: "group", repeatsWeekly: false, startsOn: "2026-11-18", athletes: [] })],
      "2026-11-16",
      "2026-11-22",
    );
    expect(row.sportif).toBe("collective (0 inscrit)");
  });
});

describe("voir_a_encaisser", () => {
  const unpaid: UnpaidDate = {
    sessionId: "ca000000-0000-4000-8000-000000000001",
    title: "Coaching force",
    athleteName: "Lucas Janssens",
    date: "2026-11-10",
    originalDate: "2026-11-10",
    startTime: "18:00",
    amountCents: 6500,
    currency: "EUR",
    sessionHref: "/x",
    late: false,
  };

  it("filtre par sportif et donne le montant attendu", () => {
    const rows = shapeUnpaid([unpaid], [session({})], "00000000-0000-4000-8000-000000000001");
    expect(rows).toEqual([
      {
        seance_id: "ca000000-0000-4000-8000-000000000001",
        date: "2026-11-10",
        date_originale: "2026-11-10",
        heure: "18:00",
        titre: "Coaching force",
        sportif: "Lucas Janssens",
        montant: "65,00 €",
        en_retard: false,
      },
    ]);
    expect(shapeUnpaid([unpaid], [session({})], "00000000-0000-4000-8000-000000000009")).toEqual(
      [],
    );
  });
});

// Lot 3a : lectures pour créer un programme.
describe("voir_modeles, voir_programmes, chercher_exercices", () => {
  it("résume les modèles de programme (pas les modèles de séance)", () => {
    const rows = shapeTemplates([
      {
        kind: "program",
        id: "7a000000-0000-4000-8000-000000000002",
        source: "coory",
        title: "Premier 10 km · 8 semaines",
        discipline: "running",
        detail: "",
        footer: "",
        weeksCount: 8,
        sessionsPerWeek: 4,
        version: 1,
      },
      {
        kind: "session",
        id: "7b000000-0000-4000-8000-000000000001",
        source: "coory",
        title: "Sortie longue",
        discipline: "running",
        detail: "",
        footer: "",
        weeksCount: null,
        sessionsPerWeek: null,
        version: 1,
      },
    ] as never);
    expect(rows).toEqual([
      {
        id: "7a000000-0000-4000-8000-000000000002",
        titre: "Premier 10 km · 8 semaines",
        discipline: "running",
        semaines: 8,
        seances_par_semaine: 4,
        origine: "coory",
      },
    ]);
  });

  it("donne les dates des programmes d'un sportif", () => {
    expect(
      shapePrograms([
        {
          id: "f1",
          title: "Bloc 1",
          status: "published",
          startDate: "2026-10-26",
          weeksCount: 12,
          listStatus: "current",
        },
      ] as never),
    ).toEqual([
      {
        id: "f1",
        titre: "Bloc 1",
        statut: "published",
        debut: "2026-10-26",
        fin: "2027-01-17",
      },
    ]);
  });

  it("cherche les exercices par nom ou alias, 15 au plus, avec leur mesure", () => {
    const exercise = (id: string, nameFr: string, extra: object = {}) =>
      ({ id, key: id, nameFr, nameEn: null, aliasesFr: [], aliasesEn: [], ...extra }) as never;
    const rows = shapeExercises(
      [
        exercise("e1", "Back squat"),
        exercise("e2", "Planche", { timed: true }),
        exercise("e3", "Fente avant", { aliasesFr: ["Squat fendu"] }),
      ],
      "squat",
    );
    expect(rows).toEqual([
      { id: "e1", nom: "Back squat", mesure: "repetitions" },
      { id: "e3", nom: "Fente avant", mesure: "repetitions" },
    ]);
    expect(shapeExercises([exercise("e2", "Planche", { timed: true })], "planche")).toEqual([
      { id: "e2", nom: "Planche", mesure: "secondes" },
    ]);
  });
  // Relecture du lot 3a (n°4) : Claude cherche souvent le nom complet, en plusieurs mots.
  it("trouve un exercice cherché en plusieurs mots (nom complet ou alias)", () => {
    const exercise = (id: string, nameFr: string, extra: object = {}) =>
      ({ id, key: id, nameFr, nameEn: null, aliasesFr: [], aliasesEn: [], ...extra }) as never;
    const items = [
      exercise("e1", "Développé couché", { aliasesFr: ["Bench press"] }),
      exercise("e2", "Soulevé de terre"),
      exercise("e3", "Squat barre"),
      exercise("e4", "Développé militaire"),
    ];
    expect(shapeExercises(items, "développé couché").map((row) => row.id)).toEqual(["e1"]);
    expect(shapeExercises(items, "soulevé de terre").map((row) => row.id)).toEqual(["e2"]);
    expect(shapeExercises(items, "squat barre").map((row) => row.id)).toEqual(["e3"]);
    expect(shapeExercises(items, "bench press").map((row) => row.id)).toEqual(["e1"]);
    expect(shapeExercises(items, "developpe").map((row) => row.id)).toEqual(["e1", "e4"]);
  });
});
