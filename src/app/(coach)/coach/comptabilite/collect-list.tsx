"use client";

import { useOptimistic, useTransition } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

// À encaisser (D-90) : les séances passées avec un prix, pas encore payées. Chaque ligne ouvre sa
// séance sur la bonne date ; « Marquer payée » enregistre le paiement comme sur la page de la séance.
// La ligne passe « Payée » tout de suite (useOptimistic) puis quitte la liste quand la page se
// recalcule ; en cas d'échec elle revient seule et un message le dit.
export type CollectRow = {
  key: string;
  sessionId: string;
  // Date de la série (clé du paiement).
  originalDate: string;
  title: string;
  // « 78,65 € · Hier · 07:00 · Coaching force » : montant et date d'abord, la fin se coupe si besoin.
  sub: string;
  href: string;
  // Pour les lecteurs d'écran : « Nadia El Amrani, hier à 07:00 ».
  label: string;
};

export function CollectList({
  rows,
  mark,
}: {
  rows: CollectRow[];
  mark: (sessionId: string, date: string) => Promise<{ ok: boolean }>;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [paid, setPaid] = useOptimistic<string[], string>([], (state, key) => [...state, key]);

  return (
    <ul aria-label="Séances à encaisser" className="flex flex-col">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center gap-2 border-t border-line">
          <ListRow divider={false} href={row.href} title={row.title} sub={row.sub} />
          {paid.includes(row.key) ? (
            <Badge tone="ok">Payée</Badge>
          ) : (
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  setPaid(row.key);
                  const { ok } = await mark(row.sessionId, row.originalDate);
                  toast(
                    ok
                      ? "Paiement enregistré."
                      : "Le paiement n'a pas pu être enregistré. Réessaie.",
                  );
                })
              }
              aria-label={`Marquer payée : ${row.label}`}
              // Téléphone : hauteur tactile normale, un peu moins large pour laisser la place au texte ;
              // ordinateur : compact, comme la carte Prix d'une séance.
              className={buttonClass({
                variant: "outline",
                className:
                  "shrink-0 px-3.5! text-[14px]! lg:h-8! lg:rounded-lg! lg:px-3! lg:text-[12.5px]!",
              })}
            >
              Marquer payée
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
