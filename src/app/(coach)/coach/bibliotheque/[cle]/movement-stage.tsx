"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { exerciseCategoryIcons } from "@/components/blocks/exercise-image";
import type { ExerciseCategory } from "@/domain/exercises/vocabulary";

// Scène de la maquette 5 de la fiche d'un exercice (temporaire, voir maquettes.tsx) : le mouvement.
// Avec une image de début et une de fin, elles alternent en fondu court (1,4 s par position), comme
// une image animée qui montre le geste. On peut mettre en pause ou changer de position. Si la
// personne a demandé de réduire les animations, rien ne démarre seul.
// Taille (demande d'Antonino du 31/10) : l'image garde sa taille d'origine (la moitié de la largeur sur
// téléphone), centrée dans un bandeau deux fois plus large que haut ; les quatre boutons sont dans les
// coins, sur le bleu, sans rien cacher de l'image.
const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

type Shot = { src: string; alt: string; caption: string | null };

export function MovementStage({
  shots,
  category,
  name,
  corner,
}: {
  shots: Shot[];
  category: ExerciseCategory;
  name: string;
  // Boutons ronds posés en haut de la scène (retour, favori).
  corner: ReactNode;
}) {
  const animated = shots.length === 2;
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => true,
  );
  const [choice, setChoice] = useState<boolean | null>(null);
  const [frame, setFrame] = useState(0);
  const playing = animated && (choice ?? !reduced);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setFrame((current) => 1 - current), 1400);
    return () => window.clearInterval(timer);
  }, [playing]);

  const Icon = exerciseCategoryIcons[category];
  return (
    <figure
      aria-label={`Mouvement : ${name}`}
      className="relative aspect-[2/1] w-full overflow-hidden bg-illustration lg:rounded-[28px]"
    >
      {shots.length === 0 ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-on-illustration">
          <Icon aria-hidden size={32} strokeWidth={1.6} />
          <span className="text-[14px] font-medium">Illustration à venir</span>
        </span>
      ) : (
        shots.map((shot, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={shot.src}
            src={shot.src}
            alt={shot.alt}
            aria-hidden={animated && index !== frame}
            className={`absolute inset-y-0 left-1/2 aspect-square h-full -translate-x-1/2 object-contain transition-opacity duration-300 ease-out ${
              !animated || index === frame ? "opacity-100" : "opacity-0"
            }`}
          />
        ))
      )}

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5 lg:p-3">
        {corner}
      </div>

      {animated ? (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-1.5 lg:p-3">
          <button
            type="button"
            aria-label={`${shots[frame].caption} du mouvement : afficher ${frame === 0 ? "la fin" : "le début"}`}
            onClick={() => {
              setChoice(false);
              setFrame(1 - frame);
            }}
            className="inline-flex h-11 items-center px-1.5 transition-transform duration-100 active:scale-95"
          >
            <span className="inline-flex h-8 items-center rounded-pill bg-surface/90 px-3 text-[13px] font-medium text-text">
              {shots[frame].caption}
            </span>
          </button>
          <button
            type="button"
            aria-label={playing ? "Arrêter l'animation" : "Animer le mouvement"}
            onClick={() => setChoice(!playing)}
            className="inline-flex size-11 items-center justify-center rounded-full transition-transform duration-100 active:scale-95"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-surface/90 text-text">
              {playing ? (
                <Pause aria-hidden size={16} strokeWidth={1.9} />
              ) : (
                <Play aria-hidden size={16} strokeWidth={1.9} />
              )}
            </span>
          </button>
        </div>
      ) : null}
    </figure>
  );
}
