// Repère ♀ / ♂ à côté du nom d'un sportif (D-25). Le symbole porte le sens (lu « Femme » / « Homme »
// par un lecteur d'écran) ; la couleur aide seulement à le repérer. Rien si le sexe n'est pas précisé.
const marks = {
  female: {
    symbol: "♀",
    label: "Femme",
    className: "bg-female-soft text-female",
    text: "text-female",
  },
  male: { symbol: "♂", label: "Homme", className: "bg-male-soft text-male", text: "text-male" },
} as const;

// `plain` (liste des sportifs, maquette du 03/11/2026) : le symbole seul, en couleur, sans pastille.
export function SexMark({
  sex,
  size = "md",
  plain = false,
}: {
  sex: "female" | "male" | "unspecified" | null;
  size?: "sm" | "md";
  plain?: boolean;
}) {
  if (sex !== "female" && sex !== "male") return null;
  const mark = marks[sex];
  if (plain) {
    return (
      <span
        role="img"
        aria-label={mark.label}
        title={mark.label}
        className={`shrink-0 text-[12px] leading-none font-medium ${mark.text}`}
      >
        {mark.symbol}
      </span>
    );
  }
  const box = size === "sm" ? "size-5 text-caption" : "size-7 text-title";
  return (
    <span
      role="img"
      aria-label={mark.label}
      title={mark.label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full leading-none font-semibold ${box} ${mark.className}`}
    >
      {mark.symbol}
    </span>
  );
}
