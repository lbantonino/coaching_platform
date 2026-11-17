import type { ReactNode } from "react";

// Étiquette (demande d'Antonino du 16/11/2026, plus aucune pastille dans l'app) : un petit RECTANGLE aux
// coins arrondis, fond teinté et texte de la même couleur, jamais une capsule (bords en demi-cercle) ni
// un point devant. Discipline (« Hyrox »), statut (« Actif »), état (« Publié v1 »). Pur balisage :
// utilisable dans un composant serveur comme client.
export const tagClass =
  "inline-flex h-6 shrink-0 items-center rounded-[6px] px-2 text-[12px] leading-[normal] font-semibold whitespace-nowrap";

export function Tag({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`${tagClass} ${className}`}>{children}</span>;
}
