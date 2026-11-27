import { describe, expect, it } from "vitest";

import {
  ignoredSessionFieldsRefusal,
  sessionDateStatus,
  summarizeDaily,
  withPaymentMethodVat,
} from "@/features/assistant/daily";
import { canModify } from "@/features/assistant/cards";
import { proposalToolResult } from "@/features/assistant/loop";
import {
  athleteFicheRefusal,
  changedAthleteFields,
  publicationLine,
  sameExerciseName,
  staleAthleteFields,
  summarize,
} from "@/features/assistant/proposals";
import { REGLAGES_PARAMS, uniqueNotificationKeys } from "@/features/assistant/reglages";
import { attachmentProblem } from "@/features/assistant/attachment-rules";
import {
  goalCheckDay,
  goalEditRefusal,
  recordDeletionLine,
  summarizeSportifs,
} from "@/features/assistant/sportifs";
import { shapeNotifications, withTotal } from "@/features/assistant/tools/shape";
import { pickMembership } from "@/features/coach/settings";

// Petits défauts reportés pendant les lots de l'Assistant IA (relectures du 13 au 14/11/2026),
// corrigés le 20/11/2026. Un bloc par défaut, nommé d'après son lot et son numéro.

const meta = { read: false, dismissed: false };
const notifications = {
  competitions: [],
  messages: [],
  tasks: [{ ...meta, key: "t:1", title: "Appeler Sarah", dueOn: "2026-11-14" } as never],
  unpaid: [
    { ...meta, key: "u:1", title: "Coaching", date: "2026-11-10", athleteName: null } as never,
  ],
  profiles: [],
  assistant: [],
};

describe("lot 6 n°3 : voir_notifications respecte les sortes coupées et dit quand la liste est coupée", () => {
  it("une sorte coupée par le coach n'est pas lue", () => {
    const rows = shapeNotifications(notifications, {
      competitions: true,
      messages: true,
      tasks: false,
      unpaid: true,
      profiles: true,
    });
    expect(rows.map((row) => row.cle)).toEqual(["u:1"]);
  });

  it("sans préférences, toutes les sortes visibles sont lues", () => {
    expect(shapeNotifications(notifications).map((row) => row.cle)).toEqual(["t:1", "u:1"]);
  });

  it("une liste coupée à 100 le dit, avec le total", () => {
    const rows = Array.from({ length: 100 }, (_, index) => ({ id: index }));
    expect(withTotal(rows, 100, "précise un sportif.")).toBe(rows);
    expect(withTotal(rows, 140, "précise un sportif.")).toEqual({
      lignes: rows,
      total: 140,
      note: "Seules les 100 premières lignes sur 140 sont montrées : précise un sportif.",
    });
  });
});

describe("lot 6 n°4 : les réglages lus sont ceux de l'organisation de l'assistant", () => {
  const first = { organizationId: "org-1", organizationName: "GLB" };
  const second = { organizationId: "org-2", organizationName: "BeHybrid" };

  it("prend l'organisation demandée", () => {
    expect(pickMembership([first, second] as never, "org-2")).toBe(second);
  });

  it("sans organisation demandée (ou inconnue), la première", () => {
    expect(pickMembership([first, second] as never)).toBe(first);
    expect(pickMembership([first, second] as never, "org-9")).toBe(first);
  });
});

describe("lot 6 n°5 : heures de l'agenda hors limites, message en français", () => {
  const error = (changes: Record<string, unknown>) =>
    REGLAGES_PARAMS.preferences.safeParse({ changes }).error?.issues[0]?.message;

  it("début de l'agenda", () => {
    expect(error({ agendaFirstHour: 14 })).toBe(
      "L'agenda commence entre 0 h et 12 h (un nombre entier).",
    );
  });

  it("fin de l'agenda", () => {
    expect(error({ agendaLastHour: 8 })).toBe(
      "L'agenda finit entre 13 h et 24 h (un nombre entier).",
    );
  });

  it("durée et prix par défaut", () => {
    expect(error({ defaultSessionMinutes: 5 })).toBe("La durée par défaut va de 15 à 480 minutes.");
    expect(error({ defaultPrice: -1 })).toBe("Le prix par défaut va de 0 à 100 000.");
  });
});

