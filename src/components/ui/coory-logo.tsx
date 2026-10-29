import type { CSSProperties } from "react";

import { BRAND } from "@/config/brand";

// Logo Coory : « C∞ry » en Space Grotesk Bold. Les deux « o » sont fusionnés en une seule boucle infinie,
// le lien continu entre le coach et son sportif. Graphite & Or (demande d'Antonino du 29/10/2026) : SEULE
// la boucle est en or ; les lettres C, r, y suivent le thème (blanc en graphite, noir en clair).
type Tone = "theme" | "dark" | "red" | "light";

const tones: Record<Tone, { ink: string; loop: string }> = {
  // Dans l'app : suit le thème actif. --logo-loop = or #E2C47A en graphite, or ancien #C9A24A en clair.
  theme: { ink: "var(--text)", loop: "var(--logo-loop)" },
  // Couleurs fixes de la charte (e-mails, exports), indépendantes du thème.
  dark: { ink: "#F5F5F2", loop: "#E2C47A" },
  red: { ink: "#141518", loop: "#141518" },
  light: { ink: "#141518", loop: "#C9A24A" },
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

// Tuiles d'icône : boucle or sur graphite (principale), boucle graphite sur or (petites tailles).
const iconTiles = {
  dark: { background: "#141518", loop: "#E2C47A" },
  red: { background: "#E2C47A", loop: "#141518" },
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
      className="inline-block font-logo leading-none font-bold tracking-[-0.03em] whitespace-nowrap"
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

// Filigrane des pages d'accès (COORY_AUTH_PAGES.md) : la boucle seule, couleur du texte très atténuée
// (via la classe passée), décorative. Même tracé que le logo.
export function CooryWatermark({ className }: { className: string }) {
  return <Loop color="currentColor" className={`pointer-events-none ${className}`} />;
}
