"use client";

import {
  Check,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Search,
  Tag,
  Trash2,
  Upload,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { categoryDotClass, tileClassFor } from "@/components/blocks/category-color";
import { phoneFabClass } from "@/components/layout/mobile-bar";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
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
import { SortHeader, type SortDirection } from "@/components/ui/sort-header";
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

// Page Documents (D-60, D-67), redessinée d'après le kit « Coory Pages », page 05 (D-120) : une seule
// carte « Tous les documents », son résumé (« 14 documents · 6,6 Mo utilisés », à la place des quatre
// cartes de chiffres), la recherche, le sportif, le menu « Catégorie » et « Gérer les catégories ».
// Ordinateur : un tableau trié par « Ajouté le » (le plus récent d'abord) ou par catégorie, sept lignes
// puis « Voir plus » ; la carte descend jusqu'au bas du menu. Téléphone : la même liste en lignes de
// 64 px, « Voir plus » en lien violet, et le bouton flottant « Importer ». Un appui sur une ligne ouvre
// l'aperçu (PDF, image) avec Télécharger, Modifier et Supprimer ; « ••• » ouvre le menu d'actions.
// ?sportif=<id> ouvre la page filtrée sur un sportif (onglet Documents de sa fiche), ?importer ouvre
// l'import avec ce sportif déjà choisi.
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

// Extension écrite sous le nom (« PDF · 741 o », kit 05) : d'après le format vérifié à l'import.
const extensionLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
};
const extensionOf = (document: CoachDocument) =>
  extensionLabels[document.mimeType] ?? kindLabels[document.kind];

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

// Sept lignes, puis « Voir plus (N) » (kit 05).
const PAGE_SIZE = 7;

// Tri du tableau (kit 05) : « Ajouté le », du plus récent au plus ancien par défaut ; « Catégorie » de
// A à Z (les documents sans catégorie à la fin), et dans une même catégorie le plus récent d'abord.
type SortKey = "category" | "date";
type SortState = { key: SortKey; direction: SortDirection };

function compareDocuments({ key, direction }: SortState) {
  const sign = direction === "asc" ? 1 : -1;
  return (a: CoachDocument, b: CoachDocument) => {
    const byDate = a.createdAt.localeCompare(b.createdAt);
    if (key === "date") return sign * byDate;
    const byCategory =
      Number(a.categoryName === null) - Number(b.categoryName === null) ||
      (a.categoryName ?? "").localeCompare(b.categoryName ?? "", "fr");
    return sign * byCategory || -byDate;
  };
}

// Colonnes du tableau (kit 05) : Nom, Catégorie, Sportif, Taille, Ajouté le, actions. Sous 1100 px,
// Taille et Sportif s'effacent ; à partir de 1920 px, toutes les colonnes s'élargissent avec la carte.
const columns =
  "lg:grid-cols-[minmax(0,1fr)_130px_100px_40px] min-[68.75rem]:grid-cols-[minmax(0,1fr)_130px_170px_70px_100px_40px] min-[120rem]:grid-cols-[minmax(0,2fr)_minmax(130px,1fr)_minmax(170px,1fr)_minmax(70px,0.5fr)_minmax(100px,0.5fr)_40px]";
