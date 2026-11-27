import { describe, expect, it } from "vitest";

import { noteFor } from "@/features/assistant/cards";
import { assistantActionSchema, summarize } from "@/features/assistant/proposals";
import { currencyConflict, mergePreferences, mergeProfile } from "@/features/assistant/reglages";
import { shapeNotifications, shapeSettings } from "@/features/assistant/tools/shape";

// Assistant IA, lot 6 (D-185) : les réglages (Paramètres et notifications), JAMAIS la sécurité du
// compte (e-mail de connexion, mot de passe, déconnexion).

const ok = (kind: string, params: unknown) =>
  assistantActionSchema.safeParse({ kind, params }).success;
const card = (kind: string, params: object, names: Record<string, string> = {}) =>
  summarize(
    { kind: kind as "preferences", params: params as Record<string, unknown> },
    names,
    "EUR",
  );

describe("Task 1 : schémas stricts du lot 6", () => {
  it("chaque carte accepte ses champs ; jamais e-mail ni mot de passe", () => {
    expect(ok("modifier_profil", { changes: { firstName: "Gianluca", phone: null } })).toBe(true);
    expect(ok("modifier_profil", { changes: { email: "x@example.test" } })).toBe(false);
    expect(ok("modifier_profil", { changes: { password: "secret" } })).toBe(false);
    expect(ok("modifier_profil", { changes: {} })).toBe(false);
    expect(ok("nom_organisation", { nom: "GLB Coaching" })).toBe(true);
    expect(ok("pays_organisation", { pays: "BE" })).toBe(true);
    expect(ok("pays_organisation", { pays: "Belgique" })).toBe(false);
    expect(ok("devise_organisation", { devise: "CHF", taux: "0,94" })).toBe(true);
    expect(ok("devise_organisation", { devise: "XYZ", taux: "1" })).toBe(false);
    expect(ok("preferences", { changes: { defaultSessionMinutes: 75, agendaFirstHour: 7 } })).toBe(
      true,
    );
    expect(ok("preferences", { changes: {} })).toBe(false);
    expect(ok("preference_notification", { sorte: "tasks", active: false })).toBe(true);
    expect(ok("preference_notification", { sorte: "messages", active: true })).toBe(false);
    expect(ok("notifications", { action: "masquer", cles: ["task:abc:2026-11-14"] })).toBe(true);
    expect(
      ok("notifications", {
        action: "masquer",
        cles: Array.from({ length: 501 }, (_, i) => `k${i}`),
      }),
    ).toBe(false);
    expect(ok("notifications", { action: "effacer", cles: ["k"] })).toBe(false);
  });
});

describe("Task 1 : fusions dans les valeurs actuelles", () => {
  it("profil et préférences : null efface, le reste ne bouge pas", () => {
    expect(
      mergeProfile(
        { firstName: "Gianluca", lastName: "B", companyName: "GLB", phone: "+32 470 00 00 00" },
        { phone: null, companyName: "GLB Coaching" },
      ),
    ).toEqual({ firstName: "Gianluca", lastName: "B", companyName: "GLB Coaching", phone: "" });
    expect(
      mergePreferences(
        {
          defaultSessionMinutes: "60",
          defaultLocation: "Parc",
          defaultPrice: "65",
          defaultPaymentMethod: "transfer",
          agendaFirstHour: "7",
          agendaLastHour: "21",
        },
        { defaultSessionMinutes: 75, defaultLocation: null, defaultPrice: 70.5 },
      ),
    ).toEqual({
      defaultSessionMinutes: "75",
      defaultLocation: "",
      defaultPrice: "70,50",
      defaultPaymentMethod: "transfer",
      agendaFirstHour: "7",
      agendaLastHour: "21",
    });
  });
});

