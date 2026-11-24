import { describe, expect, it } from "vitest";

import { parseSessionForm, type SessionFormInput } from "@/features/sessions/schemas";

// Alertes d'une séance (D-205) : lues dans le formulaire (« 15,1440 »), vérifiées comme en base.
const base: SessionFormInput = {
  kind: "group",
  title: "Piste du mercredi",
  discipline: "running",
  location: "",
  startsOn: "2026-12-02",
  startTime: "19:00",
  durationMinutes: "90",
  repeatsWeekly: false,
  endsOn: "",
  athleteId: "",
  athleteIds: [],
  newClient: false,
  newAthleteName: "",
  notes: "",
  price: "",
  applyVat: false,
  vatRate: "",
  vatIncluded: true,
  paymentMethod: "transfer",
};

describe("alertes d'une séance", () => {
  it("sans alerte par défaut", () => {
    const parsed = parseSessionForm(base);
    expect(parsed.ok && parsed.values.alerts).toEqual([]);
  });

  it("lit une ou deux alertes", () => {
    const parsed = parseSessionForm({ ...base, alerts: "15,1440" });
    expect(parsed.ok && parsed.values.alerts).toEqual([15, 1440]);
  });

  it("refuse une alerte qui ne va pas avec la séance", () => {
    expect(parseSessionForm({ ...base, alerts: "-540" })).toEqual({
      ok: false,
      error: "Alertes invalides : deux au plus, parmi les choix proposés.",
    });
    const stage = parseSessionForm({ ...base, allDay: true, alerts: "-540,900" });
    expect(stage.ok && stage.values.alerts).toEqual([-540, 900]);
  });
});
