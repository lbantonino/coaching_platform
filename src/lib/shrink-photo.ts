// Réduction d'une photo DANS LE NAVIGATEUR, avant l'envoi (demande d'Antonino du 14/11/2026) : une
// photo de téléphone (3552 × 4879, plusieurs Mo) dépassait la limite d'un envoi sur Vercel (4,5 Mo)
// et menait à une page d'erreur. Partagée par la photo de profil et la photo d'un exercice.
// Les deux règles de calcul sont pures (Vitest) ; le dessin sur un canvas est vérifié par Playwright.

// Au-delà de ce poids, une photo est réencodée même si ses dimensions sont déjà petites.
const HEAVY_BYTES = 1024 * 1024;

// Dimensions qui tiennent dans un carré de `maxSide` pixels, sans déformer ni agrandir.
export function fitWithin(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale), scale };
}

export const needsShrink = (scale: number, bytes: number) => scale < 1 || bytes >= HEAVY_BYTES;

// Photo réduite (JPEG, qualité 0,85), ou le fichier d'origine s'il est déjà petit ou si le
// navigateur ne sait pas le lire (le serveur dira alors quel format est accepté). `background` :
// couleur posée sous une image transparente (le JPEG n'a pas de transparence).
export async function shrinkPhoto(
  file: File,
  { maxSide, background = "#ffffff" }: { maxSide: number; background?: string },
): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = fitWithin(bitmap.width, bitmap.height, maxSide);
    if (!needsShrink(size.scale, file.size)) return file;
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}
