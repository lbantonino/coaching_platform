"use client";

import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  Copy,
  Ellipsis,
  Flag,
  LayoutTemplate,
  Pencil,
  Shapes,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { MoreMenu, type MoreMenuItem } from "@/components/ui/more-menu";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import type { ProgramListStatus } from "@/domain/training/program-status";
import {
  archiveProgram,
  deleteProgram,
  duplicateProgram,
  loadProgramSettings,
  saveProgramAsTemplate,
  unarchiveProgram,
  updateProgramSettings,
  type ProgramSettings,
} from "@/features/programs/actions";

import { DatesSheet, DisciplineSheet, GoalSheet, TextSheet } from "./editor-sheets";

// « ⋯ » sur la carte d'un programme (demande d'Antonino du 16/11/2026), sur la page Programmes et dans
// l'onglet Programme de la fiche : les actions du menu de l'éditeur sans ouvrir le programme, avec les
// MÊMES fenêtres (leurs valeurs sont lues à l'ouverture, depuis le brouillon), et Supprimer (définitif,
// après confirmation). Un programme archivé : Désarchiver, Dupliquer, Enregistrer comme modèle,
// Supprimer.

type Sheet = "template" | "rename" | "discipline" | "dates" | "goal" | "archive" | "delete";

export function ProgramCardMenu({
  organizationId,
  programId,
  title,
  status,
}: {
  organizationId: string;
  programId: string;
  title: string;
  status: ProgramListStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [settings, setSettings] = useState<ProgramSettings | null>(null);
  const base = `/coach/o/${organizationId}/programmes`;
  const archived = status === "archived";

  const done = (message: string) => {
    setSheet(null);
    toast(message);
    router.refresh();
  };
  // Les fenêtres qui montrent une valeur du programme : on la lit d'abord.
  const openWithSettings = (next: Sheet) =>
    startTransition(async () => {
      const result = await loadProgramSettings(organizationId, programId);
      if (!result.ok) return toast(result.message);
      setSettings(result.settings);
      setSheet(next);
    });
  const change = (value: Parameters<typeof updateProgramSettings>[3], message: string) =>
    startTransition(async () => {
      if (!settings) return;
      const result = await updateProgramSettings(
        organizationId,
        programId,
        settings.revision,
        value,
      );
      // Programme publié : le changement attend la prochaine publication (la carte le dit aussi).
      if (result.ok) {
        return done(
          settings.published
            ? `${message} Publie-le pour que le sportif voie le changement.`
            : message,
        );
      }
      // Modifié ou supprimé ailleurs : la fenêtre se ferme et la page reprend la dernière version.
      if (result.code === "REVISION_CONFLICT" || result.code === "NOT_FOUND") {
        setSheet(null);
        router.refresh();
      }
      toast(result.message);
    });

  const duplicate = () =>
    startTransition(async () => {
      const result = await duplicateProgram(organizationId, programId);
      if (!result.ok) return toast(result.message);
      router.push(`${base}/${result.programId}`);
    });

  const items: MoreMenuItem[] = [
    {
      label: "Enregistrer comme modèle",
      icon: LayoutTemplate,
      onSelect: () => setSheet("template"),
    },
    { label: "Dupliquer le programme", icon: Copy, onSelect: duplicate },
    ...(archived
      ? [
          {
            label: "Désarchiver",
            icon: ArchiveRestore,
            onSelect: () =>
              startTransition(async () => {
                const result = await unarchiveProgram(organizationId, programId);
                if (!result.ok) return toast(result.message);
                done("Programme désarchivé.");
              }),
          },
        ]
      : [
          { label: "Renommer", icon: Pencil, onSelect: () => openWithSettings("rename") },
          {
            label: "Changer la discipline",
            icon: Shapes,
            onSelect: () => openWithSettings("discipline"),
          },
          {
            label: "Modifier les dates",
            icon: CalendarClock,
            onSelect: () => openWithSettings("dates"),
          },
          { label: "Modifier l'objectif", icon: Flag, onSelect: () => openWithSettings("goal") },
          { label: "Archiver", icon: Archive, onSelect: () => setSheet("archive") },
        ]),
    { label: "Supprimer", icon: Trash2, destructive: true, onSelect: () => setSheet("delete") },
  ];

  const nextPublication = settings?.published
    ? "Visible dans la fiche et le PDF à la prochaine publication."
    : undefined;

  return (
    <>
      <MoreMenu
        label={`Plus d'actions sur « ${title} »`}
        title={title}
        items={items}
        button={{
          content: <Ellipsis aria-hidden size={18} strokeWidth={2} />,
          className:
            "grid size-11 shrink-0 place-items-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text lg:size-8 lg:rounded-[9px]",
        }}
      />

      <TextSheet
        open={sheet === "template"}
        onClose={() => setSheet(null)}
        title="Enregistrer comme modèle"
        label="Nom du modèle"
        initial={title}
        confirmLabel="Enregistrer le modèle"
        hint="Le modèle garde les semaines, les phases et les séances, sans le sportif ni les dates."
        pending={pending}
        onConfirm={(name) =>
          startTransition(async () => {
            const result = await saveProgramAsTemplate(organizationId, programId, name);
            if (!result.ok) return toast(result.message);
            done("Modèle enregistré dans Mes modèles.");
          })
        }
      />
      {settings ? (
        <>
          <TextSheet
            open={sheet === "rename"}
            onClose={() => setSheet(null)}
            title="Renommer le programme"
            label="Titre"
            initial={settings.title}
            confirmLabel="Renommer"
            pending={pending}
            {...(nextPublication ? { hint: nextPublication } : {})}
            onConfirm={(value) => change({ title: value }, "Programme renommé.")}
          />
          <DisciplineSheet
            open={sheet === "discipline"}
            onClose={() => setSheet(null)}
            title="Changer la discipline"
            initial={settings.discipline}
            {...(nextPublication ? { hint: nextPublication } : {})}
            onConfirm={(discipline) => change({ discipline }, "Discipline du programme changée.")}
          />
          <DatesSheet
            open={sheet === "dates"}
            onClose={() => setSheet(null)}
            startDate={settings.startDate}
            weeksCount={settings.weeksCount}
            others={settings.others}
            published={settings.published}
            onConfirm={(startDate) => change({ startDate }, "Dates du programme modifiées.")}
          />
          <GoalSheet
            open={sheet === "goal"}
            onClose={() => setSheet(null)}
            goal={settings.goal ?? undefined}
            hyrox={settings.hyrox}
            onConfirm={(goal) =>
              change({ goal: goal ?? null }, "Objectif du programme enregistré.")
            }
          />
        </>
      ) : null}
      <ConfirmDialog
        open={sheet === "archive"}
        onClose={() => setSheet(null)}
        title="Archiver ce programme ?"
        confirmLabel="Archiver"
        icon={Archive}
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await archiveProgram(organizationId, programId);
            if (!result.ok) return toast(result.message);
            done("Programme archivé.");
          })
        }
      >
        Il quitte la liste des programmes en cours et la fiche du sportif garde son historique. Ses
        versions publiées restent conservées.
      </ConfirmDialog>
      <ConfirmDialog
        open={sheet === "delete"}
        onClose={() => setSheet(null)}
        title="Supprimer ce programme ?"
        confirmLabel="Supprimer"
        icon={Trash2}
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteProgram(organizationId, programId);
            if (!result.ok) return toast(result.message);
            done("Programme supprimé.");
          })
        }
      >
        « {title} » est supprimé définitivement : ses semaines, ses séances et ses versions publiées
        (PDF compris). Pour le garder sans le voir, archive-le plutôt.
      </ConfirmDialog>
    </>
  );
}
