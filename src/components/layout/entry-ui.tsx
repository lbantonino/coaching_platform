import { ArrowLeft, CircleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClass } from "@/components/ui/button";

// Briques des pages d'entrée (prompt Claude Design §7.1) : titre, pastille d'icône, bandeau d'erreur,
// carte d'information, lien retour, boutons pleine largeur. Composants serveur, sans état.

export function EntryTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h1 className="font-display text-entry leading-[1.02] font-semibold text-balance lg:text-entry-lg">
        {children}
      </h1>
      {sub ? <p className="text-[15px] leading-[1.55] text-pretty text-muted">{sub}</p> : null}
    </div>
  );
}

const iconTones = {
  accent: "bg-chip text-text",
  ok: "bg-ok-soft text-ok",
} as const;

// Pastille de 56 px en tête de page (e-mail envoyé, lien invalide, accès refusé, bienvenue).
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

// Erreur générale du formulaire (identifiants refusés, champs à corriger…).
export function FormAlert({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div
      id={id}
      role="alert"
      className="flex items-start gap-3 rounded-wide border border-alert/40 bg-alert-soft px-4 py-3.5 text-[14px] leading-normal text-text"
    >
      <CircleAlert aria-hidden size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-alert" />
      <span>{children}</span>
    </div>
  );
}

// Carte d'information (rayon 16, fond surface) ; `tone="ok"` : confirmation en vert.
export function InfoCard({ tone, children }: { tone?: "ok"; children: ReactNode }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[16px] border p-[18px] ${
        tone === "ok" ? "border-ok-line bg-ok-soft" : "border-line bg-surface"
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

// Boutons pleine largeur des pages d'entrée : principal 54 px (texte 16), secondaire 52 px.
export const entryPrimaryClass = buttonClass({ size: "lg", className: "w-full text-[16px]" });
export const entrySecondaryClass = buttonClass({
  variant: "outline",
  size: "lg",
  className: "h-[52px] w-full",
});

// Lien souligné de rouge dans le texte (« Créer un compte », « Se connecter »…).
export const entryLinkClass = "border-b border-accent pb-px font-medium text-text";
