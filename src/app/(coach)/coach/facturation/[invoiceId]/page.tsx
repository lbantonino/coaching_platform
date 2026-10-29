import { Download, FileText, Landmark, Receipt, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { addressLines, invoiceTotals, vatMention } from "@/domain/billing/invoice-document";
import { formatEuros } from "@/domain/billing/invoices";
import { formatEnterpriseNumber } from "@/domain/billing/legal";
import { requireCoach } from "@/features/auth/guards";
import { getInvoice } from "@/features/billing/invoice-queries";
import { listLegalEntities } from "@/features/coach/legal-queries";
import { formatDate, todayIsoInBrussels } from "@/lib/format";

import {
  DeleteDraftButton,
  InvoiceDraftForm,
  IssueInvoiceButton,
  MarkPaidForm,
} from "../invoice-controls";

export const metadata: Metadata = {
  title: "Facture",
};

// Une facture (D-65). Brouillon : formulaire modifiable, « Émettre » et « Supprimer ». Émise : son
// numéro, en lecture seule (elle ne change plus). Les deux se téléchargent en PDF ; le brouillon
// porte alors la mention « Brouillon, non valable ».
export default function InvoicePage({
  params,
  searchParams,
}: PageProps<"/coach/facturation/[invoiceId]">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ invoiceId }, query]) => (
          <Invoice invoiceId={invoiceId} paymentFailed={query.paiement === "echec"} />
        ))}
      </Suspense>
    </main>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-2.5 text-[14px]">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium tabular">{value}</span>
    </div>
  );
}

