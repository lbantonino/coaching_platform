import { FileText, Landmark } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardEmpty, CardTitle } from "@/components/ui/card";
import {
  formatEuros,
  invoiceStatus,
  invoiceStatusLabels,
  monthActivity,
} from "@/domain/billing/invoices";
import { addDays } from "@/features/agenda/items";
import { listAthletes } from "@/features/athletes/queries";
import { requireCoach } from "@/features/auth/guards";
import { listInvoiceablePayments } from "@/features/billing/invoice-queries";
import { listInvoices } from "@/features/billing/queries";
import { listLegalEntities } from "@/features/coach/legal-queries";
import { dayShortLabel, formatDate, todayIsoInBrussels } from "@/lib/format";

import { CreateInvoiceButton } from "./invoice-controls";
import { NewInvoiceButton } from "./new-invoice-sheet";

export const metadata: Metadata = {
  title: "Facturation",
};

// Page Facturation (D-35, puis D-65 : factures émises). En haut, les paiements par VIREMENT encore
// sans facture (règle de Gianluca : les espèces ne se facturent pas), chacun avec « Créer la
// facture » ; dessous, les factures : brouillons et factures émises (numéro, PDF), et les factures de
// simple suivi d'avant D-65. Aucun paiement ne passe par Coory.
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
const short = (day: string) => shortDate.format(new Date(`${day}T00:00:00Z`));

async function Billing() {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const today = todayIsoInBrussels();
  const [invoices, toInvoice, athletes, entities] = await Promise.all([
    listInvoices(organizationId),
    listInvoiceablePayments(organizationId, addDays(today, -365)),
    listAthletes(organizationId, { status: "all", q: "" }),
    listLegalEntities(organizationId),
  ]);
  const activity = monthActivity(
    invoices.filter((invoice) => invoice.status === "issued"),
    today,
  );

  return (
    <>
      <PageHeader
        title="Facturation"
        subtitle="Factures et paiements · aucun paiement ne passe par Coory."
        actions={
          // « Créer une facture » (29/10/2026), à droite de la cloche : sportif existant ou nouveau.
          <NewInvoiceButton
            organizationId={organizationId}
            athletes={athletes
              .filter((athlete) => athlete.status !== "archived")
              .map((athlete) => ({ id: athlete.id, name: athlete.displayName }))}
            entities={entities.map((entity) => ({
              id: entity.id,
              name: entity.name,
              vatSubject: entity.vatStatus === "subject",
            }))}
            today={today}
            dueDefault={addDays(today, 15)}
          />
        }
      />
      <PageBody>
        <Card
          id="to-invoice-title"
          // Deux cartes bien distinctes (29/10) : « À facturer » en rouge, « Factures » en vert.
          title={
            <CardTitle icon={Landmark} color="var(--alert)">
              À facturer
            </CardTitle>
          }
          subtitle="Paiements par virement sans facture, sur 12 mois. Les espèces ne se facturent pas."
        >
          {toInvoice.length === 0 ? (
            <CardEmpty icon={Landmark}>Tous les virements reçus ont leur facture.</CardEmpty>
          ) : (
            <ul aria-label="Paiements à facturer" className="flex flex-col">
              {toInvoice.map((payment) => (
                <li key={payment.id}>
                  <ListRow
                    leading={
                      <span className="w-14 shrink-0 font-mono text-[13px] font-medium tabular">
                        {short(payment.receivedOn)}
                      </span>
                    }
                    title={payment.athleteName}
                    sub={[payment.label, `${formatEuros(payment.amountCents)} par virement`]
                      .filter(Boolean)
                      .join(" · ")}
                    trailing={
                      <CreateInvoiceButton
                        organizationId={organizationId}
                        paymentId={payment.id}
                        label={`Créer la facture : ${payment.athleteName}, ${formatDate(payment.receivedOn)}`}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          id="invoices-title"
          title={
            <CardTitle icon={FileText} color="var(--ok)">
              Factures
            </CardTitle>
          }
          subtitle={`${formatEuros(activity.sent.cents)} émis ce mois-ci · ${formatEuros(activity.pending.cents)} en attente`}
        >
          {invoices.length === 0 ? (
            <CardEmpty icon={FileText}>Aucune facture pour l&apos;instant.</CardEmpty>
          ) : (
            <ul aria-label="Liste des factures" className="flex flex-col">
              {invoices.map((invoice) => {
                const status = invoiceStatus(invoice, today);
                const draft = invoice.status === "draft";
                // Brouillons et factures numérotées s'ouvrent ; le simple suivi d'avant D-65, non.
                const opens = draft || invoice.number !== null;
                return (
                  <li key={invoice.id}>
                    <ListRow
                      href={opens ? `/coach/facturation/${invoice.id}` : undefined}
                      leading={
                        <span className="w-14 shrink-0 font-mono text-[13px] font-medium tabular">
                          {short(invoice.issuedOn)}
                        </span>
                      }
                      title={invoice.athleteName}
                      sub={[
                        invoice.number,
                        invoice.label,
                        invoice.paidOn
                          ? `payée le ${formatDate(invoice.paidOn)}`
                          : `échéance ${dayShortLabel(invoice.dueOn, today).toLowerCase()}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      trailing={
                        <span className="flex flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-3">
                          <span className="text-[15px] font-semibold tabular">
                            {formatEuros(invoice.amountCents)}
                          </span>
                          {draft ? (
                            <Badge>Brouillon</Badge>
                          ) : (
                            <StatusBadge label={invoiceStatusLabels[status]} />
                          )}
                        </span>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </PageBody>
    </>
  );
}
