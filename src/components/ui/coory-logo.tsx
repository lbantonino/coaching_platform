import type { CSSProperties } from "react";

import { BRAND } from "@/config/brand";

// Logo Coory (COORY_LOGO.md) : « C∞ry » en Space Grotesk Bold. Les deux « o » sont fusionnés en une seule
// boucle infinie, le lien continu entre le coach et son sportif. Lettres en couleur texte, SEULE la boucle
// est rouge.
type Tone = "theme" | "dark" | "red" | "light";

const tones: Record<Tone, { ink: string; loop: string }> = {
  // Dans l'app : suit le thème actif. --logo-loop = #FF3347 en sombre, #D91E32 en clair (COORY_LOGO.md §3).
  theme: { ink: "var(--text)", loop: "var(--logo-loop)" },
  // Couleurs fixes de la charte (e-mails, exports), indépendantes du thème.
  dark: { ink: "#F4F2EF", loop: "#FF3347" },
  red: { ink: "#FFFFFF", loop: "#FFFFFF" },
  light: { ink: "#141416", loop: "#D91E32" },
};

// Tracé de la boucle (§4), dessiné d'après le « o » de Space Grotesk Bold (unités de 1/1000 em) :
// deux arcs de 200 u reliés par deux courbes qui se pincent au centre.
const LOOP_PATH =
  "M390.6 108.8C440.4 150.6 510 166 566 166C622 166 691.6 150.6 741.4 108.8A200 200 0 1 1 741.4 415.2C691.6 373.4 622 358 566 358C510 358 440.4 373.4 390.6 415.2A200 200 0 1 1 390.6 108.8Z";

function Loop({
  color,
  className,
  style,
}: {
  color: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="-4 -4 1140 532" fill="none" aria-hidden className={className} style={style}>
      <path d={LOOP_PATH} stroke={color} strokeWidth={124} strokeLinejoin="round" />
    </svg>
  );
}

// Tuiles d'icône (§5) : boucle rouge sur graphite (principale), boucle blanche sur rouge (petites tailles).
const iconTiles = {
  dark: { background: "#0B0B0C", loop: "#FF3347" },
  red: { background: "#FF3347", loop: "#FFFFFF" },
};

// wordmark = « C » + boucle + « ry » ; `size` = taille du texte en px.
// symbol = la boucle seule ; `size` = sa hauteur en px.
// icon = tuile carrée arrondie (boucle sur graphite, ou sur rouge avec tone="red") ; `size` = son côté en px.
export function CooryLogo({
  variant = "wordmark",
  tone = "theme",
  size = 20,
}: {
  variant?: "wordmark" | "symbol" | "icon";
  tone?: Tone;
  size?: number;
}) {
  const colors = tones[tone];

  if (variant === "icon") {
    const tile = tone === "red" ? iconTiles.red : iconTiles.dark;
    return (
      <svg role="img" aria-label={BRAND.name} viewBox="0 0 1024 1024" width={size} height={size}>
        <rect width="1024" height="1024" rx="236" fill={tile.background} />
        <g transform="translate(164 350) scale(0.6108)">
          <path
            d={LOOP_PATH}
            fill="none"
            stroke={tile.loop}
            strokeWidth={124}
            strokeLinejoin="round"
          />
        </g>
      </svg>
    );
  }

  if (variant === "symbol") {
    return (
      <span role="img" aria-label={BRAND.name} className="inline-flex">
        <Loop color={colors.loop} style={{ height: size, width: "auto" }} />
      </span>
    );
  }

  // role="img" + aria-label : un lecteur d'écran annonce « Coory », pas « C… r y ».
  return (
    <span
      role="img"
      aria-label={BRAND.name}
      className="inline-block font-display leading-none font-bold tracking-[-0.03em] whitespace-nowrap"
      style={{ fontSize: size, color: colors.ink }}
    >
      C
      <Loop
        color={colors.loop}
        className="inline-block h-[0.532em] w-[1.14em] align-[-0.018em]"
        style={{ margin: "0 -0.018em 0 0.042em" }}
      />
      ry
    </span>
  );
}
