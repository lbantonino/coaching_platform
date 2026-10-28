"use client";

import { useOptimistic, useTransition } from "react";

import { ListRow } from "@/components/blocks/list-row";
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

  return (
    <ul aria-label="Paiements des dates" className="flex flex-col">
      {shown.map((row) => (
        <li key={row.date}>
          <ListRow
            title={
              <>
                <span className="lg:hidden">{row.compact}</span>
                <span className="max-lg:hidden">{row.long}</span>
              </>
            }
            sub={
              row.state === "paid"
                ? row.paidLabel
                : row.state === "covered"
                  ? "Comprise dans le forfait du sportif"
                  : row.state === "future"
                    ? "À venir"
                    : "Pas encore payée"
            }
            trailing={
              row.state === "paid" ? (
                <span className="flex items-center gap-1">
                  <Badge tone="ok">Payée</Badge>
                  <button
                    type="button"
                    onClick={() => toggle(row, false)}
                    aria-label={`Annuler le paiement : ${row.long}`}
                    className={buttonClass({ variant: "ghost" })}
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
                  className={buttonClass({ variant: "outline" })}
                >
                  Marquer payée
                </button>
              ) : null
            }
          />
        </li>
      ))}
    </ul>
  );
}
