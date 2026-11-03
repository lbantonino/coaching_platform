"use client";

import { CalendarPlus, ClipboardList, Coins, FilePlus, Plus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOpenNewPayment } from "@/components/blocks/new-payment-sheet";
import { useOpenNewSession } from "@/components/blocks/new-session-sheet";
import { useOpenTaskSheet } from "@/components/blocks/task-sheet";
import { barActionClass, MobileBarAction } from "@/components/layout/mobile-bar";
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
      {/* Téléphone (D-78) : le « + » de la carte en haut à droite (avec l'assistant IA et la cloche). */}
      <MobileBarAction>
        <button
          type="button"
          aria-label="Créer"
          onClick={() => setOpen(true)}
          className={barActionClass}
        >
          <Plus aria-hidden size={20} strokeWidth={2.2} />
        </button>
      </MobileBarAction>
      <ActionMenu
        open={open}
        onClose={() => setOpen(false)}
        title="Créer"
        // Ordre choisi par Antonino (26/10).
        items={[
          {
            label: "Séance",
            icon: CalendarPlus,
            onSelect: () => openNewSession?.(),
          },
          { label: "Programme", icon: FilePlus, onSelect: go("/coach/programmes") },
          { label: "Tâche", icon: ClipboardList, onSelect: () => openTask?.() },
          { label: "Sportif", icon: UserPlus, onSelect: go(`${orgBase}/sportifs/nouveau`) },
          { label: "Paiement reçu", icon: Coins, onSelect: () => openNewPayment?.() },
        ]}
      />
    </>
  );
}
