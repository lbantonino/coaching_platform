import { Info } from "lucide-react";

import { LEGAL } from "@/config/legal";

// Bandeau « Bêta privée » (maquette du 06/11/2026, D-139 ; texte du 20/11/2026, D-198) : pages
// légales et onglet « Légal » des Paramètres. Les textes sont complets mais n'ont pas encore été relus
// par un juriste : le bandeau le dit, sans les présenter comme validés.
export function ProvisionalNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-[14px] bg-notice px-4 py-3.5 inset-ring inset-ring-notice-line ${className}`}
    >
      <Info aria-hidden size={18} strokeWidth={2} className="mt-px shrink-0 text-notice-icon" />
      <p className="text-[13px] leading-[1.5] text-notice-text">
        <strong className="font-bold text-notice-strong">Bêta privée</strong> ({LEGAL.updatedOn}) :
        ces textes seront relus par un juriste avant l’ouverture au public.
      </p>
    </div>
  );
}