describe("lot 6 n°6 : une carte de notifications ne compte pas deux fois la même", () => {
  it("les clés en double sont retirées, l'ordre est gardé", () => {
    expect(uniqueNotificationKeys(["t:1", "u:1", "t:1"])).toEqual(["t:1", "u:1"]);
  });
});

describe("lot 4 n°3 : pas de carte pour un changement que le formulaire ignore", () => {
  const unpriced = { priceCents: null, repeatsWeekly: false };

  it("paiement ou TVA sur une séance sans prix : refusé", () => {
    expect(ignoredSessionFieldsRefusal(unpriced, { paymentMethod: "cash" })).toBe(
      "Cette séance n'a pas de prix : le paiement et la TVA ne comptent qu'avec un prix. Ajoute un prix (price) dans la même demande, ou retire ces changements.",
    );
    expect(ignoredSessionFieldsRefusal(unpriced, { vatRate: 21 })).not.toBeNull();
  });

  it("avec un prix donné dans la même demande : accepté", () => {
    expect(ignoredSessionFieldsRefusal(unpriced, { price: 65, paymentMethod: "cash" })).toBeNull();
    expect(
      ignoredSessionFieldsRefusal(
        { priceCents: 6500, repeatsWeekly: false },
        { vatIncluded: true },
      ),
    ).toBeNull();
  });

  it("date de fin sur une séance unique : refusée ; sur une série : acceptée", () => {
    expect(ignoredSessionFieldsRefusal(unpriced, { endsOn: "2026-12-20" })).toBe(
      "Une séance unique n'a pas de date de fin : endsOn sert seulement à une séance qui se répète chaque semaine (repeatsWeekly).",
    );
    expect(
      ignoredSessionFieldsRefusal(unpriced, { repeatsWeekly: true, endsOn: "2026-12-20" }),
    ).toBeNull();
    expect(ignoredSessionFieldsRefusal(unpriced, { endsOn: null })).toBeNull();
  });
});

describe("lot 4 n°4 : changer le moyen de paiement suit le formulaire", () => {
  const session = { paymentMethod: "transfer", priceVatIncluded: false };

  it("TVA comprise remise à la valeur du nouveau moyen, comme le formulaire", () => {
    expect(withPaymentMethodVat(session, { paymentMethod: "cash" })).toEqual({
      paymentMethod: "cash",
      vatIncluded: true,
    });
  });

  it("rien n'est ajouté si le coach choisit lui-même la TVA ou si rien ne change", () => {
    expect(withPaymentMethodVat(session, { paymentMethod: "cash", vatIncluded: false })).toEqual({
      paymentMethod: "cash",
      vatIncluded: false,
    });
    expect(withPaymentMethodVat(session, { paymentMethod: "transfer" })).toEqual({
      paymentMethod: "transfer",
    });
  });

  it("la carte montre le prix quand le paiement change", () => {
    const card = summarizeDaily(
      {
        kind: "modifier_seance_agenda",
        params: { sessionId: "s", changes: { paymentMethod: "cash", vatIncluded: true } },
      },
      { seance: "Coaching · Sarah", prix: "65,00 €" },
      "EUR",
    );
    expect(card?.summary).toContain("Prix : 65,00 €");
  });
});

describe("lot 4 n°5 : supprimer un paiement dit précisément ce qui redevient à encaisser", () => {
  it("statut d'une date de séance", () => {
    expect(sessionDateStatus("2026-12-01", "2026-11-20")).toBe("futur");
    expect(sessionDateStatus("2026-11-18", "2026-11-20")).toBe("a_encaisser");
    expect(sessionDateStatus("2026-08-01", "2026-11-20")).toBe("ancien");
  });

  const card = (names: Record<string, string>) =>
    summarizeDaily({ kind: "supprimer_paiement", params: { paymentId: "p" } }, names, "EUR")
      ?.summary;

  it("une séance passée redevient à encaisser ; une future n'est plus marquée payée", () => {
    expect(card({ seanceDate: "2026-11-18", seanceStatut: "a_encaisser" })).toContain(
      "La séance du mercredi 18 novembre 2026 redevient à encaisser",
    );
    expect(card({ seanceDate: "2026-12-01", seanceStatut: "futur" })).toContain(
      "La séance du mardi 1 décembre 2026 n'est plus marquée payée",
    );
    expect(card({ seanceDate: "2026-08-01", seanceStatut: "ancien" })).toContain(
      "La séance du samedi 1 août 2026 n'est plus marquée payée (trop ancienne pour « À encaisser »)",
    );
  });

  it("un forfait est annoncé", () => {
    expect(card({ forfaitDu: "2026-11-01", forfaitAu: "2026-11-30" })).toContain(
      "Forfait du dimanche 1 novembre 2026 au lundi 30 novembre 2026 : ses séances ne sont plus couvertes",
    );
  });
});