async function Invoice({
  invoiceId,
  paymentFailed,
}: {
  invoiceId: string;
  // « Créer une facture » déjà payée : la facture est créée, mais le paiement n'a pas pu être noté.
  paymentFailed: boolean;
}) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation ; la RLS limite la lecture.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const invoice = /^[0-9a-f-]{36}$/i.test(invoiceId)
    ? await getInvoice(organizationId, invoiceId)
    : null;
  if (!invoice) notFound();
  const draft = invoice.status === "draft";
  const entities = draft ? await listLegalEntities(organizationId) : [];
  const totals = invoiceTotals(invoice.amountCents, invoice.vatRate);
  const seller = invoice.seller;
  const mention = seller ? vatMention(seller.vatStatus) : null;

  return (
    <>
      <PageHeader
        back={{ href: "/coach/facturation", label: "Facturation" }}
        title={draft ? "Brouillon de facture" : `Facture ${invoice.number}`}
        titleAside={draft ? <Badge>Brouillon</Badge> : <Badge tone="ok">Émise</Badge>}
        subtitle={`${invoice.client.name} · ${formatEuros(invoice.amountCents)}${
          invoice.paidOn ? ` · payée le ${formatDate(invoice.paidOn)}` : ""
        }`}
        actions={
          <>
            <a
              href={`/coach/facturation/${invoice.id}/pdf`}
              download
              className={buttonClass({
                variant: draft ? "outline" : "primary",
                size: "md",
                className: "max-lg:w-full",
              })}
            >
              <Download aria-hidden size={17} strokeWidth={1.8} />
              {draft ? "Aperçu PDF" : "Télécharger le PDF"}
            </a>
            {draft ? (
              <IssueInvoiceButton organizationId={organizationId} invoiceId={invoice.id} />
            ) : null}
          </>
        }
      />
      <PageBody grid>
        {paymentFailed && !invoice.paidOn ? (
          <p
            role="alert"
            className="rounded-wide border border-warn/50 bg-warn-soft p-4 text-[14px] lg:col-span-12"
          >
            La facture est créée, mais le paiement n&apos;a pas pu être noté. Note-le ci-dessous
            avec « Marquer comme payée ».
          </p>
        ) : null}
        {invoice.paidOn ? null : (
          <Card
            id="invoice-payment-title"
            title={
              <CardTitle icon={Landmark} color="var(--warn)">
                À payer
              </CardTitle>
            }
            subtitle={`Échéance le ${formatDate(invoice.dueOn)}. Le paiement reçu s'ajoute à la Comptabilité.`}
            className="lg:col-span-12"
          >
            <MarkPaidForm
              organizationId={organizationId}
              invoiceId={invoice.id}
              today={todayIsoInBrussels()}
            />
          </Card>
        )}
        <Card
          id="invoice-amounts-title"
          title={
            <CardTitle icon={Receipt} color="var(--ok)">
              Montants
            </CardTitle>
          }
          className="lg:col-span-5"
        >
          <div className="flex flex-col">
            <Line label="Total HTVA" value={formatEuros(totals.exclCents)} />
            <Line label={`TVA ${invoice.vatRate} %`} value={formatEuros(totals.vatCents)} />
            <Line label="Total TVAC" value={formatEuros(totals.inclCents)} />
            <Line label="Date" value={formatDate(invoice.issuedOn)} />
            {invoice.serviceOn ? (
              <Line label="Prestation" value={formatDate(invoice.serviceOn)} />
            ) : null}
          </div>
          {draft ? (
            <p className="text-[13px] text-muted">
              {invoice.paymentId
                ? "Le montant est celui du paiement reçu. "
                : "Montant TVA comprise. "}
              La date et le numéro sont donnés à l&apos;émission.
            </p>
          ) : mention ? (
            <p className="text-[13px] text-muted">{mention}</p>
          ) : null}
        </Card>

        {draft ? (
          <Card
            id="invoice-draft-title"
            title={
              <CardTitle icon={FileText} color="var(--run)">
                Brouillon
              </CardTitle>
            }
            className="lg:col-span-7"
          >
            <InvoiceDraftForm
              organizationId={organizationId}
              invoiceId={invoice.id}
              entities={entities.map((entity) => ({
                id: entity.id,
                name: entity.name,
                vatSubject: entity.vatStatus === "subject",
              }))}
              values={{
                legalEntityId: invoice.legalEntityId ?? entities[0]?.id ?? "",
                label: invoice.label,
                serviceOn: invoice.serviceOn ?? "",
                vatRate: String(invoice.vatRate),
                clientName: invoice.client.name,
                addressLine: invoice.client.addressLine ?? "",
                postalCode: invoice.client.postalCode ?? "",
                city: invoice.client.city ?? "",
                country: invoice.client.country ?? "BE",
              }}
            />
            <div className="border-t border-line pt-4">
              <DeleteDraftButton organizationId={organizationId} invoiceId={invoice.id} />
            </div>
          </Card>
        ) : (
          <Card
            id="invoice-parties-title"
            title={
              <CardTitle icon={UserRound} color="var(--strength)">
                Client et structure
              </CardTitle>
            }
            className="lg:col-span-7"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-0.5 text-[14px]">
                <span className="text-[12px] font-semibold tracking-[0.04em] text-muted uppercase">
                  Facturé à
                </span>
                <span className="font-semibold">{invoice.client.name}</span>
                {addressLines(invoice.client).map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              {seller ? (
                <div className="flex flex-col gap-0.5 text-[14px]">
                  <span className="text-[12px] font-semibold tracking-[0.04em] text-muted uppercase">
                    Émise par
                  </span>
                  <span className="font-semibold">{seller.name}</span>
                  {addressLines(seller).map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                  {seller.enterpriseNumber ? (
                    <span className="text-muted">
                      N° d&apos;entreprise {formatEnterpriseNumber(seller.enterpriseNumber)}
                    </span>
                  ) : null}
                  {seller.vatNumber ? (
                    <span className="text-muted">TVA {seller.vatNumber}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className="border-t border-line pt-3.5 text-[13px] text-muted">
              {invoice.label}. Une facture émise ne se modifie plus : une erreur se corrigera par
              une note de crédit.
            </p>
          </Card>
        )}
      </PageBody>
    </>
  );
}
