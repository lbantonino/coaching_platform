"use client";

import { CloudOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/overlay";

import { saveStatusLabel, useEditor } from "../_editor/editor-provider";

// Quitter l'éditeur de séance sans perdre de modification (phase 4, SES-F07) : « Terminer » et le
// retour enregistrent d'abord ; si l'enregistrement échoue (connexion, séance refusée, programme
// modifié ailleurs), on reste sur la page et le coach choisit : rester (« Annuler », puis
// « Réessayer ») ou quitter en perdant ses dernières modifications.
export function useSafeLeave() {
  const editor = useEditor();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [blockedHref, setBlockedHref] = useState<string | null>(null);

  const leave = (href: string) =>
    startTransition(async () => {
      if (await editor.flush()) router.push(href);
      else setBlockedHref(href);
    });

  const dialog = (
    <ConfirmDialog
      open={blockedHref !== null}
      onClose={() => setBlockedHref(null)}
      title="Modifications non enregistrées"
      confirmLabel="Quitter quand même"
      icon={CloudOff}
      onConfirm={() => {
        const href = blockedHref;
        setBlockedHref(null);
        if (href) router.push(href);
      }}
    >
      {editor.status === "conflict"
        ? "Le programme a été modifié ailleurs. Si tu quittes, tes dernières modifications de cette séance seront perdues."
        : `${editor.error ?? "L'enregistrement a échoué."} Si tu quittes maintenant, tes dernières modifications seront perdues.`}
    </ConfirmDialog>
  );

  return { leave, pending, dialog };
}

// L'état de l'enregistrement, avec « Réessayer » (erreur) ou « Recharger » (modifié ailleurs).
// `quietWhenSaved` : rien quand tout est enregistré (téléphone : pas de bruit inutile).
export function SaveState({
  quietWhenSaved = false,
  className = "",
}: {
  quietWhenSaved?: boolean;
  className?: string;
}) {
  const editor = useEditor();
  const router = useRouter();
  if (quietWhenSaved && editor.status === "saved") return null;
  const alert = editor.status === "error" || editor.status === "conflict";
  return (
    <span
      aria-live="polite"
      className={`text-[12.5px] whitespace-nowrap ${alert ? "font-semibold text-alert" : "font-medium text-faint"} ${className}`}
    >
      {saveStatusLabel(editor.status)}
      {editor.status === "error" ? (
        <button type="button" onClick={editor.retry} className="ml-1.5 underline">
          Réessayer
        </button>
      ) : null}
      {editor.status === "conflict" ? (
        <button type="button" onClick={() => router.refresh()} className="ml-1.5 underline">
          Recharger
        </button>
      ) : null}
    </span>
  );
}
