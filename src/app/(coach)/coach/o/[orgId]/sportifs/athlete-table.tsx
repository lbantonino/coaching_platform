"use client";

import {
  Archive,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  CirclePause,
  CirclePlay,
  Ellipsis,
  Layers,
  MailCheck,
  MessageSquare,
  Pencil,
  RefreshCw,
  Send,
  Target,
  UserPen,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Avatar } from "@/components/ui/avatar";
import { buttonClass, iconButtonClass } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { disciplineIcons } from "@/components/ui/discipline-icon";
import { ActionMenu } from "@/components/ui/overlay";
import { SexMark } from "@/components/ui/sex-mark";
import { useToast } from "@/components/ui/toast";
import {
  DISCIPLINES,
  disciplineLabels,
  disciplineStyles,
  type Discipline,
} from "@/domain/training/discipline";
import { setAthletesProgramType, setAthletesStatus } from "@/features/athletes/actions";
import type { AthleteStatus, Sex } from "@/features/athletes/schemas";

// Liste des sportifs (maquette d'Antonino du 24/10, D-40). Ordinateur : tableau (Sportif, Statut,
// Type de programme, Objectif, Actions), colonnes triables. Téléphone (mobile first) : une carte par
// sportif, mêmes informations et mêmes gestes. Le statut et le type de programme se changent d'un
// appui sur leur pastille ; cocher plusieurs sportifs fait apparaître une barre d'actions groupées.
// Accès à son espace : compte activé = icône message ; sinon seulement « Inviter ».
export type AthleteTableRow = {
  id: string;
  name: string;
  sex: Sex | null;
  photoPath: string | null;
  status: AthleteStatus;
  programType: Discipline | null;
  hasAccount: boolean;
  hasPendingInvite: boolean;
  // Ce qui manque à la fiche (infobulle), null si elle est complète.
  missing: string | null;
  sub: string;
  objective: { label: string; date: string | null } | null;
};

export type SortColumn = "sportif" | "statut" | "type" | "objectif";

export const statusChoices: { status: AthleteStatus; label: string; icon: LucideIcon }[] = [
  { status: "active", label: "Actif", icon: CirclePlay },
  { status: "paused", label: "En pause", icon: CirclePause },
  { status: "archived", label: "Archivé", icon: Archive },
];
const statusLabel = Object.fromEntries(statusChoices.map((c) => [c.status, c.label])) as Record<
  AthleteStatus,
  string
>;

// Couleurs des pastilles de statut, écrites en entier pour Tailwind.
const statusPill: Record<AthleteStatus, string> = {
  active: "border-ok/30 bg-ok-soft text-ok",
  paused: "border-warn/35 bg-warn-soft text-warn",
  archived: "border-line-2 bg-chip text-muted",
};
// Téléphone : le statut en texte coloré, sans pastille (carte compacte, demande d'Antonino du 28/10).
const statusText: Record<AthleteStatus, string> = {
  active: "text-ok",
  paused: "text-warn",
  archived: "text-muted",
};

const shortDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const formatShort = (day: string) => shortDate.format(new Date(`${day}T00:00:00Z`));

type MenuKind = "actions" | "status" | "type";
// `fromActions` : ouvert depuis le menu « ••• » de la ligne, avec une flèche pour y revenir.
type Menu = { kind: MenuKind; ids: string[]; title: string; fromActions?: boolean } | null;

