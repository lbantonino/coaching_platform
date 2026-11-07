import { ArrowLeft, Check, CircleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { InputHTMLAttributes, ReactNode } from "react";

import { FieldError } from "@/components/ui/field";

// Briques des pages d'entrée, d'après les maquettes d'Antonino du 06/11/2026
// (coory-design/COORY_AUTH_DESIGN_HANDOFF, D-139) : titre au point violet, champ à icône, case
// « Se souvenir de moi », bouton principal, liens légaux, « copilote IA » étoilé. Les couleurs
// passent par les jetons (famille des fenêtres --dlg-*, qui reprend la palette de la maquette).
// Mobile d'abord : classes de base pour le téléphone, `lg:` pour l'ordinateur.

// Point final violet des titres (« Connexion. », « Créer ton compte. »).
export function TitleDot() {
  return <span className="text-violet">.</span>;
}

// Titre de page (h1) et phrase dessous. Le point violet est ajouté, sauf si le titre se termine déjà
// par une ponctuation (« ? », « ! »).
export function EntryTitle({
  children,
  sub,
  dot = true,
  size = "md",
  className = "",
  subClassName = "",
}: {
  children: ReactNode;
  sub?: ReactNode;
  dot?: boolean;
  subClassName?: string;
  // « md » : connexion (38 px sur ordinateur) ; « sm » : inscription et bienvenue (36 px).
  size?: "md" | "sm";
  className?: string;
}) {
  const md = size === "md";
  return (
    <div className={`flex flex-col ${md ? "gap-1.5 lg:gap-2" : "gap-[7px]"} ${className}`}>
      <h1
        className={`text-[30px] leading-[1.05] font-extrabold tracking-[-0.04em] text-balance text-text ${
          md ? "lg:text-[38px]" : "lg:text-[36px]"
        }`}
      >
        {children}
        {dot ? <TitleDot /> : null}
      </h1>
      {sub ? (
        <p
          className={`text-[14.5px] text-muted ${
            md ? "leading-[normal] lg:text-[15px]" : "leading-[1.45]"
          } ${subClassName}`}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

// Pastille de 56 px en tête des pages d'accès sans maquette (e-mail envoyé, lien invalide…).
const iconTones = {
  accent: "bg-dlg-accent-tile text-violet-text",
  ok: "bg-ok-soft text-ok",
} as const;

export function EntryIcon({
  icon: Icon,
  tone = "accent",
}: {
  icon: LucideIcon;
  tone?: keyof typeof iconTones;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-14 items-center justify-center rounded-[16px] ${iconTones[tone]}`}
    >
      <Icon size={26} strokeWidth={1.8} />
    </span>
  );
}

// Erreur générale du formulaire (identifiants refusés, champs à corriger…) : bandeau d'alerte de l'app.
export function FormAlert({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div
      id={id}
      role="alert"
      className="flex items-start gap-3 rounded-[12px] border border-alert/40 bg-alert-soft px-3.5 py-3 text-[14px] leading-normal text-text"
    >
      <CircleAlert aria-hidden size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-alert" />
      <span>{children}</span>
    </div>
  );
}

// Carte d'information (rayon 16) ; `tone="ok"` : confirmation en vert.
export function InfoCard({ tone, children }: { tone?: "ok"; children: ReactNode }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[16px] border p-[18px] ${
        tone === "ok" ? "border-ok-line bg-ok-soft" : "border-line bg-dlg-field"
      }`}
    >
      {children}
    </div>
  );
}

export function InfoRow({
  icon: Icon,
  iconClassName = "text-muted",
  children,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-[14px] leading-normal">
      <Icon
        aria-hidden
        size={17}
        strokeWidth={1.8}
        className={`mt-0.5 shrink-0 ${iconClassName}`}
      />
      <span>{children}</span>
    </div>
  );
}

export function EntryBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 self-start text-[14px] text-muted transition-colors duration-150 hover:text-text"
    >
      <ArrowLeft aria-hidden size={16} strokeWidth={1.8} />
      {children}
    </Link>
  );
}

// Bouton principal pleine largeur : 52 px rayon 13 (téléphone), rayon 12 sur ordinateur (50 px à la
// connexion, 48 px à l'inscription), noir en clair et blanc en sombre (--cta, règle de la charte).
// Désactivé : opacité 0,4 (maquette).
const entryPrimaryBase =
  "flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[13px] bg-cta text-[15.5px] font-bold text-on-cta transition-[background-color,opacity,scale] duration-150 hover:bg-cta-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cta disabled:active:scale-100 lg:rounded-[12px] lg:text-[15px]";
export const entryPrimaryClass = `${entryPrimaryBase} h-[52px] lg:h-[50px]`;
export const entryPrimaryCompactClass = `${entryPrimaryBase} h-[52px] lg:h-12`;
// Bienvenue : 54 px sur téléphone (maquette 03).
export const entryPrimaryTallClass = `${entryPrimaryBase} h-[54px] lg:h-[50px]`;

// Colonne de la bienvenue : mêmes marges que l'inscription sur téléphone ; sur ordinateur, la moitié
// de l'écran, contenu centré sur 432 px (largeur de la maquette).
export const welcomeColumnClass =
  "px-[26px] pt-[max(53px,calc(env(safe-area-inset-top)+20px))] pb-7 lg:px-16 lg:pt-[38px] lg:pb-10";
export const welcomeContentClass = "lg:max-w-[432px] lg:gap-[22px]";

// Bouton secondaire (« Continuer avec Google », « Renvoyer l'e-mail ») : blanc à filet fin.
export const entrySecondaryClass =
  "flex h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[13px] bg-dlg text-[15px] font-semibold text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-dlg-field disabled:cursor-not-allowed disabled:opacity-60 lg:h-[50px] lg:rounded-[12px] lg:text-[14.5px]";

// Lien dans le texte (« Créer un compte », « Se connecter », « Mot de passe oublié ? »).
export const entryLinkClass =
  "font-bold text-violet-text transition-colors duration-150 hover:text-violet";

// Liens légaux : sous le formulaire sur téléphone ; sur ordinateur, dans l'image de droite (6a, 6b).
// Gris #64626e (--muted) plutôt que le #8a8896 de la maquette, trop pâle (accessibilité, D-139).
export function AuthLegalLinks({ className = "" }: { className?: string }) {
  const link = "text-muted transition-colors duration-150 hover:text-text";
  return (
    <nav
      aria-label="Informations légales"
      className={`flex justify-center gap-[18px] text-[12px] font-medium ${className}`}
    >
      <Link href="/conditions" className={link}>
        Conditions
      </Link>
      <Link href="/confidentialite" className={link}>
        Confidentialité
      </Link>
      <Link href="/mentions-legales" className={link}>
        Mentions légales
      </Link>
    </nav>
  );
}

// Étoile à 4 branches de l'assistant IA (tracé de la maquette).
export function Spark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2L12 2.5z" />
    </svg>
  );
}

