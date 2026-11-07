import { createLucideIcon } from "lucide-react";

// Illustrations et icônes des pages d'erreur (maquette « Coory Erreurs » du 06/11/2026, D-147),
// tracés repris tels quels de coory-design/COORY_ERRORS_DESIGN_HANDOFF/04_ASSETS. Seule différence
// avec les fichiers : le trait noir (#17151d) suit la couleur du texte (currentColor), pour rester
// visible en thème sombre ; en clair, le rendu est identique. Le violet reste celui de la marque.

// « 404 » : les deux 4 en traits droits, le 0 en pilule violette (le O du logo).
export function Illustration404({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 304 120" role="img" aria-label="404" className={`text-text ${className}`}>
      <g fill="none" strokeWidth="16">
        <path d="M20 8V64H84M68 8V112" stroke="currentColor" />
        <rect x="116" y="8" width="72" height="104" rx="36" className="stroke-violet" />
        <path d="M232 8V64H296M280 8V112" stroke="currentColor" />
      </g>
    </svg>
  );
}

// « 500 » : les deux maillons du logo séparés, trois éclats violets entre eux.
export function Illustration500({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 304 120"
      role="img"
      aria-label="Lien rompu"
      className={`text-text ${className}`}
    >
      <g fill="none" strokeWidth="16" strokeLinecap="round">
        <rect x="8" y="36" width="124" height="60" rx="30" stroke="currentColor" />
        <rect
          x="174"
          y="22"
          width="122"
          height="60"
          rx="30"
          transform="rotate(-10 235 52)"
          className="stroke-violet"
        />
      </g>
      <g strokeWidth="5" strokeLinecap="round" className="stroke-violet">
        <path d="M148 40l6-12M156 62h12M148 84l6 12" />
      </g>
    </svg>
  );
}

// Icônes des boutons (04_ASSETS/icons : flèches à petite pointe, rafraîchir).
export const ErrorArrowRight = createLucideIcon("CooryErrorArrowRight", [
  ["path", { d: "M5 12h14M13 6l6 6-6 6", key: "arrow" }],
]);
export const ErrorArrowLeft = createLucideIcon("CooryErrorArrowLeft", [
  ["path", { d: "M19 12H5M11 6l-6 6 6 6", key: "arrow" }],
]);
export const ErrorRefresh = createLucideIcon("CooryErrorRefresh", [
  ["path", { d: "M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5", key: "refresh" }],
]);