export function AthleteTable({
  organizationId,
  basePath,
  rows,
  sort,
}: {
  organizationId: string;
  basePath: string;
  rows: AthleteTableRow[];
  sort: { column: SortColumn; desc: boolean; hrefs: Record<SortColumn, string> };
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [menu, setMenu] = useState<Menu>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  // Une sélection ne garde que les sportifs encore affichés (après un filtre ou un changement).
  const visible = selected.filter((id) => rows.some((row) => row.id === id));
  const allSelected = rows.length > 0 && visible.length === rows.length;
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  const byId = new Map(rows.map((row) => [row.id, row]));
  const who = (ids: string[]) =>
    ids.length === 1 ? (byId.get(ids[0])?.name ?? "1 sportif") : `${ids.length} sportifs`;

  const apply = (
    ids: string[],
    run: () => Promise<{ ok: boolean; error: string | null }>,
    done: string,
  ) => {
    startTransition(async () => {
      const result = await run();
      // Message neutre (« Statut de … ») : pas d'accord au masculin ou au féminin à deviner.
      toast(result.ok ? done : (result.error ?? "Réessaie."));
      if (result.ok && ids.length > 1) setSelected([]);
      router.refresh();
    });
  };

  const menuFor = (row: AthleteTableRow, kind: MenuKind, fromActions = false): Menu => ({
    kind,
    fromActions,
    ids: [row.id],
    title:
      kind === "status"
        ? `Statut de ${row.name}`
        : kind === "type"
          ? `Programme de ${row.name}`
          : row.name,
  });

  const menuItems = () => {
    if (!menu) return [];
    const single = menu.ids.length === 1 ? byId.get(menu.ids[0]) : undefined;
    // Menu « ••• » d'une ligne (demande d'Antonino du 24/10) : tout ce que la ligne permet, au même
    // endroit. Statut et type ouvrent leur choix ; le reste mène à la fiche, à l'invitation ou au fil.
    if (menu.kind === "actions" && single) {
      const href = `${basePath}/${single.id}`;
      return [
        {
          label: "Changer le statut",
          icon: RefreshCw,
          onSelect: () => setMenu(menuFor(single, "status", true)),
        },
        {
          label: "Changer le type de programme",
          icon: Layers,
          onSelect: () => setMenu(menuFor(single, "type", true)),
        },
        {
          label: "Modifier l'objectif",
          icon: Target,
          onSelect: () => router.push(`${href}?onglet=objectifs`),
        },
        {
          label: "Modifier la fiche",
          icon: Pencil,
          onSelect: () => router.push(`${href}?onglet=profil`),
        },
        ...(single.hasAccount
          ? [
              {
                label: "Écrire un message",
                icon: MessageSquare,
                onSelect: () => router.push(`/coach/messages?sportif=${single.id}`),
              },
            ]
          : single.status !== "archived"
            ? [
                {
                  label: "Inviter dans son espace",
                  icon: Send,
                  onSelect: () => router.push(`${href}/inviter`),
                },
              ]
            : []),
      ];
    }
    if (menu.kind === "status") {
      return statusChoices.map((choice) => ({
        label: choice.label,
        icon: choice.icon,
        selected: single?.status === choice.status,
        onSelect: () => {
          if (single?.status === choice.status) return;
          apply(
            menu.ids,
            () => setAthletesStatus(organizationId, menu.ids, choice.status),
            `Statut de ${who(menu.ids)} : ${choice.label.toLowerCase()}.`,
          );
        },
      }));
    }
    return DISCIPLINES.map((discipline) => ({
      label: disciplineLabels[discipline],
      icon: disciplineIcons[discipline],
      selected: single?.programType === discipline,
      onSelect: () => {
        if (single?.programType === discipline) return;
        apply(
          menu.ids,
          () => setAthletesProgramType(organizationId, menu.ids, discipline),
          `Programme de ${who(menu.ids)} : ${disciplineLabels[discipline]}.`,
        );
      },
    }));
  };

  const header = (column: SortColumn, label: string) => {
    const active = sort.column === column;
    return (
      <Link
        href={sort.hrefs[column]}
        scroll={false}
        aria-label={`Trier par ${label.toLowerCase()}`}
        className="inline-flex min-h-11 items-center gap-1 text-[13px] font-medium text-muted hover:text-text"
      >
        {label}
        {active ? (
          <ChevronDown
            aria-hidden
            size={14}
            strokeWidth={2}
            className={sort.desc ? "" : "rotate-180"}
          />
        ) : (
          <ChevronsUpDown aria-hidden size={13} strokeWidth={1.8} className="text-faint" />
        )}
      </Link>
    );
  };

  // Colonnes du tableau (ordinateur) : case, sportif, statut, type, objectif, actions.
  const grid = "lg:grid lg:grid-cols-[44px_minmax(0,1fr)_150px_170px_190px_212px] lg:items-center";

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
        <div
          className={`flex items-center gap-2 border-b border-line px-4 py-1 lg:gap-0 lg:px-4 ${grid}`}
        >
          <Checkbox
            size="md"
            checked={allSelected}
            disabled={rows.length === 0}
            onChange={() => setSelected(allSelected ? [] : rows.map((row) => row.id))}
            label={<span className="text-[14px] text-muted lg:sr-only">Tout sélectionner</span>}
          />
          <span className="hidden lg:block">{header("sportif", "Sportif")}</span>
          <span className="hidden lg:block">{header("statut", "Statut")}</span>
          <span className="hidden lg:block">{header("type", "Type de programme")}</span>
          <span className="hidden lg:block">{header("objectif", "Objectif")}</span>
          <span className="hidden text-right text-[13px] font-medium text-muted lg:block">
            Actions
          </span>
        </div>
        <ul aria-label="Liste des sportifs" className="flex flex-col">
          {rows.map((row) => (
            <Row
              key={row.id}
              row={row}
              grid={grid}
              href={`${basePath}/${row.id}`}
              checked={visible.includes(row.id)}
              onToggle={() => toggle(row.id)}
              onMenu={(kind) => setMenu(menuFor(row, kind))}
              pending={pending}
            />
          ))}
        </ul>
      </div>

      {/* Barre d'actions groupées : en bas de l'écran tant qu'au moins un sportif est coché. */}
      {visible.length > 0 ? (
        <div
          role="region"
          aria-label="Actions sur la sélection"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-[560px] flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-2.5 shadow-lg"
        >
          <span className="px-2 text-[14px] font-medium">
            {visible.length} sélectionné{visible.length > 1 ? "s" : ""}
          </span>
          <span className="ml-auto flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                setMenu({ kind: "status", ids: visible, title: `Statut de ${who(visible)}` })
              }
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              Statut
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                setMenu({ kind: "type", ids: visible, title: `Programme de ${who(visible)}` })
              }
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              Type
            </button>
            <button
              type="button"
              aria-label="Annuler la sélection"
              onClick={() => setSelected([])}
              className={iconButtonClass()}
            >
              <X aria-hidden size={18} strokeWidth={1.8} />
            </button>
          </span>
        </div>
      ) : null}

      <ActionMenu
        open={menu !== null}
        onClose={() => setMenu(null)}
        onBack={
          menu?.fromActions
            ? () => {
                const row = byId.get(menu.ids[0]);
                setMenu(row ? menuFor(row, "actions") : null);
              }
            : undefined
        }
        title={menu?.title ?? ""}
        items={menuItems()}
      />
    </>
  );
}