const wideOnly = "hidden min-[68.75rem]:flex";

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
  upload: UploadAction;
  update: UpdateAction;
  remove: (documentId: string) => Promise<{ ok: boolean }>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [athleteFilter, setAthleteFilter] = useState(initialAthleteId);
  const [sort, setSort] = useState<SortState>({ key: "date", direction: "desc" });
  const [expanded, setExpanded] = useState(false);
  const [importing, setImporting] = useState(openImport);
  const [managing, setManaging] = useState(false);
  const [previewed, setPreviewed] = useState<CoachDocument | null>(null);
  const [editing, setEditing] = useState<CoachDocument | null>(null);
  const [deleting, setDeleting] = useState<CoachDocument | null>(null);
  const [menuFor, setMenuFor] = useState<CoachDocument | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const rowsId = useId();
  const searchField = useRef<HTMLInputElement>(null);

  // La recherche et le sportif d'abord : les nombres du menu « Catégorie » se comptent là-dessus.
  const words = fold(query).split(/\s+/).filter(Boolean);
  const base = documents.filter((document) => {
    if (athleteFilter && document.athleteId !== athleteFilter) return false;
    const haystack = fold(
      [document.name, document.athleteName ?? "", categoryLabel(document)].join(" "),
    );
    return words.every((word) => haystack.includes(word));
  });
  const countWhere = (test: (document: CoachDocument) => boolean) => base.filter(test).length;
  const categoryOptions: CategoryOption[] = [
    { key: ALL, label: "Toutes", dot: null, count: base.length },
    ...categories.map((item) => ({
      key: item.id,
      label: item.name,
      dot: categoryDotClass[item.color],
      count: countWhere((document) => document.categoryId === item.id),
    })),
    ...(documents.some((document) => document.categoryId === null)
      ? [
          {
            key: NONE,
            label: "Sans catégorie",
            dot: categoryDotClass.grey,
            count: countWhere((document) => document.categoryId === null),
          },
        ]
      : []),
  ];
  // Une catégorie supprimée pendant qu'elle filtrait la liste : retour à « Toutes ».
  const activeCategory = categoryOptions.some((option) => option.key === category) ? category : ALL;
  const shown = base
    .filter((document) =>
      activeCategory === ALL
        ? true
        : activeCategory === NONE
          ? document.categoryId === null
          : document.categoryId === activeCategory,
    )
    .sort(compareDocuments(sort));
  const visible = expanded ? shown : shown.slice(0, PAGE_SIZE);
  const hiddenCount = shown.length - PAGE_SIZE;

  const filteredAthlete = athletes.find((athlete) => athlete.id === athleteFilter);
  const totalBytes = documents.reduce((sum, document) => sum + document.sizeBytes, 0);
  // « 14 documents · 6,6 Mo utilisés » : les documents affichés, la place prise par tout l'espace.
  const summary = [
    shown.length === 0
      ? "Aucun document"
      : `${shown.length} document${shown.length > 1 ? "s" : ""}`,
    totalBytes > 0 ? `${formatBytes(totalBytes)} utilisés` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "category" ? "asc" : "desc" },
    );

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

  const moreButton = (className: string, chevronSize: number) =>
    hiddenCount > 0 ? (
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={rowsId}
        onClick={() => setExpanded((value) => !value)}
        className={className}
      >
        {expanded ? "Réduire" : `Voir plus (${hiddenCount})`}
        <ChevronDown
          aria-hidden
          size={chevronSize}
          strokeWidth={2}
          className={`shrink-0 transition-transform duration-200 ease-out ${expanded ? "rotate-180" : ""}`}
        />
      </button>
    ) : null;

  return (
    <>
      <PageHeader
        title="Documents"
        actions={
          // Ordinateur : le bouton de l'en-tête (32 px) ; téléphone : le bouton flottant (kit 05).
          <button
            type="button"
            onClick={() => setImporting(true)}
            className={buttonClass({
              className:
                "max-lg:hidden lg:h-8! lg:gap-1.5! lg:rounded-[9px]! lg:px-3.5! lg:text-[12.5px]! lg:font-medium!",
            })}
          >
            <Upload aria-hidden size={13} strokeWidth={2} />
            Importer un fichier
          </button>
        }
      />
      <PageBody grow>
        <section
          aria-labelledby={titleId}
          // Téléphone : la liste garde de la place sous sa dernière ligne pour le bouton flottant
          // (60 px à 28 px du bas), comme la maquette où la carte passe sous lui.
          className="flex flex-1 flex-col rounded-[22px] bg-surface pb-[calc(76px+env(safe-area-inset-bottom))] lg:rounded-[20px] lg:pb-0 lg:inset-ring lg:inset-ring-line-soft"
        >
          {/* Ordinateur : titre, recherche (280 px) et sportif sur une ligne, puis le menu
              « Catégorie » et « Gérer les catégories ». Téléphone : titre ; recherche et bouton du
              sportif ; « Catégorie » et « Gérer ». */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 px-[18px] pt-[18px] pb-3 lg:grid-cols-[minmax(0,1fr)_280px_auto] lg:gap-x-3 lg:gap-y-3.5 lg:px-[22px] lg:pt-5 lg:pb-4">
            <div className="col-span-2 flex min-w-0 flex-col gap-0.5 lg:col-span-1 lg:gap-[3px]">
              <h2
                id={titleId}
                className="text-[18px] leading-[normal] font-semibold lg:tracking-[-0.01em]"
              >
                Tous les documents
              </h2>
              <p className="text-[12.5px] leading-[normal] text-muted">{summary}</p>
            </div>

            <label className="relative flex h-11 min-w-0 items-center gap-2 rounded-[12px] bg-surface-2 px-3 text-faint inset-ring inset-ring-line transition-shadow duration-150 focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet/55 lg:h-9 lg:rounded-[10px]">
              <Search aria-hidden size={15} strokeWidth={2} className="shrink-0 lg:size-3.5" />
              <span className="sr-only">Rechercher un document</span>
              <input
                ref={searchField}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
                enterKeyHint="search"
                // 16 px sur téléphone : en dessous, iPhone agrandit la page quand on touche le champ.
                // La croix du navigateur (bleue dans Chrome) est remplacée par celle d'à côté.
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none lg:text-[13px] [&::-webkit-search-cancel-button]:appearance-none"
              />
              {/* Texte d'attente du kit : court sur téléphone, complet sur ordinateur. */}
              {query ? (
                <button
                  type="button"
                  aria-label="Effacer la recherche"
                  onClick={() => {
                    setQuery("");
                    searchField.current?.focus();
                  }}
                  className="-mr-2 grid h-full w-9 shrink-0 place-items-center text-faint transition-colors duration-150 hover:text-text lg:-mr-1.5 lg:w-7"
                >
                  <X aria-hidden size={15} strokeWidth={2} className="lg:size-3.5" />
                </button>
              ) : (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-3 left-[35px] flex items-center overflow-hidden text-[16px] whitespace-nowrap lg:left-[34px] lg:text-[13px]"
                >
                  <span className="lg:hidden">Rechercher</span>
                  <span className="truncate max-lg:hidden">
                    Rechercher un document, un sportif…
                  </span>
                </span>
              )}
            </label>

            {/* Sportif (D-67) : la vraie liste du téléphone ou de l'ordinateur, invisible, couvre le
                bouton. Téléphone : l'icône seule, puis le prénom quand un sportif est choisi. */}
            <label
              className={`relative flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[12px] px-[13px] transition-colors duration-150 has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-accent lg:h-9 lg:justify-start lg:rounded-[10px] lg:px-3 ${
                filteredAthlete
                  ? "bg-selected text-violet-text inset-ring inset-ring-violet-line"
                  : "text-text inset-ring inset-ring-line-2"
              }`}
            >
              <User
                aria-hidden
                size={17}
                strokeWidth={1.8}
                className={`shrink-0 lg:size-3.5 ${filteredAthlete ? "" : "lg:text-muted"}`}
              />
              <span
                className={`truncate text-[14px] leading-[normal] font-medium lg:max-w-[180px] lg:text-[13px] ${
                  filteredAthlete ? "max-w-24" : "max-lg:hidden"
                }`}
              >
                {filteredAthlete ? (
                  <>
                    <span className="lg:hidden">{filteredAthlete.name.split(" ")[0]}</span>
                    <span className="max-lg:hidden">{filteredAthlete.name}</span>
                  </>
                ) : (
                  "Tous les sportifs"
                )}
              </span>
              <ChevronDown
                aria-hidden
                size={13}
                strokeWidth={2}
                className="shrink-0 text-muted max-lg:hidden"
              />
              <select
                aria-label="Filtrer par sportif"
                value={athleteFilter}
                onChange={(event) => setAthleteFilter(event.target.value)}
                className="absolute inset-0 size-full cursor-pointer appearance-none text-[16px] opacity-0"
              >
                <option value="">Tous les sportifs</option>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="col-span-2 flex items-center gap-2 lg:col-span-3 lg:flex-wrap lg:gap-1.5">
              <CategoryMenu
                options={categoryOptions}
                value={activeCategory}
                onChange={setCategory}
              />
              <button
                type="button"
                onClick={() => setManaging(true)}
                aria-label="Gérer les catégories"
                // Très petit téléphone (< 360 px) : l'étiquette seule, pour que « Catégorie  Toutes »
                // tienne en entier.
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[12px] px-3.5 text-[14px] leading-[normal] font-medium whitespace-nowrap text-violet-text inset-ring inset-ring-line-2 transition-[background-color,scale] duration-150 hover:bg-surface-2 active:scale-[0.97] max-[359.98px]:w-11 max-[359.98px]:px-0 lg:h-8 lg:rounded-[9px] lg:px-3 lg:text-[12.5px]"
              >
                <Tag aria-hidden size={14} strokeWidth={1.8} />
                <span className="lg:hidden max-[359.98px]:hidden">Gérer</span>
                <span className="max-lg:hidden">Gérer les catégories</span>
              </button>
            </div>
          </div>

          {/* Une ligne par document. Ordinateur : un tableau (en-têtes triables) ; téléphone : tuile,
              nom et « catégorie · sportif · date » sur deux lignes. Toute la ligne ouvre l'aperçu (le
              bouton du nom la recouvre) ; le sportif (sa fiche) et « ••• » restent au-dessus. */}
          <div role="table" aria-labelledby={titleId} className="flex flex-col max-lg:px-2">
            {documents.length > 0 ? (
              <div role="rowgroup" className="max-lg:hidden">
                <div
                  role="row"
                  className={`grid items-center gap-4 border-y border-line bg-surface-2/60 px-[22px] py-2.5 text-[11.5px] leading-[normal] font-medium tracking-[0.02em] text-faint ${columns}`}
                >
                  <span role="columnheader">Nom</span>
                  <SortHeader
                    label="Catégorie"
                    active={sort.key === "category"}
                    direction={sort.direction}
                    onToggle={() => toggleSort("category")}
                  />
                  <span role="columnheader" className={wideOnly}>
                    Sportif
                  </span>
                  <span role="columnheader" className={wideOnly}>
                    Taille
                  </span>
                  <SortHeader
                    label="Ajouté le"
                    active={sort.key === "date"}
                    direction={sort.direction}
                    onToggle={() => toggleSort("date")}
                  />
                  <span role="columnheader">
                    <span className="sr-only">Actions</span>
                  </span>
                </div>
              </div>
            ) : null}
            <div role="rowgroup" id={rowsId} className="flex flex-col">
              {visible.map((document) => {
                const Icon = kindIcons[document.kind];
                return (
                  <div
                    key={document.id}
                    role="row"
                    className={`relative flex min-h-16 items-center gap-3 rounded-[14px] px-2.5 py-2.5 transition-colors duration-150 has-[[data-open]:active]:bg-surface-2 lg:grid lg:min-h-0 lg:gap-4 lg:rounded-none lg:border-b lg:border-line-soft lg:px-[22px] lg:py-3 lg:hover:bg-surface-2/60 ${columns}`}
                  >
                    <div role="cell" className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        aria-hidden
                        className={`grid size-[42px] shrink-0 place-items-center rounded-[12px] lg:size-9 lg:rounded-[10px] ${tileClassFor(document.categoryColor)}`}
                      >
                        <Icon size={18} strokeWidth={1.8} className="lg:size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-[3px] lg:gap-px">
                        <button
                          type="button"
                          data-open=""
                          onClick={() => setPreviewed(document)}
                          className="truncate text-left text-[15px] leading-[normal] font-semibold after:absolute after:inset-0 after:rounded-[14px] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent lg:text-[13.5px] lg:after:rounded-none"
                        >
                          {document.name}
                        </button>
                        <span className="truncate text-[13px] leading-[normal] text-muted lg:hidden">
                          {[
                            categoryLabel(document),
                            document.athleteName ?? "Aucun sportif",
                            shortDay(document.createdAt),
                          ].join(" · ")}
                        </span>
                        <span className="truncate text-[12px] leading-[normal] text-faint max-lg:hidden">
                          {extensionOf(document)} · {formatBytes(document.sizeBytes)}
                        </span>
                      </span>
                    </div>
                    <div role="cell" className="hidden min-w-0 lg:flex">
                      <span
                        className={`inline-flex h-6 max-w-full items-center gap-1.5 rounded-xl px-[9px] text-[12px] leading-[normal] font-medium ${tileClassFor(document.categoryColor)}`}
                      >
                        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
                        <span className="truncate">{categoryLabel(document)}</span>
                      </span>
                    </div>
                    <div role="cell" className={`${wideOnly} min-w-0 items-center`}>
                      {document.athleteId && document.athleteName ? (
                        <Link
                          href={`${orgBase}/sportifs/${document.athleteId}`}
                          className="relative z-[1] flex min-w-0 items-center gap-2 rounded-[6px] text-[13px] leading-[normal] text-text underline-offset-4 hover:underline"
                        >
                          <Avatar name={document.athleteName} size="2xs" />
                          <span className="truncate">{document.athleteName}</span>
                        </Link>
                      ) : (
                        <span className="text-[13px] leading-[normal] text-faint">
                          Aucun sportif
                        </span>
                      )}
                    </div>
                    <div
                      role="cell"
                      className={`${wideOnly} text-[12.5px] leading-[normal] whitespace-nowrap text-muted`}
                    >
                      {formatBytes(document.sizeBytes)}
                    </div>
                    <div
                      role="cell"
                      className="hidden text-[12.5px] leading-[normal] whitespace-nowrap text-muted lg:block"
                    >
                      {shortDay(document.createdAt)}
                    </div>
                    <div role="cell" className="flex shrink-0">
                      <button
                        type="button"
                        aria-label={`Plus d'actions : ${document.name}`}
                        onClick={() => setMenuFor(document)}
                        className="relative z-[1] grid size-11 place-items-center rounded-[12px] text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text active:bg-surface-2 lg:size-8 lg:rounded-[9px]"
                      >
                        {/* Points du kit : 3 unités de diamètre (ronds pleins, trait de 1). */}
                        <MoreHorizontal
                          aria-hidden
                          size={16}
                          strokeWidth={1}
                          fill="currentColor"
                          className="lg:size-[15px]"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-3 py-8 text-center lg:px-[22px] lg:py-10">
              {documents.length === 0 ? (
                <>
                  <p className="text-[14px] leading-[normal] font-semibold">Aucun document</p>
                  <p className="max-w-[46ch] text-[14px] leading-[1.45] text-muted lg:text-[13px]">
                    Importe un programme, une facture, un contrat ou un bilan : PDF, image, Word ou
                    Excel, 10 Mo maximum.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[14px] leading-[normal] font-semibold max-lg:hidden">
                    Aucun document
                  </p>
                  <p className="text-[14px] leading-[normal] text-muted lg:text-[13px]">
                    <span className="lg:hidden">Aucun document pour ce filtre.</span>
                    <span className="max-lg:hidden">Change de filtre ou importe un fichier.</span>
                  </p>
                </>
              )}
            </div>
          ) : null}

          {/* Téléphone : « Voir plus (N) » en lien violet centré, sous un filet. */}
          {moreButton(
            "mx-[18px] mt-2.5 flex h-[58px] items-center justify-center gap-1.5 border-t border-line text-[14px] leading-[normal] font-semibold text-violet-text transition-opacity duration-150 active:opacity-70 lg:hidden",
            14,
          )}

          {/* Ordinateur : formats acceptés, et « Voir plus » en bouton gris, en bas de la carte. */}
          <div className="mt-auto hidden items-center gap-3 px-[22px] py-3 lg:flex">
            <p className="flex-1 text-[12px] leading-[normal] text-faint">
              PDF, images et documents Office · 10 Mo maximum par fichier
            </p>
            {moreButton(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] bg-dlg-tile px-3.5 text-[12.5px] leading-[normal] font-medium whitespace-nowrap text-text transition-[background-color,scale] duration-150 hover:bg-dlg-tile-hover active:scale-[0.97]",
              13,
            )}
          </div>
        </section>
      </PageBody>

      {/* Téléphone : « Importer » en bouton flottant (kit 05, SH-08). Sans data-phone-fab : ici la
          carte passe sous le bouton (sa place est gardée au bas de la carte). */}
      <button
        type="button"
        aria-label="Importer un fichier"
        onClick={() => setImporting(true)}
        className={phoneFabClass}
      >
        <Upload aria-hidden size={22} strokeWidth={2} />
      </button>

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

type CategoryOption = { key: string; label: string; dot: string | null; count: number };

// Menu « Catégorie » (kit 05, M-MENU) : bouton « Catégorie  Toutes ▾ », précédé du rond de la
// catégorie choisie. La liste s'ouvre JUSTE SOUS le bouton (sur téléphone aussi) : rond de couleur,
// nom, nombre de documents (après la recherche et le sportif), coche violette sur le choix en cours.
// Clic dehors ou Échap : fermée ; flèches ↑ ↓ (Début, Fin) : d'un choix à l'autre.
function CategoryMenu({
  options,
  value,
  onChange,
}: {
  options: CategoryOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = options.find((option) => option.key === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    // Le choix en cours prend le focus : les flèches et Entrée marchent tout de suite.
    box.current?.querySelector<HTMLElement>("[role=option][aria-selected=true]")?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    const items = [...(box.current?.querySelectorAll<HTMLElement>("[role=option]") ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? (index + 1) % items.length
            : (index - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={box} onKeyDown={onKeyDown} className="relative min-w-0 flex-1 lg:flex-none">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Catégorie : ${current.label}`}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-11 w-full items-center gap-2 rounded-[12px] bg-surface px-3 text-left text-[14.5px] leading-[normal] font-medium whitespace-nowrap text-text transition-shadow duration-150 lg:h-8 lg:w-auto lg:rounded-[9px] lg:text-[12.5px] ${
          open ? "inset-ring-[1.5px] inset-ring-violet/55" : "inset-ring inset-ring-line-2"
        }`}
      >
        {current.dot ? (
          <span aria-hidden className={`size-2 shrink-0 rounded-full ${current.dot}`} />
        ) : null}
        <span className="text-muted">Catégorie</span>
        <span className="min-w-0 flex-1 truncate">{current.label}</span>
        <ChevronDown
          aria-hidden
          size={13}
          strokeWidth={2}
          className={`shrink-0 text-muted transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Catégorie"
          className="absolute top-[calc(100%+6px)] left-0 z-20 flex max-h-[min(420px,60vh)] w-full origin-top-left flex-col overflow-y-auto overscroll-contain rounded-[14px] bg-popover p-1.5 shadow-[0_18px_40px_-12px_rgba(22,18,40,0.3)] inset-ring inset-ring-popover-line transition-[opacity,scale] duration-150 ease-out starting:scale-[0.97] starting:opacity-0 motion-reduce:transition-none lg:w-max lg:max-w-[320px] lg:min-w-[230px]"
        >
          {options.map((option) => {
            const selected = option.key === current.key;
            return (
              <button
                key={option.key}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={`${option.label}, ${option.count} document${option.count > 1 ? "s" : ""}`}
                onClick={() => {
                  onChange(option.key);
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className={`flex h-[46px] shrink-0 items-center gap-2.5 rounded-[9px] px-2.5 text-left text-[15px] leading-[normal] font-medium text-text transition-colors duration-150 lg:h-9 lg:text-[13px] ${
                  selected ? "bg-selected" : "hover:bg-dlg-tile"
                }`}
              >
                <span aria-hidden className={`size-2 shrink-0 rounded-full ${option.dot ?? ""}`} />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                <span aria-hidden className="text-faint tabular">
                  {option.count}
                </span>
                <span aria-hidden className="flex w-3.5 shrink-0 justify-end text-violet-text">
                  {selected ? <Check size={14} strokeWidth={2.5} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
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
      <div className="flex min-h-0 flex-auto flex-col md:hidden">
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
        <div className="flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto overscroll-contain px-5 pt-3.5 pb-6">
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
