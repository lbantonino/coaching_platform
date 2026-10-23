import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

// Case à cocher et interrupteur (prompt Claude Design §4). Ce sont de vraies cases natives,
// cachées visuellement (sr-only) : clavier, formulaires et lecteurs d'écran fonctionnent sans
// JavaScript. Toute la ligne est cliquable (le <label> l'entoure).

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "className">;

const boxSizes = {
  md: "size-6 rounded-[7px]", // 24 px : formulaires
  list: "size-[26px] rounded-[8px]", // 26 px : listes (tâches)
  lg: "size-[30px] rounded-[9px]", // 30 px : mode actif du sportif
} as const;

export function Checkbox({
  label,
  size = "md",
  multiline = false,
  ...props
}: NativeProps & {
  label: ReactNode;
  size?: keyof typeof boxSizes;
  // Libellé sur plusieurs lignes (conditions d'utilisation) : case alignée sur la première ligne.
  multiline?: boolean;
}) {
  return (
    <label
      className={`group flex min-h-11 cursor-pointer gap-3 text-text ${
        multiline ? "items-start text-[14px] leading-normal" : "items-center text-[15px]"
      }`}
    >
      <input type="checkbox" {...props} className="peer sr-only" />
      <span
        aria-hidden
        className={`${boxSizes[size]} inline-flex shrink-0 items-center justify-center border-[1.5px] border-line-2 text-on-accent transition-colors duration-150 peer-checked:border-accent peer-checked:bg-accent peer-aria-invalid:border-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent [&>svg]:hidden peer-checked:[&>svg]:block`}
      >
        <Check size={size === "lg" ? 18 : 15} strokeWidth={3} />
      </span>
      <span className="min-w-0">{label}</span>
    </label>
  );
}

// Interrupteur 46 × 28 : fond « bar » → rouge, pastille blanche de 22 px, transition 200 ms.
export function Toggle({ label, ...props }: NativeProps & { label: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[14px] text-muted">
      <input type="checkbox" role="switch" {...props} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-7 w-[46px] shrink-0 rounded-pill bg-bar transition-colors duration-200 ease-coory peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-checked:[&>span]:translate-x-[18px]"
      >
        <span className="absolute top-[3px] left-[3px] size-[22px] rounded-full bg-white transition-transform duration-200 ease-coory" />
      </span>
      <span className="min-w-0">{label}</span>
    </label>
  );
}