describe("Task 1 : ce que disent les cartes", () => {
  it("devise : le taux, ce qui est converti et ce qui reste (mots de la fenêtre)", () => {
    const result = card(
      "devise_organisation",
      { devise: "CHF", taux: "0,94" },
      { devise: "EUR", seances: "3", paiements: "12" },
    );
    expect(result.title).toBe("Changer de devise");
    expect(result.summary).toEqual([
      "Devise : EUR → CHF",
      "Taux : 1 EUR = 0,94 CHF",
      "Sera converti en CHF : 3 séances à venir avec prix, ton prix par défaut des séances",
      "Reste en EUR : 12 paiements reçus",
    ]);
  });

  it("notifications : combien, et lesquelles", () => {
    const result = card(
      "notifications",
      { action: "masquer", cles: ["a", "b", "c"] },
      { "notif:0": "Tâche : Appeler Sarah", "notif:1": "Profil : Hugo Lefèvre", "notif:2": "X" },
    );
    expect(result.title).toBe("Masquer des notifications");
    expect(result.summary).toEqual([
      "3 notifications masquées",
      "Tâche : Appeler Sarah",
      "Profil : Hugo Lefèvre",
      "X",
    ]);
  });

  it("la note « [Fait : …] » du profil ne garde que les noms des champs", () => {
    const summary = card(
      "modifier_profil",
      { changes: { phone: "+32 470 11 22 33" } },
      { "avant:phone": "+32 470 00 00 00" },
    );
    expect(summary.summary).toEqual(["Téléphone : +32 470 00 00 00 → +32 470 11 22 33"]);
    const note = noteFor(
      {
        id: "c",
        kind: "modifier_profil",
        params: {},
        title: summary.title,
        summary: summary.summary,
        dependsOn: null,
      },
      "done",
    );
    expect(note).toBe("[Fait : Modifier ton profil · Téléphone]");
  });
});

describe("Task 1 : lectures sans données sensibles", () => {
  it("voir_parametres : ni e-mail de connexion, ni numéro", () => {
    const shaped = shapeSettings({
      email: "coach@example.test",
      displayName: "Gianluca B",
      photoPath: null,
      profile: { firstName: "Gianluca", lastName: "B", companyName: "GLB", phone: "+32 470" },
      preferences: {
        defaultSessionMinutes: "60",
        defaultLocation: "",
        defaultPrice: "65",
        defaultPaymentMethod: "transfer",
        agendaFirstHour: "7",
        agendaLastHour: "21",
      },
      notify: { competitions: true, messages: true, tasks: false, unpaid: true, profiles: true },
      organization: { id: "o", name: "GLB", isOwner: true, country: "BE", currency: "EUR" },
      currencyChanges: [],
    } as never);
    const text = JSON.stringify(shaped);
    expect(text).not.toContain("coach@example.test");
    expect(text).not.toContain("+32");
    expect(shaped).toMatchObject({
      profil: { telephone: "rempli" },
      organisation: { nom: "GLB", devise: "EUR", proprietaire: true },
      notifications: { tasks: false },
    });
    expect("messages" in shaped.notifications).toBe(false);
  });

  it("voir_notifications : une ligne par notification, sans les messages masqués", () => {
    const meta = { read: false, dismissed: false };
    const rows = shapeNotifications({
      competitions: [],
      messages: [{ ...meta, key: "m:1" } as never],
      tasks: [{ ...meta, key: "t:1", title: "Appeler Sarah", dueOn: "2026-11-14" } as never],
      unpaid: [],
      profiles: [{ ...meta, key: "p:1", name: "Hugo Lefèvre", dismissed: true } as never],
      assistant: [],
    });
    expect(rows).toEqual([
      {
        cle: "t:1",
        sorte: "tasks",
        texte: "Tâche : Appeler Sarah (2026-11-14)",
        lue: false,
        masquee: false,
      },
      {
        cle: "p:1",
        sorte: "profiles",
        texte: "Fiche à compléter : Hugo Lefèvre",
        lue: false,
        masquee: true,
      },
    ]);
  });
});

// --- Relecture indépendante du lot 6 -------------------------------------------------------------
describe("relecture n°1 : une carte de devise ne convertit que depuis la devise qu'elle annonce", () => {
  it("la devise de départ est notée par le serveur ; une autre au clic = refus", () => {
    expect(ok("devise_organisation", { devise: "CHF", taux: "0,94", depuis: "EUR" })).toBe(true);
    expect(currencyConflict("EUR", "EUR")).toBeNull();
    expect(currencyConflict("EUR", "GBP")).toBe(
      "La devise a changé depuis cette carte (EUR, maintenant GBP) : rien n'a été converti. Redemande à l'assistant.",
    );
    expect(currencyConflict(undefined, "EUR")).toContain("pas valable");
  });
});

describe("relecture n°2 : supprimer une notification est définitif pour l'assistant", () => {
  it("plus de « rétablir » ; la carte « Supprimer » le dit", () => {
    expect(ok("notifications", { action: "retablir", cles: ["profile:x"] })).toBe(false);
    const result = card("notifications", { action: "supprimer", cles: ["a"] }, { "notif:0": "X" });
    expect(result.summary).toEqual(["1 notification supprimée (définitif)", "X"]);
  });
});
