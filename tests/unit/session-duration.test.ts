import { describe, expect, it } from "vitest";

import { estimatedSessionSeconds, withEstimatedDuration } from "@/domain/training/session-duration";
import type { SessionDraft } from "@/domain/training/session-v2";

import { hyrox, running, strength } from "./pdf-fixtures";

// Durée estimée des séances (décision d'Antonino du 10/11, phase 4) : calculée d'après le contenu
// dans les trois disciplines, et le coach peut la corriger ; une durée corrigée ne bouge plus.
const draftOf = (session: ReturnType<typeof running>, extra: Partial<SessionDraft> = {}) =>
  ({ ...session, key: "s1", ...extra }) as SessionDraft;

describe("estimatedSessionSeconds", () => {
  it("Running : la somme des étapes (15 min + 5 × (800 m à 4:35 + 1:30) + 10 min)", () => {
    // 800 m à 4:35/km (milieu de 4:30–4:40) = 220 s ; 5 × (220 + 90) = 1550 ; + 900 + 600.
    expect(estimatedSessionSeconds(running(50).content)).toBe(3050);
  });

  it("Musculation : séries (≈ 4 s par répétition) et repos, superset par tour, EMOM, échauffement", () => {
    // Échauffement 10 min + retour au calme 5 min = 900 ; squat 4 × 6 (repos 2:30) = 606 ;
    // SDT roumain 3 × 8 = 456 ; superset 3 tours (fentes 10, hip thrust 12, repos 1:30) = 504 ;
    // EMOM 10 min = 660.
    expect(estimatedSessionSeconds(strength(40).content)).toBe(3126);
  });

  it("Hyrox : temps cibles ou allures, temps de course de référence des stations, tours et repos", () => {
    // Échauffement run 1 km à 6:00 = 360 ; circuit 3 tours : run 1 km à 5:30 (330), sled push
    // 50 m (180), burpees broad jumps 40 m (135), SkiErg 500 m à 2:10 (130), transition 30 s
    // = 805 par tour ; 3 × 805 + 2 × 90 de repos = 2595.
    expect(estimatedSessionSeconds(hyrox(3).content)).toBe(2955);
  });

  it("une séance hybride (texte) n'a pas d'estimation", () => {
    expect(
      estimatedSessionSeconds({
        discipline: "hybrid",
        items: [{ id: "t1", kind: "text", title: "Circuit", lines: ["5 tours"] }],
      }),
    ).toBeNull();
  });
});

describe("withEstimatedDuration", () => {
  it("met la durée à jour d'après le contenu, arrondie à la minute", () => {
    expect(withEstimatedDuration(draftOf(strength(40))).durationMinutes).toBe(52);
    expect(withEstimatedDuration(draftOf(hyrox(3))).durationMinutes).toBe(49);
  });

  it("une durée corrigée par le coach ne bouge plus", () => {
    const manual = draftOf(strength(40), { durationMinutes: 75, durationManual: true });
    expect(withEstimatedDuration(manual).durationMinutes).toBe(75);
  });

  it("sans estimation possible, la durée reste celle de la séance", () => {
    const text = {
      ...draftOf(running(50)),
      content: {
        discipline: "hybrid" as const,
        items: [{ id: "t1", kind: "text" as const, title: "Circuit", lines: ["5 tours"] }],
      },
    };
    expect(withEstimatedDuration(text).durationMinutes).toBe(50);
  });
});
