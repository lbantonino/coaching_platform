"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

// Supprimer un exercice de l'organisation (D-76), après confirmation. Les programmes publiés garderont
// leur propre copie de l'exercice (docs/08) : la suppression ne les touchera pas.
export function DeleteExerciseButton({
  name,
  remove,
}: {
  name: string;
  remove: () => Promise<{ ok: boolean }>;
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ variant: "outline" })}
      >
        <Trash2 aria-hidden size={16} strokeWidth={1.8} />
        Supprimer
      </button>
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
