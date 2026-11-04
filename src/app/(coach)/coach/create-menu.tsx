"use client";

import { CalendarPlus, ClipboardList, Coins, FilePlus, Plus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOpenNewPayment } from "@/components/blocks/new-payment-sheet";
import { useOpenNewSession } from "@/components/blocks/new-session-sheet";
import { useOpenTaskSheet } from "@/components/blocks/task-sheet";
import { phoneFabClass } from "@/components/layout/mobile-bar";
import { buttonClass } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/overlay";

// Bouton « + Créer » du tableau de bord (prompt Claude Design §7.2) : menu « ••• » en feuille du bas
// sur téléphone, fenêtre centrée sur ordinateur. Séance ouvre la fenêtre « Nouvelle séance » sans
// quitter la page (D-35), comme Tâche (D-59) et Paiement reçu ; Sportif ouvre sa page de création ;
// Programme la page de son module (D-32). Plus de Facture (D-90).
export function CreateMenu({ orgBase }: { orgBase: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const openNewSession = useOpenNewSession();
  const openNewPayment = useOpenNewPayment();
  const openTask = useOpenTaskSheet();
  const go = (href: string) => () => router.push(href);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({
          className: "max-lg:hidden lg:h-8 lg:rounded-lg lg:px-3.5 lg:text-[12px] lg:font-medium",
        })}
      >
        <Plus aria-hidden size={16} strokeWidth={2} />
        Créer
      </button>
      {/* Téléphone (D-117) : le bouton flottant en bas à droite, celui de l'Agenda. */}
      <button
        type="button"
        aria-label="Créer"
        onClick={() => setOpen(true)}
        data-phone-fab=""
        className={phoneFabClass}
      >
        <Plus aria-hidden size={24} strokeWidth={2.2} />
      </button>
      <ActionMenu
        open={open}
        onClose={() => setOpen(false)}
        title="Créer"
        // Kit (boîte 01) : sous-titre, une description par choix et un chevron (chaque choix ouvre
        // une autre boîte ou page). Ordre choisi par Antonino (26/10).
        subtitle="Qu'est-ce que tu veux ajouter ?"
        items={[
          {
            label: "Séance",
            description: "Individuelle ou collective, dans l'agenda",
            icon: CalendarPlus,
            chevron: true,
            onSelect: () => openNewSession?.(),
          },
          {
            label: "Programme",
            description: "Plusieurs semaines pour un sportif",
            icon: FilePlus,
            chevron: true,
            onSelect: go("/coach/programmes"),
          },
          {
            label: "Tâche",
            description: "Un rappel pour toi",
            icon: ClipboardList,
            chevron: true,
            onSelect: () => openTask?.(),
          },
          {
            label: "Sportif",
            description: "Une nouvelle fiche",
            icon: UserPlus,
            chevron: true,
            onSelect: go(`${orgBase}/sportifs/nouveau`),
          },
          {
            label: "Paiement reçu",
            description: "L'argent reçu d'un sportif",
            icon: Coins,
            chevron: true,
            onSelect: () => openNewPayment?.(),
          },
        ]}
      />
    </>
  );
}
