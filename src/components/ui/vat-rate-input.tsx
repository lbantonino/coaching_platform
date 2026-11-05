"use client";

import { inputClass } from "@/components/ui/form-styles";

// Taux de TVA LIBRE (D-69) : le coach écrit le sien (21, 20, 8,1, 5,5…), pré-rempli avec le taux
// habituel de sa structure. Coory ne tient aucune liste de taux par pays (D-66). Le « % » est
// affiché dans le champ ; le serveur revérifie (0 à 100, 2 décimales).
export function VatRateInput({
  id,
  name = "vatRate",
  value,
  onChange,
  describedBy,
  className = `${inputClass} pr-10 font-mono`,
  disabled = false,
}: {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  describedBy?: string;
  // Habillage du champ (Paramètres du kit « Coory Pages », page 13) ; garder la place du « % ».
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        inputMode="decimal"
        autoComplete="off"
        placeholder="21"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
        disabled={disabled}
        className={className}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted"
      >
        %
      </span>
    </div>
  );
}
