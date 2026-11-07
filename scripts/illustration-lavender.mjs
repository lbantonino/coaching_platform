// Fond lavande des illustrations RepDB (maquette « Bibliothèque » du 06/11/2026, D-142) : le ciel bleu
// clair d'origine devient la lavande #EEE9FC ; le personnage, le matériel, les ombres au sol et les
// blancs ne changent pas. Licence RepDB, terme 4 : recolorer une image pour l'application est permis
// (simple calcul de couleur, aucune IA). Règle relevée sur les images de la maquette (04_ASSETS) :
// - un pixel proche du bleu du fond (le plus fréquent de l'image) est décalé de « lavande − fond »,
//   ce qui garde ses petites nuances ; le décalage s'efface entre 10 et 30 d'écart (bords adoucis
//   entre le ciel et le personnage) ;
// - le halo très clair du ciel (bleu presque blanc) devient la lavande unie.
import sharp from "sharp";

export const LAVENDER = [238, 233, 252]; // #EEE9FC

const FULL = 10; // écart au fond (distance RGB) en dessous duquel le décalage est complet
const NONE = 30; // écart au-delà duquel le pixel ne bouge plus

function hueLightSat(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  if (max === min) return [0, l, 0];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, l, s];
}

// Halo du ciel : bleu (180 à 235°), très clair, nettement teinté (un blanc neutre ne bouge pas).
const isSkyGlow = (r, g, b) => {
  const [h, l, s] = hueLightSat(r, g, b);
  return h >= 180 && h <= 235 && l >= 0.9 && s >= 0.5 && b - r >= 3;
};

// Pixels bruts RGB(A) → mêmes pixels, fond recoloré. `channels` vaut 3 ou 4.
export function recolorPixels(data, channels, width) {
  const counts = new Map();
  for (let i = 0; i < data.length; i += channels) {
    if (channels === 4 && data[i + 3] < 255) continue;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let bgKey = 0;
  let best = -1;
  for (const [key, n] of counts) if (n > best) [bgKey, best] = [key, n];
  const bg = [(bgKey >> 16) & 255, (bgKey >> 8) & 255, bgKey & 255];
  // Garde-fou : une image sans ciel bleu (fond blanc, transparent…) reste telle quelle.
  if (!(bg[2] > bg[0] && hueLightSat(...bg)[1] >= 0.8)) return { data, changed: false, bg };
  const shift = LAVENDER.map((v, k) => v - bg[k]);
  const pixels = data.length / channels;
  const distOf = (p) => {
    const i = p * channels;
    return Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
  };
  // Seul le ciel RELIÉ au fond change (comme un pot de peinture) : les reflets bleutés d'une basket
  // blanche, entourés du contour du dessin, restent blancs.
  const sky = new Uint8Array(pixels);
  const queue = new Int32Array(pixels);
  let head = 0;
  let tail = 0;
  for (let p = 0; p < pixels; p += 1) {
    if (distOf(p) <= FULL) {
      sky[p] = 1;
      queue[tail++] = p;
    }
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    for (const q of [p - width, p + width, x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1]) {
      if (q < 0 || q >= pixels || sky[q]) continue;
      const i = q * channels;
      if (distOf(q) < NONE || isSkyGlow(data[i], data[i + 1], data[i + 2])) {
        sky[q] = 1;
        queue[tail++] = q;
      }
    }
  }
  const out = Buffer.from(data);
  for (let p = 0; p < pixels; p += 1) {
    if (!sky[p]) continue;
    const i = p * channels;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const dist = distOf(p);
    let next;
    if (dist <= FULL) next = [r + shift[0], g + shift[1], b + shift[2]];
    else if (isSkyGlow(r, g, b)) next = LAVENDER;
    else {
      const w = Math.max(0, (NONE - dist) / (NONE - FULL));
      next = [r + w * shift[0], g + w * shift[1], b + w * shift[2]];
    }
    for (let k = 0; k < 3; k += 1) out[i + k] = Math.max(0, Math.min(255, Math.round(next[k])));
  }
  return { data: out, changed: true, bg };
}

// Fichier image → WebP au fond lavande (même taille). Renvoie false si l'image n'a pas de ciel bleu.
export async function toLavenderWebp(input, output, { quality = 90 } = {}) {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const result = recolorPixels(data, info.channels, info.width);
  await sharp(result.data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .webp({ quality })
    .toFile(output);
  return result.changed;
}