describe("lot 5 n°5 : modifier un objectif comme la fiche le permet", () => {
  const values = {
    goalType: "run_10k",
    priority: "main",
    targetDate: "2026-11-01",
    targetTime: "45:00",
    isCompetition: false,
    competitionName: "",
    competitionLocation: "",
    hyroxCategory: "",
    description: "",
  };

  it("un objectif clôturé ne se modifie plus : refusé dès la carte", () => {
    expect(goalEditRefusal({ status: "achieved" }, values, { targetTime: "44:00" })).toBe(
      "Cet objectif est déjà atteint : il n'est plus en cours et ne se modifie plus.",
    );
  });

  it("une carte sans effet est refusée", () => {
    expect(goalEditRefusal({ status: "active" }, values, { priority: "main" })).toBe(
      "Cet objectif est déjà l'objectif principal.",
    );
    expect(goalEditRefusal({ status: "active" }, values, { targetTime: "45:00" })).toBe(
      "Rien ne change : l'objectif a déjà ces valeurs.",
    );
    expect(goalEditRefusal({ status: "active" }, values, { targetTime: "44:00" })).toBeNull();
  });

  it("un objectif en retard garde sa date passée, comme dans la fiche", () => {
    expect(goalCheckDay("2026-11-01", "2026-11-20")).toBe("2026-11-01");
    expect(goalCheckDay("2026-12-01", "2026-11-20")).toBe("2026-11-20");
    expect(goalCheckDay(null, "2026-11-20")).toBe("2026-11-20");
  });
});

describe("lot 5 n°6 et n°7 : les cartes des objectifs et des repères disent tout", () => {
  const card = (kind: string, params: Record<string, unknown>, names: Record<string, string>) =>
    summarizeSportifs({ kind, params }, { sportif: "Sarah Dubois", ...names })?.summary ?? [];

  it("devenir principal annonce que l'actuel passe en secondaire", () => {
    const names = { objectif: "Semi-marathon", principalActuel: "Course 10 km en 45:00" };
    const line = "L'objectif principal actuel (Course 10 km en 45:00) passe en secondaire";
    expect(
      card("statut_objectif", { athleteId: "a", goalId: "g", statut: "principal" }, names),
    ).toContain(line);
    expect(
      card(
        "modifier_objectif",
        { athleteId: "a", goalId: "g", changes: { priority: "main" } },
        names,
      ),
    ).toContain(line);
  });

  it("le nouvel objectif montre lieu, catégorie Hyrox et description", () => {
    const summary = card(
      "ajouter_objectif",
      {
        athleteId: "a",
        objectif: {
          goalType: "hyrox",
          isCompetition: true,
          competitionName: "Hyrox Bruxelles",
          competitionLocation: "Brussels Expo",
          hyroxCategory: "open",
          description: "Finir sous 1:20",
        },
      },
      {},
    );
    expect(summary).toContain("Lieu : Brussels Expo");
    expect(summary.some((line) => line.startsWith("Catégorie Hyrox : "))).toBe(true);
    expect(summary).toContain("Description : Finir sous 1:20");
  });

  it("le nouveau repère montre sa note", () => {
    const summary = card(
      "ajouter_repere",
      {
        athleteId: "a",
        repere: {
          kind: "hr_max",
          bpm: "192",
          measuredOn: "2026-11-10",
          source: "test",
          note: "Test sur piste",
        },
      },
      {},
    );
    expect(summary).toContain("Note : Test sur piste");
  });
});

