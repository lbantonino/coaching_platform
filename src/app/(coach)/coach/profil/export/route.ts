import { requireCoach } from "@/features/auth/guards";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

// Export des données (Paramètres > Données, D-57 ; droit à la portabilité, RGPD art. 20) : tout ce
// que l'organisation du coach contient, en un fichier JSON lisible par une autre application. Lu
// avec la session du coach : la RLS ne laisse sortir que les données de SON organisation.
const TABLES = [
  "athlete_profiles",
  "athlete_goals",
  "athlete_personal_records",
  "athlete_reference_metrics",
  "athlete_consents",
  "athlete_notes",
  "coach_sessions",
  "coach_session_athletes",
  "coach_session_exceptions",
  "athlete_payments",
  "athlete_invoices",
  "coach_tasks",
  "athlete_messages",
  "programs",
  "program_publications",
  "publication_sessions",
  "organization_legal_entities",
] as const;

export async function GET() {
  const { user, memberships } = await requireCoach();
  const organization = memberships[0];
  const supabase = await createClient();

  const results = await Promise.all(
    TABLES.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("organization_id", organization.organizationId);
      return [table, error ? { erreur: "Lecture impossible" } : (data ?? [])] as const;
    }),
  );
  const { data: profile } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const body = {
    exporte_le: new Date().toISOString(),
    application: "Coory",
    compte: { email: user.email, profil: profile },
    organisation: { id: organization.organizationId, nom: organization.organizationName },
    donnees: Object.fromEntries(results),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="coory-export-${todayIsoInBrussels()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
