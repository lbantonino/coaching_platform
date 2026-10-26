"use client";

import { CalendarPlus, FilePlus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOpenNewSession } from "@/components/blocks/new-session-sheet";
import { buttonClass } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/overlay";
import type { Discipline } from "@/domain/training/discipline";

// Bouton rouge « + Créer » de la fiche (demande d'Antonino du 26/10, comme au tableau de bord) :
// Programme (cœur de Coory ; tant que le module n'existe pas, la page Programmes), et Séance, la
// fenêtre « Nouvelle séance » déjà remplie avec ce sportif (individuelle, discipline de son type de
// programme, date du jour). La séance apparaît ensuite dans l'agenda du tableau de bord et sur la fiche.
export function FicheCreateMenu({
  athlete,
}: {
  athlete: { id: string; name: string; programType: Discipline | null };
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const openNewSession = useOpenNewSession();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ className: "max-lg:flex-1" })}
      >
        <Plus aria-hidden size={16} strokeWidth={2} />
        Créer
      </button>
      <ActionMenu
        open={open}
        onClose={() => setOpen(false)}
        title={`Créer pour ${athlete.name}`}
        items={[
          {
            label: "Programme",
            icon: FilePlus,
            onSelect: () => router.push("/coach/programmes"),
          },
          {
            label: "Séance",
            icon: CalendarPlus,
            onSelect: () =>
              openNewSession?.({
                athleteId: athlete.id,
                discipline: athlete.programType,
                label: `Avec ${athlete.name}`,
              }),
          },
        ]}
      />
    </>
  );
}
