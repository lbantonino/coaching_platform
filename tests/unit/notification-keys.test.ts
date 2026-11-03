import { describe, expect, it } from "vitest";

import {
  countUnread,
  isNotificationKey,
  latestUnreadByAthlete,
  messageKey,
  stateMap,
  taskKey,
  unpaidKey,
} from "@/domain/notifications/keys";

const ID = "7a000000-0000-4000-8000-0000000000a1";

describe("clés des notifications", () => {
  it("change quand la situation change (nouvelle échéance, nouveau message)", () => {
    expect(taskKey(ID, "2026-10-28")).not.toBe(taskKey(ID, "2026-10-30"));
    expect(messageKey(ID, "m1")).not.toBe(messageKey(ID, "m2"));
    expect(taskKey(ID, null)).toBe(`task:${ID}:sans-date`);
  });

  it("n'accepte que des clés connues, sans caractère libre", () => {
    expect(isNotificationKey(unpaidKey(ID, "2026-10-01"))).toBe(true);
    // Les anciennes notifications de factures (avant D-90) ne sont plus des clés valables.
    expect(isNotificationKey(`invoice:${ID}:2026-10-01`)).toBe(false);
    expect(isNotificationKey("task:'; drop table x;--")).toBe(false);
    expect(isNotificationKey("autre:123")).toBe(false);
    expect(isNotificationKey(42)).toBe(false);
  });

  it("compte ce qui n'est ni lu ni masqué", () => {
    const states = stateMap([
      { key: "task:a:2026-10-28", read_at: "2026-10-28T10:00:00Z", dismissed_at: null },
      { key: "task:b:2026-10-28", read_at: null, dismissed_at: "2026-10-28T10:00:00Z" },
    ]);
    expect(
      countUnread(["task:a:2026-10-28", "task:b:2026-10-28", "task:c:2026-10-28"], states),
    ).toBe(1);
  });

  it("retient le dernier message non lu de chaque sportif", () => {
    const latest = latestUnreadByAthlete([
      { id: "m3", athlete_id: "ines" },
      { id: "m2", athlete_id: "thomas" },
      { id: "m1", athlete_id: "ines" },
    ]);
    expect(latest.get("ines")).toBe("m3");
    expect(latest.get("thomas")).toBe("m2");
  });
});
