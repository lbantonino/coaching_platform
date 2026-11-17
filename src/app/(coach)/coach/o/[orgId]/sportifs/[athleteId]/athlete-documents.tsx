import { FileSpreadsheet, FileText, ImageIcon, Upload } from "lucide-react";
import Link from "next/link";

import { tileClassFor } from "@/components/blocks/category-color";
import { formatBytes } from "@/domain/documents/documents";
import { listDocuments, type CoachDocument } from "@/features/documents/queries";
import { formatDate } from "@/lib/format";

// Onglet « Documents » de la fiche sportif (option D du classement, D-67), d'après la maquette
// « Sportifs » du 03/11/2026 (page 2j) : une seule carte, pleine largeur, qui descend jusqu'au bas du
// menu sur ordinateur (« espace vide sous la liste accepté ») et suit son contenu sur téléphone.
// Les documents liés à ce sportif, du plus récent au plus ancien ; chaque ligne ouvre le document.
// Importer passe par la page Documents, avec ce sportif déjà choisi : une seule fenêtre d'import.
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
    <section
      aria-labelledby="athlete-documents-title"
      className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft lg:flex-1"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="athlete-documents-title"
          className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
        >
          Documents
        </h2>
        <p className="text-[13.5px] leading-[1.5] text-pretty text-muted">
          Contrats, bilans, factures… liés à {athleteName}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`${pageHref}&importer`}
          className="flex h-[38px] shrink-0 items-center gap-[7px] rounded-[10px] px-3.5 text-[13.5px] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2 active:scale-[0.97]"
        >
          <Upload aria-hidden size={14} strokeWidth={1.8} />
          Importer un document
        </Link>
        {documents.length > 0 ? (
          <Link
            href={pageHref}
            className="flex h-[38px] items-center rounded-[10px] px-2.5 text-[13.5px] font-medium whitespace-nowrap text-violet-text transition-colors duration-150 hover:bg-violet/7"
          >
            Voir dans Documents
          </Link>
        ) : null}
      </div>

      {documents.length === 0 ? (
        <p
          role="status"
          className="rounded-2xl border border-dashed border-line-2 p-[18px] text-[14px] leading-[1.5] text-muted"
        >
          Aucun document lié à ce sportif pour l&apos;instant.
        </p>
      ) : (
        <ul aria-label={`Documents de ${athleteName}`} className="flex flex-col gap-2">
          {documents.map((document) => (
            <li key={document.id}>
              <Link
                href={`/documents/${document.id}`}
                className="flex items-center gap-3 rounded-[14px] bg-surface-2 p-3 transition-shadow duration-150 hover:inset-ring hover:inset-ring-line-2"
              >
                <DocumentTile document={document} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[14px] leading-[17.5px] font-semibold break-words">
                    {document.name}
                  </span>
                  {/* Taille et date : sur un écran étroit, la date passe entière à la ligne. */}
                  <span className="text-[12.5px] leading-4 text-muted">
                    <span className="whitespace-nowrap">{formatBytes(document.sizeBytes)} ·</span>{" "}
                    <span className="whitespace-nowrap">
                      {formatDate(document.updatedAt.slice(0, 10))}
                    </span>
                  </span>
                </span>
                <span className="flex h-6 shrink-0 items-center rounded-[6px] bg-bg px-[9px] text-[12px] font-medium whitespace-nowrap text-text-2">
                  {document.categoryName ?? "Sans catégorie"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Icône du type de fichier, dans la couleur de sa catégorie (D-68, demande d'Antonino), comme sur la
// page Documents (la maquette la dessine blanche ; la couleur de catégorie est gardée).
function DocumentTile({ document }: { document: CoachDocument }) {
  const Icon =
    document.kind === "image" ? ImageIcon : document.kind === "excel" ? FileSpreadsheet : FileText;
  return (
    <span
      aria-hidden
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-[11px] ${tileClassFor(document.categoryColor)}`}
    >
      <Icon size={17} strokeWidth={1.8} />
    </span>
  );
}
