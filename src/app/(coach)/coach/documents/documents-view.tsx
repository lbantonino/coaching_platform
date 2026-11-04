"use client";

import {
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Search,
  Tags,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState, useTransition, type FormEvent } from "react";

import { categoryDotClass, tileClassFor } from "@/components/blocks/category-color";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { chipActiveClass, chipClass, chipIdleClass } from "@/components/ui/chip";
import { inputClass } from "@/components/ui/form-styles";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { DlgChips, DlgField, DlgFieldset, DlgSelect } from "@/components/ui/dialog-fields";
import {
  dlgDropZoneClass,
  dlgErrorClass,
  dlgFormGridClass,
  dlgInputClass,
  dlgPrimaryButtonClass,
} from "@/components/ui/dialog-styles";
import {
  ActionMenu,
  ConfirmDialog,
  DialogBody,
  DialogFooter,
  DialogIconButton,
  PanelDialog,
  Sheet,
} from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { Quoted } from "@/components/ui/quoted";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_NAME_MAX,
  foldText as fold,
  formatBytes,
  guessCategoryId,
  nameFromFile,
  type DocumentCategory,
  type DocumentKind,
} from "@/domain/documents/documents";
import type { CategoryResult, DocumentFormState } from "@/features/documents/actions";
import type { CoachDocument } from "@/features/documents/queries";

import { CategoryManager } from "@/components/blocks/category-manager";

// Page Documents (prompt Claude Design §7 `/coach/documents`, 4e, D-60) : chiffres, recherche et
// filtres en direct, liste ; un appui ouvre l'aperçu (PDF, image) avec Télécharger, Modifier et
// Supprimer ; « Importer un fichier » : le fichier, son nom, sa catégorie et le sportif concerné.
// Classement (option D, D-67) : les catégories du coach (créées, renommées, supprimées dans « Gérer
// les catégories ») et le sportif comme second filtre ; ?sportif=<id> ouvre la page filtrée sur un
// sportif (onglet Documents de sa fiche), ?importer ouvre l'import avec ce sportif déjà choisi.
type Athlete = { id: string; name: string };
type UploadAction = (previous: DocumentFormState, formData: FormData) => Promise<DocumentFormState>;
type UpdateAction = (
  documentId: string,
  previous: DocumentFormState,
  formData: FormData,
) => Promise<DocumentFormState>;

const kindIcons: Record<DocumentKind, LucideIcon> = {
  pdf: FileText,
  image: ImageIcon,
  word: FileText,
  excel: FileSpreadsheet,
};
const kindLabels: Record<DocumentKind, string> = {
  pdf: "PDF",
  image: "Image",
  word: "Word",
  excel: "Excel",
};

const dayFormatter = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Brussels",
});
const shortDay = (iso: string) => dayFormatter.format(new Date(iso));

// Filtre de catégorie : toutes, une catégorie (son id), ou les documents sans catégorie.
const ALL = "tous";
const NONE = "sans";
const categoryLabel = (document: CoachDocument) => document.categoryName ?? "Sans catégorie";

type CategoryActions = {
  create: (name: string) => Promise<CategoryResult>;
  rename: (categoryId: string, name: string) => Promise<CategoryResult>;
  remove: (categoryId: string) => Promise<CategoryResult>;
  recolor: (categoryId: string, color: string) => Promise<CategoryResult>;
};

const fileUrl = (id: string) => `/documents/${id}`;
const downloadUrl = (id: string) => `/documents/${id}?telecharger`;

