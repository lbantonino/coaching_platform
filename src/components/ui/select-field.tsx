import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

// Menu « bouton + chevron » des maquettes « Programmes » (D-156) : Type de séance, Type d'étape,
// Format du bloc, Allure en min/km, Catégorie, Heure. Un <select> natif dessiné comme la maquette :
// sur téléphone, il ouvre le sélecteur du système (le plus rapide au doigt), au clavier il marche seul.
// Mesures exactes : 44 px de haut (40 pour un filtre de liste), rayon 11, fond de carte et filet
// .12, 14 px à gauche, chevron 14 px gris à 12 px du bord ; texte 15/500 (14,5 pour « Type de séance »,
// 16 pour une allure, 13,5 pour un filtre). Choix actif : anneau violet 1,5 px.
// Téléphone : 16 px au moins, sinon iOS zoome sur la page au toucher (règle mobile-native, et
// « 16 px minimum sur mobile » du design system de la livraison).
export type SelectFieldSize = "md" | "lg" | "sm";

const SIZE: Record<SelectFieldSize, string> = {
  md: "h-11 text-[16px] lg:text-[15px]",
  lg: "h-11 text-[16px]",
  sm: "h-11 text-[16px] lg:h-10 lg:text-[13.5px]",
};

export function SelectField({
  size = "md",
  className = "",
  children,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: SelectFieldSize }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        {...props}
        className={`w-full min-w-0 cursor-pointer appearance-none truncate rounded-[11px] bg-surface pr-9 pl-3.5 leading-[normal] font-medium text-text inset-ring inset-ring-field-ring transition-shadow duration-150 focus:inset-ring-[1.5px] focus:inset-ring-violet focus:outline-none disabled:cursor-not-allowed disabled:text-faint ${SIZE[size]}`}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        size={14}
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