// Champ à icône : libellé visible sur ordinateur (600 13 px), caché à l'écran sur téléphone (la
// maquette mobile n'en montre pas, le lecteur d'écran le lit toujours). Icône 18 px à gauche, centrée
// sur le champ ; l'erreur s'affiche dessous (style de l'app).
export function AuthField({
  id,
  label,
  icon: Icon,
  error,
  compact = false,
  children,
}: {
  id: string;
  label: string;
  icon?: LucideIcon;
  error?: string | null;
  // Inscription sur ordinateur : champ de 45 px, icône de 17 px à 14 px du bord (maquette 02).
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col ${compact ? "gap-1.5" : "gap-[7px]"}`}>
      <label
        htmlFor={id}
        className="text-[13px] leading-[normal] font-semibold text-text max-lg:sr-only"
      >
        {label}
      </label>
      <div className="relative">
        {children}
        {Icon ? (
          <Icon
            aria-hidden
            size={18}
            strokeWidth={1.8}
            className={`pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted ${
              compact ? "lg:left-3.5 lg:size-[17px]" : "lg:left-[15px]"
            }`}
          />
        ) : null}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

// Case de la maquette : 20 px rayon 6 (téléphone), 18 px rayon 5 (ordinateur) ; cochée = fond de
// l'action principale (noir en clair, blanc en sombre) et ✓. Vraie case native cachée (clavier,
// formulaire sans JavaScript, lecteur d'écran), toute la ligne cliquable.
export function AuthCheckbox({
  label,
  multiline = false,
  tone = "ink",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  label: ReactNode;
  multiline?: boolean;
  // « ink » : se souvenir de moi (noir) ; « violet » : conditions de l'inscription (maquette).
  tone?: "ink" | "violet";
}) {
  const checked =
    tone === "violet"
      ? "peer-checked:bg-violet peer-checked:text-on-accent peer-checked:inset-ring-violet"
      : "peer-checked:bg-cta peer-checked:text-on-cta peer-checked:inset-ring-cta";
  return (
    <label
      className={`group flex cursor-pointer text-dlg-ink-2 ${
        multiline
          ? "items-start gap-2.5 text-[13px] leading-[1.5] font-medium lg:text-[12.5px]"
          : "min-h-11 items-center gap-[9px] text-[13.5px] leading-[normal] font-medium lg:min-h-0 lg:text-[13px]"
      }`}
    >
      <input type="checkbox" {...props} className="peer sr-only" />
      <span
        aria-hidden
        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] inset-ring-[1.5px] inset-ring-dlg-check-line transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet peer-aria-invalid:inset-ring-alert lg:size-[18px] lg:rounded-[5px] [&>svg]:hidden peer-checked:[&>svg]:block ${checked} ${
          multiline ? "mt-px" : ""
        }`}
      >
        <Check size={12} strokeWidth={3.2} />
      </span>
      <span className="min-w-0">{label}</span>
    </label>
  );
}
