"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  FavoriteHeaderButton,
  libraryHeaderButtonClass,
  useFavorite,
} from "@/components/blocks/favorite-button";
import { MoreDotsIcon, StarIcon, VariantIcon } from "@/components/blocks/library-icons";
import { MobileBarTool } from "@/components/layout/mobile-bar";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/overlay";

import { DeleteExerciseButton } from "./delete-exercise-button";

// Actions de la fiche d'un exercice (maquette « Bibliothèque » du 06/11/2026, D-142).
// Ordinateur : dans l'en-tête, « Favori » puis « Créer ma variante » (catalogue) ou « Modifier » et
// « Supprimer » (exercice de l'organisation, D-76). Téléphone : un bouton ⋮ dans la barre du haut,
// qui ouvre le menu des mêmes actions (PROPOSED validé le 06/11). L'état du favori est partagé.
export function ExerciseActions({
  name,
  favorite,
  setFavorite,
  variantHref,
  editHref,
  remove,
}: {
  name: string;
  favorite: boolean;
  setFavorite: (favorite: boolean) => Promise<{ ok: boolean }>;
  // Exercice du catalogue : sa variante ; exercice de l'organisation : Modifier et Supprimer.
  variantHref?: string;
  editHref?: string;
  remove?: () => Promise<{ ok: boolean }>;
}) {
  const [on, toggle] = useFavorite(favorite, setFavorite);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  const items: ActionMenuItem[] = [
    {
      label: on ? "Retirer des favoris" : "Mettre en favori",
      icon: StarIcon,
      selected: on,
      onSelect: () => {
        toggle();
        setMenu(false);
      },
    },
    ...(variantHref
      ? [
          {
            label: "Créer ma variante",
            description: "Une copie à ton nom, modifiable",
            icon: VariantIcon,
            onSelect: () => {
              setMenu(false);
              router.push(variantHref);
            },
          },
        ]
      : []),
    ...(editHref
      ? [
          {
            label: "Modifier",
            icon: Pencil,
            onSelect: () => {
              setMenu(false);
              router.push(editHref);
            },
          },
        ]
      : []),
    ...(remove
      ? [
          {
            label: "Supprimer",
            icon: Trash2,
            destructive: true,
            onSelect: () => {
              setMenu(false);
              setConfirm(true);
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="flex items-center gap-2.5 max-lg:hidden">
        <FavoriteHeaderButton on={on} onToggle={toggle} />
        {variantHref ? (
          <Link href={variantHref} className={libraryHeaderButtonClass}>
            <VariantIcon aria-hidden size={13} strokeWidth={2} />
            Créer ma variante
          </Link>
        ) : null}
        {editHref ? (
          <Link href={editHref} className={libraryHeaderButtonClass}>
            <Pencil aria-hidden size={13} strokeWidth={2} />
            Modifier
          </Link>
        ) : null}
        {remove ? <DeleteExerciseButton name={name} remove={remove} variant="header" /> : null}
      </div>

      <MobileBarTool>
        <button
          type="button"
          aria-label="Plus d'actions"
          aria-haspopup="dialog"
          onClick={() => setMenu(true)}
          className="grid size-10 place-items-center rounded-xl text-text-2"
        >
          <MoreDotsIcon aria-hidden size={17} strokeWidth={1.9} />
        </button>
      </MobileBarTool>
      <ActionMenu open={menu} onClose={() => setMenu(false)} title={name} items={items} />
      {remove ? (
        <DeleteExerciseButton
          name={name}
          remove={remove}
          variant="none"
          open={confirm}
          onOpenChange={setConfirm}
        />
      ) : null}
    </>
  );
}
