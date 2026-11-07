"use client";

import { Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import { inputClass } from "./form-styles";
import { PASSWORD_MIN_LENGTH, passwordStrength, STRENGTH_LABELS } from "./password-strength";

// Mot de passe avec bouton œil de 44 × 44 dans le champ (prompt §4 « PasswordInput »).
// Le libellé du bouton dit « caractères saisis » et non « mot de passe » : sinon getByLabel
// (« Mot de passe ») trouverait deux éléments, le champ et le bouton.
export function PasswordInput({
  shown,
  onToggle,
  withToggle = true,
  iconSize = 20,
  className = inputClass,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  shown: boolean;
  onToggle: () => void;
  withToggle?: boolean;
  // Pages d'entrée (maquettes du 06/11) : œil de 18 px.
  iconSize?: number;
  className?: string;
}) {
  return (
    <div className="relative">
      <input
        {...props}
        type={shown ? "text" : "password"}
        // Place de l'œil : sauf si la classe donnée la réserve déjà (champs des pages d'entrée).
        className={/(^|\s)pr-/.test(className) ? className : `${className} pr-14`}
      />
      {withToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={shown ? "Masquer les caractères saisis" : "Afficher les caractères saisis"}
          aria-pressed={shown}
          className="absolute top-1/2 right-[3px] flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:text-text"
        >
          {/* Œil barré : caractères cachés ; œil ouvert : caractères visibles (demande d'Antonino). */}
          {shown ? (
            <Eye aria-hidden size={iconSize} strokeWidth={1.7} />
          ) : (
            <EyeOff aria-hidden size={iconSize} strokeWidth={1.7} />
          )}
        </button>
      ) : null}
    </div>
  );
}

const segmentColor = ["bg-alert-fill", "bg-alert-fill", "bg-warn", "bg-ok", "bg-ok"] as const;
const textColor = ["text-alert", "text-alert", "text-warn", "text-ok", "text-ok"] as const;

// Jauge de robustesse : 4 segments de 4 px. Rouge (0–1), orange (2), vert (3–4).
export function PasswordGauge({ password }: { password: string }) {
  const score = passwordStrength(password);
  const empty = password.length === 0;
  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1" aria-hidden>
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1 rounded-[4px] transition-colors duration-200 ${
              !empty && segment <= Math.max(score, 1) ? segmentColor[score] : "bg-bar"
            }`}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className={`font-medium ${empty ? "text-muted" : textColor[score]}`}>
          Robustesse : {empty ? "—" : STRENGTH_LABELS[score]}
        </span>
        <span className="text-muted">{PASSWORD_MIN_LENGTH} caractères min.</span>
      </div>
    </div>
  );
}
