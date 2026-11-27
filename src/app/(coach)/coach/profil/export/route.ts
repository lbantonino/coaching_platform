import { LEGAL } from "@/config/legal";
import { jsonStream, readAll } from "@/features/account/export-data";
import { requireCoach } from "@/features/auth/guards";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

// Export des données (Paramètres > Données, D-57 ; droit à la portabilité, RGPD art. 20) : tout ce
// que l'organisation du coach contient, en un fichier JSON lisible par une autre application. Lu
// avec la session du coach : la RLS ne laisse sortir que les données de SON organisation. Chaque
// table est lue page par page jusqu'au bout (au-delà de 1 000 lignes, le fichier était coupé) ; si une
// lecture échoue, l'export échoue au lieu de sortir un fichier incomplet (relecture du 18/11/2026,
// qui a aussi ajouté une douzaine de tables oubliées depuis D-57). Les fichiers eux-mêmes (documents,
// photos) n'y sont pas : seulement leurs noms et dates. Le fichier part en flux, JSON compact (Vercel
// refuse une réponse de plus de 4,5 Mo qui ne serait pas en flux).

// Lecture de 30 tables page par page : jamais plus d'une minute (au lieu des 300 s de l'espace coach).
export const maxDuration = 60;

type Source = {
  table: string;
  // Clé primaire : l'ordre stable qui permet de lire page par page.
  order: string[];
  // Colonnes, quand une colonne ne doit jamais sortir (jeton secret d'une invitation).
  columns?: string;
  // Filtre : l'organisation (par défaut) ou le coach lui-même.
  by?: "organization" | "user";
};

const SOURCES: Source[] = [
  // Le coach lui-même : son inscription (nom, téléphone, acceptation des conditions) et son rôle.
  { table: "account_signups", order: ["user_id"], by: "user" },
  { table: "organization_members", order: ["organization_id", "user_id"] },
  { table: "athlete_profiles", order: ["id"] },
  { table: "athlete_goals", order: ["id"] },
  { table: "athlete_personal_records", order: ["id"] },
  { table: "athlete_reference_metrics", order: ["id"] },
  { table: "athlete_consents", order: ["id"] },
  { table: "athlete_notes", order: ["id"] },
  {
    table: "athlete_invites",
    order: ["id"],
    columns:
      "id, organization_id, athlete_id, status, expires_at, created_by, created_at, revoked_at, accepted_at, accepted_by, adult_confirmed_at",
  },
  { table: "coach_sessions", order: ["id"] },
  { table: "coach_session_athletes", order: ["session_id", "athlete_id"] },
  { table: "coach_session_exceptions", order: ["session_id", "original_date"] },
  { table: "athlete_payments", order: ["id"] },
  { table: "athlete_invoices", order: ["id"] },
  { table: "organization_legal_entities", order: ["id"] },
  { table: "coach_expenses", order: ["id"] },
  { table: "expense_categories", order: ["id"] },
  { table: "organization_currency_changes", order: ["id"] },
  { table: "coach_tasks", order: ["id"] },
  { table: "coach_task_lists", order: ["id"] },
  { table: "athlete_messages", order: ["id"] },
  { table: "coach_documents", order: ["id"] },
  { table: "document_categories", order: ["id"] },
  { table: "programs", order: ["id"] },
  { table: "program_drafts", order: ["program_id"] },
  { table: "program_publications", order: ["id"] },
  { table: "publication_sessions", order: ["id"] },
  { table: "program_templates", order: ["id"] },
  { table: "session_templates", order: ["id"] },
  { table: "exercises", order: ["id"] },
  { table: "exercise_favorites", order: ["user_id", "exercise_id"], by: "user" },
  { table: "assistant_usage", order: ["id"] },
  // Conversations de l'Assistant IA (D-212) : celles du coach (la RLS ne laisse voir que les siennes).
  { table: "assistant_conversations", order: ["id"] },
];

const FAILED = `L'export n'a pas abouti. Réessaie dans un instant ; si ça recommence, écris à ${LEGAL.contactEmail}.`;

export async function GET() {
  const { user, memberships } = await requireCoach();
  const organization = memberships[0];
  const supabase = await createClient();

  try {
    const donnees = Object.fromEntries(
      await Promise.all(
        SOURCES.map(async ({ table, order, columns = "*", by = "organization" }) => {
          const rows = await readAll((from, to) => {
            // Nom de table venu de la liste ci-dessus (jamais du navigateur).
            let query = supabase
              .from(table as "programs")
              .select(columns)
              .eq(
                by === "user" ? ("user_id" as "id") : "organization_id",
                by === "user" ? user.id : organization.organizationId,
              );
            for (const column of order) query = query.order(column as "id");
            return query.range(from, to);
          }).catch((error: { code?: string; message?: string }) => {
            // Le journal du serveur dit QUELLE table a échoué (jamais les données).
            console.error("[export]", table, error?.code ?? error?.message ?? "erreur");
            throw error;
          });
          return [table, rows] as const;
        }),
      ),
    );
    const [{ data: profile, error: profileError }, { data: org, error: orgError }] =
      await Promise.all([
        supabase.from("coach_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("organizations")
          .select("id, name, timezone, country, currency, vat_rate, created_at")
          .eq("id", organization.organizationId)
          .single(),
      ]);
    if (profileError || orgError) {
      console.error("[export]", profileError ? "coach_profiles" : "organizations");
      throw profileError ?? orgError;
    }

    const body = {
      exporte_le: new Date().toISOString(),
      application: "Coory",
      a_savoir:
        "Les fichiers eux-mêmes (documents, photos) ne sont pas dans cet export : seulement leurs noms et dates. Les documents se téléchargent un par un depuis la page Documents de Coory.",
      compte: { email: user.email, profil: profile },
      organisation: {
        id: org.id,
        nom: org.name,
        pays: org.country,
        devise: org.currency,
        tva: org.vat_rate,
        fuseau_horaire: org.timezone,
        creee_le: org.created_at,
      },
      donnees,
    };
    return new Response(jsonStream(body), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="coory-export-${todayIsoInBrussels()}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(FAILED, {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
