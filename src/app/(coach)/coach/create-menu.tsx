"use client";

import {
  CalendarPlus,
  ClipboardList,
  Euro,
  FilePlus,
  Plus,
  ReceiptText,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOpenNewPayment } from "@/components/blocks/new-payment-sheet";
import { useOpenNewSession } from "@/components/blocks/new-session-sheet";
import { useOpenTaskSheet } from "@/components/blocks/task-sheet";
import { buttonClass } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/overlay";

// Bouton « + Créer » du tableau de bord (prompt Claude Design §7.2) : menu « ••• » en feuille du bas
// sur téléphone, fenêtre centrée sur ordinateur. Séance ouvre la fenêtre « Nouvelle séance » sans
// quitter la page (D-35), comme Tâche (D-59) et Paiement reçu ; Sportif ouvre sa page de création ;
// Programme et Facture la page de leur module (D-32).
export function CreateMenu({ orgBase }: { orgBase: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const openNewSession = useOpenNewSession();
  const openNewPayment = useOpenNewPayment();
  const openTask = useOpenTaskSheet();
  const go = (href: string) => () => router.push(href);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass()}>
        <Plus aria-hidden size={16} strokeWidth={2} />
        Créer
      </button>
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
          { label: "Facture", icon: ReceiptText, onSelect: go("/coach/facturation") },
          { label: "Paiement reçu", icon: Euro, onSelect: () => openNewPayment?.() },
        ]}
      />
    </>
  );
}
