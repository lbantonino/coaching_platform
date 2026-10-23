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
import { buttonClass } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/overlay";

// Bouton « + Créer » du tableau de bord (prompt Claude Design §7.2) : menu « ••• » en feuille du bas
// sur téléphone, fenêtre centrée sur ordinateur. Séance ouvre la fenêtre « Nouvelle séance » sans
// quitter la page (D-35), Sportif sa page de création ; Programme, Facture et Tâche ouvrent la page
// de leur module (D-32).
export function CreateMenu({ orgBase }: { orgBase: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const openNewSession = useOpenNewSession();
  const openNewPayment = useOpenNewPayment();
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
        items={[
          { label: "Programme", icon: FilePlus, onSelect: go("/coach/programmes") },
          {
            label: "Séance",
            icon: CalendarPlus,
            onSelect: () => openNewSession?.(),
          },
          { label: "Sportif", icon: UserPlus, onSelect: go(`${orgBase}/sportifs/nouveau`) },
          { label: "Paiement reçu", icon: Euro, onSelect: () => openNewPayment?.() },
          { label: "Facture", icon: ReceiptText, onSelect: go("/coach/facturation") },
          { label: "Tâche", icon: ClipboardList, onSelect: go("/coach/taches") },
        ]}
      />
    </>
  );
}
