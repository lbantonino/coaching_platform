import { photoUrl } from "@/features/photos/validate";

// Avatar (design system §6) : photo de profil si elle existe (D-28), sinon initiales sur fond chip,
// police ≈ 34 % de la taille, poids 600.
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

const boxes = {
  sm: "size-7 text-micro",
  md: "size-[34px] text-caption",
  lg: "size-16 text-[22px]",
} as const;

// `colorClass` : fond teinté (ex. couleur de la discipline, D-24) ; les initiales restent en couleur texte.
// L'avatar est décoratif : le nom est toujours écrit à côté.
export function Avatar({
  name,
  size = "md",
  colorClass = "bg-chip",
  photoPath,
}: {
  name: string;
  size?: keyof typeof boxes;
  colorClass?: string;
  photoPath?: string | null;
}) {
  const src = photoUrl(photoPath);
  if (src) {
    return (
      // Image servie par notre route /photos avec la session de l'utilisateur : l'optimiseur de
      // next/image la demanderait sans cookies et serait refusé, d'où une balise img simple.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        className={`${boxes[size]} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${boxes[size]} ${colorClass} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-text`}
    >
      {initials(name)}
    </span>
  );
}
