import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const INVITATION_VALIDITY_DAYS = 7;

// 32 octets aléatoires encodés en base64url = 43 caractères, impossibles à deviner.
export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

// Seule cette empreinte est stockée en base : une fuite de la base ne donne aucun lien utilisable.
export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
