import { Banknote, CalendarRange, Euro, Landmark } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { DeleteMoreMenu } from "@/components/blocks/more-menu";
import { NewPaymentButton } from "@/components/blocks/new-payment-sheet";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Card, CardEmpty } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-chips";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { formatEuros } from "@/domain/billing/invoices";
import {
  isBankMethod,
  paymentMethodLabels,
  paymentTotals,
  splitVat,
} from "@/domain/billing/payments";
import { addDays } from "@/features/agenda/items";
import { mondayOf } from "@/features/agenda/week";
import { requireCoach } from "@/features/auth/guards";
import { deletePayment } from "@/features/billing/payment-actions";
import { listPayments } from "@/features/billing/payment-queries";
import { todayIsoInBrussels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Comptabilité",
};

// Comptabilité, première version (D-36, demande de Gianluca) : l'argent RÉELLEMENT reçu de ses
// sportifs, semaine et mois, TVA comprise et HTVA, la TVA du mois et ce qui arrive sur le compte
// bancaire ; la liste des paiements avec le filtre « compte bancaire / espèces et autres ».
// Vue de gestion, pas une comptabilité légale : taux et règles à faire valider (OPEN-17).
const filters = [
  { key: "tous", label: "Tous" },
  { key: "banque", label: "Compte bancaire" },
  { key: "especes", label: "Espèces et autres" },
] as const;
type Filter = (typeof filters)[number]["key"];

export default function AccountingPage({ searchParams }: PageProps<"/coach/comptabilite">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <Accounting filter={filters.find((f) => f.key === query.mode)?.key ?? "tous"} />
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
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

async function Accounting({ filter }: { filter: Filter }) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const today = todayIsoInBrussels();
  const payments = await listPayments(organizationId);

  const weekStart = mondayOf(today);
  const monthStart = `${today.slice(0, 7)}-01`;
  const week = paymentTotals(payments, weekStart, addDays(weekStart, 6));
  const month = paymentTotals(payments, monthStart, today);
  const monthPayments = payments.filter((p) => p.receivedOn >= monthStart && p.receivedOn <= today);
  const bank = paymentTotals(
    monthPayments.filter((p) => isBankMethod(p.method)),
    monthStart,
    today,
  );
  const shown = payments.filter(
    (p) => filter === "tous" || (filter === "banque") === isBankMethod(p.method),
  );
  const shownTotals = paymentTotals(shown, "2000-01-01", "9999-12-31");

  return (
    <>
      <PageHeader
        title="Comptabilité"
        subtitle="L'argent reçu de tes sportifs · vue de gestion, pas une comptabilité légale."
        actions={<NewPaymentButton />}
      />
      <PageBody>
        <KpiGrid label="Chiffres de la comptabilité">
          <KpiCard
            color="ok"
            icon={Euro}
            value={formatEuros(week.inclCents)}
            label="cette semaine"
            detail={`${formatEuros(week.exclCents)} HTVA · ${plural(week.count, "paiement")}`}
          />
          <KpiCard
            color="run"
            icon={CalendarRange}
            value={formatEuros(month.inclCents)}
            label="ce mois-ci"
            detail={`${formatEuros(month.exclCents)} HTVA · ${plural(month.count, "paiement")}`}
          />
          <KpiCard
            color="amber"
            icon={Landmark}
            value={formatEuros(month.vatCents)}
            label="de TVA ce mois-ci"
            detail="Comprise dans les montants reçus"
          />
          <KpiCard
            color="strength"
            icon={Banknote}
            value={formatEuros(bank.inclCents)}
            label="sur le compte bancaire"
            detail={`Ce mois-ci · espèces et autres : ${formatEuros(month.inclCents - bank.inclCents)}`}
          />
        </KpiGrid>
        <FilterChips
          label="Filtrer les paiements"
          options={filters.map((item) => ({
            href:
              item.key === "tous" ? "/coach/comptabilite" : `/coach/comptabilite?mode=${item.key}`,
            label: item.label,
            active: item.key === filter,
          }))}
        />
        <Card
          id="payments-title"
          title="Paiements reçus"
          subtitle={`${plural(shownTotals.count, "paiement")} · ${formatEuros(shownTotals.inclCents)} TVAC · ${formatEuros(shownTotals.exclCents)} HTVA`}
        >
          {shown.length === 0 ? (
            <CardEmpty icon={Euro}>
              Aucun paiement pour l&apos;instant. Note l&apos;argent reçu avec « Nouveau paiement ».
            </CardEmpty>
          ) : (
            <ul aria-label="Liste des paiements" className="flex flex-col">
              {shown.map((payment) => {
                const { exclCents } = splitVat(payment.amountCents, payment.vatRate);
                return (
                  <li key={payment.id}>
                    <ListRow
                      leading={
                        <span className="w-14 shrink-0 font-mono text-[13px] font-medium tabular">
                          {shortDate.format(new Date(`${payment.receivedOn}T00:00:00Z`))}
                        </span>
                      }
                      title={payment.athleteName}
                      // Le mode d'abord : sur téléphone, la fin de la ligne est coupée.
                      sub={[
                        paymentMethodLabels[payment.method],
                        payment.coversFrom && payment.coversTo
                          ? `Forfait du ${shortDate.format(new Date(`${payment.coversFrom}T00:00:00Z`))} au ${shortDate.format(new Date(`${payment.coversTo}T00:00:00Z`))}`
                          : null,
                        `${formatEuros(exclCents)} HTVA (TVA ${payment.vatRate} %)`,
                        payment.label ?? "Paiement",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      trailing={
                        <>
                          <span className="text-[15px] font-semibold tabular">
                            {formatEuros(payment.amountCents)}
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
          <p className="text-[13px] text-muted">
            Montants TVA comprise ; le HTVA et la TVA sont calculés à partir du taux noté. À faire
            valider par ton comptable avant toute déclaration.
          </p>
        </Card>
      </PageBody>
    </>
  );
}
