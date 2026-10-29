import {
  CalendarRange,
  ChartColumn,
  ChartPie,
  Coins,
  Receipt,
  Scale,
  Table2,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { categoryDotClass } from "@/components/blocks/category-color";
import { ListRow } from "@/components/blocks/list-row";
import { DeleteMoreMenu } from "@/components/blocks/more-menu";
import { NewPaymentButton } from "@/components/blocks/new-payment-sheet";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Card, CardEmpty, CardTitle } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-chips";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { SegmentedNav } from "@/components/ui/segmented";
import {
  ACCOUNTING_UNITS,
  accountingRows,
  periodLabel,
  shareOf,
  totalRow,
  type AccountingUnit,
} from "@/domain/billing/accounting";
import { describeTotal, formatMoney, formatVatRate } from "@/domain/billing/money";
import { isBankMethod, paymentMethodLabel, splitVat } from "@/domain/billing/payments";
import { requireCoach } from "@/features/auth/guards";
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  deleteExpenseCategory,
  renameExpenseCategory,
  setExpenseCategoryColor,
  stopExpense,
} from "@/features/billing/expense-actions";
import { listExpenseCategories, listExpenses } from "@/features/billing/expense-queries";
import { deletePayment } from "@/features/billing/payment-actions";
import { listPayments } from "@/features/billing/payment-queries";
import { getConverter } from "@/features/coach/currency-queries";
import { isVatSubject } from "@/features/coach/legal-queries";
import { todayIsoInBrussels } from "@/lib/format";

import { BarChart } from "./bar-chart";
import { DonutChart } from "./donut-chart";
import { NewExpenseButton } from "./expense-sheet";

export const metadata: Metadata = {
  title: "Comptabilité",
};

// Comptabilité (D-36, demande de Gianluca ; D-72 et D-73, demandes d'Antonino du 29/10/2026) :
// l'argent reçu de ses sportifs, ses DÉPENSES et le RÉSULTAT (gagné moins dépensé : HTVA pour un
// coach soumis à la TVA, TVA comprise sinon). Page en widgets comme le tableau de bord, chaque
// rangée à la même hauteur : les chiffres clés du mois ; « Répartition » (graphique circulaire des
// modes de paiement) et « Gagné et dépensé » (barres par période) ; le tableau de comptabilité et,
// à sa hauteur, la liste des paiements ou des dépenses (elle défile). Semaine, mois ou année pour
// toute la page. Vue de gestion, pas une comptabilité légale.
const filters = [
  { key: "tous", label: "Tous" },
  { key: "banque", label: "Compte bancaire" },
  { key: "especes", label: "Espèces et autres" },
] as const;
type Filter = (typeof filters)[number]["key"];
type List = "paiements" | "depenses";

const unitLabels: Record<AccountingUnit, string> = {
  semaine: "Semaine",
  mois: "Mois",
  annee: "Année",
};
// Colonnes du tableau et parts du graphique : toujours dans cet ordre, chacune avec sa couleur de
// graphique (validée par script, D-72).
const METHOD_ORDER = ["transfer", "bancontact", "cash", "other"] as const;
const methodColor: Record<(typeof METHOD_ORDER)[number], string> = {
  transfer: "var(--chart-1)",
  bancontact: "var(--chart-2)",
  cash: "var(--chart-3)",
  other: "var(--chart-4)",
};

export default function AccountingPage({ searchParams }: PageProps<"/coach/comptabilite">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <Accounting
            filter={filters.find((f) => f.key === query.mode)?.key ?? "tous"}
            unit={ACCOUNTING_UNITS.find((unit) => unit === query.vue) ?? "mois"}
            period={typeof query.periode === "string" ? query.periode : null}
            list={query.liste === "depenses" ? "depenses" : "paiements"}
          />
        ))}
      </Suspense>
    </main>
  );
}

const shortDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const monthName = new Intl.DateTimeFormat("fr-BE", { month: "short", timeZone: "UTC" });
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;
const day = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`));

// Étiquette sous une barre : « 26/10 », « oct. », « 2026 ».
function barLabel(key: string, unit: AccountingUnit): string {
  if (unit === "annee") return key;
  if (unit === "mois") return monthName.format(new Date(`${key}-01T00:00:00Z`));
  return `${key.slice(8, 10)}/${key.slice(5, 7)}`;
}

async function Accounting({
  filter,
  unit,
  period,
  list,
}: {
  filter: Filter;
  unit: AccountingUnit;
  period: string | null;
  list: List;
}) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const membership = memberships[0];
  const organizationId = membership.organizationId;
  // Totaux dans la devise de l'organisation ; chaque paiement dans la sienne (D-69). Après un
  // changement de devise (D-70), un total qui mélange deux devises est converti « ≈ ».
  const { currency, country } = membership;
  const money = (cents: number) => formatMoney(cents, currency);
  const today = todayIsoInBrussels();
  const [payments, expenses, categories, convert, vatSubject] = await Promise.all([
    listPayments(organizationId),
    listExpenses(organizationId),
    listExpenseCategories(organizationId),
    getConverter(membership),
    isVatSubject(organizationId),
  ]);
  // Résultat (D-73) : HTVA pour un coach soumis à la TVA, TVA comprise sinon.
  const basis = vatSubject ? "excl" : "incl";
  const basisLabel = vatSubject ? "HTVA" : "";

  const rows = accountingRows(payments, unit, today, convert, expenses, basis);
  const selected = rows.find((row) => row.key === period) ?? rows[0];
  const sum = totalRow(rows);
  const [month] = accountingRows(payments, "mois", today, convert, expenses, basis);
  const [week] = accountingRows(payments, "semaine", today, convert, expenses, basis);
  const gained = (row: { inclCents: number; exclCents: number }) =>
    vatSubject ? row.exclCents : row.inclCents;
  const spent = (row: { spentInclCents: number; spentExclCents: number }) =>
    vatSubject ? row.spentExclCents : row.spentInclCents;
  const signed = (cents: number) => (cents > 0 ? `+${money(cents)}` : money(cents));
  const approx = (row: Parameters<typeof describeTotal>[1], cents: number) =>
    `${describeTotal(cents, row, currency).approximate ? "≈ " : ""}${money(cents)}`;

  const methodName = (method: (typeof METHOD_ORDER)[number]) => paymentMethodLabel(method, country);
  // « Autre » n'a sa colonne que s'il a servi.
  const methods = METHOD_ORDER.filter((method) => method !== "other" || sum.byMethod.other > 0);
  const query = (next: {
    vue?: AccountingUnit;
    periode?: string | null;
    mode?: Filter;
    liste?: List;
  }) => {
    const params = new URLSearchParams();
    const vue = next.vue ?? unit;
    if (vue !== "mois") params.set("vue", vue);
    const chosen = next.periode === undefined ? period : next.periode;
    if (chosen && next.vue === undefined) params.set("periode", chosen);
    const mode = next.mode ?? filter;
    if (mode !== "tous") params.set("mode", mode);
    if ((next.liste ?? list) === "depenses") params.set("liste", "depenses");
    const text = params.toString();
    return text ? `/coach/comptabilite?${text}` : "/coach/comptabilite";
  };
  const cell = (cents: number) =>
    cents === 0 ? <span className="text-faint">–</span> : money(cents);
  const resultCell = (cents: number) =>
    cents === 0 ? (
      <span className="text-faint">–</span>
    ) : (
      <span className={cents < 0 ? "text-alert" : ""}>{signed(cents)}</span>
    );

  const shown = payments.filter(
    (p) => filter === "tous" || (filter === "banque") === isBankMethod(p.method),
  );
  const head = "border-t border-line px-2.5 text-right";

  return (
    <>
      <PageHeader
        title="Comptabilité"
        subtitle="Gagné, dépensé et résultat · vue de gestion, pas une comptabilité légale."
        actions={
          <>
            <NewExpenseButton
              action={createExpense.bind(null, organizationId)}
              categories={categories}
              categoryActions={{
                create: createExpenseCategory.bind(null, organizationId),
                rename: renameExpenseCategory.bind(null, organizationId),
                remove: deleteExpenseCategory.bind(null, organizationId),
                recolor: setExpenseCategoryColor.bind(null, organizationId),
              }}
              vatSubject={vatSubject}
              today={today}
            />
            <NewPaymentButton />
          </>
        }
      />
      <PageBody grid>
        <div className="lg:col-span-12">
          <KpiGrid label="Chiffres de la comptabilité">
            <KpiCard
              color="ok"
              icon={Coins}
              value={approx(month.byCurrency, gained(month))}
              label={`gagné ce mois-ci${basisLabel ? ` (${basisLabel})` : ""}`}
              detail={`${plural(month.count, "paiement")} · ${money(month.inclCents)} reçus TVAC`}
            />
            <KpiCard
              color="hyrox"
              icon={Receipt}
              value={money(spent(month))}
              label={`dépensé ce mois-ci${basisLabel ? ` (${basisLabel})` : ""}`}
              detail={
                vatSubject
                  ? `${money(month.spentVatCents)} de TVA récupérable`
                  : `${money(month.spentInclCents)} payés`
              }
            />
            <KpiCard
              color={month.resultCents < 0 ? "warn" : "run"}
              icon={Scale}
              value={signed(month.resultCents)}
              label="résultat ce mois-ci"
              detail={vatSubject ? "Gagné HTVA − dépensé HTVA" : "Gagné − dépensé"}
            />
            <KpiCard
              color="strength"
              icon={CalendarRange}
              value={approx(week.byCurrency, gained(week))}
              label={`gagné cette semaine${basisLabel ? ` (${basisLabel})` : ""}`}
              detail={`${plural(week.count, "paiement")} · résultat ${signed(week.resultCents)}`}
            />
          </KpiGrid>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-12">
          <h2 className="font-display text-[20px] font-semibold">Gagné, dépensé et résultat</h2>
          <SegmentedNav
            label="Période du tableau"
            items={ACCOUNTING_UNITS.map((item) => ({
              href: query({ vue: item }),
              label: unitLabels[item],
              active: item === unit,
            }))}
          />
        </div>

        {/* Rangée 1 : deux widgets à la même hauteur. */}
        <Card
          id="share-title"
          className="lg:col-span-6"
          title={
            <CardTitle icon={ChartPie} color="var(--accent-text)">
              Répartition · {periodLabel(selected.key, unit)}
            </CardTitle>
          }
          subtitle={
            selected.count === 0
              ? "Aucun paiement sur cette période."
              : `${plural(selected.count, "paiement")} · ${approx(selected.byCurrency, selected.exclCents)} HTVA · ${approx(selected.byCurrency, selected.vatCents)} de TVA`
          }
        >
          <div className="flex flex-1 items-center">
            <DonutChart
              caption={`Répartition des paiements reçus par mode, ${periodLabel(selected.key, unit)}`}
              total={describeTotal(selected.inclCents, selected.byCurrency, currency).value}
              segments={METHOD_ORDER.map((method) => ({
                key: method,
                label: methodName(method),
                color: methodColor[method],
                cents: selected.byMethod[method],
                amount: money(selected.byMethod[method]),
                share: shareOf(selected.byMethod[method], selected.inclCents),
              }))}
            />
          </div>
        </Card>

        <Card
          id="bars-title"
          className="lg:col-span-6"
          title={
            <CardTitle icon={ChartColumn} color="var(--run)">
              Gagné et dépensé
            </CardTitle>
          }
          subtitle={`Par ${unitLabels[unit].toLowerCase()} · clique une période pour la voir partout`}
        >
          <BarChart
            selected={selected.key}
            basisLabel={basisLabel}
            groups={[...rows].reverse().map((row) => ({
              key: row.key,
              label: periodLabel(row.key, unit),
              short: barLabel(row.key, unit),
              href: query({ periode: row.key }),
              gained: gained(row),
              spent: spent(row),
              gainedText: money(gained(row)),
              spentText: money(spent(row)),
              resultText: signed(row.resultCents),
              negative: row.resultCents < 0,
            }))}
          />
        </Card>

        {/* Rangée 2 : le tableau décide de la hauteur ; la liste de droite la prend et défile. */}
        <Card
          id="ledger-title"
          className="lg:col-span-8"
          title={
            <CardTitle icon={Table2} color="var(--strength)">
              Tableau de comptabilité
            </CardTitle>
          }
          subtitle={
            vatSubject
              ? "Reçu par mode de paiement (TVA comprise) ; gagné, dépensé et résultat HTVA."
              : "Reçu par mode de paiement ; gagné, dépensé et résultat."
          }
        >
          {/* Téléphone : le tableau défile de côté, la colonne « Période » reste en place. */}
          <div className="-mx-[18px] overflow-x-auto px-[18px] [scrollbar-width:thin]">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-[13px] tabular">
              <caption className="sr-only">
                Gagné, dépensé et résultat par {unitLabels[unit].toLowerCase()}
              </caption>
              <thead>
                <tr className="text-left text-[11.5px] font-semibold tracking-[0.04em] text-muted uppercase">
                  <th scope="col" className="sticky left-0 z-10 bg-surface py-2.5 pr-3">
                    Période
                  </th>
                  {methods.map((method) => (
                    <th
                      key={method}
                      scope="col"
                      className="px-2.5 py-2.5 text-right whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          aria-hidden
                          className="size-2 rounded-full"
                          style={{ background: methodColor[method] }}
                        />
                        {methodName(method)}
                      </span>
                    </th>
                  ))}
                  <th scope="col" className="px-2.5 py-2.5 text-right whitespace-nowrap">
                    Gagné {basisLabel}
                  </th>
                  <th scope="col" className="px-2.5 py-2.5 text-right whitespace-nowrap">
                    Dépensé {basisLabel}
                  </th>
                  <th scope="col" className="py-2.5 pl-3 text-right">
                    Résultat
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const current = row.key === selected.key;
                  const tone = current ? "bg-selected" : "bg-surface";
                  // Colonne fixe : fond plein (le jaune posé sur la carte), pour cacher ce qui défile dessous.
                  const stickyTone = current
                    ? "[background:linear-gradient(var(--selected),var(--selected)),var(--surface)]"
                    : "bg-surface";
                  return (
                    <tr key={row.key}>
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 border-t border-line p-0 text-left font-medium ${stickyTone}`}
                      >
                        <Link
                          href={query({ periode: row.key })}
                          scroll={false}
                          aria-current={current ? "true" : undefined}
                          className="flex min-h-11 items-center pr-3 pl-2 whitespace-nowrap underline-offset-4 hover:underline"
                        >
                          {periodLabel(row.key, unit, true)}
                        </Link>
                      </th>
                      {methods.map((method) => (
                        <td key={method} className={`${head} ${tone}`}>
                          {cell(row.byMethod[method])}
                        </td>
                      ))}
                      <td className={`${head} font-medium ${tone}`}>{cell(gained(row))}</td>
                      <td className={`${head} ${tone}`}>{cell(spent(row))}</td>
                      <td className={`border-t border-line pl-3 text-right font-semibold ${tone}`}>
                        {resultCell(row.resultCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-t-2 border-line-2 bg-surface py-3 pr-3 pl-2 text-left"
                  >
                    Total
                  </th>
                  {methods.map((method) => (
                    <td key={method} className="border-t-2 border-line-2 px-2.5 py-3 text-right">
                      {cell(sum.byMethod[method])}
                    </td>
                  ))}
                  <td className="border-t-2 border-line-2 px-2.5 py-3 text-right">
                    {approx(sum.byCurrency, gained(sum))}
                  </td>
                  <td className="border-t-2 border-line-2 px-2.5 py-3 text-right">
                    {cell(spent(sum))}
                  </td>
                  <td className="border-t-2 border-line-2 py-3 pl-3 text-right">
                    {resultCell(sum.resultCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <div className="lg:relative lg:col-span-4">
          <Card
            id="list-title"
            className="lg:absolute lg:inset-0"
            title={
              <CardTitle icon={Wallet} color="var(--ok)">
                {list === "depenses" ? "Dépenses" : "Paiements reçus"}
              </CardTitle>
            }
            subtitle={
              list === "depenses"
                ? `${plural(expenses.length, "dépense")} · les mensuelles comptent chaque mois`
                : `${plural(shown.length, "paiement")} · montants TVA comprise`
            }
          >
            <SegmentedNav
              label="Liste affichée"
              items={[
                {
                  href: query({ liste: "paiements" }),
                  label: "Paiements",
                  active: list === "paiements",
                },
                {
                  href: query({ liste: "depenses" }),
                  label: "Dépenses",
                  active: list === "depenses",
                },
              ]}
            />
            {list === "paiements" ? (
              <>
                <FilterChips
                  label="Filtrer les paiements"
                  options={filters.map((item) => ({
                    href: query({ mode: item.key }),
                    label: item.label,
                    active: item.key === filter,
                  }))}
                />
                <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                  {shown.length === 0 ? (
                    <CardEmpty icon={Coins}>
                      Aucun paiement. Note l&apos;argent reçu avec « Nouveau paiement ».
                    </CardEmpty>
                  ) : (
                    <ul aria-label="Liste des paiements" className="flex flex-col">
                      {shown.map((payment) => {
                        const { exclCents } = splitVat(payment.amountCents, payment.vatRate);
                        return (
                          <li key={payment.id}>
                            <ListRow
                              leading={
                                <span className="w-12 shrink-0 font-mono text-[12px] font-medium tabular">
                                  {day(payment.receivedOn)}
                                </span>
                              }
                              title={payment.athleteName}
                              // Le mode d'abord : la fin de la ligne est coupée si elle est longue.
                              sub={[
                                paymentMethodLabel(payment.method, country),
                                payment.coversFrom && payment.coversTo
                                  ? `Forfait du ${day(payment.coversFrom)} au ${day(payment.coversTo)}`
                                  : null,
                                `${formatMoney(exclCents, payment.currency)} HTVA (TVA ${formatVatRate(payment.vatRate)})`,
                                payment.label ?? "Paiement",
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                              trailing={
                                <>
                                  <span className="text-[15px] font-semibold tabular">
                                    {formatMoney(payment.amountCents, payment.currency)}
                                  </span>
                                  <DeleteMoreMenu
                                    menuTitle={`Paiement de ${payment.athleteName}`}
                                    action={deletePayment.bind(null, organizationId, payment.id)}
                                    confirmTitle="Supprimer ce paiement ?"
                                    confirmText="À utiliser pour un paiement noté par erreur : il disparaît des chiffres."
                                  />
                                </>
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                {expenses.length === 0 ? (
                  <CardEmpty icon={Receipt}>
                    Aucune dépense. Note ce que tu paies (salle, matériel, assurance) avec «
                    Nouvelle dépense ».
                  </CardEmpty>
                ) : (
                  <ul aria-label="Liste des dépenses" className="flex flex-col">
                    {expenses.map((expense) => {
                      const running =
                        expense.repeatsMonthly &&
                        expense.spentOn <= today &&
                        (expense.endsOn === null || expense.endsOn > today);
                      return (
                        <li key={expense.id}>
                          <ListRow
                            leading={
                              <span className="w-12 shrink-0 font-mono text-[12px] font-medium tabular">
                                {day(expense.spentOn)}
                              </span>
                            }
                            title={expense.label}
                            sub={
                              <span className="inline-flex min-w-0 items-center gap-1.5">
                                <span
                                  aria-hidden
                                  className={`size-2 shrink-0 rounded-full ${categoryDotClass[expense.categoryColor ?? "grey"]}`}
                                />
                                <span className="truncate">
                                  {[
                                    expense.categoryName ?? "Sans catégorie",
                                    expense.repeatsMonthly
                                      ? expense.endsOn
                                        ? `Chaque mois jusqu'au ${day(expense.endsOn)}`
                                        : "Chaque mois"
                                      : null,
                                    vatSubject && expense.vatRate > 0
                                      ? `TVA ${formatVatRate(expense.vatRate)}`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              </span>
                            }
                            trailing={
                              <>
                                <span className="text-[15px] font-semibold tabular">
                                  −{formatMoney(expense.amountCents, expense.currency)}
                                </span>
                                <DeleteMoreMenu
                                  menuTitle={expense.label}
                                  action={deleteExpense.bind(null, organizationId, expense.id)}
                                  confirmTitle="Supprimer cette dépense ?"
                                  confirmText={
                                    expense.repeatsMonthly
                                      ? "Elle disparaît de TOUS les mois. Pour une dépense qui prend fin (loyer arrêté), utilise plutôt « Arrêter » : le passé reste."
                                      : "À utiliser pour une dépense notée par erreur : elle disparaît des chiffres."
                                  }
                                  stop={
                                    running
                                      ? {
                                          label: "Arrêter (ne compte plus après aujourd'hui)",
                                          action: stopExpense.bind(
                                            null,
                                            organizationId,
                                            expense.id,
                                            today,
                                          ),
                                        }
                                      : undefined
                                  }
                                />
                              </>
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </Card>
        </div>
      </PageBody>
    </>
  );
}
