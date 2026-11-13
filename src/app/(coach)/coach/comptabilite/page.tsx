import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { categoryDotClass } from "@/components/blocks/category-color";
import { DeleteMoreMenu } from "@/components/blocks/more-menu";
import { NewPaymentButton } from "@/components/blocks/new-payment-sheet";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import {
  ACCOUNTING_UNITS,
  accountingRows,
  periodLabel,
  shareOf,
  totalRow,
  type AccountingUnit,
} from "@/domain/billing/accounting";
import {
  addTo,
  describeTotal,
  formatMoney,
  formatVatRate,
  type ByCurrency,
} from "@/domain/billing/money";
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
import { COLLECT_WEEKS, listUnpaidDates } from "@/features/billing/collect-queries";
import { getConverter } from "@/features/coach/currency-queries";
import { unpaidSub } from "@/features/notifications/preview";
import { markSessionPaid } from "@/features/sessions/actions";
import { dayShortLabel, todayIsoInBrussels } from "@/lib/format";

import { AccountingFab, LedgerCard, ShareCard, ShowMore } from "./accounting-widgets";
import { BarChart } from "./bar-chart";
import { CollectList } from "./collect-list";
import { NewExpenseButton } from "./expense-sheet";

export const metadata: Metadata = {
  title: "Comptabilité",
};

// Comptabilité (D-36, demande de Gianluca ; D-72 et D-73, demandes d'Antonino du 29/10/2026) :
// l'argent reçu de ses sportifs, ses DÉPENSES et le RÉSULTAT (gagné moins dépensé : HTVA pour un
// coach soumis à la TVA, TVA comprise sinon). Page en widgets comme le tableau de bord, chaque
// rangée à la même hauteur : les chiffres clés du mois ; « Répartition » (graphique circulaire des
// modes de paiement) et « Gagné et dépensé » (barres par période) ; le tableau de comptabilité et,
// à sa hauteur, la liste des paiements, des dépenses ou des séances À ENCAISSER (D-90 : séances passées
// pas encore payées, à la place des factures en retard ; elle défile). Semaine, mois ou année pour
// toute la page. Aperçu de gestion, pas une comptabilité officielle : Coory ne fait pas de factures.
const filters = [
  { key: "tous", label: "Tous" },
  { key: "banque", label: "Compte bancaire" },
  { key: "especes", label: "Espèces et autres" },
] as const;
type Filter = (typeof filters)[number]["key"];
type List = "paiements" | "depenses" | "a-encaisser";

