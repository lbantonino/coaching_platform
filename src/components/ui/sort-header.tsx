// En-tête de colonne triable des tableaux (kit « Coory Pages » : Documents 05, puis Comptabilité 04,
// D-120). Le libellé (11,5 / 500, espacé de 0,02 em) et deux petits triangles de 9 × 12 : le sens en
// cours en violet, l'autre gris clair. Libellé en encre quand la colonne trie la liste, gris sinon.
// La cellule porte role="columnheader" et aria-sort : un lecteur d'écran annonce le tri en cours.
export type SortDirection = "asc" | "desc";

export function SortHeader({
  label,
  active,
  direction,
  onToggle,
  className = "",
}: {
  label: string;
  // Cette colonne trie la liste en ce moment.
  active: boolean;
  direction: SortDirection;
  onToggle: () => void;
  className?: string;
}) {
  const sort = active ? (direction === "asc" ? "ascending" : "descending") : "none";
  const arrow = (on: boolean) =>
    `transition-[fill] duration-150 ${on ? "fill-violet-text" : "fill-dlg-disabled"}`;
  return (
    <div role="columnheader" aria-sort={sort} className={`flex min-w-0 ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-[5px] rounded-[4px] text-[11.5px] leading-[normal] font-medium tracking-[0.02em] transition-colors duration-150 hover:text-text ${
          active ? "text-text" : "text-faint"
        }`}
      >
        {label}
        <svg aria-hidden width="9" height="12" viewBox="0 0 9 12" className="shrink-0">
          <path d="M4.5 0L8.5 4.5H.5z" className={arrow(active && direction === "asc")} />
          <path d="M4.5 12L.5 7.5h8z" className={arrow(active && direction === "desc")} />
        </svg>
      </button>
    </div>
  );
}
