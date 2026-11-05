"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

// Supprimer un exercice de l'organisation (D-76), TOUJOURS après confirmation. Les programmes publiés
// garderont leur propre copie de l'exercice (docs/08) : la suppression ne les touchera pas.
// Trois habits, la même action (kit « Coory Pages », page 11, D-121) :
// - "button" : le bouton « Supprimer » de la fiche de l'exercice ;
// - "link" : « Supprimer l'exercice », lien rouge sous les boutons de l'aperçu (Modifier, ordinateur) ;
// - "icon" : la corbeille rouge de 44 px à droite du titre (Modifier, téléphone).
export function DeleteExerciseButton({
  name,
  remove,
  variant = "button",
}: {
  name: string;
  remove: () => Promise<{ ok: boolean }>;
  variant?: "button" | "link" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const confirm = () =>
    startTransition(async () => {
      const { ok } = await remove();
      setOpen(false);
      if (!ok) {
        toast("L'exercice n'a pas pu être supprimé. Réessaie.");
        return;
      }
      toast("Exercice supprimé.");
      router.push("/coach/bibliotheque");
    });

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          aria-label="Supprimer l'exercice"
          onClick={() => setOpen(true)}
          className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-surface text-status-danger transition-[scale,background-color] duration-150 active:scale-95 active:bg-surface-2"
        >
          <Trash2 aria-hidden size={18} strokeWidth={1.8} />
        </button>
      ) : variant === "link" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-[4px] text-[13px] leading-[normal] font-medium text-status-danger underline-offset-4 hover:underline"
        >
          Supprimer l&apos;exercice
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          // Fiche de l'exercice : 32 px dans l'en-tête sur ordinateur (D-124).
          className={buttonClass({
            variant: "outline",
            className:
              "lg:h-8! lg:gap-1.5! lg:rounded-[9px]! lg:px-3! lg:text-[12.5px]! lg:[&>svg]:size-3.5",
          })}
        >
          <Trash2 aria-hidden size={16} strokeWidth={1.8} />
          Supprimer
        </button>
      )}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        title={`Supprimer « ${name} » ?`}
        confirmLabel="Supprimer"
        pending={pending}
      >
        L&apos;exercice et sa photo disparaissent de ta bibliothèque. Cette action est définitive.
      </ConfirmDialog>
    </>
  );
}