describe("lot 5 n°8 : un record se lit en heures quand il dépasse l'heure", () => {
  it("marathon en 3:05:00, pas en 185:00", () => {
    expect(
      recordDeletionLine({
        event: "run_marathon",
        hyroxCategory: null,
        timeSeconds: 11_100,
        achievedOn: "2026-04-12",
      }),
    ).toBe("Marathon : 3:05:00 (le dimanche 12 avril 2026)");
  });
});

describe("lot 2 n°a et n°i : la version publiée se date à Bruxelles", () => {
  it("publiée à 0 h 30 à Bruxelles : le jour de Bruxelles, pas la veille (UTC)", () => {
    expect(publicationLine(2, "2026-11-19T23:30:00Z")).toBe(
      "Version 2 publiée le vendredi 20 novembre 2026",
    );
  });
});

describe("lot 2 n°c : la carte « Nouvel exercice » n'a pas de « Modifier »", () => {
  it("l'exercice se modifie ensuite dans sa page", () => {
    expect(canModify("creer_exercice")).toBe(false);
    expect(canModify("creer_seance")).toBe(true);
    expect(canModify("completer_fiche")).toBe(true);
  });
});

describe("lot 2 n°d et n°e : « Compléter la fiche » sans faux changement ni écrasement", () => {
  const current = { city: "Bruxelles", phone: "", level: "beginner", trainingPlaces: ["gym"] };

  it("un champ déjà identique n'est pas montré comme un changement", () => {
    expect(changedAthleteFields(current, { city: "Bruxelles", phone: "+32 470 00 00 00" })).toEqual(
      {
        phone: "+32 470 00 00 00",
      },
    );
    expect(changedAthleteFields(current, { trainingPlaces: ["gym"] })).toEqual({});
  });

  it("une valeur changée entre la carte et le clic refuse la carte", () => {
    expect(staleAthleteFields({ city: "Bruxelles" }, { ...current, city: "Liège" })).toBe(
      "La fiche a changé depuis la carte (Ville) : redemande à l'assistant pour ne rien écraser.",
    );
    expect(staleAthleteFields({ city: "Bruxelles", phone: "" }, current)).toBeNull();
    expect(staleAthleteFields(undefined, current)).toBeNull();
  });
});

describe("lot 2 n°f : doublon d'exercice, sans joker ni espaces en trop", () => {
  it("même nom à la casse et aux espaces près", () => {
    expect(sameExerciseName("Fentes  sautées ", "fentes sautées")).toBe(true);
  });

  it("une étoile n'est pas un joker", () => {
    expect(sameExerciseName("Squat*", "Squat bulgare")).toBe(false);
    expect(sameExerciseName("Squat*", "squat*")).toBe(true);
  });
});

describe("lot 2 n°g : un fichier joint refusé dit pourquoi", () => {
  // D-213 (27/11) : 20 Mo par fichier, plusieurs fichiers (assistant-attachment-rules.test.ts).
  it("fichier vide, trop lourd, nom trop long", () => {
    const pdf = (name: string, size: number) => ({ name, type: "application/pdf", size });
    expect(attachmentProblem(pdf("vide.pdf", 0), 0)).toBe("« vide.pdf » est vide.");
    expect(attachmentProblem(pdf("gros.pdf", 21 * 1024 * 1024), 0)).toBe(
      "« gros.pdf » : plus de 20 Mo.",
    );
    expect(attachmentProblem(pdf(`${"a".repeat(201)}.pdf`, 10), 0)).toBe(
      "Nom de fichier trop long (200 caractères au plus).",
    );
    expect(attachmentProblem(pdf("ok.pdf", 5 * 1024 * 1024), 0)).toBeNull();
  });
});

