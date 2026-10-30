// Vérification PURE d'une photo envoyée (D-28), testée par Vitest. On ne croit ni le nom du fichier
// ni le type annoncé par le navigateur : on lit les premiers octets (« signature » du format).

export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

export type PhotoFormat = { contentType: "image/jpeg" | "image/png" | "image/webp"; ext: string };
export type PhotoCheck = ({ ok: true } & PhotoFormat) | { ok: false; error: string };

function detectFormat(bytes: Uint8Array): PhotoFormat | null {
  const starts = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);
  if (starts(0xff, 0xd8, 0xff)) return { contentType: "image/jpeg", ext: "jpg" };
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { contentType: "image/png", ext: "png" };
  }
  // WebP : « RIFF » + taille sur 4 octets + « WEBP ».
  const webp = [0x57, 0x45, 0x42, 0x50];
  if (starts(0x52, 0x49, 0x46, 0x46) && webp.every((byte, i) => bytes[8 + i] === byte)) {
    return { contentType: "image/webp", ext: "webp" };
  }
  return null;
}

// `maxBytes` : 2 Mo pour une photo de profil, davantage pour la photo d'un exercice (D-76).
export function checkPhoto(bytes: Uint8Array, maxBytes = PHOTO_MAX_BYTES): PhotoCheck {
  if (bytes.length === 0) return { ok: false, error: "Choisis une photo." };
  if (bytes.length > maxBytes) {
    return { ok: false, error: `Photo trop lourde : ${maxBytes / (1024 * 1024)} Mo maximum.` };
  }
  const format = detectFormat(bytes);
  if (!format) return { ok: false, error: "Format non accepté : JPEG, PNG ou WebP." };
  return { ok: true, ...format };
}

// Une photo se sert uniquement depuis l'un de nos deux dossiers (jamais un chemin arbitraire).
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PATH = new RegExp(
  `^(org/${UUID}/athlete/[0-9a-z-]+|user/${UUID})/[0-9a-z-]+\\.(jpg|png|webp)$`,
  "i",
);

export function isPhotoPath(path: string): boolean {
  return PATH.test(path);
}

// Adresse de la photo dans l'app (servie par la route /photos après contrôle des droits).
export function photoUrl(path: string | null | undefined): string | null {
  return path && isPhotoPath(path) ? `/photos/${path}` : null;
}
