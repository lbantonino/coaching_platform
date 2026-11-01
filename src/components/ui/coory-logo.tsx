import { BRAND } from "@/config/brand";

// Logo Coory (D-77, 01/11/2026) : le kit de marque d'Antonino, dans public/brand (lettres + le O de droite
// en violet #8B5CF6). Chaque dessin existe pour fond sombre et pour fond clair : le bon s'affiche selon le
// thème (classes brand-dark / brand-light, globals.css). Fichiers SVG servis tels quels : pas de
// recoloration, pas de déformation (règles du kit).
type Tone = "theme" | "dark" | "light";

const files = {
  wordmark: {
    dark: "/brand/logo/coory-logo-fond-sombre.svg",
    light: "/brand/logo/coory-logo-fond-clair.svg",
  },
  symbol: {
    dark: "/brand/icone/coory-icone-fond-sombre.svg",
    light: "/brand/icone/coory-icone-fond-clair.svg",
  },
  icon: {
    dark: "/brand/app-icon/coory-app-icon-noir.svg",
    light: "/brand/app-icon/coory-app-icon-blanc.svg",
  },
} as const;

// wordmark = le logo complet ; symbol = l'icône (les deux O) ; icon = la tuile d'application arrondie.
// `size` = la hauteur en px. `tone` : « theme » suit le thème actif ; « dark » / « light » imposent la
// version pour fond sombre / clair (e-mails, exports).
export function CooryLogo({
  variant = "wordmark",
  tone = "theme",
  size = 15,
}: {
  variant?: "wordmark" | "symbol" | "icon";
  tone?: Tone;
  size?: number;
}) {
  const set = files[variant];
  const image = (src: string, className = "") => (
    // SVG du kit servi tel quel : pas d'optimiseur d'images à faire tourner.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden style={{ height: size, width: "auto" }} className={className} />
  );
  return (
    <span role="img" aria-label={BRAND.name} className="inline-flex shrink-0 items-center">
      {tone === "theme" ? (
        <>
          {image(set.dark, "brand-dark")}
          {image(set.light, "brand-light")}
        </>
      ) : (
        image(set[tone])
      )}
    </span>
  );
}

// Filigrane des pages d'accès : l'icône Coory (les deux O) en une couleur, très atténuée par la classe
// passée (opacité). Décoratif.
export function CooryWatermark({ className }: { className: string }) {
  return (
    <span aria-hidden className={`pointer-events-none block ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/icone/coory-icone-mono-blanc.svg" alt="" className="brand-dark size-full" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/icone/coory-icone-mono-noir.svg" alt="" className="brand-light size-full" />
    </span>
  );
}
