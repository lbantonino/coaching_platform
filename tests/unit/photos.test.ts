import { describe, expect, it } from "vitest";

import { checkPhoto, isPhotoPath, PHOTO_MAX_BYTES, photoUrl } from "@/features/photos/validate";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const ORG = "0a000000-0000-4000-8000-0000000000a1";

describe("checkPhoto", () => {
  it("reconnaît JPEG, PNG et WebP par leurs premiers octets", () => {
    expect(checkPhoto(jpeg)).toEqual({ ok: true, contentType: "image/jpeg", ext: "jpg" });
    expect(checkPhoto(png)).toMatchObject({ ok: true, ext: "png" });
    expect(checkPhoto(webp)).toMatchObject({ ok: true, ext: "webp" });
  });

  it("refuse un faux fichier image, un fichier vide ou trop lourd", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7 pas une image");
    expect(checkPhoto(pdf)).toEqual({
      ok: false,
      error: "Format non accepté : JPEG, PNG ou WebP.",
    });
    expect(checkPhoto(new Uint8Array())).toEqual({ ok: false, error: "Choisis une photo." });
    const heavy = new Uint8Array(PHOTO_MAX_BYTES + 1);
    heavy.set(jpeg);
    expect(checkPhoto(heavy)).toEqual({ ok: false, error: "Photo trop lourde : 2 Mo maximum." });
  });
});

describe("chemins des photos", () => {
  it("n'accepte que les dossiers d'organisation ou de compte", () => {
    const athlete = `org/${ORG}/athlete/da000000-0000-4000-8000-000000000003/abc-123.jpg`;
    expect(isPhotoPath(athlete)).toBe(true);
    expect(photoUrl(athlete)).toBe(`/photos/${athlete}`);
    expect(isPhotoPath(`user/${ORG}/photo.webp`)).toBe(true);
    expect(isPhotoPath(`org/${ORG}/../../secret.jpg`)).toBe(false);
    expect(isPhotoPath("autre/photo.jpg")).toBe(false);
    expect(photoUrl(null)).toBeNull();
  });
});