describe("lot 2 n°j : les refus de « Compléter la fiche » testés hors de la base", () => {
  const changes = { equipment: "Tapis" };

  it("fiche introuvable ou archivée", () => {
    expect(athleteFicheRefusal(null, changes)).toBe(
      "Sportif introuvable ou archivé : cherche-le avec chercher_sportifs.",
    );
    expect(athleteFicheRefusal({ status: "archived", hasAccount: false }, changes)).not.toBeNull();
  });

  it("l'e-mail d'un sportif qui a activé son compte ne change pas ici", () => {
    expect(
      athleteFicheRefusal({ status: "active", hasAccount: true }, { email: "a@example.test" }),
    ).toBe("Le sportif a activé son compte : son adresse e-mail ne peut plus être modifiée ici.");
    expect(athleteFicheRefusal({ status: "active", hasAccount: true }, changes)).toBeNull();
  });
});

describe("lot 2 n°h : les coordonnées d'un sportif ne partent jamais chez Claude", () => {
  // Décision d'Antonino du 20/11/2026 (option B) : e-mail, téléphone et adresse = « rempli » ou
  // « vide » pour Claude. La carte du coach garde « ancien → nouveau » ; ce que Claude en apprend
  // (proposalToolResult, relecture du lot 3a n°11) ne contient jamais l'ancienne valeur.
  const athleteId = "ab000000-0000-4000-8000-000000000001";
  const action = {
    kind: "completer_fiche" as const,
    params: {
      athleteId,
      changes: { email: "nouveau@example.test", level: "advanced", city: "Liège" },
    },
  };
  const card = summarize(
    action,
    {
      [athleteId]: "Léa Test",
      "avant:email": "ancien@example.test",
      "avant:level": "beginner",
      "avant:city": "Namur",
    },
    "EUR",
  );

  it("la carte du coach montre toujours l'ancienne valeur", () => {
    expect(card.summary).toContain("E-mail : ancien@example.test → nouveau@example.test");
    expect(card.summary).toContain("Ville : Namur → Liège");
  });

  it("Claude n'apprend que la nouvelle valeur des coordonnées", () => {
    const result = proposalToolResult({ ...action, ...card });
    expect(result).not.toContain("ancien@example.test");
    expect(result).not.toContain("Namur");
    expect(result).toContain("nouveau@example.test");
    expect(result).toContain("E-mail : rempli → nouveau@example.test");
    expect(result).toContain("Ville : rempli → Liège");
    // Les autres champs restent « ancien → nouveau » : Claude les lit déjà dans voir_fiche.
    expect(result).toContain("Niveau : Débutant → Confirmé");
  });

  it("un champ vide se dit « vide », comme dans voir_fiche", () => {
    const empty = { ...action, params: { athleteId, changes: { phone: "0470 00 00 00" } } };
    const result = proposalToolResult({ ...empty, ...summarize(empty, {}, "EUR") });
    expect(result).toContain("Téléphone : vide → 0470 00 00 00");
  });
});

describe("revue du 20/11 n°1 : le téléphone du coach ne part pas chez Claude", () => {
  // voir_parametres dit « rempli » ou « vide » pour le téléphone du coach : la carte « Modifier ton
  // profil » renvoyée à Claude suit la même règle, la carte du coach garde « ancien → nouveau ».
  const action = {
    kind: "modifier_profil" as const,
    params: { changes: { phone: "0470 11 11 11", firstName: "Gianluca" } },
  };
  const card = summarize(
    action,
    { "avant:phone": "0470 99 99 99", "avant:firstName": "Gian" },
    "EUR",
  );

  it("la carte du coach montre l'ancien numéro", () => {
    expect(card.summary).toContain("Téléphone : 0470 99 99 99 → 0470 11 11 11");
  });

  it("Claude lit « rempli → nouveau », jamais l'ancien numéro", () => {
    const result = proposalToolResult({ ...action, ...card });
    expect(result).not.toContain("0470 99 99 99");
    expect(result).toContain("Téléphone : rempli → 0470 11 11 11");
    expect(result).toContain("Prénom : Gian → Gianluca");
  });

  it("un numéro absent se dit « vide »", () => {
    const empty = { ...action, params: { changes: { phone: "0470 11 11 11" } } };
    const result = proposalToolResult({ ...empty, ...summarize(empty, {}, "EUR") });
    expect(result).toContain("Téléphone : vide → 0470 11 11 11");
  });
});
