import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { programDraftSchema, programPlanSchema } from "@/domain/training/program-plan";
import { parseProgramSession } from "@/domain/training/program-session";
import { publishedSessionSchema, sessionBodySchema } from "@/domain/training/session-v2";

// Les documents v2 du seed (partie <programmes-v2>, D-155) doivent rester valides pour l'application :
// une donnée de démo mal formée serait écartée en silence par les écrans. Les modèles Coory vivent
// dans supabase/content/modeles_coory.sql depuis le 13/11/2026 (chargé avant la graine) : vérifiés ici aussi.

const seed = readFileSync(path.resolve(import.meta.dirname, "../../supabase/seed.sql"), "utf8");
const cooryTemplates = readFileSync(
  path.resolve(import.meta.dirname, "../../supabase/content/modeles_coory.sql"),
  "utf8",
);
const section =
  seed.slice(seed.indexOf("-- <programmes-v2>"), seed.indexOf("-- </programmes-v2>")) +
  cooryTemplates;
const documents = [...section.matchAll(/'(\{.*?\})'::jsonb/g)].map(
  (match) => JSON.parse((match[1] ?? "").replace(/''/g, "'")) as Record<string, unknown>,
);

const isDraft = (doc: Record<string, unknown>) =>
  "weeks" in doc && "startDate" in doc && !("weeksCount" in doc);
const isSnapshot = (doc: Record<string, unknown>) => "weeksCount" in doc;
const isPlan = (doc: Record<string, unknown>) => "weeks" in doc && !("startDate" in doc);
const isPublishedSession = (doc: Record<string, unknown>) =>
  "content" in doc && "schemaVersion" in doc;
const isSessionBody = (doc: Record<string, unknown>) =>
  "content" in doc && !("schemaVersion" in doc);

describe("seed : programmes au schéma v2", () => {
  it("contient les documents attendus", () => {
    expect(section.length).toBeGreaterThan(0);
    expect(documents.filter(isDraft)).toHaveLength(2);
    expect(documents.filter(isSnapshot)).toHaveLength(1);
    expect(documents.filter(isPlan)).toHaveLength(5);
    expect(documents.filter(isPublishedSession)).toHaveLength(23);
    expect(documents.filter(isSessionBody)).toHaveLength(4);
  });
  it("chaque brouillon, modèle et séance publiée est valide", () => {
    for (const doc of documents.filter(isDraft))
      expect(programDraftSchema.safeParse(doc).error).toBeUndefined();
    for (const doc of documents.filter(isPlan))
      expect(programPlanSchema.safeParse(doc).error).toBeUndefined();
    for (const doc of documents.filter(isSessionBody))
      expect(sessionBodySchema.safeParse(doc).error).toBeUndefined();
    for (const doc of documents.filter(isPublishedSession)) {
      expect(publishedSessionSchema.safeParse(doc).error).toBeUndefined();
      // Et les écrans savent l'afficher.
      expect(parseProgramSession(doc)).not.toBeNull();
    }
  });
  it("le bloc 2 d'Inès commence le lundi qui suit son bloc 1 (pas de chevauchement, C-8)", () => {
    const snapshot = documents.find(isSnapshot);
    expect(snapshot?.startDate).toBe("2027-01-18");
    // Bloc 1 : 26 octobre 2026, 12 semaines -> se termine le dimanche 17 janvier 2027.
    expect(seed).toContain(
      "'Prépa Hyrox Bruxelles · bloc 1', 'Hyrox Bruxelles · Pro', '2026-10-26', 12",
    );
  });
});
