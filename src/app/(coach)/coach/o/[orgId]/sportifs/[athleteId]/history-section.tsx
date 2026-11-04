"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import type { ActivityEvent } from "@/features/activity/build";

import { ActivityTimeline } from "./activity-timeline";

// Nombre d'événements montrés avant « Voir tout l'historique » (maquette « Sportifs », page 2k).
const SHOWN = 6;

// Onglet « Historique » de la fiche, d'après la maquette « Sportifs » du 03/11/2026 (page 2k) : une
// carte pleine largeur (jusqu'au bas du menu sur ordinateur), les 6 derniers événements, puis
// « Voir tout l'historique (n) » / « Réduire » (demande d'Antonino pendant la conception). Le bouton
// n'apparaît que s'il y a plus de 6 événements. Sur téléphone, il passe sous le titre.
export function HistorySection({ events }: { events: ActivityEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const more = events.length > SHOWN;
  const shown = expanded || !more ? events : events.slice(0, SHOWN);

  return (
    <section
      aria-labelledby="history-title"
      className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft lg:flex-1"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
          <h2
            id="history-title"
            className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
          >
            Historique
          </h2>
          <p className="text-[13.5px] leading-[1.5] text-pretty text-muted">
            Tout ce qui s&apos;est passé sur cette fiche, du plus récent au plus ancien.
          </p>
        </div>
        {more ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((value) => !value)}
            className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-[10px] bg-surface px-3 text-[13px] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2 active:scale-[0.97]"
          >
            {expanded ? "Réduire" : `Voir tout l’historique (${events.length})`}
            <ChevronDown
              aria-hidden
              size={13}
              strokeWidth={2}
              className={`transition-transform duration-200 motion-reduce:transition-none ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        ) : null}
      </div>

      {events.length === 0 ? (
        <p
          role="status"
          className="rounded-2xl border border-dashed border-line-2 p-[18px] text-[14px] leading-[1.5] text-muted"
        >
          Rien pour l&apos;instant : chaque changement de la fiche s&apos;inscrira ici.
        </p>
      ) : (
        <div id={listId}>
          <ActivityTimeline events={shown} label="Historique de la fiche" />
        </div>
      )}
    </section>
  );
}
