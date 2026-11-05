"use client";

import { ChartNoAxesGantt, ChartPie, ChevronDown, Minus, Plus, Table2 } from "lucide-react";
import { Children, useState, type ReactNode } from "react";

import { useOpenNewPayment } from "@/components/blocks/new-payment-sheet";
import { phoneFabClass } from "@/components/layout/mobile-bar";
import { MenuDialog } from "@/components/ui/overlay";

import { DonutChart, type DonutSegment } from "./donut-chart";

// Morceaux interactifs de la Comptabilité, kit « Coory Pages », page 04 (D-130). La page reste une
// page serveur ; ici, seulement ce qui change sans recharger : la bascule anneau / barres, « Voir
// les N » des mouvements, le tableau repliable et le menu « + » du téléphone.

// « Reçu par mode de paiement » : anneau ou barre (deux boutons icône, aria-pressed).
export function ShareCard({
  subtitle,
  total,
  segments,
  caption,
}: {
  subtitle: string;
  total: string;
  segments: DonutSegment[];
  caption: string;
}) {
  const [view, setView] = useState<"pie" | "bars">("pie");
  return (
    <section
      aria-labelledby="share-title"
      className="flex min-w-0 flex-col gap-[18px] rounded-[22px] bg-surface px-4 py-[18px] inset-ring inset-ring-line lg:rounded-[20px] lg:px-6 lg:py-[22px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="share-title" className="text-[16px] leading-[normal] font-semibold">
            Reçu par mode de paiement
          </h2>
          <p className="text-[13px] leading-[1.4] text-muted">{subtitle}</p>
        </div>
        <div
          role="group"
          aria-label="Type de graphique"
          className="flex shrink-0 gap-0.5 rounded-[10px] bg-dlg-tile p-[3px]"
        >
          {(
            [
              ["pie", "Graphique circulaire", ChartPie],
              ["bars", "Graphique en barre", ChartNoAxesGantt],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={`relative grid h-[30px] w-[34px] place-items-center rounded-[8px] transition-[background-color,color,box-shadow] duration-150 after:absolute after:inset-x-0 after:-inset-y-[7px] ${
                view === value
                  ? "bg-surface text-text shadow-[0_1px_2px_rgba(22,18,40,0.10)]"
                  : "text-muted hover:text-text"
              }`}
            >
              <Icon aria-hidden size={15} strokeWidth={1.9} />
            </button>
          ))}
        </div>
      </div>
      <DonutChart view={view} segments={segments} total={total} caption={caption} />
    </section>
  );
}

// Les 5 premières lignes, puis « Voir les N paiements » / « Afficher moins » (chevron qui pivote).
export function ShowMore({
  children,
  label,
  listLabel,
  first = 5,
}: {
  children: ReactNode;
  // « Voir les 12 paiements »
  label: string;
  // Nom de la liste pour les lecteurs d'écran (« Liste des paiements »).
  listLabel: string;
  first?: number;
}) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  return (
    <>
      <ul aria-label={listLabel} className="flex flex-col">
        {open ? items : items.slice(0, first)}
      </ul>
      {items.length > first ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="mx-4 flex h-11 items-center justify-center gap-1.5 border-t border-line text-[13.5px] leading-[normal] font-semibold whitespace-nowrap text-violet-text lg:mx-6"
        >
          {open ? "Afficher moins" : label}
          <ChevronDown
            aria-hidden
            size={15}
            strokeWidth={2.2}
            className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </>
  );
}

// « Tableau de comptabilité » repliable (aria-expanded) ; les périodes sans activité sont cachées
// derrière « Afficher les N mois sans activité » (lignes marquées data-empty).
export function LedgerCard({
  subtitle,
  emptyCount,
  emptyLabel,
  children,
}: {
  subtitle: string;
  emptyCount: number;
  // « mois », « semaines », « années »
  emptyLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  return (
    <section
      aria-labelledby="ledger-title"
      className="flex min-w-0 flex-col overflow-hidden rounded-[22px] bg-surface inset-ring inset-ring-line lg:rounded-[20px]"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="ledger-body"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 px-4 py-[18px] text-left lg:px-6"
      >
        <span
          aria-hidden
          className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-dlg-tile text-text-2"
        >
          <Table2 size={16} strokeWidth={1.8} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span id="ledger-title" className="text-[15px] leading-[normal] font-semibold text-text">
            Tableau de comptabilité
          </span>
          <span className="text-[12.5px] leading-[1.4] text-muted">{subtitle}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[13px] leading-[normal] font-semibold whitespace-nowrap text-violet-text">
          {open ? "Masquer" : "Afficher"}
          <ChevronDown
            aria-hidden
            size={15}
            strokeWidth={2.2}
            className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open ? (
        <div
          id="ledger-body"
          className={`border-t border-line px-4 pb-3 lg:px-6 ${showEmpty ? "" : "[&_tr[data-empty]]:hidden"}`}
        >
          {children}
          {emptyCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowEmpty((value) => !value)}
              className="h-10 w-full text-[12.5px] leading-[normal] font-medium text-muted transition-colors duration-150 hover:text-text"
            >
              {showEmpty
                ? `Masquer les ${emptyLabel} sans activité`
                : `Afficher les ${emptyCount} ${emptyLabel} sans activité`}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

// Téléphone : le bouton flottant « + » et son menu (Nouveau paiement · Nouvelle dépense), ancré en
// bas à droite ; le « + » pivote en « × ». Les fenêtres sont celles de la page (les mêmes que les
// boutons de l'en-tête sur ordinateur).
export function AccountingFab() {
  const [open, setOpen] = useState(false);
  const openPayment = useOpenNewPayment();
  const row =
    "flex min-h-[62px] w-full items-center gap-3.5 rounded-[14px] px-3 py-2 text-left transition-[background-color] duration-150 hover:bg-dlg-field";
  return (
    <>
      <button
        type="button"
        aria-label={open ? "Fermer le menu" : "Nouveau paiement ou nouvelle dépense"}
        aria-expanded={open}
        data-phone-fab=""
        onClick={() => setOpen((value) => !value)}
        className={phoneFabClass}
      >
        <Plus
          aria-hidden
          size={24}
          strokeWidth={2.2}
          className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
      </button>
      <MenuDialog open={open} onClose={() => setOpen(false)} title="Ajouter">
        <button
          type="button"
          disabled={!openPayment}
          onClick={() => {
            setOpen(false);
            openPayment?.();
          }}
          className={row}
        >
          <span
            aria-hidden
            className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-status-accent-soft text-violet-text"
          >
            <Plus size={18} strokeWidth={2.2} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15.5px] leading-[normal] font-semibold">Nouveau paiement</span>
            <span className="text-[13px] leading-[normal] text-muted">
              Un sportif t&apos;a payé
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            window.dispatchEvent(new Event("coory:new-expense"));
          }}
          className={row}
        >
          <span
            aria-hidden
            className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-status-warn-soft text-status-warn"
          >
            <Minus size={18} strokeWidth={2.2} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15.5px] leading-[normal] font-semibold">Nouvelle dépense</span>
            <span className="text-[13px] leading-[normal] text-muted">
              Salle, matériel, abonnement…
            </span>
          </span>
        </button>
      </MenuDialog>
    </>
  );
}
