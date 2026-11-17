import { Plus } from "lucide-react";
import Link from "next/link";

import { exerciseCategoryLabels, type ExerciseCategory } from "@/domain/exercises/vocabulary";

import { PictureIcon, libraryCategoryDots } from "./library-icons";

// Illustrations des exercices (maquette « Bibliothèque » du 06/11/2026, D-142). Toujours carrées,
// en `cover`, sur la lavande #EEE9FC (peinte aussi dans les images) : la tuile reste claire dans les
// deux thèmes, le personnage et le matériel sont dessinés pour un fond clair.

// Pastille de la rubrique (discipline) : point de couleur de l'agenda + libellé. Blanche dans les deux
// thèmes sur une illustration (carte) ; sur la carte de la fiche, sur le fond de la carte.
export function ExerciseTag({
  category,
  size = "card",
}: {
  category: ExerciseCategory;
  size?: "card" | "sheet";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] pr-[9px] pl-[7px] leading-none font-semibold shadow-[0_1px_2px_rgba(22,18,40,0.08)] ${
        size === "card"
          ? "h-[22px] bg-on-image text-[10.5px] text-on-image-ink"
          : "h-6 self-start bg-lib-tag text-[11px] text-text"
      }`}
    >
      <span
        aria-hidden
        className={`h-2.5 w-[3px] shrink-0 rounded-[1.5px] ${libraryCategoryDots[category]}`}
      />
      {exerciseCategoryLabels[category]}
    </span>
  );
}

// Vignette d'une carte : carré de rayon 12. Sans image (exercice d'un coach sans photo) : le même
// carré, gris clair, avec l'icône image violette (PROPOSED validé le 06/11).
export function CardIllustration({ src, alt }: { src: string | null; alt: string }) {
  return src ? (
    <span className="relative block aspect-square overflow-hidden rounded-[12px] bg-illustration">
      {/* Images déjà réduites en WebP et servies depuis public/ : pas d'optimiseur à faire tourner. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="block size-full object-cover" />
    </span>
  ) : (
    <span className="relative grid aspect-square place-items-center overflow-hidden rounded-[12px] bg-surface-2">
      <PictureIcon aria-hidden size={24} strokeWidth={1.8} className="text-violet-text" />
      <span className="sr-only">Pas encore d&apos;illustration</span>
    </span>
  );
}

// Grande illustration de la fiche, rayon 16. `step` : la légende « 1 Début » / « 2 Fin » posée en
// haut à gauche quand l'exercice a deux images.
export function SheetFigure({
  src,
  alt,
  step,
  className = "",
}: {
  src: string;
  alt: string;
  step?: { number: number; label: string };
  className?: string;
}) {
  return (
    <figure
      className={`relative m-0 aspect-square shrink-0 overflow-hidden rounded-[16px] bg-illustration ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} fetchPriority="high" className="block size-full object-cover" />
      {step ? (
        <figcaption className="absolute top-2.5 left-2.5 flex h-[26px] items-center gap-[7px] rounded-[7px] bg-on-image pr-2.5 pl-1 text-[11.5px] leading-none font-semibold text-on-image-ink shadow-[0_1px_2px_rgba(22,18,40,0.1)]">
          <span
            aria-hidden
            className="grid size-[18px] place-items-center rounded-[5px] bg-on-image-ink text-[10px] leading-none font-bold text-on-image"
          >
            {step.number}
          </span>
          {step.label}
        </figcaption>
      ) : null}
    </figure>
  );
}

// Cadre « Aucune illustration » (maquette 4a / 4b) : pointillés violets, rond lavande et icône image.
// Bouton « Ajouter une image » seulement pour l'auteur (PROPOSED validé) : il ouvre la page Modifier,
// où la photo s'ajoute déjà (formats réels : JPEG, PNG ou WebP, 5 Mo).
// Ordinateur : un carré à la place de la figure ; téléphone : pleine largeur, hauteur libre (plus bas
// qu'une photo, pour que les consignes restent proches).
export function MissingIllustration({
  addHref,
  className = "",
}: {
  addHref?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-[16px] border-[1.5px] border-dashed border-lib-dash bg-surface-2 px-[18px] py-[22px] text-center lg:aspect-square lg:justify-center lg:gap-3.5 lg:p-7 ${className}`}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-lib-lavender lg:size-14">
        <PictureIcon
          aria-hidden
          strokeWidth={1.8}
          className="size-[21px] text-violet-text lg:size-6"
        />
      </span>
      <span className="flex flex-col items-center gap-1 lg:gap-1.5">
        <span className="text-[14.5px] leading-[normal] font-semibold text-text lg:text-[15px]">
          Aucune illustration
        </span>
        {addHref ? (
          <span className="text-[12.5px] leading-[1.5] text-pretty text-dlg-faint lg:max-w-[220px] lg:text-[13px]">
            <span className="lg:hidden">Ajoute une photo du mouvement.</span>
            <span className="max-lg:hidden">
              Ajoute une photo pour montrer le mouvement à tes sportifs.
            </span>
          </span>
        ) : null}
      </span>
      {addHref ? (
        <>
          <Link
            href={addHref}
            className="inline-flex h-[34px] items-center gap-[7px] rounded-[10px] bg-surface px-3.5 text-[12.5px] leading-none font-semibold whitespace-nowrap text-text shadow-[0_1px_2px_rgba(22,18,40,0.08)] inset-ring inset-ring-popover-line transition-[background-color,scale] duration-150 ease-out hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet active:scale-[0.97]"
          >
            <Plus aria-hidden size={13} strokeWidth={2.2} />
            Ajouter une image
          </Link>
          <span className="text-[11.5px] leading-[normal] text-dlg-chev max-lg:hidden">
            JPEG, PNG ou WebP · 5 Mo max.
          </span>
        </>
      ) : null}
    </div>
  );
}
