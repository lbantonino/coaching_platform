"use client";

import { useOptimistic, useTransition } from "react";

import { useToast } from "@/components/ui/toast";

import { StarIcon } from "./library-icons";

type SetFavorite = (favorite: boolean) => Promise<{ ok: boolean }>;

// Favori d'un exercice (D-75) : réponse immédiate (l'étoile change tout de suite), puis
// enregistrement ; en cas d'échec, l'étoile revient et un message le dit. Partagé par l'étoile des
// cartes, le bouton de l'en-tête et le menu ⋮ du téléphone (fiche).
export function useFavorite(favorite: boolean, setFavorite: SetFavorite) {
  const [optimistic, setOptimistic] = useOptimistic(favorite);
  const [, startTransition] = useTransition();
  const toast = useToast();
  const toggle = () =>
    startTransition(async () => {
      setOptimistic(!optimistic);
      const { ok } = await setFavorite(!optimistic);
      if (!ok) toast("Le favori n'a pas pu être enregistré. Réessaie.");
    });
  return [optimistic, toggle] as const;
}

// Étoile au trait ; pleine et violette quand l'exercice est en favori (maquette, PROPOSED validé).
export function FavoriteStar({ on, size }: { on: boolean; size: number }) {
  return (
    <StarIcon
      aria-hidden
      size={size}
      strokeWidth={size > 14 ? 1.8 : 2}
      className={on ? "fill-violet text-violet" : ""}
    />
  );
}

// Bouton « Favori » de l'en-tête d'une fiche (maquette « Bibliothèque », 06/11/2026, D-142) : 32 px,
// blanc, contour fin, étoile 13.
export const libraryHeaderButtonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[9px] bg-surface px-3 text-[12.5px] leading-none font-medium whitespace-nowrap text-text inset-ring inset-ring-lib-field-ring transition-[background-color,scale] duration-150 ease-out hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet active:scale-[0.97]";

// Étoile ronde de 30 px posée sur l'illustration d'une carte (maquette 1a / 1b) ; la zone tactile
// déborde jusqu'à 44 px (pseudo-élément) sans changer le dessin.
export function FavoriteButton({
  name,
  favorite,
  setFavorite,
}: {
  name: string;
  favorite: boolean;
  setFavorite: SetFavorite;
}) {
  const [on, toggle] = useFavorite(favorite, setFavorite);
  return (
    <button
      type="button"
      // Libellé fixe, l'état est donné par aria-pressed (bouton bascule).
      aria-label={`Mettre ${name} en favori`}
      aria-pressed={on}
      onClick={toggle}
      className="relative grid size-[30px] place-items-center rounded-full bg-on-image text-on-image-ink shadow-[0_1px_3px_rgba(22,18,40,0.12)] transition-[scale] duration-150 ease-out before:absolute before:-inset-[7px] before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet active:scale-[0.92]"
    >
      <FavoriteStar on={on} size={15} />
    </button>
  );
}

// Bouton « Favori » de l'en-tête (ordinateur) ; l'état vient de useFavorite, partagé avec le menu ⋮.
export function FavoriteHeaderButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onToggle} className={libraryHeaderButtonClass}>
      <FavoriteStar on={on} size={13} />
      Favori
    </button>
  );
}
