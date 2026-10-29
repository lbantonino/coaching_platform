import { FileText, FolderOpen, Upload } from "lucide-react";
import Link from "next/link";

import { ListRow } from "@/components/blocks/list-row";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardEmpty } from "@/components/ui/card";
import { formatBytes } from "@/domain/documents/documents";
import { listDocuments } from "@/features/documents/queries";
import { formatDate } from "@/lib/format";

// Onglet « Documents » de la fiche sportif (option D du classement, D-67) : les documents liés à ce
// sportif, du plus récent au plus ancien. Importer passe par la page Documents, avec ce sportif déjà
// choisi : une seule fenêtre d'import dans l'app.
export async function AthleteDocuments({
  organizationId,
  athleteId,
  athleteName,
}: {
  organizationId: string;
  athleteId: string;
  athleteName: string;
}) {
  const documents = await listDocuments(organizationId, athleteId);
  const pageHref = `/coach/documents?sportif=${athleteId}`;
  return (
    <Card
      id="athlete-documents-title"
      title="Documents"
      subtitle={`Contrats, bilans, factures… liés à ${athleteName}.`}
    >
      <div className="flex flex-wrap gap-2.5 max-sm:[&>*]:flex-1">
        <Link href={`${pageHref}&importer`} className={buttonClass({ variant: "outline" })}>
          <Upload aria-hidden size={15} strokeWidth={1.8} />
          Importer un document
        </Link>
        {documents.length > 0 ? (
          <Link href={pageHref} className={buttonClass({ variant: "ghost" })}>
            <FolderOpen aria-hidden size={15} strokeWidth={1.8} />
            Voir dans Documents
          </Link>
        ) : null}
      </div>
      {documents.length === 0 ? (
        <CardEmpty icon={FileText}>Aucun document lié à ce sportif pour l&apos;instant.</CardEmpty>
      ) : (
        <ul aria-label={`Documents de ${athleteName}`} className="flex flex-col">
          {documents.map((document) => (
            <li key={document.id}>
              <ListRow
                href={`/documents/${document.id}`}
                title={document.name}
                sub={`${formatBytes(document.sizeBytes)} · ${formatDate(document.updatedAt.slice(0, 10))}`}
                trailing={<Badge>{document.categoryName ?? "Sans catégorie"}</Badge>}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
