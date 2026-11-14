"use client";

import { Check, Clock, FileDown, X } from "lucide-react";
import Link from "next/link";

import { useOpenNewPayment } from "@/components/blocks/new-payment-sheet";
import { useOpenNewSession } from "@/components/blocks/new-session-sheet";
import { useOpenTaskSheet } from "@/components/blocks/task-sheet";
import { Spinner } from "@/components/ui/spinner";
import { canValidate, type CardState } from "@/features/assistant/cards";
import { toPaymentPrefill, toSessionPrefill, toTaskPrefill } from "@/features/assistant/form-data";

// Carte d'action de l'Assistant IA (lot 1 des actions, spec §5.2) : ce que l'assistant propose de
// faire, en clair, et rien n'est fait avant « Valider ». « Modifier » ouvre la fenêtre habituelle
// pré-remplie (séance, paiement, tâche) ; pour les autres actions, le coach corrige dans sa réponse.
// Une carte liée (sportif créé par une autre carte) attend que cette carte soit faite.
export function AssistantCard({
  card,
  cards,
  onValidate,
  onCancel,
  onModify,
}: {
  card: CardState;
  cards: CardState[];
  onValidate: () => void;
  onCancel: () => void;
  // `asked` : la correction se fait dans la conversation (pas de fenêtre pour cette action).
  onModify: (asked: boolean) => void;
}) {
  const openSession = useOpenNewSession();
  const openPayment = useOpenNewPayment();
  const openTask = useOpenTaskSheet();
  const parent = card.dependsOn ? cards.find((item) => item.id === card.dependsOn) : undefined;
  const waiting = card.status === "pending" && !canValidate(cards, card.id);
  const actionable = card.status === "pending" && !waiting;

  const modify = () => {
    const p = card.params;
    if (card.kind === "creer_seance" && openSession) {
      openSession({
        date: String(p.startsOn),
        time: String(p.startTime),
        values: toSessionPrefill(p),
      });
      onModify(false);
    } else if (card.kind === "noter_paiement" && openPayment) {
      openPayment(toPaymentPrefill(p));
      onModify(false);
    } else if (card.kind === "creer_tache" && openTask) {
      openTask(undefined, toTaskPrefill(p));
      onModify(false);
    } else {
      onModify(true);
    }
  };

  const faded = card.status === "cancelled" || card.status === "blocked";
  return (
    <section
      aria-label={card.title}
      className={`flex flex-col gap-3 rounded-[16px] bg-surface p-3.5 inset-ring inset-ring-line-2 md:p-4 ${
        faded ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-[14.5px] leading-[1.3] font-semibold text-text">{card.title}</h3>
        <ul className="flex flex-col gap-0.5">
          {card.summary.map((line, index) => (
            <li
              key={`${index}-${line}`}
              className={`text-[13.5px] leading-[1.45] break-words ${
                index === 0 ? "font-medium text-text" : "text-text-2"
              }`}
            >
              {line}
            </li>
          ))}
        </ul>
      </div>

      {waiting ? (
        <p className="flex items-center gap-2 text-[13px] leading-[1.4] text-muted">
          <Clock aria-hidden size={14} strokeWidth={1.9} className="shrink-0" />
          Après la création de {parent?.summary[0] ?? "la fiche"}
        </p>
      ) : null}

      {card.links && card.links.length > 0 ? (
        // Lot 2 (D-181) : les PDF d'un programme publié, à ouvrir ; rien à valider.
        <div className="flex flex-wrap items-center gap-2">
          {card.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[12px] px-3.5 text-[14px] font-medium text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2 md:h-9 md:rounded-[10px] md:text-[13.5px]"
            >
              <FileDown aria-hidden size={15} strokeWidth={1.9} className="shrink-0" />
              {link.label}
            </a>
          ))}
        </div>
      ) : card.status === "pending" ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!actionable}
            onClick={onValidate}
            className="inline-flex h-11 items-center justify-center rounded-[12px] bg-cta px-4 text-[14px] font-semibold text-on-cta transition-[scale,opacity] duration-150 active:scale-[0.97] disabled:opacity-40 md:h-9 md:rounded-[10px] md:text-[13.5px]"
          >
            Valider
          </button>
          <button
            type="button"
            disabled={!actionable}
            onClick={modify}
            className="inline-flex h-11 items-center justify-center rounded-[12px] px-3.5 text-[14px] font-medium text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2 disabled:opacity-40 md:h-9 md:rounded-[10px] md:text-[13.5px]"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-[12px] px-3 text-[14px] font-medium text-muted transition-colors duration-150 hover:text-text md:h-9 md:text-[13.5px]"
          >
            Annuler
          </button>
        </div>
      ) : card.status === "running" ? (
        <p className="flex items-center gap-2 text-[13.5px] text-muted">
          <Spinner /> En cours…
        </p>
      ) : card.status === "done" ? (
        <p className="flex items-center gap-2 text-[13.5px] font-medium text-text">
          <Check aria-hidden size={16} strokeWidth={2.2} className="text-ok" />
          Fait
          {card.href ? (
            <Link href={card.href} className="ml-1 text-violet-text hover:underline">
              Voir
            </Link>
          ) : null}
        </p>
      ) : card.status === "error" ? (
        <p role="alert" className="text-[13.5px] leading-[1.45] text-alert">
          {card.result}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-[13.5px] leading-[1.45] text-muted">
          <X aria-hidden size={14} strokeWidth={2} className="shrink-0" />
          {card.result ?? "Annulé"}
        </p>
      )}
    </section>
  );
}
