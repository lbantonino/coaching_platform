"use client";

import { Ellipsis, Layers, MessageSquare, Pencil, RefreshCw, Send, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { dialogDisciplineIcons } from "@/components/ui/kit-icons";
import { ActionMenu } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { DISCIPLINES, disciplineLabels, type Discipline } from "@/domain/training/discipline";
import { setAthletesProgramType, setAthletesStatus } from "@/features/athletes/actions";
import type { AthleteStatus } from "@/features/athletes/schemas";

import { statusChoices } from "../athlete-table";

// Menu « ••• » de l'en-tête de la fiche (demande d'Antonino du 26/10) : les mêmes actions que dans la
// liste des sportifs. Statut et type ouvrent leur choix, avec une flèche pour revenir au menu.
type MenuKind = "actions" | "status" | "type";

export function AthleteFicheMenu({
  organizationId,
  athlete,
  basePath,
  phone = false,
}: {
  organizationId: string;
  athlete: {
    id: string;
    name: string;
    status: AthleteStatus;
    programType: Discipline | null;
    hasAccount: boolean;
    // Niveau en toutes lettres (« Confirmé »), pour le sous-titre du menu.
    level: string | null;
  };
  basePath: string;
  // Téléphone : bouton de 44 px dans la carte d'identité ; ordinateur : 32 px dans l'en-tête.
  phone?: boolean;
}) {
  const [menu, setMenu] = useState<MenuKind | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const apply = (run: () => Promise<{ ok: boolean; error: string | null }>, done: string) => {
    startTransition(async () => {
      const result = await run();
      toast(result.ok ? done : (result.error ?? "Réessaie."));
      router.refresh();
    });
  };

  const items =
    menu === "status"
      ? statusChoices.map((choice) => ({
          label: choice.label,
          icon: choice.icon,
          tone: choice.tone,
          selected: athlete.status === choice.status,
          onSelect: () => {
            if (athlete.status === choice.status) return;
            apply(
              () => setAthletesStatus(organizationId, [athlete.id], choice.status),
              `Statut de ${athlete.name} : ${choice.label.toLowerCase()}.`,
            );
          },
        }))
      : menu === "type"
        ? DISCIPLINES.map((discipline) => ({
            label: disciplineLabels[discipline],
            icon: dialogDisciplineIcons[discipline],
            tone: discipline,
            selected: athlete.programType === discipline,
            onSelect: () => {
              if (athlete.programType === discipline) return;
              apply(
                () => setAthletesProgramType(organizationId, [athlete.id], discipline),
                `Programme de ${athlete.name} : ${disciplineLabels[discipline]}.`,
              );
            },
          }))
        : [
            {
              label: "Changer le statut",
              icon: RefreshCw,
              chevron: true,
              onSelect: () => setMenu("status"),
            },
            {
              label: "Changer le programme",
              icon: Layers,
              chevron: true,
              onSelect: () => setMenu("type"),
            },
            {
              label: "Modifier l'objectif",
              icon: Target,
              onSelect: () => router.push(`${basePath}?onglet=objectifs`, { scroll: false }),
            },
            {
              label: "Modifier la fiche",
              icon: Pencil,
              onSelect: () => router.push(`${basePath}?onglet=profil`, { scroll: false }),
            },
            ...(athlete.hasAccount
              ? [
                  {
                    label: "Écrire un message",
                    icon: MessageSquare,
                    onSelect: () => router.push(`/coach/messages?sportif=${athlete.id}`),
                  },
                ]
              : athlete.status !== "archived"
                ? [
                    {
                      label: "Inviter dans son espace",
                      icon: Send,
                      onSelect: () => router.push(`${basePath}/inviter`),
                    },
                  ]
                : []),
          ];

  return (
    <>
      <button
        type="button"
        aria-label={`Actions pour ${athlete.name}`}
        disabled={pending}
        onClick={() => setMenu("actions")}
        className={
          phone
            ? "grid size-11 shrink-0 place-items-center rounded-[13px] bg-bg text-text"
            : "grid size-8 shrink-0 place-items-center rounded-[9px] text-text-2 inset-ring inset-ring-line transition-colors duration-150 hover:bg-selected-hover"
        }
      >
        <Ellipsis aria-hidden size={phone ? 18 : 16} strokeWidth={1.8} />
      </button>
      <ActionMenu
        open={menu !== null}
        onClose={() => setMenu(null)}
        onBack={menu === "status" || menu === "type" ? () => setMenu("actions") : undefined}
        title={
          menu === "status"
            ? `Statut de ${athlete.name}`
            : menu === "type"
              ? `Programme de ${athlete.name}`
              : athlete.name
        }
        // Kit (boîte 06) : « Actif · Confirmé · Hyrox » sous le nom.
        subtitle={
          menu === "actions"
            ? [
                statusChoices.find((choice) => choice.status === athlete.status)?.label,
                athlete.level,
                athlete.programType ? disciplineLabels[athlete.programType] : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        items={items}
      />
    </>
  );
}
