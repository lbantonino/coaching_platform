// Repère ♀ / ♂ à côté du nom d'un sportif (D-25). Le symbole porte le sens (lu « Femme » / « Homme »
// par un lecteur d'écran) ; la couleur aide seulement à le repérer. Rien si le sexe n'est pas précisé.
const marks = {
  female: { symbol: "♀", label: "Femme", className: "bg-female-soft text-female" },
  male: { symbol: "♂", label: "Homme", className: "bg-male-soft text-male" },
} as const;

export function SexMark({
  sex,
  size = "md",
}: {
  sex: "female" | "male" | "unspecified" | null;
  size?: "sm" | "md";
}) {
  if (sex !== "female" && sex !== "male") return null;
  const mark = marks[sex];
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
