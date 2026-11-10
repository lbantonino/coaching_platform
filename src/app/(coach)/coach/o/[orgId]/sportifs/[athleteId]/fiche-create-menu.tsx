"use client";

import { CalendarPlus, FilePlus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOpenNewSession } from "@/components/blocks/new-session-sheet";
import { phoneFabClass } from "@/components/layout/mobile-bar";
import { buttonClass } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/overlay";
import type { Discipline } from "@/domain/training/discipline";

// Bouton rouge « + Créer » de la fiche (demande d'Antonino du 26/10, comme au tableau de bord) :
// Programme (cœur de Coory ; tant que le module n'existe pas, la page Programmes), et Séance, la
// fenêtre « Nouvelle séance » déjà remplie avec ce sportif (individuelle, discipline de son type de
// programme, date du jour). La séance apparaît ensuite dans l'agenda du tableau de bord et sur la fiche.
// `phone` : le bouton flottant « + » du téléphone, en bas à droite (celui de l'Agenda, D-117) ; sinon
// le bouton « + Créer » de 32 px de l'en-tête, sur ordinateur.
export function FicheCreateMenu({
  athlete,
  phone = false,
}: {
  athlete: { id: string; name: string; programType: Discipline | null };
  phone?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const openNewSession = useOpenNewSession();
  return (
    <>
      {phone ? (
        <button
          type="button"
          aria-label={`Créer pour ${athlete.name}`}
          onClick={() => setOpen(true)}
          data-phone-fab=""
          className={phoneFabClass}
        >
          <Plus aria-hidden size={24} strokeWidth={2.2} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={buttonClass({
            className: "h-8! gap-1.5! rounded-[9px]! px-3.5! text-[12.5px]! font-medium!",
          })}
        >
          <Plus aria-hidden size={13} strokeWidth={2.2} />
          Créer
        </button>
      )}
      <ActionMenu
        open={open}
        onClose={() => setOpen(false)}
        title={`Créer pour ${athlete.name}`}
        items={[
          // Kit (boîte 05) : descriptions et chevrons. L'assistant s'ouvre avec ce sportif déjà choisi
          // (D-157) ; la description du kit (« préremplies pour elle ») suppose le genre : on garde
          // une phrase neutre.
          {
            label: "Programme",
            description: "Plusieurs semaines d'entraînement",
            icon: FilePlus,
            tone: "hybrid",
            chevron: true,
            onSelect: () => router.push(`/coach/programmes/nouveau?sportif=${athlete.id}`),
          },
          {
            label: "Séance",
            description: "Une séance dans l'agenda",
            icon: CalendarPlus,
            tone: "running",
            chevron: true,
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