const unitLabels: Record<AccountingUnit, string> = {
  semaine: "Semaine",
  mois: "Mois",
  annee: "Année",
};
// Colonnes du tableau et parts du graphique : toujours dans cet ordre, chacune avec sa couleur de
// graphique (validée par script, D-72).
const METHOD_ORDER = ["transfer", "bancontact", "cash", "other"] as const;
// Kit « Coory Pages », 04 (D-130) : violet, indigo, turquoise, gris (palette des listes).
const methodColor: Record<(typeof METHOD_ORDER)[number], string> = {
  transfer: "var(--list-violet)",
  bancontact: "var(--list-indigo)",
  cash: "var(--list-teal)",
  other: "var(--dlg-check-line)",
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
            list={
              query.liste === "depenses" || query.liste === "a-encaisser"
                ? query.liste
                : "paiements"
            }
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
  const [payments, expenses, categories, convert, unpaid] = await Promise.all([
    listPayments(organizationId),
    listExpenses(organizationId),
    listExpenseCategories(organizationId),
    getConverter(membership),
    listUnpaidDates(organizationId),
  ]);
  // Résultat (D-73) : chaque paiement et chaque dépense a son taux (D-163, 0 = sans TVA). Dès qu'il y a
  // de la TVA dans les comptes, tout se lit HTVA (une ligne sans TVA compte en entier) ; sinon, ni
  // « HTVA » ni « TVAC » nulle part.
  const vatSubject =
    payments.some((payment) => payment.vatRate > 0) ||
    expenses.some((expense) => expense.vatRate > 0);
  const basis = vatSubject ? "excl" : "incl";
  const basisLabel = vatSubject ? "HTVA" : "";

  const rows = accountingRows(payments, unit, today, convert, expenses, basis);
  const selected = rows.find((row) => row.key === period) ?? rows[0];
  const sum = totalRow(rows);
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
    const liste = next.liste ?? list;
    if (liste !== "paiements") params.set("liste", liste);
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
  const head = "border-b border-line px-2.5 text-right";
  // À encaisser (D-90) : total attendu, « ≈ » après un changement de devise (D-70).
  const toCollect = unpaid.reduce(
    (tally, date) => {
      tally.cents += convert(date.amountCents, date.currency);
      addTo(tally.byCurrency, date.currency, date.amountCents);
      return tally;
    },
    { cents: 0, byCurrency: {} as ByCurrency },
  );

  const compact =
    "lg:h-8! lg:gap-1.5! lg:rounded-[9px]! lg:px-3.5! lg:text-[12.5px]! lg:[&>svg]:size-3.5";
  const periodName = periodLabel(selected.key, unit);
  // Sous 1 100 px de large, les deux cartes du milieu passent l'une sous l'autre.
  const card =
    "flex min-w-0 flex-col rounded-[22px] bg-surface inset-ring inset-ring-line lg:rounded-[20px]";
  const segmented = "flex gap-0.5 rounded-[12px] bg-dlg-tile p-1";
  const segment = (active: boolean) =>
    `tap-44 flex h-8 items-center justify-center rounded-[9px] px-3 text-[13px] leading-[normal] font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 lg:px-3.5 ${
      active
        ? "bg-surface text-text shadow-[0_1px_2px_rgba(22,18,40,0.10)]"
        : "text-muted hover:text-text"
    }`;
  const listCount =
    list === "depenses" ? expenses.length : list === "a-encaisser" ? unpaid.length : shown.length;
  const noun = list === "depenses" ? "dépenses" : list === "a-encaisser" ? "séances" : "paiements";
  const emptyRows = rows.filter((row) => row.count === 0 && spent(row) === 0).length;
  const emptyUnit = unit === "semaine" ? "semaines" : unit === "annee" ? "années" : "mois";

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
              today={today}
            />
            <NewPaymentButton className={`max-lg:hidden ${compact}`} />
          </>
        }
      />
      <PageBody>
        <div className="flex w-full max-w-[1600px] flex-col gap-3 lg:gap-4">
          {/* La période (kit) : son nom à gauche, Semaine · Mois · Année à droite. */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1.5">
            <h2 className="text-[22px] leading-[normal] font-bold tracking-[-0.02em] max-sm:sr-only">
              {periodName}
            </h2>
            <nav aria-label="Période" className={`${segmented} max-sm:w-full`}>
              {ACCOUNTING_UNITS.map((item) => (
                <Link
                  key={item}
                  href={query({ vue: item })}
                  scroll={false}
                  aria-current={item === unit ? "page" : undefined}
                  className={`${segment(item === unit)} max-sm:h-10 max-sm:flex-1`}
                >
                  {unitLabels[item]}
                </Link>
              ))}
            </nav>
          </div>

          {/* Carte héro : le résultat de la période, gagné, dépensé, et cette semaine. */}
          <section
            aria-label={`Résultat · ${periodName}`}
            className={`${card} grid grid-cols-2 gap-2.5 px-4 py-5 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] lg:gap-0 lg:p-8`}
          >
            <div className="col-span-full flex flex-col gap-2.5 max-lg:pb-2 lg:col-span-1">
              <span className="text-[13.5px] leading-[normal] font-medium text-muted">
                Résultat · {periodName}
              </span>
              <span
                className={`text-[32px] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap tabular ${
                  selected.resultCents < 0 ? "text-alert" : "text-text"
                }`}
              >
                {signed(selected.resultCents)}
              </span>
              <span className="text-[13px] leading-[normal] text-muted">
                {vatSubject ? "Gagné HTVA − dépensé HTVA" : "Gagné − dépensé"}
              </span>
            </div>
            {[
              {
                label: `Gagné${basisLabel ? ` ${basisLabel}` : ""}`,
                dot: "bg-violet",
                value: approx(selected.byCurrency, gained(selected)),
                lines: [
                  plural(selected.count, "paiement"),
                  vatSubject ? `${money(selected.inclCents)} TVAC` : null,
                ],
              },
              {
                label: `Dépensé${basisLabel ? ` ${basisLabel}` : ""}`,
                dot: "bg-list-amber",
                value: money(spent(selected)),
                lines: vatSubject
                  ? ["TVA récupérable", money(selected.spentVatCents)]
                  : [`${money(selected.spentInclCents)} payés`],
              },
              {
                label: `Gagné cette semaine`,
                dot: "bg-faint",
                value: approx(week.byCurrency, gained(week)),
                lines: [plural(week.count, "paiement"), `Résultat ${signed(week.resultCents)}`],
                wide: true,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                // Téléphone (kit) : une tuile grise, le nom et le montant ; ordinateur : une colonne
                // séparée d'un filet, avec ses deux lignes de détail.
                className={`flex min-w-0 flex-col gap-2.5 max-lg:gap-1.5 max-lg:rounded-[14px] max-lg:bg-surface-2 max-lg:p-3.5 lg:border-l lg:border-line lg:px-7 lg:py-0.5 ${
                  stat.wide ? "max-lg:col-span-full" : ""
                }`}
              >
                <span className="flex items-center gap-[7px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-text-2">
                  <span aria-hidden className={`size-2 shrink-0 rounded-full ${stat.dot}`} />
                  {stat.label}
                </span>
                <span className="text-[18px] leading-[1.2] font-semibold tracking-[-0.01em] whitespace-nowrap tabular">
                  {stat.value}
                </span>
                <span className="flex flex-col gap-[3px] text-[13px] leading-[1.4] text-muted max-lg:hidden">
                  {stat.lines.filter(Boolean).map((line) => (
                    <span key={line} className="truncate">
                      {line}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </section>

          {/* Le graphique (1,6) et la répartition (1) ; l'un sous l'autre sous 1 100 px. */}
          <div className="grid gap-3 lg:gap-4 min-[68.75rem]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section
              aria-labelledby="bars-title"
              className={`${card} gap-5 px-4 py-[18px] lg:px-[26px] lg:py-6`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id="bars-title" className="text-[16px] leading-[normal] font-semibold">
                  Gagné et dépensé
                </h2>
                <div className="flex gap-3.5 text-[12.5px] leading-[normal] font-medium text-text-2">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span aria-hidden className="size-2 rounded-full bg-violet" />
                    Gagné
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span aria-hidden className="size-2 rounded-full bg-list-amber" />
                    Dépensé
                  </span>
                </div>
              </div>
              <BarChart
                selected={selected.key}
                groups={[...rows].reverse().map((row) => ({
                  key: row.key,
                  label: periodLabel(row.key, unit),
                  short: barLabel(row.key, unit),
                  tiny:
                    unit === "mois"
                      ? barLabel(row.key, unit).charAt(0).toUpperCase()
                      : unit === "semaine"
                        ? row.key.slice(8, 10)
                        : `’${row.key.slice(2, 4)}`,
                  href: query({ periode: row.key }),
                  gained: gained(row),
                  spent: spent(row),
                  gainedText: money(gained(row)),
                  spentText: money(spent(row)),
                  resultText: signed(row.resultCents),
                  negative: row.resultCents < 0,
                }))}
              />
            </section>
            <ShareCard
              subtitle={
                selected.count === 0
                  ? `${periodName} · aucun paiement`
                  : `${periodName} · montants TVA comprise`
              }
              total={describeTotal(selected.inclCents, selected.byCurrency, currency).value}
              caption={`Répartition des paiements reçus par mode, ${periodName}`}
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

          {/* Mouvements : Paiements · Dépenses · À encaisser (lien de la cloche), 5 lignes puis « Voir ». */}
          <section
            aria-labelledby="list-title"
            className={`${card} gap-3.5 pt-[18px] pb-2 lg:pt-[22px] ${list === "a-encaisser" ? "max-lg:order-first" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 id="list-title" className="text-[16px] leading-[normal] font-semibold">
                  Mouvements
                </h2>
                <p className="text-[13px] leading-[1.4] text-muted">
                  {list === "depenses"
                    ? `${plural(expenses.length, "dépense")} · les mensuelles comptent chaque mois`
                    : list === "a-encaisser"
                      ? unpaid.length === 0
                        ? `Séances passées des ${COLLECT_WEEKS} dernières semaines : tout est payé.`
                        : `${plural(unpaid.length, "séance")} · ${describeTotal(toCollect.cents, toCollect.byCurrency, currency).value} attendus · ${COLLECT_WEEKS} dernières semaines`
                      : `${plural(shown.length, "paiement")} · montants TVA comprise`}
                </p>
              </div>
              <nav aria-label="Liste affichée" className={`${segmented} max-sm:w-full`}>
                {(
                  [
                    ["paiements", "Paiements"],
                    ["depenses", "Dépenses"],
                    ["a-encaisser", "À encaisser"],
                  ] as const
                ).map(([key, label]) => (
                  <Link
                    key={key}
                    href={query({ liste: key })}
                    scroll={false}
                    aria-current={list === key ? "page" : undefined}
                    className={`${segment(list === key)} max-sm:flex-1`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            {list === "paiements" ? (
              <nav
                aria-label="Filtrer les paiements"
                className="flex flex-wrap gap-1.5 px-4 lg:px-6"
              >
                {filters.map((item) => (
                  <Link
                    key={item.key}
                    href={query({ mode: item.key })}
                    scroll={false}
                    aria-current={item.key === filter ? "page" : undefined}
                    className={`tap-44 flex h-9 items-center rounded-full px-3 text-[13px] leading-[normal] font-medium whitespace-nowrap transition-colors duration-150 lg:h-8 ${
                      item.key === filter
                        ? "bg-cta text-on-cta"
                        : "text-text inset-ring inset-ring-line-2 hover:bg-surface-2"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : null}

            {list === "a-encaisser" ? (
              unpaid.length === 0 ? (
                <p className="border-t border-line px-4 py-6 text-[14px] text-muted lg:px-6">
                  Aucune séance à encaisser. Les séances passées avec un prix apparaissent ici tant
                  qu&apos;elles ne sont pas marquées payées.
                </p>
              ) : (
                <div className="px-2 lg:px-4">
                  <CollectList
                    mark={markSessionPaid.bind(null, organizationId)}
                    rows={unpaid.map((date) => ({
                      key: `${date.sessionId}:${date.originalDate}`,
                      sessionId: date.sessionId,
                      originalDate: date.originalDate,
                      title: date.athleteName ?? date.title,
                      sub: `${formatMoney(date.amountCents, date.currency)} · ${unpaidSub(date, today)}`,
                      href: date.sessionHref,
                      label: `${date.athleteName ?? date.title}, ${dayShortLabel(date.date, today).toLowerCase()} à ${date.startTime}`,
                    }))}
                  />
                </div>
              )
            ) : listCount === 0 ? (
              <p className="border-t border-line px-4 py-6 text-[14px] text-muted lg:px-6">
                {list === "depenses"
                  ? "Aucune dépense. Note ce que tu paies (salle, matériel, assurance) avec « Nouvelle dépense »."
                  : "Aucun paiement. Note l'argent reçu avec « Nouveau paiement »."}
              </p>
            ) : (
              <ShowMore
                label={`Voir les ${listCount} ${noun}`}
                listLabel={list === "depenses" ? "Liste des dépenses" : "Liste des paiements"}
              >
                {list === "depenses"
                  ? expenses.map((expense) => {
                      const running =
                        expense.repeatsMonthly &&
                        expense.spentOn <= today &&
                        (expense.endsOn === null || expense.endsOn > today);
                      return (
                        <MoveRow
                          key={expense.id}
                          date={day(expense.spentOn)}
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
                          amount={`−${formatMoney(expense.amountCents, expense.currency)}`}
                          menu={
                            <DeleteMoreMenu
                              plain
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
                                      action: stopExpense.bind(null, organizationId, expense.id),
                                    }
                                  : undefined
                              }
                            />
                          }
                        />
                      );
                    })
                  : shown.map((payment) => {
                      const { exclCents } = splitVat(payment.amountCents, payment.vatRate);
                      return (
                        <MoveRow
                          key={payment.id}
                          date={day(payment.receivedOn)}
                          title={payment.athleteName}
                          // Le mode d'abord : la fin de la ligne est coupée si elle est longue.
                          sub={[
                            paymentMethodLabel(payment.method, country),
                            payment.coversFrom && payment.coversTo
                              ? `Forfait du ${day(payment.coversFrom)} au ${day(payment.coversTo)}`
                              : null,
                            // TVA (D-118, D-163) : rien si les comptes n'ont pas de TVA ; sinon
                            // « Sans TVA » pour un paiement noté sans.
                            payment.vatRate > 0
                              ? `${formatMoney(exclCents, payment.currency)} HTVA (TVA ${formatVatRate(payment.vatRate)})`
                              : vatSubject
                                ? "Sans TVA"
                                : null,
                            payment.label ?? "Paiement",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          amount={formatMoney(payment.amountCents, payment.currency)}
                          menu={
                            <DeleteMoreMenu
                              plain
                              menuTitle={`Paiement de ${payment.athleteName}`}
                              menuSubtitle={[
                                day(payment.receivedOn),
                                formatMoney(payment.amountCents, payment.currency),
                                paymentMethodLabel(payment.method, country),
                              ].join(" · ")}
                              deleteDescription="Pour un paiement noté par erreur"
                              action={deletePayment.bind(null, organizationId, payment.id)}
                              confirmTitle="Supprimer ce paiement ?"
                              confirmText="À utiliser pour un paiement noté par erreur : il disparaît des chiffres."
                            />
                          }
                        />
                      );
                    })}
              </ShowMore>
            )}
          </section>

          <LedgerCard
            subtitle={`${rows.length} ${emptyUnit} · reçu par mode, gagné, dépensé et résultat${basisLabel ? ` ${basisLabel}` : ""}`}
            emptyCount={emptyRows}
            emptyLabel={emptyUnit}
          >
            {/* Téléphone : le tableau défile de côté, la colonne « Période » reste en place. */}
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:thin] lg:-mx-6 lg:px-6">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-[13.5px] tabular">
                <caption className="sr-only">
                  Gagné, dépensé et résultat par {unitLabels[unit].toLowerCase()}
                </caption>
                <thead>
                  <tr className="text-left text-[11.5px] font-semibold tracking-[0.04em] text-faint uppercase">
                    <th
                      scope="col"
                      className="sticky left-0 z-10 border-b border-line bg-surface py-3 pr-3"
                    >
                      Période
                    </th>
                    {methods.map((method) => (
                      <th
                        key={method}
                        scope="col"
                        className="border-b border-line px-2.5 py-3 text-right whitespace-nowrap"
                      >
                        {methodName(method)}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="border-b border-line px-2.5 py-3 text-right whitespace-nowrap"
                    >
                      Gagné {basisLabel}
                    </th>
                    <th
                      scope="col"
                      className="border-b border-line px-2.5 py-3 text-right whitespace-nowrap"
                    >
                      Dépensé {basisLabel}
                    </th>
                    <th scope="col" className="border-b border-line py-3 pl-3 text-right">
                      Résultat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const current = row.key === selected.key;
                    const tone = current ? "bg-status-accent-soft/60" : "bg-surface";
                    // Colonne fixe : fond plein, pour cacher ce qui défile dessous.
                    const stickyTone = current
                      ? "[background:linear-gradient(color-mix(in_oklab,var(--status-accent-soft)_60%,transparent),color-mix(in_oklab,var(--status-accent-soft)_60%,transparent)),var(--surface)]"
                      : "bg-surface";
                    const empty = row.count === 0 && spent(row) === 0;
                    return (
                      <tr key={row.key} data-empty={empty && !current ? "" : undefined}>
                        <th
                          scope="row"
                          className={`sticky left-0 z-10 border-b border-line p-0 text-left font-medium ${stickyTone}`}
                        >
                          <Link
                            href={query({ periode: row.key })}
                            scroll={false}
                            aria-current={current ? "true" : undefined}
                            className="flex min-h-11 items-center pr-3 whitespace-nowrap underline-offset-4 hover:underline"
                          >
                            {periodLabel(row.key, unit, true)}
                          </Link>
                        </th>
                        {methods.map((method) => (
                          <td key={method} className={`${head} ${tone}`}>
                            {cell(row.byMethod[method])}
                          </td>
                        ))}
                        <td className={`${head} ${tone}`}>{cell(gained(row))}</td>
                        <td className={`${head} ${tone}`}>{cell(spent(row))}</td>
                        <td className={`border-b border-line pl-3 text-right ${tone}`}>
                          {resultCell(row.resultCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-t-[1.5px] border-line-2 bg-surface py-3 pr-3 text-left"
                    >
                      Total
                    </th>
                    {methods.map((method) => (
                      <td
                        key={method}
                        className="border-t-[1.5px] border-line-2 px-2.5 py-3 text-right"
                      >
                        {cell(sum.byMethod[method])}
                      </td>
                    ))}
                    <td className="border-t-[1.5px] border-line-2 px-2.5 py-3 text-right">
                      {approx(sum.byCurrency, gained(sum))}
                    </td>
                    <td className="border-t-[1.5px] border-line-2 px-2.5 py-3 text-right">
                      {cell(spent(sum))}
                    </td>
                    <td className="border-t-[1.5px] border-line-2 py-3 pl-3 text-right">
                      {resultCell(sum.resultCents)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </LedgerCard>

          {/* D-90 : Coory ne fait ni factures ni déclarations, et ne suit les règles d'aucun pays. */}
          <p className="px-1 text-[13px] leading-[1.5] text-muted">
            Aperçu de ton activité, pas une comptabilité officielle : tes factures et tes
            déclarations se font avec ton logiciel de facturation ou ton comptable.
          </p>
        </div>
        <AccountingFab />
      </PageBody>
    </>
  );
}

// Une ligne de « Mouvements » (kit) : date, nom et détail, montant, menu « ··· ».
function MoveRow({
  date,
  title,
  sub,
  amount,
  menu,
}: {
  date: string;
  title: string;
  sub: React.ReactNode;
  amount: string;
  menu: React.ReactNode;
}) {
  return (
    <li className="flex min-h-[58px] items-center gap-3 border-t border-line px-4 py-2 lg:gap-4 lg:px-6">
      <span className="w-12 shrink-0 text-[12.5px] leading-[normal] font-medium whitespace-nowrap text-muted tabular lg:w-14">
        {date}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14.5px] leading-[normal] font-semibold">{title}</span>
        <span className="truncate text-[12.5px] leading-[normal] text-muted">{sub}</span>
      </span>
      <span className="shrink-0 text-[14.5px] leading-[normal] font-semibold whitespace-nowrap tabular">
        {amount}
      </span>
      {menu}
    </li>
  );
}
