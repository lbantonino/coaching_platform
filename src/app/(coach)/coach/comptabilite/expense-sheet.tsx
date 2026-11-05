"use client";

import { Minus, Tags } from "lucide-react";
import { useActionState, useEffect, useId, useState } from "react";

import { CategoryManager } from "@/components/blocks/category-manager";
import { useMoney } from "@/components/blocks/money-context";
import { buttonClass } from "@/components/ui/button";
import {
  DlgCheckCard,
  DlgDate,
  DlgField,
  DlgHint,
  DlgSelect,
  DlgSuffixInput,
} from "@/components/ui/dialog-fields";
import {
  dlgErrorClass,
  dlgFormGridClass,
  dlgInputClass,
  dlgPrimaryButtonClass,
} from "@/components/ui/dialog-styles";
import { FieldCheck } from "@/components/ui/field-check";
import { DialogBody, DialogFooter, Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import {
  currencySymbol,
  formatVatRate,
  type Currency,
  parseAmount,
  parseVatRate,
  splitVat,
} from "@/domain/billing/money";
import type { DocumentCategory } from "@/domain/documents/documents";
import type { ExpenseFormState } from "@/features/billing/expense-actions";
import type { CategoryResult } from "@/features/documents/actions";

// « Nouvelle dépense » (D-73, décisions d'Antonino du 29/10/2026) : description, catégorie (liste du
// coach, modifiable ici), montant PAYÉ TVA comprise, taux de TVA (coach soumis : pré-rempli avec son
// taux habituel, la TVA récupérable s'affiche ; « Appliquer la TVA » décochée : dépense sans TVA,
// D-118), date, et « Se répète chaque mois » (loyer, abonnement) avec une fin facultative.
type Action = (previous: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
export type ExpenseCategoryActions = {
  create: (name: string) => Promise<CategoryResult>;
  rename: (categoryId: string, name: string) => Promise<CategoryResult>;
  remove: (categoryId: string) => Promise<CategoryResult>;
  recolor: (categoryId: string, color: string) => Promise<CategoryResult>;
};

const initial: ExpenseFormState = { error: null, attempt: 0, values: null, saved: false };

export function NewExpenseButton({
  action,
  categories,
  categoryActions,
  vatSubject,
  today,
}: {
  action: Action;
  categories: DocumentCategory[];
  categoryActions: ExpenseCategoryActions;
  vatSubject: boolean;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  // Téléphone (kit « Coory Pages », 04, D-130) : le menu du bouton flottant ouvre cette fenêtre.
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("coory:new-expense", show);
    return () => window.removeEventListener("coory:new-expense", show);
  }, []);
  return (
    <>
      {/* En-tête, ordinateur : 32 px, filet (kit) ; sur téléphone, le bouton flottant le remplace. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({
          variant: "outline",
          size: "md",
          className:
            "max-lg:hidden lg:h-8! lg:gap-1.5! lg:rounded-[9px]! lg:px-3! lg:text-[12.5px]! lg:[&>svg]:size-3.5",
        })}
      >
        <Minus aria-hidden size={16} strokeWidth={2} />
        Nouvelle dépense
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle dépense"
        subtitle="Ce que tu as payé pour ton activité : salle, matériel, assurance…"
        bare
      >
        {open ? (
          <ExpenseForm
            onCancel={() => setOpen(false)}
            action={action}
            categories={categories}
            vatSubject={vatSubject}
            today={today}
            onManage={() => setManaging(true)}
            onSaved={() => setOpen(false)}
          />
        ) : null}
      </Sheet>
      <Sheet
        open={managing}
        onClose={() => setManaging(false)}
        onBack={() => setManaging(false)}
        title="Catégories de dépenses"
        subtitle="Supprimer une catégorie garde ses dépenses : elles deviennent « sans catégorie »."

        bare
      >
        {managing ? (
          <CategoryManager
            categories={categories}
            actions={categoryActions}
            items="dépenses"
            onDone={() => setManaging(false)}
          />
        ) : null}
      </Sheet>
    </>
  );
}

function ExpenseForm({
  action,
  categories,
  vatSubject,
  today,
  onManage,
  onSaved,
  onCancel,
}: {
  action: Action;
  categories: DocumentCategory[];
  vatSubject: boolean;
  today: string;
  onManage: () => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const toast = useToast();
  const { currency, vatRate: habitual, format } = useMoney();
  useEffect(() => {
    if (!state.saved) return;
    toast("Dépense enregistrée.");
    onSaved();
  }, [state, toast, onSaved]);

  const v = state.values ?? {
    label: "",
    categoryId: "",
    amount: "",
    vatRate: String(habitual).replace(".", ","),
    spentOn: today,
    repeatsMonthly: false,
    endsOn: "",
  };
  return (
    <Fields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.error}
      values={v}
      categories={categories}
      vatSubject={vatSubject}
      currency={currency}
      format={format}
      onManage={onManage}
      onCancel={onCancel}
    />
  );
}

function Fields({
  formAction,
  pending,
  error,
  values: v,
  categories,
  vatSubject,
  currency,
  format,
  onManage,
  onCancel,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: NonNullable<ExpenseFormState["values"]>;
  categories: DocumentCategory[];
  vatSubject: boolean;
  currency: Currency;
  format: (cents: number) => string;
  onManage: () => void;
  onCancel: () => void;
}) {
  const formId = useId();
  const { vatRate: habitual } = useMoney();
  // « Appliquer la TVA » (D-118, coach soumis à la TVA) : décochée, la dépense est notée sans TVA
  // (taux 0) ; après une erreur, la saisie revient ; recocher redonne le taux habituel.
  const initialRate = parseVatRate(v.vatRate);
  const [applyVat, setApplyVat] = useState(initialRate !== 0);
  const withVat = vatSubject && applyVat;
  const [amount, setAmount] = useState(v.amount);
  const [vatRate, setVatRate] = useState(
    initialRate === 0 ? String(habitual).replace(".", ",") : v.vatRate,
  );
  const [monthly, setMonthly] = useState(v.repeatsMonthly);
  const cents = parseAmount(amount);
  const rate = parseVatRate(vatRate);
  // Montant payé, TVA comprise : on en déduit HTVA et TVA.
  const totals = withVat && cents !== null && rate !== null ? splitVat(cents, rate) : null;
  // Kit (boîte 27) : grille de 12 colonnes, montant et TVA à suffixe, aide sous les montants,
  // répétition en carte à cocher, boutons dans le pied fixe.
  return (
    <>
      <DialogBody>
        <form id={formId} action={formAction} className={dlgFormGridClass} noValidate>
          <DlgField label="Description" htmlFor="expense-label">
            <input
              id="expense-label"
              name="label"
              maxLength={120}
              placeholder="Ex. : loyer de la salle"
              defaultValue={v.label}
              className={dlgInputClass}
            />
          </DlgField>

          <DlgField
            label="Catégorie"
            htmlFor="expense-category"
            aside={
              <button
                type="button"
                onClick={onManage}
                className="inline-flex items-center gap-1.5 text-[13px] leading-[normal] font-semibold whitespace-nowrap text-dlg-accent transition-opacity duration-150 hover:opacity-80"
              >
                <Tags aria-hidden size={14} strokeWidth={2} />
                Gérer les catégories
              </button>
            }
          >
            <DlgSelect id="expense-category" name="categoryId" defaultValue={v.categoryId}>
              <option value="">Sans catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </DlgSelect>
          </DlgField>

          <DlgField
            label={
              <>
                Montant payé
                <span className="sr-only">
                  {" "}
                  ({withVat ? "TVAC, " : ""}
                  {currency})
                </span>
              </>
            }
            htmlFor="expense-amount"
            half={withVat}
          >
            <DlgSuffixInput
              id="expense-amount"
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Ex. : 605"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-describedby="expense-amount-hint"
              suffix={withVat ? `${currencySymbol(currency)} TVAC` : currencySymbol(currency)}
            />
            <FieldCheck htmlFor="expense-amount" rule="amount" />
          </DlgField>
          {withVat ? (
            <DlgField label="Taux de TVA" htmlFor="expense-vat" half>
              <DlgSuffixInput
                id="expense-vat"
                name="vatRate"
                inputMode="decimal"
                autoComplete="off"
                placeholder="21"
                value={vatRate}
                onChange={(event) => setVatRate(event.target.value)}
                suffix="%"
              />
            </DlgField>
          ) : (
            <input type="hidden" name="vatRate" value="0" />
          )}
          <DlgHint id="expense-amount-hint" live>
            {!vatSubject
              ? "Le montant que tu as payé."
              : !withVat
                ? "Sans TVA : le montant payé compte tel quel."
                : totals && rate !== null
                  ? `${format(totals.exclCents)} HTVA + ${format(totals.vatCents)} de TVA récupérable (${formatVatRate(rate)}).`
                  : "TVA comprise : la TVA récupérable se calcule toute seule."}
          </DlgHint>
          {vatSubject ? (
            <DlgCheckCard
              checked={applyVat}
              onChange={(event) => setApplyVat(event.target.checked)}
              label="Appliquer la TVA"
              description="Décoche pour une dépense sans TVA."
            />
          ) : null}

          <DlgField
            label={monthly ? "Première dépense le" : "Payée le"}
            htmlFor="expense-date"
            half
          >
            <DlgDate id="expense-date" name="spentOn" defaultValue={v.spentOn} />
          </DlgField>
          <DlgCheckCard
            name="repeatsMonthly"
            checked={monthly}
            onChange={(event) => setMonthly(event.target.checked)}
            label="Se répète chaque mois"
            description="Loyer, abonnement…"
            half
          />
          {monthly ? (
            <>
              <DlgField label="Jusqu'au" htmlFor="expense-end" optional half>
                <DlgDate
                  id="expense-end"
                  name="endsOn"
                  defaultValue={v.endsOn}
                  aria-describedby="expense-end-hint"
                />
              </DlgField>
              <DlgHint id="expense-end-hint">
                Sans date, elle compte chaque mois jusqu&apos;à ce que tu l&apos;arrêtes.
              </DlgHint>
            </>
          ) : null}

          {error ? (
            <p role="alert" className={dlgErrorClass}>
              {error}
            </p>
          ) : null}
        </form>
      </DialogBody>
      <DialogFooter
        onCancel={onCancel}
        primary={
          <button type="submit" form={formId} disabled={pending} className={dlgPrimaryButtonClass}>
            {pending ? "Enregistrement…" : "Enregistrer la dépense"}
          </button>
        }
      />
    </>
  );
}
