"use client";

import { WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { buttonClass } from "./button";

// État d'erreur d'une page (prompt Claude Design §4). Le vide est dans empty-state.tsx, le
// chargement dans skeleton.tsx : chaque page a besoin des trois (règle 6 du prompt).

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
      <WifiOff aria-hidden size={22} strokeWidth={1.8} className="text-alert" />
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
