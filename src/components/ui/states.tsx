"use client";

import { WifiOff, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { buttonClass } from "./button";

// Les trois états d'une page en dehors de « rempli » (prompt Claude Design §4) : vide, chargement,
// erreur. Chaque page en a besoin (règle 6 du prompt).

// Vide : icône 24 grise, titre 16/600, texte 14 gris, action facultative (bouton contour).
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-card border border-dashed border-line-2 p-4">
      <Icon aria-hidden size={24} strokeWidth={1.7} className="text-muted" />
      <p className="text-[16px] font-semibold">{title}</p>
      {children ? <p className="text-[14px] leading-[1.45] text-muted">{children}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

// Erreur : bandeau rouge doux, icône « wifi-off », bouton « Réessayer ». Par défaut, Réessayer
// recharge les données de la page ; dans un error.tsx, passer la fonction reset de Next.
export function ErrorState({
  title = "Impossible de charger cette page",
  children = "La connexion au serveur a échoué. Tes données sont en sécurité.",
  onRetry,
}: {
  title?: string;
  children?: ReactNode;
  onRetry?: () => void;
}) {
  const router = useRouter();
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-card border border-accent-line bg-accent-soft p-4"
    >
      <WifiOff aria-hidden size={22} strokeWidth={1.8} className="text-accent-text" />
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="text-[13px] leading-[1.45]">{children}</p>
      <button
        type="button"
        onClick={onRetry ?? (() => router.refresh())}
        className={buttonClass({ variant: "outline", size: "sm", className: "mt-1 h-10" })}
      >
        Réessayer
      </button>
    </div>
  );
}
