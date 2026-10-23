import type { Metadata } from "next";
import { Suspense } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  formatEuros,
  invoiceStatus,
  invoiceStatusLabels,
  monthActivity,
} from "@/domain/billing/invoices";
import { requireCoach } from "@/features/auth/guards";
import { listInvoices } from "@/features/billing/queries";
import { dayShortLabel, formatDate, todayIsoInBrussels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Facturation",
};

// Page Facturation, première tranche (D-35 / D-17 étape A) : la liste des VRAIES factures suivies, avec
// leur statut calculé (payée, en attente, en retard), derrière le « Voir tout » de la carte Activité
// financière. Saisie d'une facture, d'un paiement reçu et document légal : 4f, après OPEN-17.
export default function BillingPage() {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        <Billing />
      </Suspense>
    </main>
  );
}

const shortDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

async function Billing() {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const today = todayIsoInBrussels();
  const invoices = await listInvoices(organizationId);
  const activity = monthActivity(invoices, today);

  return (
    <>
      <PageHeader
        title="Facturation"
        subtitle="Factures et paiements · aucun paiement ne passe par Coory."
      />
      <PageBody>
        <Card
          id="invoices-title"
          title="Factures"
          subtitle={`${formatEuros(activity.sent.cents)} envoyés ce mois-ci · ${formatEuros(activity.pending.cents)} en attente`}
        >
          {invoices.length === 0 ? (
            <p className="border-t border-line pt-3.5 text-[14px] text-muted">
              Aucune facture pour l&apos;instant.
            </p>
          ) : (
            <ul aria-label="Liste des factures" className="flex flex-col">
              {invoices.map((invoice) => {
                const status = invoiceStatus(invoice, today);
                return (
                  <li key={invoice.id}>
                    <ListRow
                      leading={
                        <span className="w-14 shrink-0 font-mono text-[13px] font-medium tabular">
                          {shortDate.format(new Date(`${invoice.issuedOn}T00:00:00Z`))}
                        </span>
                      }
                      title={invoice.athleteName}
                      sub={`${invoice.label} · ${
                        invoice.paidOn
                          ? `payée le ${formatDate(invoice.paidOn)}`
                          : `échéance ${dayShortLabel(invoice.dueOn, today).toLowerCase()}`
                      }`}
                      trailing={
                        <span className="flex flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-3">
                          <span className="text-[15px] font-semibold tabular">
                            {formatEuros(invoice.amountCents)}
                          </span>
                          <StatusBadge label={invoiceStatusLabels[status]} />
                        </span>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-[13px] text-muted">
            Suivi seulement pour l&apos;instant : la création des factures et la saisie des
            paiements reçus arriveront avec la facturation complète.
          </p>
        </Card>
      </PageBody>
    </>
  );
}
