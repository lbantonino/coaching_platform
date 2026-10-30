import { describe, expect, it } from "vitest";

import {
  isExercisePhotoPath,
  parseCoachExerciseForm,
  parseVideoUrl,
  readCoachExerciseForm,
  videoPlatform,
} from "@/domain/exercises/coach-exercise";
import { muscleInfo } from "@/domain/exercises/vocabulary";
import { checkPhoto } from "@/features/photos/validate";

// « Créer un exercice » (D-76) : formulaire, lien vidéo, chemin de la photo.
const valid = {
  name: "  Gainage   planche  sur ballon ",
  category: "mobility",
  muscleGroups: ["abs", "abs", "lower_back"],
  equipment: "stability_ball",
  instructions: "1. Pose les avant-bras sur le ballon.\n\n- Garde le dos droit.\n",
  videoUrl: " https://www.instagram.com/reel/abc123/ ",
};

describe("formulaire d'un exercice du coach", () => {
  it("nettoie et garde les valeurs", () => {
    const result = parseCoachExerciseForm(valid);
    expect(result).toEqual({
      ok: true,
      values: {
        nameFr: "Gainage planche sur ballon",
        category: "mobility",
        primaryMuscles: ["abs", "lower_back"],
        equipment: ["stability_ball"],
        bodyweight: false,
        instructions: ["Pose les avant-bras sur le ballon.", "Garde le dos droit."],
        videoUrl: "https://www.instagram.com/reel/abc123/",
      },
    });
  });

  it("sans matériel, c'est au poids du corps", () => {
    const result = parseCoachExerciseForm({ ...valid, equipment: "" });
    expect(result.ok && result.values).toMatchObject({ equipment: [], bodyweight: true });
  });

  it("refuse un nom vide, une rubrique, un muscle ou un matériel inconnus", () => {
    expect(parseCoachExerciseForm({ ...valid, name: "  " })).toEqual({
      ok: false,
      error: "Donne un nom à l'exercice.",
    });
    expect(parseCoachExerciseForm({ ...valid, category: "yoga" }).ok).toBe(false);
    expect(parseCoachExerciseForm({ ...valid, muscleGroups: ["coeur"] }).ok).toBe(false);
    expect(parseCoachExerciseForm({ ...valid, equipment: "laser" }).ok).toBe(false);
  });

  it("15 consignes au plus", () => {
    const many = Array.from({ length: 16 }, (_, i) => `Consigne ${i + 1}`).join("\n");
    expect(parseCoachExerciseForm({ ...valid, instructions: many }).ok).toBe(false);
  });

  it("lit un vrai formulaire (plusieurs groupes cochés)", () => {
    const form = new FormData();
    form.set("name", "Planche");
    form.set("category", "strength");
    form.append("muscles", "abs");
    form.append("muscles", "shoulders");
    expect(readCoachExerciseForm(form)).toMatchObject({
      name: "Planche",
      muscleGroups: ["abs", "shoulders"],
    });
  });

  it("un groupe choisi par le coach a son libellé", () => {
    expect(muscleInfo.glutes).toEqual({ label: "Fessiers", group: "glutes" });
    expect(muscleInfo.gluteus_maximus.group).toBe("glutes");
  });
});

describe("lien vidéo", () => {
  it("facultatif ; https seulement", () => {
    expect(parseVideoUrl("")).toEqual({ ok: true, url: null });
    expect(parseVideoUrl("http://youtube.com/watch?v=1").ok).toBe(false);
    expect(parseVideoUrl("javascript:alert(1)").ok).toBe(false);
    expect(parseVideoUrl("https://exemple com").ok).toBe(false);
  });

  it("reconnaît la plateforme", () => {
    expect(videoPlatform("https://youtu.be/abc")).toBe("YouTube");
    expect(videoPlatform("https://www.youtube.com/watch?v=abc")).toBe("YouTube");
    expect(videoPlatform("https://www.instagram.com/reel/abc/")).toBe("Instagram");
    expect(videoPlatform("https://vm.tiktok.com/abc")).toBe("TikTok");
    expect(videoPlatform("https://notyoutube.com/abc")).toBeNull();
  });
});

describe("photo d'un exercice", () => {
  it("se sert seulement depuis le dossier d'une organisation", () => {
    const org = "aaaaaaaa-0000-4000-8000-000000000001";
    const file = "bbbbbbbb-0000-4000-8000-000000000002";
    expect(isExercisePhotoPath(`org/${org}/${file}.jpg`)).toBe(true);
    expect(isExercisePhotoPath(`org/${org}/../secret.jpg`)).toBe(false);
    expect(isExercisePhotoPath(`user/${org}/${file}.jpg`)).toBe(false);
  });

  it("jusqu'à 5 Mo, au lieu de 2 pour une photo de profil", () => {
    const jpeg = new Uint8Array(3 * 1024 * 1024);
    jpeg.set([0xff, 0xd8, 0xff]);
    expect(checkPhoto(jpeg).ok).toBe(false);
    expect(checkPhoto(jpeg, 5 * 1024 * 1024)).toMatchObject({ ok: true, ext: "jpg" });
  });
});
