import "server-only";

import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

import { addressLines, invoiceTotals } from "@/domain/billing/invoice-document";
import { formatEuros } from "@/domain/billing/invoices";
import { formatEnterpriseNumber, formatIban } from "@/domain/billing/legal";
import { formatDate } from "@/lib/format";

import type { InvoiceDetail } from "./invoice-queries";

// PDF d'une facture (D-65), rendu côté serveur par React-PDF (moteur PDF retenu le 29/10/2026, il
// servira aussi aux programmes en P5). Document imprimable : fond blanc, texte noir, un filet or
// (couleur de la marque) ; police Helvetica intégrée au format PDF. Un brouillon porte la mention
// « Brouillon, non valable » et pas de numéro.

// Helvetica (police standard du PDF) n'a pas l'espace fine insécable des montants à la belge.
const plain = (text: string) => text.replace(/[  ]/g, " ");
const euros = (cents: number) => plain(formatEuros(cents));

const INK = "#141518";
const MUTED = "#5f6168";
const LINE = "#d9d9d6";
const GOLD = "#c9a24a";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: INK, lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 24 },
  sellerName: { fontFamily: "Helvetica-Bold", fontSize: 14, marginBottom: 4 },
  muted: { color: MUTED },
  title: { fontFamily: "Helvetica-Bold", fontSize: 22, lineHeight: 1.1, textAlign: "right" },
  draft: { color: "#963d3a", fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 2 },
  meta: { textAlign: "right", marginTop: 8 },
  rule: { height: 2, backgroundColor: GOLD, marginVertical: 22 },
  label: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  table: { marginTop: 26, borderTopWidth: 1, borderColor: LINE },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderColor: LINE },
  description: { flex: 1, paddingRight: 12 },
  cell: { width: 80, textAlign: "right" },
  head: { fontFamily: "Helvetica-Bold", fontSize: 8, color: MUTED, textTransform: "uppercase" },
  totals: { marginTop: 14, marginLeft: "auto", width: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: INK,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  notes: { marginTop: 30, gap: 4 },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: MUTED },
});

function InvoiceDocument({ invoice }: { invoice: InvoiceDetail }) {
  const seller = invoice.seller;
  const totals = invoiceTotals(invoice.amountCents, invoice.vatRate);
  const draft = invoice.status === "draft";
  return (
    <Document
      title={draft ? "Brouillon de facture" : `Facture ${invoice.number}`}
      author={seller?.name ?? undefined}
      language="fr-BE"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.sellerName}>{seller?.name ?? "Structure à choisir"}</Text>
            {seller
              ? addressLines(seller).map((line) => (
                  <Text key={line} style={styles.muted}>
                    {line}
                  </Text>
                ))
              : null}
            {seller?.enterpriseNumber ? (
              <Text style={styles.muted}>
                N° d&apos;entreprise {formatEnterpriseNumber(seller.enterpriseNumber)}
              </Text>
            ) : null}
            {seller?.vatNumber ? <Text style={styles.muted}>TVA {seller.vatNumber}</Text> : null}
            {seller?.email ? <Text style={styles.muted}>{seller.email}</Text> : null}
          </View>
          <View>
            <Text style={styles.title}>Facture</Text>
            {draft ? <Text style={styles.draft}>Brouillon, non valable</Text> : null}
            <View style={styles.meta}>
              {invoice.number ? <Text>N° {invoice.number}</Text> : null}
              <Text>Date : {formatDate(invoice.issuedOn)}</Text>
              {invoice.serviceOn && invoice.serviceOn !== invoice.issuedOn ? (
                <Text>Prestation : {formatDate(invoice.serviceOn)}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.rule} />

        <View>
          <Text style={styles.label}>Facturé à</Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{invoice.client.name}</Text>
          {addressLines(invoice.client).map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </View>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.description, styles.head]}>Description</Text>
            <Text style={[styles.cell, styles.head]}>HTVA</Text>
            <Text style={[styles.cell, styles.head]}>TVA</Text>
            <Text style={[styles.cell, styles.head]}>Total</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.description}>{invoice.label}</Text>
            <Text style={styles.cell}>{euros(totals.exclCents)}</Text>
            <Text style={styles.cell}>{invoice.vatRate} %</Text>
            <Text style={styles.cell}>{euros(totals.inclCents)}</Text>
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Total HTVA</Text>
            <Text>{euros(totals.exclCents)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>TVA {invoice.vatRate} %</Text>
            <Text>{euros(totals.vatCents)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total TVAC</Text>
            <Text>{euros(totals.inclCents)}</Text>
          </View>
        </View>

        <View style={styles.notes}>
          {invoice.paidOn ? (
            <Text>Payée le {formatDate(invoice.paidOn)}. Merci !</Text>
          ) : (
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              À payer au plus tard le {formatDate(invoice.dueOn)}
              {invoice.number ? `, avec la communication « ${invoice.number} »` : ""}.
            </Text>
          )}
          {seller?.iban ? (
            <Text style={styles.muted}>
              IBAN {formatIban(seller.iban)}
              {seller.bic ? ` · BIC ${seller.bic}` : ""}
            </Text>
          ) : null}
          {seller?.legalMentions ? <Text style={styles.muted}>{seller.legalMentions}</Text> : null}
        </View>

        <Text style={styles.footer} fixed>
          {seller?.name ?? ""}
          {invoice.number ? ` · Facture ${invoice.number}` : " · Brouillon"}
        </Text>
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(invoice: InvoiceDetail): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument invoice={invoice} />);
}
