import { describe, expect, it } from "vitest";

import { sessionFieldText } from "@/features/assistant/daily";
import { mergeSessionChanges, toFormData } from "@/features/assistant/form-data";
import {
  assistantActionSchema,
  summarize,
  type ParsedAssistantAction,
} from "@/features/assistant/proposals";
import { shapeAgenda } from "@/features/assistant/tools/shape";
import type { CoachSession } from "@/features/sessions/queries";
import type { SessionFormInput } from "@/features/sessions/schemas";

// L'Assistant IA règle aussi les alertes des séances (D-207, règle d'Antonino : l'assistant fait tout
// ce que fait le coach). En minutes AVANT le début, comme dans le formulaire (D-205).
const LUCAS = "da000000-0000-4000-8000-000000000001";
const SESSION = "cb000000-0000-4000-8000-000000000011";
const ok = (kind: string, params: unknown) =>
  assistantActionSchema.safeParse({ kind, params }).success;

const create = (extra: Record<string, unknown>) => ({
  kind: "individual",
  title: "Coaching force",
  athlete: { athleteId: LUCAS },
  startsOn: "2026-12-02",
  startTime: "18:00",
  durationMinutes: 60,
  ...extra,
});

describe("créer une séance avec ses alertes", () => {
  it("accepte une ou deux alertes permises, refuse le reste", () => {
    expect(ok("creer_seance", create({ alerts: [15, 1440] }))).toBe(true);
    expect(ok("creer_seance", create({ alerts: [7] }))).toBe(false);
    expect(ok("creer_seance", create({ alerts: [5, 15, 30] }))).toBe(false);
    expect(ok("creer_seance", create({ alerts: [-540] }))).toBe(false);
    expect(ok("creer_seance", create({ allDay: true, alerts: [-540, 900] }))).toBe(true);
  });

  it("les envoie au formulaire et les montre sur la carte", () => {
    const action = { kind: "creer_seance", params: create({ alerts: [15, 1440] }) };
    expect(toFormData(action as ParsedAssistantAction).get("alerts")).toBe("15,1440");
    const card = summarize(action as ParsedAssistantAction, { [LUCAS]: "Lucas M." }, "EUR");
    expect(card.summary).toContain("Alertes : 15 min avant, 1 jour avant");
  });
});

describe("modifier les alertes d'une séance", () => {
  const initial = { title: "Coaching force", allDay: false, alerts: "15" } as SessionFormInput;

  it("accepte les alertes et « Jour entier » dans les changements", () => {
    expect(ok("modifier_seance_agenda", { sessionId: SESSION, changes: { alerts: [30] } })).toBe(
      true,
    );
    expect(ok("modifier_seance_agenda", { sessionId: SESSION, changes: { alerts: [7] } })).toBe(
      false,
    );
    expect(ok("modifier_seance_agenda", { sessionId: SESSION, changes: { allDay: true } })).toBe(
      true,
    );
  });

  it("remplace les alertes ; passer en « Jour entier » sans alertes les retire", () => {
    expect(mergeSessionChanges(initial, { alerts: [30, 1440] }).alerts).toBe("30,1440");
    expect(mergeSessionChanges(initial, { alerts: [] }).alerts).toBe("");
    const stage = mergeSessionChanges(initial, { allDay: true });
    expect([stage.allDay, stage.alerts]).toEqual([true, ""]);
    const both = mergeSessionChanges(initial, { alerts: [-540], allDay: true });
    expect([both.allDay, both.alerts]).toEqual([true, "-540"]);
  });

  it("dit les alertes en clair sur la carte", () => {
    expect(sessionFieldText("alerts", [15, 1440], {}, "EUR")).toBe("15 min avant, 1 jour avant");
    expect(sessionFieldText("alerts", [-540], {}, "EUR")).toBe("Le jour même (09:00)");
    expect(sessionFieldText("alerts", [], {}, "EUR")).toBe("aucune");
    expect(sessionFieldText("allDay", true, {}, "EUR")).toBe("oui");
  });
});

describe("l'agenda lu par l'assistant", () => {
  it("donne les alertes de chaque séance", () => {
    const session = {
      id: SESSION,
      kind: "individual",
      title: "Coaching force",
      discipline: null,
      location: null,
      startsOn: "2026-12-02",
      startTime: "18:00",
      allDay: false,
      alerts: [15],
      durationMinutes: 60,
      repeatsWeekly: false,
      recurrence: null,
      endsOn: null,
      notes: null,
      athletes: [{ id: LUCAS, name: "Lucas Martin" }],
      exceptions: [],
      priceCents: null,
      priceVatIncluded: true,
      vatRate: 0,
      currency: "EUR",
      paymentMethod: null,
    } as CoachSession;
    const [row] = shapeAgenda([session], "2026-12-01", "2026-12-07");
    expect(row.alertes).toEqual(["15 min avant"]);
  });
});
