"use client";

import { Archive, Copy, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SessionDetail } from "@/components/programs/session-detail";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import type { SessionBody } from "@/domain/training/session-v2";
import { archiveTemplate, duplicateTemplate } from "@/features/programs/actions";

// Un modèle de séance (écran d'appoint fait avec les composants de l'app, décision d'Antonino du
// 09/11) : son détail, et ce qu'on peut en faire. Un modèle Coory se lit et se duplique ; un de Mes
// modèles s'archive. Son contenu se modifie dans un programme, puis « Enregistrer comme modèle ».
export function SessionTemplateView({
  organizationId,
  base,
  templateId,
  source,
  session,
}: {
  organizationId: string;
  base: string;
  templateId: string;
  source: "coory" | "mine";
  session: SessionBody;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const duplicate = () =>
    startTransition(async () => {
      const result = await duplicateTemplate(organizationId, "session", templateId);
      if (!result.ok) return toast(result.message);
      toast("Modèle dupliqué dans Mes modèles.");
      router.push(`${base}/modeles/${result.templateId}`);
    });

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3">
      <div className="rounded-[20px] bg-surface p-4 lg:p-[18px]">
        <SessionDetail session={session} />
      </div>
      {source === "coory" ? (
        <p className="flex items-center gap-2 px-1 text-[13px] text-muted">
          <Lock aria-hidden size={14} strokeWidth={2} />
          Modèle fourni par Coory, en lecture seule : duplique-le pour l&apos;adapter.
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={duplicate}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[13px] bg-cta px-4 text-[14.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] disabled:opacity-60 lg:h-10 lg:flex-none lg:rounded-[11px] lg:text-[13.5px]"
        >
          <Copy aria-hidden size={15} strokeWidth={2} />
          {source === "coory" ? "Dupliquer dans Mes modèles" : "Dupliquer"}
        </button>
        {source === "mine" ? (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[13px] bg-surface px-4 text-[14.5px] font-semibold text-alert inset-ring inset-ring-field-ring transition-[scale] duration-150 active:scale-[0.98] lg:h-10 lg:rounded-[11px] lg:text-[13.5px]"
          >
            <Archive aria-hidden size={15} strokeWidth={2} />
            Archiver
          </button>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Archiver ce modèle ?"
        confirmLabel="Archiver"
        icon={Archive}
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await archiveTemplate(organizationId, "session", templateId);
            if (!result.ok) return toast(result.message);
            toast("Modèle archivé.");
            router.push(`${base}?onglet=modeles`);
          })
        }
      >
        Il ne sera plus proposé. Les séances déjà copiées dans des programmes ne changent pas.
      </ConfirmDialog>
    </div>
  );
}
