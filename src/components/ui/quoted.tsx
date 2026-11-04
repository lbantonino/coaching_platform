import type { ReactNode } from "react";

// Nom cité dans le texte d'une confirmation (kit des boîtes, famille confirmation) :
// « Hyrox Bruxelles » en 600, couleur du texte, guillemets insécables (jamais seuls en bout de ligne).
export function Quoted({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-text">«&nbsp;{children}&nbsp;»</strong>;
}
