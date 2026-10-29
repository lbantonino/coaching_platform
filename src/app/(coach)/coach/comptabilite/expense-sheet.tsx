"use client";

import { Minus, Tags } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { CategoryManager } from "@/components/blocks/category-manager";
import { useMoney } from "@/components/blocks/money-context";
import { buttonClass } from "@/components/ui/button";
import { FieldCheck } from "@/components/ui/field-check";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { VatRateInput } from "@/components/ui/vat-rate-input";
import { totalsFromEntry } from "@/domain/billing/invoice-document";
import { formatVatRate, parseAmount, parseVatRate } from "@/domain/billing/money";
import type { DocumentCategory } from "@/domain/documents/documents";
import type { ExpenseFormState } from "@/features/billing/expense-actions";
import type { CategoryResult } from "@/features/documents/actions";

// « Nouvelle dépense » (D-73, décisions d'Antonino du 29/10/2026) : description, catégorie (liste du
// coach, modifiable ici), montant PAYÉ TVA comprise, taux de TVA (coach soumis : pré-rempli avec son
// taux habituel, la TVA récupérable s'affiche), date, et « Se répète chaque mois » (loyer,
// abonnement) avec une fin facultative.
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
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ variant: "outline", size: "md" })}
      >
        <Minus aria-hidden size={16} strokeWidth={2} />
        Nouvelle dépense
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle dépense"
        subtitle="Ce que tu as payé pour ton activité : salle, matériel, assurance…"
      >
        {open ? (
          <ExpenseForm
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
        title="Catégories de dépenses"
        subtitle="Supprimer une catégorie garde ses dépenses : elles deviennent « sans catégorie »."
      >
        {managing ? <CategoryManager categories={categories} actions={categoryActions} /> : null}
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
}: {
  action: Action;
  categories: DocumentCategory[];
  vatSubject: boolean;
  today: string;
  onManage: () => void;
  onSaved: () => void;
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
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: NonNullable<ExpenseFormState["values"]>;
  categories: DocumentCategory[];
  vatSubject: boolean;
  currency: string;
  format: (cents: number) => string;
  onManage: () => void;
}) {
  const [amount, setAmount] = useState(v.amount);
  const [vatRate, setVatRate] = useState(v.vatRate);
  const [monthly, setMonthly] = useState(v.repeatsMonthly);
  const cents = parseAmount(amount);
  const rate = parseVatRate(vatRate);
  const totals = cents !== null && rate !== null ? totalsFromEntry(cents, "incl", rate) : null;
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="expense-label" className={labelClass}>
          Description
        </label>
        <input
          id="expense-label"
          name="label"
          maxLength={120}
          placeholder="Ex. : loyer de la salle"
          defaultValue={v.label}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="expense-category" className={labelClass}>
            Catégorie
          </label>
          <button
            type="button"
            onClick={onManage}
            className="inline-flex min-h-9 items-center gap-1.5 text-[13px] text-muted transition-colors duration-150 hover:text-text"
          >
            <Tags aria-hidden size={14} strokeWidth={1.8} />
            Gérer les catégories
          </button>
        </div>
        <select
          id="expense-category"
          name="categoryId"
          defaultValue={v.categoryId}
          className={inputClass}
        >
          <option value="">Sans catégorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className={`grid gap-4 ${vatSubject ? "sm:grid-cols-2" : ""}`}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense-amount" className={labelClass}>
            Montant payé ({vatSubject ? "TVAC, " : ""}
            {currency})
          </label>
          <input
            id="expense-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex. : 605"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-describedby="expense-amount-hint"
            className={`${inputClass} font-mono`}
          />
          <FieldCheck htmlFor="expense-amount" rule="amount" />
        </div>
        {vatSubject ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expense-vat" className={labelClass}>
              Taux de TVA
            </label>
            <VatRateInput id="expense-vat" value={vatRate} onChange={setVatRate} />
          </div>
        ) : (
          <input type="hidden" name="vatRate" value="0" />
        )}
      </div>
      <p id="expense-amount-hint" aria-live="polite" className={`-mt-2 ${hintClass}`}>
        {!vatSubject
          ? "Le montant que tu as payé."
          : totals && rate !== null
            ? `${format(totals.exclCents)} HTVA + ${format(totals.vatCents)} de TVA récupérable (${formatVatRate(rate)}).`
            : "Le montant payé, TVA comprise : la TVA récupérable se calcule toute seule."}
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="expense-date" className={labelClass}>
          {monthly ? "Première dépense le" : "Payée le"}
        </label>
        <input
          id="expense-date"
          name="spentOn"
          type="date"
          defaultValue={v.spentOn}
          className={inputClass}
        />
      </div>

      <label className="inline-flex w-fit cursor-pointer items-center gap-2.5 text-[15px]">
        <input
          type="checkbox"
          name="repeatsMonthly"
          checked={monthly}
          onChange={(event) => setMonthly(event.target.checked)}
          className="size-4 accent-[var(--text)]"
        />
        Se répète chaque mois (loyer, abonnement…)
      </label>
      {monthly ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense-end" className={labelClass}>
            Jusqu&apos;au <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="expense-end"
            name="endsOn"
            type="date"
            defaultValue={v.endsOn}
            aria-describedby="expense-end-hint"
            className={inputClass}
          />
          <p id="expense-end-hint" className={hintClass}>
            Sans date, elle compte chaque mois jusqu&apos;à ce que tu l&apos;arrêtes.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "primary", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Enregistrer la dépense"}
        </button>
        {error ? (
          <p role="alert" className={errorTextClass}>
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
