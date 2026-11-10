import type { NextRequest } from "next/server";

import { fichesPdf } from "@/domain/training/pdf-fiches";
import { requireOrgAccess } from "@/features/auth/guards";
import { renderFichesPdf } from "@/features/programs/pdf/fiches-pdf";
import { pdfResponse } from "@/features/programs/pdf/pdf-response";
import { loadProgramPdfInput } from "@/features/programs/pdf/program-pdf-source";

// PDF 2 « Fiches et repères » (phase 5) : mêmes règles que l'agenda (version PUBLIÉE, session du
// coach, 404 pour un programme inconnu, d'une autre organisation ou jamais publié).
export async function GET(
  request: NextRequest,
  context: RouteContext<"/coach/o/[orgId]/programmes/[programId]/pdf/fiches">,
) {
  const { orgId, programId } = await context.params;
  const { user, membership } = await requireOrgAccess(orgId);
  const input = await loadProgramPdfInput(membership.organizationId, programId, user);
  if (!input) return new Response(null, { status: 404 });
  const model = fichesPdf(input);
  const pdf = await renderFichesPdf(model, input.coachName);
  return pdfResponse(pdf, model.fileName, request.nextUrl.searchParams.has("telecharger"));
}
