import { Dumbbell, HeartPulse, PersonStanding, Zap, type LucideIcon } from "lucide-react";

import type { ExerciseCategory } from "@/domain/exercises/vocabulary";

// Pictogramme de chaque rubrique de la bibliothèque (D-75), repris des disciplines quand elles existent.
export const exerciseCategoryIcons: Record<ExerciseCategory, LucideIcon> = {
  strength: Dumbbell,
  cardio: HeartPulse,
  hyrox: Zap,
  mobility: PersonStanding,
};

// Illustration d'un exercice (D-75) sur une tuile CLAIRE dans les deux thèmes : les images Hyrox sont
// détourées avec du noir (short, traîneau) qui disparaîtrait sur le graphite. Sans image, la même
// tuile avec le pictogramme de la rubrique ; la fiche écrit en plus « Illustration à venir ».
export function ExerciseImage({
  src,
  alt,
  category,
  caption,
  missingLabel = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  category: ExerciseCategory;
  // Légende sous l'image (« Début », « Fin »).
  caption?: string;
  missingLabel?: boolean;
  className?: string;
}) {
  const Icon = exerciseCategoryIcons[category];
  return (
    <figure className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      {/* Sur la fiche, une image absente donne un bandeau bas, pas un grand carré vide. */}
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-[14px] bg-illustration ${
          !src && missingLabel ? "aspect-[5/2]" : "aspect-square"
        }`}
      >
        {src ? (
          // Images déjà réduites en WebP et servies depuis public/ : pas d'optimiseur à faire tourner.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} loading="lazy" className="size-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 px-3 text-center text-on-illustration">
            <Icon aria-hidden size={28} strokeWidth={1.6} />
            {missingLabel ? (
              <span className="text-[13px] font-medium">Illustration à venir</span>
            ) : (
              <span className="sr-only">Illustration à venir</span>
            )}
          </span>
        )}
      </div>
      {caption ? <figcaption className="text-[13px] text-muted">{caption}</figcaption> : null}
    </figure>
  );
}
