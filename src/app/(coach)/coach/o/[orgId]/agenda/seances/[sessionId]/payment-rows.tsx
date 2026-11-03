"use client";

import { Check } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

// Dates d'une séance à encaisser (D-52). « Marquer payée » et « Annuler » s'affichent tout de suite
// (useOptimistic, audit apple-design du 28/10), l'action serveur enregistre ensuite ; en cas d'échec
// la ligne revient seule à son état réel et un message le dit.
export type PaymentRow = {
  date: string;
  // « Lun 26 oct. · 07:00 » (téléphone) et « Lundi 26 octobre · 07:00 » (ordinateur).
  compact: string;
  long: string;
  state: "paid" | "covered" | "unpaid" | "future";
  // Ligne payée : « Payée le 26 oct. · 78,65 € ».
  paidLabel: string | null;
};

export function PaymentRows({
  rows,
  priced,
  amountLabel,
  mark,
  unmark,
}: {
  rows: PaymentRow[];
  priced: boolean;
  // Montant reçu pour une date (« 78,65 € ») : affiché tout de suite après « Marquer payée ».
  amountLabel: string;
  mark: (date: string) => Promise<{ ok: boolean }>;
  unmark: (date: string) => Promise<{ ok: boolean }>;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(rows, (state, change: { date: string; paid: boolean }) =>
    state.map((row) =>
      row.date !== change.date
        ? row
        : change.paid
          ? { ...row, state: "paid" as const, paidLabel: `Payée aujourd'hui · ${amountLabel}` }
          : { ...row, state: "unpaid" as const, paidLabel: null },
    ),
  );

  const toggle = (row: PaymentRow, paid: boolean) =>
    startTransition(async () => {
      setShown({ date: row.date, paid });
      const { ok } = await (paid ? mark(row.date) : unmark(row.date));
      toast(
        ok
          ? paid
            ? "Paiement enregistré."
            : "Paiement annulé."
          : "Le paiement n'a pas pu être enregistré. Réessaie.",
      );
    });

  // Une ligne par date (filet au-dessus) : sur téléphone, comme une ligne de liste (64 px) ; sur
  // ordinateur, compacte (48 px) pour que la carte Prix en montre plusieurs (03/11).
  const small = "lg:h-8! lg:rounded-lg! lg:px-3! lg:text-[12.5px]!";
  return (
    <ul aria-label="Paiements des dates" className="flex flex-col">
      {shown.map((row) => (
        <li
          key={row.date}
          className="flex min-h-16 items-center gap-3 border-t border-line py-2.5 lg:min-h-12 lg:py-1.5"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold lg:text-[13.5px] lg:font-medium">
              <span className="lg:hidden">{row.compact}</span>
              <span className="max-lg:hidden">{row.long}</span>
            </span>
            <span className="truncate text-[13px] text-muted lg:text-[12px]">
              {row.state === "paid"
                ? row.paidLabel
                : row.state === "covered"
                  ? "Comprise dans le forfait du sportif"
                  : row.state === "future"
                    ? "À venir"
                    : "Pas encore payée"}
            </span>
          </span>
          {row.state === "paid" ? (
            <span className="flex shrink-0 items-center gap-1">
              <Badge tone="ok">Payée</Badge>
              <button
                type="button"
                onClick={() => toggle(row, false)}
                aria-label={`Annuler le paiement : ${row.long}`}
                className={buttonClass({ variant: "ghost", className: small })}
              >
                Annuler
              </button>
            </span>
          ) : row.state === "covered" ? (
            <Badge tone="ok">Forfait</Badge>
          ) : priced ? (
            <button
              type="button"
              onClick={() => toggle(row, true)}
              aria-label={`Marquer payée : ${row.long}`}
              className={buttonClass({ variant: "outline", className: `shrink-0 ${small}` })}
            >
              Marquer payée
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

// La date affichée (carte Prix depuis le 03/11) : « Marquer payée », ou ce qu'il en est (payée, comprise
// dans un forfait). Même enregistrement que la liste ci-dessus. `className` : taille du bouton.
export function DatePayment({
  row,
  priced,
  amountLabel,
  mark,
  className = "",
}: {
  row: PaymentRow;
  priced: boolean;
  amountLabel: string;
  mark: (date: string) => Promise<{ ok: boolean }>;
  className?: string;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(row, (state, paid: boolean) =>
    paid
      ? { ...state, state: "paid" as const, paidLabel: `Payée aujourd'hui · ${amountLabel}` }
      : state,
  );
  if (shown.state === "paid" || shown.state === "covered") {
    return (
      <p className="flex items-center gap-2 text-[13.5px] text-ok">
        <Check aria-hidden size={17} strokeWidth={2.2} className="shrink-0" />
        {shown.state === "paid" ? shown.paidLabel : "Comprise dans le forfait du sportif"}
      </p>
    );
  }
  if (shown.state === "future" || !priced) return null;
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          setShown(true);
          const { ok } = await mark(row.date);
          toast(ok ? "Paiement enregistré." : "Le paiement n'a pas pu être enregistré. Réessaie.");
        })
      }
      aria-label={`Marquer cette date payée : ${row.long}`}
      className={buttonClass({ variant: "outline", className })}
    >
      <Check aria-hidden size={16} strokeWidth={2.2} />
      Marquer payée
    </button>
  );
}
