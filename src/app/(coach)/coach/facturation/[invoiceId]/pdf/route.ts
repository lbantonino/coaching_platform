import { invoiceFileName } from "@/domain/billing/invoice-document";
import { requireCoach } from "@/features/auth/guards";
import { renderInvoicePdf } from "@/features/billing/invoice-pdf";
import { getInvoice } from "@/features/billing/invoice-queries";

// Téléchargement du PDF d'une facture (D-65), lu avec la session du coach : la RLS ne laisse sortir
// que les factures de SON organisation ; une autre facture répond « introuvable », sans fuite.
// ?apercu : le PDF s'affiche dans la page (fenêtre « Aperçu », 29/10/2026) au lieu d'être téléchargé.
export async function GET(
  request: Request,
  { params }: RouteContext<"/coach/facturation/[invoiceId]/pdf">,
) {
  const { invoiceId } = await params;
  const { memberships } = await requireCoach();
  const invoice = /^[0-9a-f-]{36}$/i.test(invoiceId)
    ? await getInvoice(memberships[0].organizationId, invoiceId)
    : null;
  if (!invoice) return new Response("Facture introuvable.", { status: 404 });
  const pdf = await renderInvoicePdf(invoice);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        new URL(request.url).searchParams.has("apercu") ? "inline" : "attachment"
      }; filename="${invoiceFileName(invoice.number)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
