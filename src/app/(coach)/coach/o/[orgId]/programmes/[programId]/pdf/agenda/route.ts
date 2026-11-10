import type { NextRequest } from "next/server";

import { agendaPdf } from "@/domain/training/pdf-agenda";
import { requireOrgAccess } from "@/features/auth/guards";
import { renderAgendaPdf } from "@/features/programs/pdf/agenda-pdf";
import { pdfResponse } from "@/features/programs/pdf/pdf-response";
import { loadProgramPdfInput } from "@/features/programs/pdf/program-pdf-source";

// PDF 1 « Agenda du programme » (phase 5) : généré à la demande depuis la version PUBLIÉE, avec la
// session du coach (organisation vérifiée ici, puis la RLS en dernière défense). Programme inconnu,
// d'une autre organisation ou jamais publié : 404, sans rien révéler.
export async function GET(
  request: NextRequest,
  context: RouteContext<"/coach/o/[orgId]/programmes/[programId]/pdf/agenda">,
) {
  const { orgId, programId } = await context.params;
  const { user, membership } = await requireOrgAccess(orgId);
  const input = await loadProgramPdfInput(membership.organizationId, programId, user);
  if (!input) return new Response(null, { status: 404 });
  const model = agendaPdf(input);
  const pdf = await renderAgendaPdf(model, input.coachName);
  return pdfResponse(pdf, model.fileName, request.nextUrl.searchParams.has("telecharger"));
}
