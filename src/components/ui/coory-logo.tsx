import { useId, type CSSProperties } from "react";

import { BRAND } from "@/config/brand";

// Logo Coory (COORY_LOGO.md) : « coory » en minuscules, les deux « o » remplacés par deux anneaux
// entrelacés (le coach et le sportif). Anneau gauche = couleur du texte, anneau droit = rouge.
// La « coupure » aux croisements doit être EXACTEMENT la couleur du fond derrière le logo.
type Tone = "theme" | "dark" | "red" | "light";

const tones: Record<Tone, { ink: string; ring: string; cut: string }> = {
  // Dans l'app : suit le thème actif. Le logo est toujours posé sur bg-bg (en-têtes, barre latérale).
  // accent-text = #FF3347 en sombre, #D91E32 en clair, comme le prévoit COORY_LOGO.md §3.
  theme: { ink: "currentColor", ring: "var(--accent-text)", cut: "var(--bg)" },
  // Couleurs fixes de la charte (e-mails, exports), indépendantes du thème.
  dark: { ink: "#F4F2EF", ring: "#FF3347", cut: "#0B0B0C" },
  red: { ink: "#FFFFFF", ring: "#FFFFFF", cut: "#FF3347" },
  light: { ink: "#141416", ring: "#D91E32", cut: "#F4F2EF" },
};

// Géométrie du §4 (unités de 1/1000 em, tirées du « o » de Geist SemiBold).
const LEFT = { cx: 262.5, cy: 279, rx: 198.5, ry: 215 } as const;
const RIGHT = { cx: 492.5, cy: 279, rx: 198.5, ry: 215 } as const;

function Rings({
  ink,
  ring,
  cut,
  className,
  style,
}: {
  ink: string;
  ring: string;
  cut: string;
  className?: string;
  style?: CSSProperties;
}) {
  // Identifiants uniques : sans eux, deux logos sur la même page partageraient le même masque.
  const id = useId();
  const top = `${id}-top`;
  const over = `${id}-over`;
  return (
    <svg viewBox="-4 -4 763 566" fill="none" aria-hidden className={className} style={style}>
      <defs>
        <clipPath id={top}>
          <rect x="262.5" y="-200" width="1200" height="479" />
        </clipPath>
        <clipPath id={over}>
          <rect x="258.5" y="-200" width="1200" height="485" />
        </clipPath>
      </defs>
      {/* 1. anneau droit (rouge) */}
      <ellipse {...RIGHT} stroke={ring} strokeWidth={128} />
      {/* 2. anneau gauche : halo de coupure dans la couleur du fond, puis l'anneau */}
      <ellipse {...LEFT} stroke={cut} strokeWidth={188} />
      <ellipse {...LEFT} stroke={ink} strokeWidth={128} />
      {/* 3. au croisement du haut, l'anneau droit repasse PAR-DESSUS l'anneau gauche */}
      <g clipPath={`url(#${top})`}>
        <ellipse {...RIGHT} stroke={cut} strokeWidth={188} />
      </g>
      <g clipPath={`url(#${over})`}>
        <ellipse {...RIGHT} stroke={ring} strokeWidth={128} />
      </g>
    </svg>
  );
}

// wordmark = « c » + anneaux + « ry » (17–20 px dans l'app, 22–26 px sur les écrans d'accueil)
// symbol = les anneaux seuls (icône, avatar). `size` = taille du texte, ou hauteur du symbole.
export function CooryLogo({
  variant = "wordmark",
  tone = "theme",
  size = 20,
}: {
  variant?: "wordmark" | "symbol";
  tone?: Tone;
  size?: number;
}) {
  const colors = tones[tone];
  const color = tone === "theme" ? undefined : colors.ink;

  if (variant === "symbol") {
    return (
      <span role="img" aria-label={BRAND.name} className="inline-flex text-text" style={{ color }}>
        <Rings {...colors} style={{ height: size, width: "auto" }} />
      </span>
    );
  }

  // role="img" + aria-label : un lecteur d'écran annonce « Coory », pas « c… r y ».
  return (
    <span
      role="img"
      aria-label={BRAND.name}
      className="inline-block leading-none font-semibold tracking-[-0.05em] whitespace-nowrap text-text"
      style={{ fontSize: size, color }}
    >
      c
      <Rings
        {...colors}
        className="inline-block h-[0.566em] w-[0.763em] align-[-0.016em]"
        style={{ margin: "0 -0.025em 0 0.025em" }}
      />
      ry
    </span>
  );
}
