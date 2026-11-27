import type { NextRequest } from "next/server";

import { programPdf } from "@/domain/training/pdf-programme";
import { requireOrgAccess } from "@/features/auth/guards";
import { pdfResponse } from "@/features/programs/pdf/pdf-response";
import { renderProgramPdf } from "@/features/programs/pdf/program-pdf";
import { loadProgramPdfInput } from "@/features/programs/pdf/program-pdf-source";

// Le PDF du programme (phase 5 ; un seul fichier depuis D-211, 27/11/2026 : l'agenda puis « Fiches et
// repères ») : généré à la demande depuis la version PUBLIÉE, avec la session du coach (organisation
// vérifiée ici, puis la RLS en dernière défense). Programme inconnu, d'une autre organisation ou
// jamais publié : 404, sans rien révéler.
export async function GET(
  request: NextRequest,
  context: RouteContext<"/coach/o/[orgId]/programmes/[programId]/pdf">,
) {
  const { orgId, programId } = await context.params;
  const { user, membership } = await requireOrgAccess(orgId);
  const input = await loadProgramPdfInput(membership.organizationId, programId, user);
  if (!input) return new Response(null, { status: 404 });
  const model = programPdf(input);
  const pdf = await renderProgramPdf(model, input.coachName);
  return pdfResponse(pdf, model.fileName, request.nextUrl.searchParams.has("telecharger"));
}
