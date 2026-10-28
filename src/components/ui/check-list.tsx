"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";

import { StatusBadge } from "./badge";
import { useToast } from "./toast";

// Liste à ronds cochables, façon widget Rappels de l'iPhone (demande d'Antonino, 23/10) : un rond par
// ligne, plein quand la tâche est faite. Le clic s'affiche tout de suite (useOptimistic), l'action
// serveur enregistre, puis un toast confirme ; en cas d'échec, la ligne revient seule à son état réel.
// `removeOnToggle` : la ligne quitte la liste au clic (carte du tableau de bord, onglets filtrés).
// Couleur : celle de la carte (--kpi), ou le rouge de l'app hors carte.
export type CheckItem = {
  id: string;
  title: string;
  sub?: string;
  // Lien de la précision (ex. la fiche du sportif concerné), sur la page seulement.
  subHref?: string;
  meta?: string;
  // Tâche urgente : « ! » rouge devant le titre (carte) ou pastille « Haute » (page).
  urgent?: boolean;
  checked: boolean;
  // Nom du rond pour les lecteurs d'écran (« Tâche faite : … »).
  label: string;
};

export function CheckList({
  items,
  action,
  empty,
  toasts,
  removeOnToggle = false,
  variant = "card",
}: {
  items: CheckItem[];
  action: (id: string, checked: boolean) => Promise<{ ok: boolean }>;
  empty: string;
  toasts: { checked: string; unchecked: string };
  removeOnToggle?: boolean;
  variant?: "card" | "page";
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(
    items,
    (state, change: { id: string; checked: boolean }) =>
      removeOnToggle
        ? state.filter((item) => item.id !== change.id)
        : state.map((item) =>
            item.id === change.id ? { ...item, checked: change.checked } : item,
          ),
  );

  const page = variant === "page";
  if (shown.length === 0) {
    return page ? (
      <p className="border-t border-line pt-3.5 text-[14px] text-muted">{empty}</p>
    ) : (
      <p className="min-w-0 flex-1 self-center text-[13px] text-muted">{empty}</p>
    );
  }

  // Après un changement réussi, le message propose « Annuler » : remet la tâche comme avant.
  const toggle = (item: CheckItem, undoable = true) => {
    const checked = !item.checked;
    startTransition(async () => {
      setShown({ id: item.id, checked });
      const { ok } = await action(item.id, checked);
      if (!ok) {
        toast("Le changement n'a pas pu être enregistré. Réessaie.");
        return;
      }
      toast(
        checked ? toasts.checked : toasts.unchecked,
        undoable
          ? { action: { label: "Annuler", onClick: () => toggle({ ...item, checked }, false) } }
          : undefined,
      );
    });
  };

  return (
    <ul className="flex min-w-0 flex-1 flex-col">
      {shown.map((item) => (
        <li
          key={item.id}
          className={`flex min-w-0 items-center gap-1 ${
            page ? "min-h-16 gap-2 border-t border-line py-2" : "min-h-11"
          }`}
        >
          <button
            type="button"
            role="checkbox"
            aria-checked={item.checked}
            aria-label={item.label}
            onClick={() => toggle(item)}
            className="group -ml-2.5 inline-flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <span
              aria-hidden
              className={`inline-flex size-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-150 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--kpi,var(--accent))] ${
                item.checked
                  ? "border-[var(--kpi,var(--accent))] bg-[var(--kpi,var(--accent))] text-surface"
                  : "border-[color-mix(in_srgb,var(--kpi,var(--accent))_45%,var(--line-2))] group-hover:border-[var(--kpi,var(--accent))]"
              }`}
            >
              {item.checked ? <Check size={13} strokeWidth={3} /> : null}
            </span>
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 items-baseline gap-2">
              <span
                className={`min-w-0 flex-1 truncate leading-snug ${
                  page ? "text-[15px] font-semibold" : "text-[13px] font-medium lg:text-[14px]"
                } ${item.checked ? "text-muted line-through" : ""}`}
              >
                {item.urgent && !page ? (
                  <>
                    <span
                      aria-hidden
                      className={`font-semibold ${item.checked ? "" : "text-accent"}`}
                    >
                      !{" "}
                    </span>
                    <span className="sr-only">Urgent : </span>
                  </>
                ) : null}
                {item.title}
              </span>
              {item.meta && !page ? (
                <span className="shrink-0 font-mono text-[11px] text-muted tabular max-lg:hidden">
                  {item.meta}
                </span>
              ) : null}
            </span>
            {item.sub ? (
              item.subHref ? (
                <Link
                  href={item.subHref}
                  className="w-fit max-w-full truncate text-[13px] leading-snug text-muted underline-offset-4 hover:text-text hover:underline"
                >
                  {item.sub}
                </Link>
              ) : (
                // Carte sur téléphone : l'intitulé seul, comme le widget Rappels de l'iPhone.
                <span
                  className={`truncate leading-snug text-muted ${page ? "text-[13px]" : "text-[12px] max-lg:hidden"}`}
                >
                  {item.sub}
                </span>
              )
            ) : null}
          </div>
          {page ? (
            <span className="flex shrink-0 flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-3">
              <StatusBadge label={item.urgent ? "Haute" : "Normale"} />
              {item.meta ? (
                <span className="font-mono text-[12px] text-muted tabular">{item.meta}</span>
              ) : null}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