export function DocumentsView({
  documents,
  categories,
  athletes,
  orgBase,
  monthStart,
  initialAthleteId,
  openImport,
  upload,
  update,
  remove,
  categoryActions,
}: {
  documents: CoachDocument[];
  categories: DocumentCategory[];
  athletes: Athlete[];
  // ?sportif=<id> : la page s'ouvre filtrée sur ce sportif ; ?importer : l'import s'ouvre aussi.
  initialAthleteId: string;
  openImport: boolean;
  categoryActions: CategoryActions;
  orgBase: string;
  // Premier jour du mois à Bruxelles (AAAA-MM-JJ), pour « ajoutés ce mois-ci ».
  monthStart: string;
  upload: UploadAction;
  update: UpdateAction;
  remove: (documentId: string) => Promise<{ ok: boolean }>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [athleteFilter, setAthleteFilter] = useState(initialAthleteId);
  const [importing, setImporting] = useState(openImport);
  const [managing, setManaging] = useState(false);
  const [previewed, setPreviewed] = useState<CoachDocument | null>(null);
  const [editing, setEditing] = useState<CoachDocument | null>(null);
  const [deleting, setDeleting] = useState<CoachDocument | null>(null);
  const [menuFor, setMenuFor] = useState<CoachDocument | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const words = fold(query).split(/\s+/).filter(Boolean);
  const shown = documents.filter((document) => {
    if (
      category === NONE
        ? document.categoryId !== null
        : category !== ALL && document.categoryId !== category
    ) {
      return false;
    }
    if (athleteFilter && document.athleteId !== athleteFilter) return false;
    const haystack = fold(
      [document.name, document.athleteName ?? "", categoryLabel(document)].join(" "),
    );
    return words.every((word) => haystack.includes(word));
  });

  const hasUncategorized = documents.some((document) => document.categoryId === null);
  const categoryTitle =
    category === ALL
      ? "Tous les documents"
      : category === NONE
        ? "Sans catégorie"
        : (categories.find((item) => item.id === category)?.name ?? "Tous les documents");
  const filteredAthlete = athletes.find((athlete) => athlete.id === athleteFilter);
  const thisMonth = documents.filter((document) => document.createdAt.slice(0, 10) >= monthStart);
  const linked = documents.filter((document) => document.athleteId !== null);
  const totalBytes = documents.reduce((sum, document) => sum + document.sizeBytes, 0);

  const confirmDelete = () => {
    const target = deleting;
    if (!target) return;
    startDelete(async () => {
      const { ok } = await remove(target.id);
      setDeleting(null);
      if (!ok) {
        toast("Le document n'a pas pu être supprimé. Réessaie.");
        return;
      }
      setPreviewed(null);
      toast("Document supprimé.");
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Programmes, factures, contrats et bilans, rangés au même endroit."
        actions={
          <button type="button" onClick={() => setImporting(true)} className={buttonClass()}>
            <Upload aria-hidden size={16} strokeWidth={2} />
            Importer un fichier
          </button>
        }
      />
      <PageBody>
        <KpiGrid label="Chiffres des documents">
          <KpiCard
            color="run"
            icon={FolderOpen}
            value={String(documents.length)}
            label={documents.length > 1 ? "documents" : "document"}
            detail="Dans ton espace"
          />
          <KpiCard
            color="ok"
            icon={Upload}
            value={String(thisMonth.length)}
            label={thisMonth.length > 1 ? "ajoutés" : "ajouté"}
            detail="Ce mois-ci"
          />
          <KpiCard
            color="strength"
            icon={FileText}
            value={String(linked.length)}
            label={linked.length > 1 ? "liés à un sportif" : "lié à un sportif"}
            detail="Avec un sportif choisi"
          />
          <KpiCard
            color="amber"
            icon={Download}
            value={formatBytes(totalBytes)}
            label="utilisés"
            detail="10 Mo maximum par fichier"
          />
        </KpiGrid>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex h-11 items-center gap-2.5 rounded-control border border-line bg-surface px-3 text-[14px] focus-within:border-accent md:w-[420px]">
              <Search aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-muted" />
              <span className="sr-only">Rechercher un document</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un document, un sportif…"
                autoComplete="off"
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-muted md:text-[14px]"
              />
            </label>
            {/* Second filtre (D-67) : les documents d'un sportif. */}
            <label className="flex flex-col gap-1 md:w-64">
              <span className="sr-only">Filtrer par sportif</span>
              <select
                value={athleteFilter}
                onChange={(event) => setAthleteFilter(event.target.value)}
                className={`${inputClass} h-11 text-[14px]`}
              >
                <option value="">Tous les sportifs</option>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            role="group"
            aria-label="Catégories"
            className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          >
            {[
              { key: ALL, label: "Tous", color: null },
              ...categories.map((item) => ({ key: item.id, label: item.name, color: item.color })),
              ...(hasUncategorized
                ? [{ key: NONE, label: "Sans catégorie", color: "grey" as const }]
                : []),
            ].map(({ key, label, color }) => (
              <button
                key={key}
                type="button"
                aria-pressed={category === key}
                onClick={() => setCategory(key)}
                className={`${chipClass} shrink-0 gap-2 ${category === key ? chipActiveClass : chipIdleClass}`}
              >
                {/* Rond de la couleur de la catégorie : le lien avec l'icône des documents. */}
                {color ? (
                  <span aria-hidden className={`size-2 rounded-full ${categoryDotClass[color]}`} />
                ) : null}
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setManaging(true)}
              className={`${chipClass} ${chipIdleClass} shrink-0 gap-1.5`}
            >
              <Tags aria-hidden size={14} strokeWidth={1.8} />
              Gérer les catégories
            </button>
          </div>
        </div>

        <Card
          id="documents-title"
          title={categoryTitle}
          subtitle={`${shown.length} document${shown.length > 1 ? "s" : ""}${
            filteredAthlete ? ` · ${filteredAthlete.name}` : ""
          }`}
        >
          {documents.length === 0 ? (
            <div className="flex flex-col items-start gap-3 border-t border-line pt-3.5">
              <p className="text-[14px] text-muted">
                Aucun document pour l&apos;instant. Importe un programme, une facture, un contrat ou
                un bilan : PDF, image, Word ou Excel, 10 Mo maximum.
              </p>
            </div>
          ) : shown.length === 0 ? (
            <p className="border-t border-line pt-3.5 text-[14px] text-muted">
              Aucun résultat. Essaie un autre filtre ou une autre recherche.
            </p>
          ) : (
            <ul className="flex flex-col">
              {shown.map((document) => {
                const Icon = kindIcons[document.kind];
                return (
                  <li
                    key={document.id}
                    className="flex min-h-16 items-center gap-1 border-t border-line py-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewed(document)}
                      className="-ml-2 flex min-w-0 flex-1 items-center gap-3 rounded-[12px] px-2 py-1.5 text-left transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2 active:duration-0"
                    >
                      <span
                        aria-hidden
                        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-[11px] ${tileClassFor(document.categoryColor)}`}
                      >
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[15px] font-semibold">{document.name}</span>
                        <span className="truncate text-[13px] text-muted">
                          {[categoryLabel(document), document.athleteName]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-4 font-mono text-[12px] text-muted tabular max-md:hidden">
                        <span>{formatBytes(document.sizeBytes)}</span>
                        <span>{shortDay(document.updatedAt)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Plus d'actions : ${document.name}`}
                      onClick={() => setMenuFor(document)}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text active:bg-surface-2 active:duration-0"
                    >
                      <MoreHorizontal aria-hidden size={18} strokeWidth={1.8} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </PageBody>

      <ActionMenu
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={menuFor?.name ?? "Document"}
        // Kit (boîte 22) : « Lucas Janssens · PDF · 741 o ».
        subtitle={
          menuFor
            ? [menuFor.athleteName, kindLabels[menuFor.kind], formatBytes(menuFor.sizeBytes)]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        items={
          menuFor
            ? [
                { label: "Aperçu", icon: Eye, onSelect: () => setPreviewed(menuFor) },
                {
                  label: "Télécharger",
                  icon: Download,
                  onSelect: () => window.location.assign(downloadUrl(menuFor.id)),
                },
                { label: "Modifier", icon: Pencil, onSelect: () => setEditing(menuFor) },
                {
                  label: "Supprimer",
                  icon: Trash2,
                  destructive: true,
                  onSelect: () => setDeleting(menuFor),
                },
              ]
            : []
        }
      />

      <PanelDialog
        open={previewed !== null}
        onClose={() => setPreviewed(null)}
        title={previewed?.name ?? "Aperçu"}
        size="preview"
        bare
      >
        {previewed ? (
          <Preview
            document={previewed}
            orgBase={orgBase}
            onClose={() => setPreviewed(null)}
            onEdit={() => setEditing(previewed)}
            onDelete={() => setDeleting(previewed)}
          />
        ) : null}
      </PanelDialog>

      <Sheet
        open={importing}
        onClose={() => setImporting(false)}
        title="Importer un fichier"
        subtitle="10 Mo maximum. Stocké en privé."
        bare
      >
        {importing ? (
          <UploadForm
            onCancel={() => setImporting(false)}
            action={upload}
            athletes={athletes}
            categories={categories}
            initialAthleteId={athleteFilter}
            onSaved={() => {
              setImporting(false);
              toast("Document importé.");
              router.refresh();
            }}
          />
        ) : null}
      </Sheet>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Modifier le document"
        bare
      >
        {editing ? (
          <EditForm
            onCancel={() => setEditing(null)}
            key={editing.id}
            document={editing}
            athletes={athletes}
            categories={categories}
            action={update.bind(null, editing.id)}
            onSaved={() => {
              setEditing(null);
              setPreviewed(null);
              toast("Document enregistré.");
              router.refresh();
            }}
          />
        ) : null}
      </Sheet>

      <Sheet
        open={managing}
        onClose={() => setManaging(false)}
        title="Gérer les catégories"
        subtitle="Supprimer une catégorie ne supprime pas ses documents : ils deviennent « sans catégorie »."

        bare
      >
        {managing ? (
          <CategoryManager
            categories={categories}
            actions={categoryActions}
            items="documents"
            onDone={() => setManaging(false)}
          />
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        pending={pendingDelete}
        title="Supprimer ce document ?"
        confirmLabel={pendingDelete ? "Suppression…" : "Supprimer"}
      >
        {deleting ? (
          <>
            <Quoted>{deleting.name}</Quoted> et son fichier seront supprimés. Ce n&apos;est pas
            réversible.
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

// Aperçu d'un document (kit, boîte 23). Ordinateur : en-tête (tuile du fichier, nom, catégorie et
// détails, Télécharger / Modifier / Supprimer, fermer), puis le vrai rendu dans une zone grise (le
// PDF dans le lecteur du navigateur, l'image telle quelle). Téléphone : nom et détails, une carte avec
// la vignette et « Ouvrir le PDF » (la visionneuse du téléphone est plus lisible qu'un cadre), trois
// actions en tuiles, la date de modification.
function Preview({
  document,
  orgBase,
  onEdit,
  onDelete,
  onClose,
}: {
  document: CoachDocument;
  orgBase: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const url = fileUrl(document.id);
  const Icon = kindIcons[document.kind];
  const athlete =
    document.athleteId && document.athleteName ? (
      <Link
        href={`${orgBase}/sportifs/${document.athleteId}`}
        className="underline-offset-4 hover:text-text hover:underline"
      >
        {document.athleteName}
      </Link>
    ) : null;
  const chip = (
    <span className="rounded-[7px] bg-dlg-accent-tile px-[9px] py-[3px] font-semibold text-dlg-accent-ink">
      {categoryLabel(document)}
    </span>
  );
  const sep = <span aria-hidden> · </span>;
  const close = (
    <DialogIconButton label="Fermer" onClick={onClose}>
      <X aria-hidden size={17} strokeWidth={2} />
    </DialogIconButton>
  );
  const action =
    "inline-flex h-10 items-center gap-2 rounded-[11px] border border-dlg-border px-3.5 text-[14px] leading-[normal] font-semibold whitespace-nowrap transition-[background-color] duration-150";
  const tile =
    "flex h-[72px] flex-col items-center justify-center gap-[7px] rounded-[14px] border border-dlg-border text-[13px] leading-[normal] font-semibold transition-[background-color] duration-150";

  return (
    <>
      {/* Ordinateur */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        <div className="flex shrink-0 items-center gap-3.5 px-6 py-[22px]">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-dlg-drop-tile text-dlg-accent"
          >
            <Icon size={21} strokeWidth={1.8} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <h2 className="truncate text-[20px] leading-[normal] font-bold tracking-[-0.02em]">
              {document.name}
            </h2>
            <p className="flex min-w-0 items-center gap-2 text-[13.5px] leading-[normal] text-muted">
              {chip}
              <span className="truncate">
                {athlete}
                {athlete ? sep : null}
                {kindLabels[document.kind]} · {formatBytes(document.sizeBytes)} · modifié le{" "}
                {shortDay(document.updatedAt)}
              </span>
            </p>
          </div>
          <a href={downloadUrl(document.id)} className={`${action} text-text hover:bg-dlg-tile`}>
            <Download aria-hidden size={16} strokeWidth={1.9} />
            Télécharger
          </a>
          <button
            type="button"
            onClick={onEdit}
            className={`${action} text-text hover:bg-dlg-tile`}
          >
            <Pencil aria-hidden size={16} strokeWidth={1.9} />
            Modifier
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${action} text-dlg-danger-ink hover:bg-dlg-danger-soft`}
          >
            <Trash2 aria-hidden size={16} strokeWidth={1.9} />
            Supprimer
          </button>
          <span className="[&>button]:size-10">{close}</span>
        </div>
        <div className="mx-6 mb-6 flex min-h-0 flex-1 justify-center overflow-hidden rounded-[18px] bg-dlg-tile p-7">
          {document.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- fichier privé servi par l'app
            <img
              src={url}
              alt={document.name}
              className="max-h-full max-w-full rounded-[6px] object-contain shadow-[0_10px_30px_-12px_rgba(23,21,29,0.25)]"
            />
          ) : document.kind === "pdf" ? (
            <iframe
              src={url}
              title={`Aperçu : ${document.name}`}
              className="h-full w-full rounded-[6px] bg-white shadow-[0_10px_30px_-12px_rgba(23,21,29,0.25)]"
            />
          ) : (
            <p className="self-center text-[14px] text-muted">
              Pas d&apos;aperçu pour un fichier {kindLabels[document.kind]} : télécharge-le pour
              l&apos;ouvrir.
            </p>
          )}
        </div>
      </div>

      {/* Téléphone */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="flex shrink-0 items-start gap-3 px-5 pt-3 pb-1.5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="text-[21px] leading-[normal] font-bold tracking-[-0.02em] break-words">
              {document.name}
            </h2>
            <p className="flex flex-wrap items-center gap-2 text-[13.5px] leading-[normal] text-muted">
              {chip}
              <span>
                {athlete}
                {athlete ? sep : null}
                {kindLabels[document.kind]} · {formatBytes(document.sizeBytes)}
              </span>
            </p>
          </div>
          {close}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-5 pt-3.5 pb-6">
          <div className="flex flex-col items-center gap-4 rounded-[20px] bg-dlg-tile p-6">
            {document.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- fichier privé servi par l'app
              <img
                src={url}
                alt={document.name}
                className="max-h-[50vh] w-full rounded-[5px] object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="grid h-[170px] w-[132px] place-items-center rounded-[5px] bg-white shadow-[0_10px_24px_-12px_rgba(23,21,29,0.3)]"
              >
                <span
                  className={`grid size-12 place-items-center rounded-[14px] ${tileClassFor(document.categoryColor)}`}
                >
                  <Icon size={22} strokeWidth={1.7} />
                </span>
              </span>
            )}
            {document.kind === "pdf" ? (
              <a
                href={url}
                target="_blank"
                rel="noopener"
                className="flex h-[50px] w-full items-center justify-center gap-[9px] rounded-[13px] bg-cta text-[15px] leading-[normal] font-semibold text-on-cta"
              >
                <Eye aria-hidden size={17} strokeWidth={1.9} />
                Ouvrir le PDF
              </a>
            ) : document.kind === "image" ? null : (
              <p className="text-center text-[13px] text-muted">
                Pas d&apos;aperçu pour un fichier {kindLabels[document.kind]} : télécharge-le pour
                l&apos;ouvrir.
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <a href={downloadUrl(document.id)} className={`${tile} text-text active:bg-dlg-tile`}>
              <Download aria-hidden size={19} strokeWidth={1.8} />
              Télécharger
            </a>
            <button
              type="button"
              onClick={onEdit}
              className={`${tile} text-text active:bg-dlg-tile`}
            >
              <Pencil aria-hidden size={19} strokeWidth={1.8} />
              Modifier
            </button>
            <button
              type="button"
              onClick={onDelete}
              className={`${tile} text-dlg-danger-ink active:bg-dlg-danger-soft`}
            >
              <Trash2 aria-hidden size={19} strokeWidth={1.8} />
              Supprimer
            </button>
          </div>
          <p className="text-center text-[13px] leading-[normal] text-dlg-faint">
            Modifié le {shortDay(document.updatedAt)}
          </p>
        </div>
      </div>
    </>
  );
}

// Pastilles de catégorie (cases radio), partagées par l'import et la modification : les catégories
// du coach (D-67), plus « Aucune ».
// Catégorie (kit, 21 et 24) : pastilles, « Aucune » à la fin.
function CategoryChoice({
  categories,
  value,
  onChange,
}: {
  categories: DocumentCategory[];
  value: string;
  onChange?: (value: string) => void;
}) {
  const options = [
    ...categories.map((item) => ({ value: item.id, label: item.name })),
    { value: "", label: "Aucune" },
  ];
  return (
    <DlgFieldset legend="Catégorie">
      {onChange ? (
        <DlgChips name="categoryId" options={options} value={value} onChange={onChange} />
      ) : (
        <DlgChips name="categoryId" options={options} defaultValue={value} />
      )}
    </DlgFieldset>
  );
}

function AthleteSelect({
  id,
  athletes,
  value,
  onChange,
}: {
  id: string;
  athletes: Athlete[];
  value: string;
  onChange?: (value: string) => void;
}) {
  return (
    <DlgField label="Sportif" htmlFor={id} optional>
      <DlgSelect
        id={id}
        name="athleteId"
        value={onChange ? value : undefined}
        defaultValue={onChange ? undefined : value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      >
        <option value="">Aucun</option>
        {value && !athletes.some((athlete) => athlete.id === value) ? (
          <option value={value}>Sportif archivé</option>
        ) : null}
        {athletes.map((athlete) => (
          <option key={athlete.id} value={athlete.id}>
            {athlete.name}
          </option>
        ))}
      </DlgSelect>
    </DlgField>
  );
}

const initial: DocumentFormState = { error: null, attempt: 0, values: null, saved: false };

// Import : saisie contrôlée et envoi à la main (pas d'action de formulaire), pour qu'une erreur ne
// vide ni le fichier choisi ni les champs.
function UploadForm({
  action,
  athletes,
  categories,
  initialAthleteId,
  onSaved,
  onCancel,
}: {
  action: UploadAction;
  athletes: Athlete[];
  categories: DocumentCategory[];
  // Sportif déjà choisi (filtre de la page, ou onglet Documents de sa fiche).
  initialAthleteId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, run, pending] = useActionState(action, initial);
  const formId = useId();
  const [, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [athleteId, setAthleteId] = useState(initialAthleteId);
  const [localError, setLocalError] = useState<string | null>(null);
  useEffect(() => {
    if (state.saved) onSaved();
  }, [state, onSaved]);

  const choose = (picked: File | null) => {
    setLocalError(null);
    setFile(picked);
    if (!picked) return;
    if (picked.size > DOCUMENT_MAX_BYTES) setLocalError("Fichier trop lourd : 10 Mo maximum.");
    // Nom et catégorie proposés d'après le fichier, s'ils n'ont pas encore été choisis.
    if (!name.trim()) setName(nameFromFile(picked.name));
    if (!categoryId) setCategoryId(guessCategoryId(picked.name, categories) ?? "");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setLocalError("Choisis un fichier.");
      return;
    }
    setLocalError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("name", name);
    formData.set("categoryId", categoryId);
    formData.set("athleteId", athleteId);
    startTransition(() => run(formData));
  };

  const error = localError ?? state.error;
  return (
    <>
      <DialogBody>
        <form id={formId} onSubmit={submit} className={dlgFormGridClass} noValidate>
          {/* Kit (21) : zone de dépôt. Le vrai champ fichier, invisible, la recouvre : un clic ouvre le
              choix du fichier, un fichier glissé dessus est pris par le navigateur. */}
          <DlgField label="Fichier">
            <div className={dlgDropZoneClass}>
              <span
                aria-hidden
                className="grid size-[46px] shrink-0 place-items-center rounded-[13px] bg-dlg-drop-tile text-dlg-accent"
              >
                <Upload size={21} strokeWidth={1.8} />
              </span>
              <span className="flex min-w-0 flex-col gap-[3px]">
                <span className="text-[15px] leading-[normal] font-semibold break-all">
                  {file ? (
                    file.name
                  ) : (
                    <>
                      Glisse un fichier ici ou <span className="text-dlg-accent">choisis-le</span>
                    </>
                  )}
                </span>
                <span className="text-[13px] leading-[normal] text-muted">
                  {file
                    ? `${formatBytes(file.size)} · touche pour changer de fichier`
                    : "PDF, JPEG, PNG, WebP, Word ou Excel"}
                </span>
              </span>
              <input
                id="document-file"
                type="file"
                accept={DOCUMENT_ACCEPT}
                aria-label="Fichier à importer"
                onChange={(event) => choose(event.currentTarget.files?.[0] ?? null)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          </DlgField>

          <DlgField label="Nom" htmlFor="document-name">
            <input
              id="document-name"
              value={name}
              maxLength={DOCUMENT_NAME_MAX}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex. : Bilan de rentrée"
              autoComplete="off"
              className={dlgInputClass}
            />
          </DlgField>

          <CategoryChoice categories={categories} value={categoryId} onChange={setCategoryId} />
          <AthleteSelect
            id="document-athlete"
            athletes={athletes}
            value={athleteId}
            onChange={setAthleteId}
          />

          {error ? (
            <p role="alert" className={dlgErrorClass}>
              {error}
            </p>
          ) : null}
        </form>
      </DialogBody>
      <DialogFooter
        onCancel={onCancel}
        primary={
          <button type="submit" form={formId} disabled={pending} className={dlgPrimaryButtonClass}>
            {pending ? "Envoi…" : "Importer"}
          </button>
        }
      />
    </>
  );
}

function EditForm({
  document,
  athletes,
  categories,
  action,
  onSaved,
  onCancel,
}: {
  document: CoachDocument;
  athletes: Athlete[];
  categories: DocumentCategory[];
  action: UploadAction;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const formId = useId();
  useEffect(() => {
    if (state.saved) onSaved();
  }, [state, onSaved]);
  const values = state.values ?? {
    name: document.name,
    categoryId: document.categoryId ?? "",
    athleteId: document.athleteId ?? "",
  };
  return (
    <>
      <DialogBody>
        <form
          id={formId}
          key={state.attempt}
          action={formAction}
          className={dlgFormGridClass}
          noValidate
        >
          <DlgField label="Nom" htmlFor="document-edit-name">
            <input
              id="document-edit-name"
              name="name"
              defaultValue={values.name}
              maxLength={DOCUMENT_NAME_MAX}
              autoComplete="off"
              className={dlgInputClass}
            />
          </DlgField>
          <CategoryChoice categories={categories} value={values.categoryId} />
          <AthleteSelect id="document-edit-athlete" athletes={athletes} value={values.athleteId} />
          {state.error ? (
            <p role="alert" className={dlgErrorClass}>
              {state.error}
            </p>
          ) : null}
        </form>
      </DialogBody>
      <DialogFooter
        onCancel={onCancel}
        primary={
          <button type="submit" form={formId} disabled={pending} className={dlgPrimaryButtonClass}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        }
      />
    </>
  );
}
