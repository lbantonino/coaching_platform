import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  generateInvitationToken,
  hashInvitationToken,
  invitationTokenSchema,
} from "@/features/invitations/token";

describe("jetons d'invitation", () => {
  it("génère un jeton de 43 caractères base64url, valide pour le schéma", () => {
    const token = generateInvitationToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(invitationTokenSchema.safeParse(token).success).toBe(true);
  });

  it("ne génère jamais deux fois le même jeton", () => {
    const tokens = new Set(Array.from({ length: 1000 }, generateInvitationToken));
    expect(tokens.size).toBe(1000);
  });

  it("stocke une empreinte SHA-256 hexadécimale, identique à celle calculée en base", () => {
    const hash = hashInvitationToken("jeton-valide");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // Même calcul que encode(sha256('jeton-valide'::bytea), 'hex') dans les tests pgTAP.
    expect(hash).toBe(createHash("sha256").update("jeton-valide").digest("hex"));
    expect(hash).not.toContain("jeton-valide");
  });

  it("refuse les jetons mal formés", () => {
    for (const bad of ["", "trop-court", "x".repeat(44), "x".repeat(42) + "!"]) {
      expect(invitationTokenSchema.safeParse(bad).success).toBe(false);
    }
  });
});
