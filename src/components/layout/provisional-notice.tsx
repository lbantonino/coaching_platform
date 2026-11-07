import { Info } from "lucide-react";

import { LEGAL } from "@/config/legal";

// Bandeau « Version provisoire » (maquette du 06/11/2026, D-139) : pages légales et onglet « Légal »
// des Paramètres. Rien n'est présenté comme validé tant qu'un juriste n'a pas relu.
export function ProvisionalNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-[14px] bg-notice px-4 py-3.5 inset-ring inset-ring-notice-line ${className}`}
    >
      <Info aria-hidden size={18} strokeWidth={2} className="mt-px shrink-0 text-notice-icon" />
      <p className="text-[13px] leading-[1.5] text-notice-text">
        <strong className="font-bold text-notice-strong">Version provisoire</strong> (
        {LEGAL.updatedOn}), à faire relire et valider par un juriste avant toute mise en ligne
        publique. Les passages entre crochets sont à compléter.
      </p>
    </div>
  );
}
