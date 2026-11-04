import { photoUrl } from "@/features/photos/validate";

// Avatar (prompt Claude Design §4) : rond, photo de profil si elle existe (D-28), sinon initiales
// en 600 sur fond chip (≈ 33 % de la taille). Pastille ♀ / ♂ en bas à droite si le sexe est connu.
// Tailles : 2xs 24 (lignes compactes, D-77) · xs 28 (piles compactes) · sm 36 et md 40 (listes) · lg 52 (cartes) · xl 64 (fiche).
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

const boxes = {
  "2xs": "size-6 text-[9px]",
  xs: "size-7 text-[10px]",
  sm: "size-9 text-[12px]",
  md: "size-10 text-[13px]",
  // Menu du compte (kit, boîte 32).
  menu: "size-[46px] text-[15px]",
  // Paramètres (kit, 33) : carte du sommaire (58) et photo de profil (72).
  card: "size-[58px] text-[18px]",
  photo: "size-[72px] text-[22px]",
  lg: "size-[52px] text-[17px]",
  xl: "size-16 text-[21px]",
} as const;

// Pastille du sexe : 18 px (24 px à partir de lg), fond teinté posé sur le fond de page.
const marks = {
  female: {
    symbol: "♀",
    className: "text-female bg-[color-mix(in_srgb,var(--female)_22%,var(--bg))]",
  },
  male: { symbol: "♂", className: "text-male bg-[color-mix(in_srgb,var(--male)_22%,var(--bg))]" },
} as const;

export type AvatarSize = keyof typeof boxes;

// `colorClass` : fond teinté (ex. couleur de la discipline, D-24) ; les initiales restent en couleur texte.
// L'avatar est décoratif : le nom (et le sexe, via SexMark ou le texte) est toujours écrit à côté.
export function Avatar({
  name,
  size = "md",
  colorClass = "bg-chip",
  photoPath,
  sex,
}: {
  name: string;
  size?: AvatarSize;
  colorClass?: string;
  photoPath?: string | null;
  sex?: "female" | "male" | "unspecified" | null;
}) {
  const src = photoUrl(photoPath);
  const mark = sex === "female" || sex === "male" ? marks[sex] : null;
  const big = size === "lg" || size === "xl";
  return (
    <span aria-hidden className="relative inline-flex shrink-0">
      {src ? (
        // Image servie par notre route /photos avec la session de l'utilisateur : l'optimiseur de
        // next/image la demanderait sans cookies et serait refusé, d'où une balise img simple.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          className={`${boxes[size]} rounded-full object-cover`}
        />
      ) : (
        <span
          className={`${boxes[size]} ${colorClass} inline-flex items-center justify-center rounded-full font-semibold text-text`}
        >
          {initials(name)}
        </span>
      )}
      {mark ? (
        <span
          className={`absolute -right-0.5 -bottom-0.5 inline-flex items-center justify-center rounded-full border-2 border-bg leading-none font-bold ${
            big ? "size-6 text-[15px]" : "size-[18px] text-[11px]"
          } ${mark.className}`}
        >
          {mark.symbol}
        </span>
      ) : null}
    </span>
  );
}
