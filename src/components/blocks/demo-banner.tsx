import { FlaskConical } from "lucide-react";

// Bandeau du compte de démonstration partagé (OPEN-24) : en tête de chaque page de l'espace coach,
// aligné sur l'en-tête de page. Les visiteurs de Synode savent que tout le monde voit ces données.
export function DemoBanner() {
  return (
    <p
      role="note"
      className="mx-3 mt-3 flex items-start gap-2.5 rounded-[14px] bg-status-warn-soft px-3.5 py-2.5 text-[13px] leading-[1.45] text-status-warn lg:mt-3.5 lg:mr-3.5 lg:ml-5 lg:items-center"
    >
      <FlaskConical aria-hidden size={16} strokeWidth={1.9} className="mt-px shrink-0 lg:mt-0" />
      <span>
        <strong className="font-semibold">Compte de démonstration partagé.</strong> N&apos;y mets
        aucune donnée réelle : tout est remis à zéro chaque nuit.
      </span>
    </p>
  );
}
