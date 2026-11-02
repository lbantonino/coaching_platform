import { FileText, Landmark } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardEmpty, CardTitle } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-chips";
import { invoiceStatus, invoiceStatusLabels, monthActivity } from "@/domain/billing/invoices";
import { describeTotal, formatMoney, type ByCurrency } from "@/domain/billing/money";
import { paymentMethodLabel } from "@/domain/billing/payments";
import { addDays } from "@/features/agenda/items";
import { listAthletes } from "@/features/athletes/queries";
import { requireCoach } from "@/features/auth/guards";
import { getConverter } from "@/features/coach/currency-queries";
import { listInvoiceablePayments } from "@/features/billing/invoice-queries";
import { listInvoices } from "@/features/billing/queries";
import { listLegalEntities } from "@/features/coach/legal-queries";
import { getCoachProfile } from "@/features/coach/profile";
import { dayShortLabel, formatDate, todayIsoInBrussels } from "@/lib/format";

import { CreateInvoiceButton } from "./invoice-controls";
import { NewInvoiceButton } from "./new-invoice-sheet";

export const metadata: Metadata = {
  title: "Facturation",
};

// Page Facturation (D-35, puis D-65 : factures émises). En haut, les paiements par VIREMENT encore
// sans facture (règle de Gianluca : les espèces ne se facturent pas), chacun avec « Créer la
// facture » ; dessous, les factures : brouillons et factures émises (numéro, PDF), et les factures de
// simple suivi d'avant D-65. Aucun paiement ne passe par Coory. Filtre « En retard » (02/11,
// ?statut=en-retard) : le lien « Voir toutes les factures en retard » de la cloche y mène.
export default function BillingPage({ searchParams }: PageProps<"/coach/facturation">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <Billing overdueOnly={query.statut === "en-retard"} />
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
const short = (day: string) => shortDate.format(new Date(`${day}T00:00:00Z`));

async function Billing({ overdueOnly }: { overdueOnly: boolean }) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { user, memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  // Devise et pays de l'organisation (D-69) : totaux, et « Bancontact » ou « Carte bancaire ».
  const { currency, country } = memberships[0];
  const bankCard = paymentMethodLabel("bancontact", country);
  const today = todayIsoInBrussels();
  const profile = await getCoachProfile(user);
  const includeCash = profile.preferences.invoiceCash;
  const [invoices, toInvoice, athletes, entities] = await Promise.all([
    listInvoices(organizationId),
    listInvoiceablePayments(organizationId, addDays(today, -365), includeCash),
    listAthletes(organizationId, { status: "all", q: "" }),
    listLegalEntities(organizationId),
  ]);
  // Après un changement de devise (D-70) : factures d'avant converties, total « ≈ ».
  const activity = monthActivity(
    invoices.filter((invoice) => invoice.status === "issued"),
    today,
    await getConverter(memberships[0]),
  );
  const overdue = invoices.filter((invoice) => invoiceStatus(invoice, today) === "overdue");
  const shownInvoices = overdueOnly ? overdue : invoices;
  const tally = (cents: number, byCurrency: ByCurrency) =>
    describeTotal(cents, byCurrency, currency).value;

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
              defaultVatRate: entity.defaultVatRate,
            }))}
            today={today}
            dueDefault={addDays(today, 15)}
          />
        }
      />
      {/* Ordinateur (demande d'Antonino du 29/10/2026) : « À facturer » et « Factures » côte à côte,
          à la même hauteur ; téléphone : l'une sous l'autre. */}
      <PageBody grid>
        <Card
          id="to-invoice-title"
          className="lg:col-span-6"
          // Deux cartes bien distinctes (29/10) : « À facturer » en rouge, « Factures » en vert.
          title={
            <CardTitle icon={Landmark} color="var(--alert)">
              À facturer
            </CardTitle>
          }
          subtitle={
            includeCash
              ? `Paiements reçus sans facture, sur 12 mois (virement, ${bankCard}, espèces).`
              : `Paiements reçus sur ton compte (virement, ${bankCard}) sans facture, sur 12 mois. Les espèces : réglage dans Paramètres, ou « Créer une facture ».`
          }
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
                    sub={[
                      payment.label,
                      `${formatMoney(payment.amountCents, payment.currency)} ${payment.method === "cash" ? "en espèces" : payment.method === "bancontact" ? `par ${bankCard}` : "par virement"}`,
                    ]
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
          // Filtre « En retard » (lien de la cloche) : sur téléphone, les factures passent en premier.
          className={`lg:col-span-6 ${overdueOnly ? "max-lg:order-first" : ""}`}
          title={
            <CardTitle icon={FileText} color="var(--ok)">
              Factures
            </CardTitle>
          }
          subtitle={`${tally(activity.sent.cents, activity.sent.byCurrency)} émis ce mois-ci · ${tally(activity.pending.cents, activity.pending.byCurrency)} en attente`}
        >
          {invoices.length > 0 ? (
            <FilterChips
              label="Filtrer les factures"
              size="sm"
              options={[
                { href: "/coach/facturation", label: "Toutes", active: !overdueOnly },
                {
                  href: "/coach/facturation?statut=en-retard",
                  label: `En retard${overdue.length > 0 ? ` (${overdue.length})` : ""}`,
                  active: overdueOnly,
                },
              ]}
            />
          ) : null}
          {shownInvoices.length === 0 ? (
            <CardEmpty icon={FileText}>
              {overdueOnly ? "Aucune facture en retard." : "Aucune facture pour l'instant."}
            </CardEmpty>
          ) : (
            <ul aria-label="Liste des factures" className="flex flex-col">
              {shownInvoices.map((invoice) => {
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
                            {formatMoney(invoice.amountCents, invoice.currency)}
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
