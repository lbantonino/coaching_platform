"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useToast } from "@/components/ui/toast";
import { publishProgram } from "@/features/programs/actions";
import type { PendingPublication } from "@/features/programs/publish-check";

import { PublishSheet } from "../../programmes/_editor/editor-sheets";

// Fiche du sportif, onglets Programme et Agenda (demande d'Antonino du 10/11) : une séance modifiée
// depuis la fiche va dans le BROUILLON ; le sportif, ces onglets et les PDF suivent la version
// publiée. Ce bandeau le dit, et publie en un geste avec la même fenêtre que l'éditeur (semaines,
// séances, avertissements, refus bloquants) : tout se met alors à jour partout.
export function PublishBanner({
  organizationId,
  firstName,
  pending,
  editorHref,
  returnTo,
}: {
  organizationId: string;
  firstName: string;
  pending: PendingPublication;
  editorHref: string;
  // La fiche (onglet) où revenir depuis l'éditeur (« Voir » d'un avertissement, B15).
  returnTo: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const next = pending.currentVersion + 1;

  const publish = () =>
    startTransition(async () => {
      setError(null);
      const result = await publishProgram(organizationId, pending.programId, pending.revision);
      if (!result.ok) return setError(result.issues?.[0] ?? result.message);
      setOpen(false);
      toast(`Programme publié (version ${result.number}).`);
      router.refresh();
    });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 rounded-[14px] bg-violet/7 px-4 py-3">
        <p className="text-[13.5px] leading-[1.45] text-text-2">
          <strong className="font-semibold text-text">Modifications non publiées.</strong>{" "}
          {/* MVP coach seul (D-167) : pas d'espace sportif, c'est la fiche et le PDF qui suivent. */}
          La fiche de {firstName} et le PDF montrent encore la version {pending.currentVersion}.
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-cta px-4 text-[14px] font-semibold whitespace-nowrap text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] max-sm:w-full max-sm:justify-center lg:h-9 lg:rounded-[10px] lg:px-3.5 lg:text-[13px]"
        >
          <Upload aria-hidden size={15} strokeWidth={2} />
          Publier la version {next}
        </button>
      </div>
      <PublishSheet
        open={open}
        onClose={() => setOpen(false)}
        version={next}
        weeks={pending.weeks}
        sessions={pending.sessions}
        issues={pending.issues}
        pending={busy}
        error={error}
        onConfirm={publish}
        onSee={(weekIndex) =>
          router.push(`${editorHref}?semaine=${weekIndex}&retour=${encodeURIComponent(returnTo)}`)
        }
      />
    </>
  );
}
