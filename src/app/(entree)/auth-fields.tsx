"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

// Champs des pages d'accès (COORY_AUTH_PAGES.md §5) : couleurs du projet uniquement.

export const authLabelClass = "text-[13px] font-medium text-text";
export const authLinkClass = "border-b border-accent pb-px text-text";

// Champ : 46 px à l'inscription (ordinateur), 50 px à la connexion, 48 px sur téléphone.
// Erreur : contour rouge + message sous le champ.
export function authInputClass(size: "login" | "signup", extra = "") {
  const box =
    size === "login" ? "h-[50px] text-[15px]" : "h-12 text-[15px] lg:h-[46px] lg:text-[14px]";
  return `${box} w-full rounded-[12px] border border-line bg-surface px-4 text-text placeholder:text-faint outline-none transition-colors focus:border-accent aria-[invalid=true]:border-accent ${extra}`;
}

export function Field({
  id,
  label,
  optional = false,
  aside,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  optional?: boolean;
  aside?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className={authLabelClass}>
          {label}
          {optional ? <span className="font-normal text-faint italic"> (facultatif)</span> : null}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[12px] font-medium text-accent-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Mot de passe avec bouton œil dans le champ (un seul état partagé avec la confirmation).
export function PasswordInput({
  shown,
  onToggle,
  withToggle = true,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  shown: boolean;
  onToggle: () => void;
  withToggle?: boolean;
  className: string;
}) {
  return (
    <div className="relative">
      <input {...props} type={shown ? "text" : "password"} className={`${className} pr-12`} />
      {withToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={shown ? "Masquer les caractères saisis" : "Afficher les caractères saisis"}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted hover:text-text"
        >
          {/* Œil barré : caractères cachés ; œil ouvert : caractères visibles (demande d'Antonino). */}
          {shown ? (
            <Eye aria-hidden size={18} strokeWidth={1.7} />
          ) : (
            <EyeOff aria-hidden size={18} strokeWidth={1.7} />
          )}
        </button>
      ) : null}
    </div>
  );
}

// Jauge de longueur (règle existante : 10 caractères minimum).
export function PasswordGauge({ length, min }: { length: number; min: number }) {
  const ok = length >= min;
  const color = length === 0 ? "bg-faint" : ok ? "bg-ok" : "bg-accent";
  const text = length === 0 ? "text-faint" : ok ? "text-ok" : "text-accent-text";
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-1 flex-1 overflow-hidden rounded-[4px] bg-bar">
        <span
          className={`block h-full rounded-[4px] transition-[width,background-color] duration-250 ${color}`}
          style={{ width: `${Math.min(100, length * 10)}%` }}
        />
      </span>
      <span className={`font-mono text-[11px] tabular ${text}`}>
        {ok ? "✓ OK" : `${length} / ${min}`}
      </span>
    </div>
  );
}

// Case des conditions : toute la ligne est cliquable ; cochée = fond rouge et ✓ blanc.
export function TermsCheckbox({
  checked,
  onChange,
  error,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="group flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-muted">
        <input
          type="checkbox"
          name="terms"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="mt-0.5 inline-flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border border-line-2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent lg:size-5"
        >
          {checked ? <Check size={14} strokeWidth={3} className="text-on-accent" /> : null}
        </span>
        <span>{children}</span>
      </label>
      {error ? (
        <p role="alert" className="text-[12px] font-medium text-accent-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Bouton principal (une seule action rouge par écran), flèche après le libellé.
export function SubmitButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-accent text-[16px] font-semibold text-on-accent transition-[background-color,scale] duration-150 hover:bg-accent-hover active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-accent disabled:active:scale-100 lg:h-[52px] lg:rounded-[13px] lg:text-[15px]"
    >
      {children}
      <span aria-hidden className="text-[17px]">
        →
      </span>
    </button>
  );
}