function Row({
  row,
  grid,
  href,
  checked,
  onToggle,
  onMenu,
  pending,
}: {
  row: AthleteTableRow;
  grid: string;
  href: string;
  checked: boolean;
  onToggle: () => void;
  onMenu: (kind: MenuKind) => void;
  pending: boolean;
}) {
  const canInvite = !row.hasAccount && row.status !== "archived";
  const TypeIcon = row.programType ? disciplineIcons[row.programType] : null;
  return (
    <li
      // Téléphone (demande d'Antonino du 28/10) : une carte basse sur une seule rangée : case, photo,
      // nom puis statut · type et objectif en petit, « ••• » à droite. Ordinateur : la ligne du tableau.
      // Appui sur la carte (téléphone) : le fond s'assombrit tout de suite, avant l'ouverture de la fiche.
      className={`relative grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-x-0 border-b border-line px-4 py-2 last:border-b-0 max-lg:active:bg-surface-2 lg:py-3 ${grid} ${
        checked ? "bg-surface-2" : ""
      }`}
    >
      {/* Nom accessible sur la case (aria-label) plutôt qu'en texte masqué : le texte
          « Sélectionner … » se confondrait avec le nom du sportif dans les recherches de la page. */}
      <span className="relative z-10">
        <Checkbox
          checked={checked}
          onChange={onToggle}
          aria-label={`Sélectionner ${row.name}`}
          label={null}
        />
      </span>

      {/* Sportif : photo, nom, niveau ouvrent la fiche. Téléphone (demande d'Antonino du 26/10) :
          TOUTE la carte ouvre la fiche (lien étendu par ::after) ; seuls la case, l'icône message,
          « Inviter » et « ••• » restent des boutons, posés au-dessus (z-10). */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[10px] hover:text-text max-lg:after:absolute max-lg:after:inset-0 max-lg:after:content-['']"
        >
          <Avatar
            name={row.name}
            colorClass={row.programType ? disciplineStyles[row.programType].avatar : undefined}
            photoPath={row.photoPath}
          />
          <span className="flex min-w-0 flex-col">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{row.name}</span>
              <SexMark sex={row.sex} size="sm" />
              {row.hasPendingInvite && !row.hasAccount ? (
                <span
                  title="Invitation envoyée, en attente"
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn"
                >
                  <MailCheck aria-hidden size={13} strokeWidth={2} />
                  <span className="sr-only">Invitation envoyée</span>
                </span>
              ) : null}
              {/* Fiche créée d'un simple nom (D-35) : le repère reste jusqu'à ce qu'elle soit complétée. */}
              {row.missing ? (
                <span
                  title={row.missing}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn"
                >
                  <UserPen aria-hidden size={13} strokeWidth={2} />
                  {/* Texte masqué plutôt qu'aria-label : le détail est dans l'infobulle. */}
                  <span className="sr-only">Fiche à compléter</span>
                </span>
              ) : null}
            </span>
            {row.sub ? (
              <span className="truncate text-[13px] text-muted max-lg:hidden">{row.sub}</span>
            ) : null}
            {/* Téléphone : statut · type, puis l'objectif, en deux petites lignes. */}
            <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium lg:hidden">
              <span className={`inline-flex shrink-0 items-center gap-1 ${statusText[row.status]}`}>
                {row.status === "active" ? (
                  <span aria-hidden className="size-1.5 rounded-full bg-ok" />
                ) : row.status === "paused" ? (
                  <CirclePause aria-hidden size={12} strokeWidth={2} />
                ) : (
                  <Archive aria-hidden size={11} strokeWidth={2} />
                )}
                {statusLabel[row.status]}
              </span>
              <span aria-hidden className="text-muted">
                ·
              </span>
              <span
                className={`inline-flex min-w-0 items-center gap-1 truncate ${
                  row.programType ? disciplineStyles[row.programType].text : "text-muted"
                }`}
              >
                {TypeIcon ? <TypeIcon aria-hidden size={12} strokeWidth={2} /> : null}
                {row.programType ? disciplineLabels[row.programType] : "Sans type"}
              </span>
            </span>
            <span className="truncate text-[12px] text-muted lg:hidden">
              {row.objective
                ? `${row.objective.date ? formatShort(row.objective.date) : "Sans date"} · ${row.objective.label}`
                : "Aucun objectif"}
            </span>
          </span>
        </Link>
      </div>

      {/* Statut et type. Ordinateur : pastilles qui ouvrent leur choix. Téléphone : simples repères,
          non cliquables (pour ne pas ouvrir un choix en voulant ouvrir la fiche) ; on les change par
          « ••• ». */}
      {/* Ordinateur : pastilles de statut et de type, qui ouvrent leur choix. */}
      <div className="hidden lg:contents">
        <span className="hidden lg:block">
          <button
            type="button"
            disabled={pending}
            onClick={() => onMenu("status")}
            aria-label={`Statut : ${statusLabel[row.status]}. Changer le statut de ${row.name}`}
            className={`inline-flex h-9 items-center gap-1.5 rounded-pill border px-3 text-[14px] font-medium transition-[filter] duration-150 hover:brightness-95 ${statusPill[row.status]}`}
          >
            {row.status === "active" ? (
              <span aria-hidden className="size-2 rounded-full bg-ok" />
            ) : row.status === "paused" ? (
              <CirclePause aria-hidden size={15} strokeWidth={2} />
            ) : (
              <Archive aria-hidden size={14} strokeWidth={2} />
            )}
            {statusLabel[row.status]}
          </button>
        </span>
        <span className="hidden lg:block">
          <button
            type="button"
            disabled={pending}
            onClick={() => onMenu("type")}
            aria-label={
              row.programType
                ? `Programme : ${disciplineLabels[row.programType]}. Changer le programme de ${row.name}`
                : `Choisir le programme de ${row.name}`
            }
            className={`inline-flex h-9 items-center gap-1.5 rounded-pill px-3 text-[14px] font-medium transition-[filter] duration-150 hover:brightness-95 ${
              row.programType
                ? disciplineStyles[row.programType].icon
                : "border border-dashed border-line-2 text-muted"
            }`}
          >
            {TypeIcon ? <TypeIcon aria-hidden size={15} strokeWidth={2} /> : null}
            {row.programType ? disciplineLabels[row.programType] : "Choisir"}
          </button>
        </span>
      </div>

      {/* Objectif principal (ordinateur) et actions (téléphone : seulement « ••• », le reste est dedans). */}
      <div className="col-start-3 flex items-center justify-end lg:contents">
        <span className="flex min-w-0 items-start gap-2 text-[13px] max-lg:hidden lg:pr-3">
          <CalendarDays
            aria-hidden
            size={15}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0 text-muted"
          />
          {row.objective ? (
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">
                {row.objective.date ? formatShort(row.objective.date) : "Sans date"}
              </span>
              <span className="truncate text-muted">{row.objective.label}</span>
            </span>
          ) : (
            <span className="text-muted">Aucun objectif</span>
          )}
        </span>

        <span className="relative z-10 flex shrink-0 items-center justify-end gap-2">
          {row.hasAccount ? (
            <Link
              href={`/coach/messages?sportif=${row.id}`}
              aria-label={`Écrire à ${row.name}`}
              title="Compte activé : écrire un message"
              className={`${iconButtonClass()} max-lg:hidden`}
            >
              <MessageSquare aria-hidden size={17} strokeWidth={1.8} />
            </Link>
          ) : canInvite ? (
            <Link
              href={`${href}/inviter`}
              className={`${buttonClass({ variant: "outline", size: "sm" })} max-lg:hidden`}
              aria-label={`Inviter ${row.name}`}
            >
              Inviter
            </Link>
          ) : null}
          <Link
            href={`${href}?onglet=profil`}
            aria-label={`Modifier la fiche de ${row.name}`}
            className={`${iconButtonClass()} max-lg:hidden`}
          >
            <Pencil aria-hidden size={16} strokeWidth={1.8} />
          </Link>
          <button
            type="button"
            aria-label={`Actions pour ${row.name}`}
            disabled={pending}
            onClick={() => onMenu("actions")}
            className={iconButtonClass()}
          >
            <Ellipsis aria-hidden size={18} strokeWidth={1.8} />
          </button>
        </span>
      </div>
    </li>
  );
}
