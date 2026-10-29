"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseExpenseForm, type ExpenseFormValues } from "@/domain/billing/expenses";
import {
  isCategoryColor,
  nextCategoryColor,
  parseCategoryName,
} from "@/domain/documents/documents";
import { requireOrgAccess } from "@/features/auth/guards";
import { isVatSubject } from "@/features/coach/legal-queries";
import type { CategoryResult } from "@/features/documents/actions";
import { createClient } from "@/lib/supabase/server";

// Dépenses du coach (D-73) : ajouter, supprimer ; et leurs catégories (créer, renommer, couleur,
// supprimer). Chaque action revérifie l'accès à l'organisation ; la RLS protège en plus (une
// catégorie d'une autre organisation est refusée par la clé étrangère composée).
export type ExpenseFormState = {
  error: string | null;
  attempt: number;
  values: ExpenseFormValues | null;
  saved: boolean;
};

const refresh = () => {
  revalidatePath("/coach");
  revalidatePath("/coach/comptabilite");
};

export async function createExpense(
  organizationId: string,
  previous: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const field = (name: string) => String(formData.get(name) ?? "");
  const values: ExpenseFormValues = {
    label: field("label"),
    categoryId: field("categoryId"),
    amount: field("amount"),
    vatRate: field("vatRate"),
    spentOn: field("spentOn"),
    repeatsMonthly: formData.get("repeatsMonthly") === "on",
    endsOn: field("endsOn"),
  };
  const fail = (error: string): ExpenseFormState => ({
    error,
    attempt: previous.attempt + 1,
    values,
    saved: false,
  });
  const parsed = parseExpenseForm(values, await isVatSubject(orgId));
  if (!parsed.ok) return fail(parsed.error);
  const expense = parsed.expense;
  const supabase = await createClient();
  const { error } = await supabase.from("coach_expenses").insert({
    organization_id: orgId,
    category_id: expense.categoryId,
    label: expense.label,
    spent_on: expense.spentOn,
    amount_cents: expense.amountCents,
    vat_rate: expense.vatRate,
    repeats_monthly: expense.repeatsMonthly,
    ends_on: expense.endsOn,
    created_by: user.id,
  });
  if (error) return fail("La dépense n'a pas pu être enregistrée. Réessaie.");
  refresh();
  return { error: null, attempt: previous.attempt + 1, values: null, saved: true };
}

// Dépense notée par erreur : elle se supprime.
export async function deleteExpense(organizationId: string, expenseId: string): Promise<void> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(expenseId).success) return;
  const supabase = await createClient();
  await supabase
    .from("coach_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("organization_id", membership.organizationId);
  refresh();
}

// Dépense mensuelle : « Arrêter » (le loyer s'arrête) la fait finir aujourd'hui, le passé reste.
export async function stopExpense(
  organizationId: string,
  expenseId: string,
  today: string,
): Promise<void> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(expenseId).success || !z.iso.date().safeParse(today).success) return;
  const supabase = await createClient();
  await supabase
    .from("coach_expenses")
    .update({ ends_on: today })
    .eq("id", expenseId)
    .eq("organization_id", membership.organizationId)
    .eq("repeats_monthly", true)
    .lte("spent_on", today);
  refresh();
}

// --- Catégories ------------------------------------------------------------------------------
const duplicate = "Une catégorie porte déjà ce nom.";

export async function createExpenseCategory(
  organizationId: string,
  rawName: string,
): Promise<CategoryResult> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const parsed = parseCategoryName(String(rawName ?? ""));
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("expense_categories")
    .select("color")
    .eq("organization_id", membership.organizationId);
  const { error } = await supabase.from("expense_categories").insert({
    organization_id: membership.organizationId,
    name: parsed.name,
    color: nextCategoryColor((existing ?? []).map((row) => row.color)),
    created_by: user.id,
  });
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? duplicate : "La catégorie n'a pas pu être créée.",
    };
  }
  refresh();
  return { ok: true, error: null };
}

async function updateCategory(
  organizationId: string,
  categoryId: string,
  values: { name?: string; color?: string },
  failure: string,
): Promise<CategoryResult> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(categoryId).success)
    return { ok: false, error: "Catégorie introuvable." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .update(values)
    .eq("id", categoryId)
    .eq("organization_id", membership.organizationId)
    .select("id");
  if (error) return { ok: false, error: error.code === "23505" ? duplicate : failure };
  if (!data?.length) return { ok: false, error: "Catégorie introuvable." };
  refresh();
  return { ok: true, error: null };
}

export async function renameExpenseCategory(
  organizationId: string,
  categoryId: string,
  rawName: string,
): Promise<CategoryResult> {
  const parsed = parseCategoryName(String(rawName ?? ""));
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return updateCategory(
    organizationId,
    categoryId,
    { name: parsed.name },
    "La catégorie n'a pas pu être renommée.",
  );
}

export async function setExpenseCategoryColor(
  organizationId: string,
  categoryId: string,
  color: string,
): Promise<CategoryResult> {
  if (!isCategoryColor(color)) return { ok: false, error: "Couleur invalide." };
  return updateCategory(
    organizationId,
    categoryId,
    { color },
    "La couleur n'a pas pu être changée.",
  );
}

// Supprimer une catégorie : ses dépenses restent, « sans catégorie » (clé étrangère SET NULL).
export async function deleteExpenseCategory(
  organizationId: string,
  categoryId: string,
): Promise<CategoryResult> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(categoryId).success)
    return { ok: false, error: "Catégorie introuvable." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .delete()
    .eq("id", categoryId)
    .eq("organization_id", membership.organizationId)
    .select("id");
  if (error || !data?.length) {
    return { ok: false, error: "La catégorie n'a pas pu être supprimée." };
  }
  refresh();
  return { ok: true, error: null };
}
