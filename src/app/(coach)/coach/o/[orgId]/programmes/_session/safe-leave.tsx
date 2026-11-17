"use client";

import { CloudOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { BackGuardProvider, returnByHistory } from "@/components/layout/back-link";
import { ConfirmDialog } from "@/components/ui/overlay";

import { saveStatusLabel, useEditor } from "../_editor/editor-provider";

// Téléphone (geste de retour d'iPhone, test du 15/11) : l'éditeur d'une séance ouvert depuis le DÉTAIL
// de la séance (une étape de l'historique au-dessus de la semaine) : « ← Semaine 1 » remonte les deux
// étapes, jusqu'à la semaine ; le geste de retour suivant quitte alors le programme, comme la barre.
const EDITOR_DEPTH = "coory-session-editor-depth";
const isPhone = () => !window.matchMedia("(min-width: 1024px)").matches;

export function rememberEditorDepth(depth: number) {
  try {
    sessionStorage.setItem(EDITOR_DEPTH, JSON.stringify({ path: window.location.pathname, depth }));
  } catch {
    // Stockage bloqué : le retour remonte d'une étape.
  }
}

function takeEditorDepth(href: string): number {
  try {
    const saved = JSON.parse(sessionStorage.getItem(EDITOR_DEPTH) ?? "null") as {
      path: string;
      depth: number;
    } | null;
    sessionStorage.removeItem(EDITOR_DEPTH);
    return saved && saved.path === href.split("?")[0] ? saved.depth : 0;
  } catch {
    return 0;
  }
}

// Quitter l'éditeur de séance sans perdre de modification (phase 4, SES-F07) : « Terminer » et le
// retour enregistrent d'abord ; si l'enregistrement échoue (connexion, séance refusée, programme
// modifié ailleurs), on reste sur la page et le coach choisit : rester (« Annuler », puis
// « Réessayer ») ou quitter en perdant ses dernières modifications.
export function useSafeLeave() {
  const editor = useEditor();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [blockedHref, setBlockedHref] = useState<string | null>(null);

  // Téléphone, vers la page d'avant : on recule dans l'historique (le geste de retour reste cohérent).
  // Ordinateur, ou page d'avant inconnue : on l'ouvre (« Terminer » rouvre la semaine et la séance).
  const go = (href: string) => {
    if (isPhone() && returnByHistory(href, 1 + takeEditorDepth(href))) return;
    router.push(href);
  };
  const leave = (href: string) =>
    startTransition(async () => {
      if (await editor.flush()) go(href);
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
        if (href) go(href);
      }}
    >
      {editor.status === "conflict"
        ? "Le programme a été modifié ailleurs. Si tu quittes, tes dernières modifications de cette séance seront perdues."
        : `${editor.error ?? "L'enregistrement a échoué."} Si tu quittes maintenant, tes dernières modifications seront perdues.`}
    </ConfirmDialog>
  );

  return { leave, pending, dialog };
}

// Le retour de l'en-tête (ordinateur et téléphone) des éditeurs passe par `leave` (revue MVP du 13/11,
// C7) : enregistrer d'abord, prévenir si l'enregistrement échoue.
export function SafeBack({ children }: { children: ReactNode }) {
  const { leave, dialog } = useSafeLeave();
  return (
    <BackGuardProvider value={leave}>
      {children}
      {dialog}
    </BackGuardProvider>
  );
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
