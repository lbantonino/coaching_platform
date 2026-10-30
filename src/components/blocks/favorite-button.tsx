"use client";

import { Star } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { useToast } from "@/components/ui/toast";

// Étoile « favori » d'un exercice (D-75) : 44 px de zone tactile, réponse immédiate (l'étoile change
// tout de suite), puis enregistrement ; en cas d'échec, l'étoile revient et un message le dit.
export function FavoriteButton({
  name,
  favorite,
  setFavorite,
  variant = "icon",
}: {
  name: string;
  favorite: boolean;
  setFavorite: (favorite: boolean) => Promise<{ ok: boolean }>;
  // « icon » : rond posé sur une image ; « button » : bouton avec son libellé (fiche).
  variant?: "icon" | "button";
}) {
  const [optimistic, setOptimistic] = useOptimistic(favorite);
  const [, startTransition] = useTransition();
  const toast = useToast();
  // Libellé fixe, l'état est donné par aria-pressed (bouton bascule).
  const label = `Mettre ${name} en favori`;

  const toggle = () =>
    startTransition(async () => {
      setOptimistic(!optimistic);
      const { ok } = await setFavorite(!optimistic);
      if (!ok) toast("Le favori n'a pas pu être enregistré. Réessaie.");
    });

  const star = (
    <Star
      aria-hidden
      size={18}
      strokeWidth={1.9}
      className={optimistic ? "fill-accent text-accent" : ""}
    />
  );

  return variant === "icon" ? (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={label}
      onClick={toggle}
      className="inline-flex size-11 items-center justify-center rounded-full text-on-illustration transition-transform duration-100 active:scale-95"
    >
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-surface/90 text-text">
        {star}
      </span>
    </button>
  ) : (
    <button
      type="button"
      aria-pressed={optimistic}
      onClick={toggle}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-line-2 px-4 text-[14px] font-medium text-text transition-colors duration-150 hover:bg-surface"
    >
      {star}
      Favori
    </button>
  );
}
