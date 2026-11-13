"use client";

import {
  Archive,
  CirclePause,
  CirclePlay,
  Copy,
  Layers,
  Mail,
  MessageCircle,
  Pencil,
  RefreshCw,
  Send,
  Target,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { NotAvailableDialog } from "@/components/blocks/not-available";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { dialogDisciplineIcons } from "@/components/ui/kit-icons";
import { ActionMenu, Sheet } from "@/components/ui/overlay";
import { SexMark } from "@/components/ui/sex-mark";
import { useToast } from "@/components/ui/toast";
import { FEATURES } from "@/config/features";
import {
  DISCIPLINES,
  disciplineLabels,
  disciplineStyles,
  type Discipline,
} from "@/domain/training/discipline";
import { setAthletesProgramType, setAthletesStatus } from "@/features/athletes/actions";
import { athleteStatusDots, type AthleteStatus, type Sex } from "@/features/athletes/schemas";
import { createInvitations, type BulkInvitation } from "@/features/invitations/actions";

// Liste des sportifs, d'après la maquette « Sportifs » du 03/11/2026 (pages 1a et 1b du dossier
// COORY-SPORTIF-PIXEL-PERFECT). Ordinateur : un tableau dans la carte (Sportif, Statut, Programme,
// Objectif, Actions), colonnes triables, pied « n sportifs affichés · Trié par… ». Téléphone : une
// carte-ligne par sportif, l'objectif en sous-carte. Cocher fait apparaître la barre d'actions
// groupées (statut, programme, invitation). Gardé de la version précédente (D-40, D-53) : la photo,
// le statut et le programme qui se changent d'un appui (ordinateur), le menu « ··· » de chaque ligne.
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

// Tuile teintée dans les boîtes (kit, 07 et 14) : Actif vert, En pause ambre, Archivé gris.
export const statusChoices: {
  status: AthleteStatus;
  label: string;
  icon: LucideIcon;
  tone: "ok" | "warn" | "muted";
}[] = [
  { status: "active", label: "Actif", icon: CirclePlay, tone: "ok" },
  { status: "paused", label: "En pause", icon: CirclePause, tone: "warn" },
  { status: "archived", label: "Archivé", icon: Archive, tone: "muted" },
];
const statusLabel = Object.fromEntries(statusChoices.map((c) => [c.status, c.label])) as Record<
  AthleteStatus,
  string
>;
// Points de statut et de discipline : athleteStatusDots et disciplineStyles[…].dot (partagés).
const statusDot = athleteStatusDots;

const sortNames: Record<SortColumn, string> = {
  sportif: "nom",
  statut: "statut",
  type: "programme",
  objectif: "objectif (date)",
};

// Colonnes exactes de la maquette (en-tête ET lignes) : case, sportif, statut, programme, objectif,
// actions ; elles s'élargissent avec l'écran (fractions), seule la colonne Actions est fixe.
const grid =
  "lg:grid lg:grid-cols-[20px_minmax(0,1.7fr)_minmax(0,.8fr)_minmax(0,1fr)_minmax(0,1.6fr)_150px] lg:items-center lg:gap-4 lg:px-6";

type MenuKind = "actions" | "status" | "type";
// `fromActions` : ouvert depuis le menu « ··· » de la ligne, avec une flèche pour y revenir.
type Menu = { kind: MenuKind; ids: string[]; title: string; fromActions?: boolean } | null;

export function AthleteTable({
  organizationId,
  basePath,
  rows,
  sort,
  toolbar,
  empty,
  today,
}: {
  organizationId: string;
  basePath: string;
  rows: AthleteTableRow[];
  sort: { column: SortColumn; desc: boolean; hrefs: Record<SortColumn, string> };
  // Filtres et recherche (rendus par la page) : dans la carte sur ordinateur, au-dessus sur téléphone.
  toolbar: ReactNode;
  // Liste vide : le message à afficher dans la carte.
  empty: ReactNode;
  today: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [menu, setMenu] = useState<Menu>(null);
  const [invitations, setInvitations] = useState<BulkInvitation[] | null>(null);
  // MVP espace coach seul (D-167) : « Écrire » et « Inviter » restent visibles mais ouvrent la
  // fenêtre « pas encore disponible ».
  const [unavailable, setUnavailable] = useState(false);
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
  const toggleAll = () => setSelected(allSelected ? [] : rows.map((row) => row.id));
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

  // Invitation groupée : un lien par sportif coché, à copier (Coory n'envoie pas d'e-mail).
  const inviteSelected = () => {
    if (!FEATURES.invitations) {
      setUnavailable(true);
      return;
    }
    startTransition(async () => {
      const results = await createInvitations(organizationId, visible);
      setInvitations(results);
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
          ? `Discipline de ${row.name}`
          : row.name,
  });

  const menuItems = () => {
    if (!menu) return [];
    const single = menu.ids.length === 1 ? byId.get(menu.ids[0]) : undefined;
    // Menu « ··· » d'une ligne (demande d'Antonino du 24/10) : tout ce que la ligne permet, au même
    // endroit. Statut et type ouvrent leur choix ; le reste mène à la fiche, à l'invitation ou au fil.
    if (menu.kind === "actions" && single) {
      const href = `${basePath}/${single.id}`;
      return [
        {
          label: "Changer le statut",
          icon: RefreshCw,
          chevron: true,
          onSelect: () => setMenu(menuFor(single, "status", true)),
        },
        {
          label: "Changer la discipline",
          icon: Layers,
          chevron: true,
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
                icon: MessageCircle,
                onSelect: () =>
                  FEATURES.messages
                    ? router.push(`/coach/messages?sportif=${single.id}`)
                    : setUnavailable(true),
              },
            ]
          : single.status !== "archived"
            ? [
                {
                  label: "Inviter dans son espace",
                  icon: Send,
                  onSelect: () =>
                    FEATURES.invitations ? router.push(`${href}/inviter`) : setUnavailable(true),
                },
              ]
            : []),
      ];
    }
    if (menu.kind === "status") {
      return statusChoices.map((choice) => ({
        label: choice.label,
        icon: choice.icon,
        tone: choice.tone,
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
      icon: dialogDisciplineIcons[discipline],
      tone: discipline,
      selected: single?.programType === discipline,
      onSelect: () => {
        if (single?.programType === discipline) return;
        apply(
          menu.ids,
          () => setAthletesProgramType(organizationId, menu.ids, discipline),
          `Discipline de ${who(menu.ids)} : ${disciplineLabels[discipline]}.`,
        );
      },
    }));
  };

  const menuSubtitle = () => {
    const single = menu?.kind === "actions" ? byId.get(menu.ids[0]) : undefined;
    if (!single) return undefined;
    return [
      statusLabel[single.status],
      single.sub,
      single.programType ? disciplineLabels[single.programType] : null,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const header = (column: SortColumn, label: string) => {
    const active = sort.column === column;
    return (
      <Link
        href={sort.hrefs[column]}
        scroll={false}
        aria-label={`Trier par ${label.toLowerCase()}`}
        className={`inline-flex items-center gap-[5px] whitespace-nowrap hover:text-text ${active ? "text-text" : ""}`}
      >
        {label}
        <span
          aria-hidden
          className={`text-[11px] font-semibold ${active ? "text-violet-text" : "text-checkbox"}`}
        >
          {active ? (sort.desc ? "↓" : "↑") : "↕"}
        </span>
      </Link>
    );
  };

  const statusMenu = (ids: string[]) =>
    setMenu({ kind: "status", ids, title: `Statut de ${who(ids)}` });
  const typeMenu = (ids: string[]) =>
    setMenu({ kind: "type", ids, title: `Discipline de ${who(ids)}` });
  const selectionLabel = `${visible.length} sportif${visible.length > 1 ? "s" : ""} sélectionné${visible.length > 1 ? "s" : ""}`;

  return (
    <>
      {/* Ordinateur : UNE carte (filtres, puis tableau). Téléphone : les filtres au-dessus, puis la carte
          de la liste (la première enveloppe ne dessine rien). */}
      <div className="flex flex-col gap-3 lg:gap-0 lg:rounded-[20px] lg:bg-surface lg:inset-ring lg:inset-ring-line-soft">
        {toolbar}
        <section
          aria-label="Sportifs"
          className="flex flex-col overflow-hidden rounded-[20px] bg-surface inset-ring inset-ring-line-soft lg:rounded-none lg:bg-transparent lg:inset-ring-0"
        >
          {/* Téléphone : « Tout sélectionner » (ou « n sélectionnés ») en tête de la carte. */}
          <div className="flex min-h-14 items-center gap-3 border-b border-line bg-surface-2 pr-3.5 pl-4 lg:hidden">
            <RowCheck
              checked={allSelected}
              disabled={rows.length === 0}
              onChange={toggleAll}
              label="Tout sélectionner"
            />
            <span className="flex-1 text-[14px] font-medium text-text-2">
              {visible.length > 0
                ? `${visible.length} sélectionné${visible.length > 1 ? "s" : ""}`
                : "Tout sélectionner"}
            </span>
          </div>

          {visible.length > 0 ? (
            <div
              role="region"
              aria-label="Actions sur la sélection"
              className="flex gap-2 overflow-x-auto border-b border-line px-3.5 py-2.5 [scrollbar-width:none] lg:mx-4 lg:mb-2.5 lg:h-[46px] lg:items-center lg:overflow-visible lg:rounded-xl lg:border-0 lg:bg-inv lg:py-0 lg:pr-2 lg:pl-4 lg:text-on-inv"
            >
              <span className="hidden min-w-0 flex-1 truncate text-[13.5px] font-medium lg:block">
                {selectionLabel}
              </span>
              <BulkButton disabled={pending} onClick={() => statusMenu(visible)}>
                Changer le statut
              </BulkButton>
              <BulkButton disabled={pending} onClick={() => typeMenu(visible)}>
                Changer la discipline
              </BulkButton>
              <BulkButton disabled={pending} onClick={inviteSelected}>
                Inviter
              </BulkButton>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="h-10 shrink-0 rounded-[11px] px-3 text-[13.5px] font-medium text-muted lg:h-8 lg:rounded-lg lg:text-on-inv/70 lg:hover:text-on-inv"
              >
                Annuler
              </button>
            </div>
          ) : null}

          {/* Ordinateur : en-tête du tableau (cases et tris). */}
          <div
            className={`hidden border-y border-line bg-surface-2 py-2.5 text-[12.5px] leading-[normal] font-medium text-muted ${grid}`}
          >
            <RowCheck
              checked={allSelected}
              disabled={rows.length === 0}
              onChange={toggleAll}
              label="Tout sélectionner"
            />
            {header("sportif", "Sportif")}
            {header("statut", "Statut")}
            {header("type", "Programme")}
            {header("objectif", "Objectif")}
            <span className="text-right">Actions</span>
          </div>

          {rows.length === 0 ? (
            empty
          ) : (
            <ul aria-label="Liste des sportifs" className="flex flex-col">
              {rows.map((row) => (
                <Row
                  key={row.id}
                  row={row}
                  href={`${basePath}/${row.id}`}
                  checked={visible.includes(row.id)}
                  onToggle={() => toggle(row.id)}
                  onMenu={(kind) => setMenu(menuFor(row, kind))}
                  onUnavailable={() => setUnavailable(true)}
                  pending={pending}
                  today={today}
                />
              ))}
            </ul>
          )}

          <div className="hidden justify-between px-6 py-3.5 text-[13px] leading-[normal] text-muted lg:flex">
            <span>
              {rows.length} sportif{rows.length > 1 ? "s" : ""} affiché{rows.length > 1 ? "s" : ""}
            </span>
            <span>
              Trié par {sortNames[sort.column]}, {sort.desc ? "décroissant" : "croissant"}
            </span>
          </div>
        </section>
      </div>

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
        // Kit (boîte 13) : « Actif · Intermédiaire · Musculation » sous le nom.
        subtitle={menuSubtitle()}
        items={menuItems()}
      />

      <NotAvailableDialog open={unavailable} onClose={() => setUnavailable(false)} />

      <InvitationLinks
        results={invitations}
        onClose={() => {
          setInvitations(null);
          setSelected([]);
        }}
      />
    </>
  );
}

function BulkButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-10 shrink-0 rounded-[11px] bg-inv px-3.5 text-[13.5px] font-medium whitespace-nowrap text-on-inv transition-opacity duration-150 disabled:opacity-45 lg:h-8 lg:rounded-lg lg:bg-on-inv/10 lg:px-3 lg:hover:bg-on-inv/20"
    >
      {children}
    </button>
  );
}

const writeClass =
  "relative z-10 grid size-8 place-items-center rounded-[9px] text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2";
const inviteClass =
  "relative z-10 flex h-8 items-center rounded-[9px] px-3 text-[13px] font-medium text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2";

// Case à cocher de la maquette : 22 px sur téléphone (dans une zone tactile de 44), 18 px sur
// ordinateur ; violette une fois cochée. Vraie case native (clavier, lecteurs d'écran).
function RowCheck({
  checked,
  disabled = false,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="relative z-10 -my-2.5 -mr-2 -ml-3 grid size-11 shrink-0 cursor-pointer place-items-center lg:m-0 lg:size-[18px]">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="grid size-[22px] place-items-center rounded-[7px] text-[12px] leading-none font-bold text-white inset-ring-[1.5px] inset-ring-checkbox peer-checked:bg-violet peer-checked:inset-ring-violet peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet lg:size-[18px] lg:rounded-[6px] lg:text-[11px]"
      >
        {checked ? "✓" : ""}
      </span>
    </label>
  );
}

const shortDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const longDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
// « 20 déc. » cette année, « 28 févr. 2027 » une autre année.
function goalDate(day: string, today: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  return day.slice(0, 4) === today.slice(0, 4) ? shortDate.format(date) : longDate.format(date);
}

function Row({
  row,
  href,
  checked,
  onToggle,
  onMenu,
  onUnavailable,
  pending,
  today,
}: {
  row: AthleteTableRow;
  href: string;
  checked: boolean;
  onToggle: () => void;
  onMenu: (kind: MenuKind) => void;
  onUnavailable: () => void;
  pending: boolean;
  today: string;
}) {
  const canInvite = !row.hasAccount && row.status !== "archived";
  const date = row.objective?.date ? goalDate(row.objective.date, today) : null;
  // Ordinateur seulement : masqué sur téléphone.
  const desktop = "max-lg:hidden";

  return (
    // UNE seule ligne pour les deux écrans (chaque texte n'existe qu'une fois) : une grille de 4
    // colonnes sur téléphone (case, photo, nom, « ··· », l'objectif dessous), celle du tableau sur
    // ordinateur. Toute la ligne ouvre la fiche (lien étendu) ; la case, le statut, le programme et
    // les actions restent des boutons, posés au-dessus.
    <li
      className={`relative grid grid-cols-[24px_44px_minmax(0,1fr)_40px] items-center gap-3 border-b border-line-soft pt-4 pr-3.5 pb-4 pl-4 transition-colors duration-150 max-lg:active:bg-surface-2 lg:min-h-[68px] lg:py-2.5 lg:hover:bg-surface-2 ${grid} ${
        checked ? "bg-violet/5 lg:hover:bg-violet/5" : ""
      }`}
    >
      <RowCheck checked={checked} onChange={onToggle} label={`Sélectionner ${row.name}`} />

      <Link
        href={href}
        className="col-span-2 flex min-w-0 items-center gap-3 after:absolute after:inset-0 after:content-[''] lg:col-span-1"
      >
        {/* Photo : 44 px sur téléphone, 40 sur ordinateur. */}
        <span className="max-lg:[&>span>*]:size-11! max-lg:[&>span>*]:text-[13.5px]!">
          <Avatar
            name={row.name}
            colorClass={row.programType ? disciplineStyles[row.programType].avatar : undefined}
            photoPath={row.photoPath}
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1 leading-[normal] lg:gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[15.5px] font-semibold lg:text-[14.5px]">
              {row.name}
            </span>
            <SexMark sex={row.sex} plain />
          </span>
          {/* Ordinateur : le niveau, ou « Fiche à compléter » en orange (détail en infobulle).
              Téléphone : seulement « Fiche à compléter », sous le statut (repère gardé de la version
              précédente, absent de la maquette). */}
          <span
            className={`truncate text-[13px] whitespace-nowrap text-muted max-lg:order-last ${row.missing ? "" : desktop}`}
          >
            {row.missing ? (
              <span title={row.missing} className="text-warn">
                Fiche à compléter
              </span>
            ) : (
              row.sub
            )}
          </span>
          {/* Téléphone : « ● Actif · ● Musculation ». */}
          <span className="flex items-center gap-2 text-[13px] whitespace-nowrap text-text-2 lg:hidden">
            <span className="flex items-center gap-[5px]">
              <span aria-hidden className={`size-1.5 rounded-full ${statusDot[row.status]}`} />
              {statusLabel[row.status]}
            </span>
            <span aria-hidden className="text-checkbox">
              ·
            </span>
            <span className="flex min-w-0 items-center gap-[5px]">
              <span
                aria-hidden
                className={`size-1.5 shrink-0 rounded-full ${row.programType ? disciplineStyles[row.programType].dot : "bg-faint"}`}
              />
              <span className="truncate">
                {row.programType ? disciplineLabels[row.programType] : "Programme à choisir"}
              </span>
            </span>
          </span>
        </span>
      </Link>

      {/* Ordinateur : statut et programme, qui ouvrent leur choix. */}
      <span className={desktop}>
        <button
          type="button"
          disabled={pending}
          onClick={() => onMenu("status")}
          aria-label={`Statut : ${statusLabel[row.status]}. Changer le statut de ${row.name}`}
          className="relative z-10 -mx-2 inline-flex items-center gap-[7px] rounded-lg px-2 py-1 text-[13.5px] whitespace-nowrap text-text transition-colors duration-150 hover:bg-chip"
        >
          <span aria-hidden className={`size-[7px] rounded-full ${statusDot[row.status]}`} />
          {statusLabel[row.status]}
        </button>
      </span>
      <span className={desktop}>
        {row.programType ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onMenu("type")}
            aria-label={`Programme : ${disciplineLabels[row.programType]}. Changer la discipline de ${row.name}`}
            className="relative z-10 -mx-2 inline-flex items-center gap-[7px] rounded-lg px-2 py-1 text-[13.5px] font-medium whitespace-nowrap text-text transition-colors duration-150 hover:bg-chip"
          >
            <span
              aria-hidden
              className={`size-2 rounded-full ${disciplineStyles[row.programType].dot}`}
            />
            {disciplineLabels[row.programType]}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => onMenu("type")}
            aria-label={`Choisir la discipline de ${row.name}`}
            className="relative z-10 inline-flex h-[30px] items-center rounded-[9px] border border-dashed border-line-2 px-3 text-[13px] font-medium text-text-2 transition-colors duration-150 hover:bg-surface-2"
          >
            Choisir
          </button>
        )}
      </span>

      {/* Objectif : colonne du tableau (ordinateur) ; sous-carte sous le nom (téléphone). */}
      <span className={`flex min-w-0 flex-col gap-0.5 leading-[normal] ${desktop}`}>
        {row.objective ? (
          <>
            <span
              className={`text-[14px] font-medium whitespace-nowrap ${date ? "text-text" : "text-faint"}`}
            >
              {date ?? "Sans date"}
            </span>
            <span className="truncate text-[13px] text-muted">{row.objective.label}</span>
          </>
        ) : (
          <span className="text-[14px] font-medium text-faint">Aucun objectif</span>
        )}
      </span>

      <span className="col-start-4 row-start-1 flex items-center justify-end gap-1.5 lg:col-start-auto lg:row-start-auto">
        {row.hasAccount ? (
          FEATURES.messages ? (
            <Link
              href={`/coach/messages?sportif=${row.id}`}
              aria-label={`Écrire à ${row.name}`}
              title="Compte activé : écrire un message"
              className={`${writeClass} ${desktop}`}
            >
              <MessageCircle aria-hidden size={15} strokeWidth={1.8} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onUnavailable}
              aria-label={`Écrire à ${row.name}`}
              className={`${writeClass} ${desktop}`}
            >
              <MessageCircle aria-hidden size={15} strokeWidth={1.8} />
            </button>
          )
        ) : !FEATURES.invitations ? (
          // Sans invitations, pas d'« Invité » en attente : le même bouton « Inviter » pour tous.
          canInvite ? (
            <button
              type="button"
              onClick={onUnavailable}
              aria-label={`Inviter ${row.name}`}
              className={`${inviteClass} ${desktop}`}
            >
              Inviter
            </button>
          ) : null
        ) : row.hasPendingInvite ? (
          <Link
            href={`${href}/inviter`}
            aria-label={`Invitation envoyée à ${row.name} : voir ou renvoyer`}
            title="Invitation envoyée, en attente"
            className={`relative z-10 flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-[12.5px] whitespace-nowrap text-muted transition-colors duration-150 hover:bg-surface-2 ${desktop}`}
          >
            <Mail aria-hidden size={14} strokeWidth={1.8} />
            Invité
          </Link>
        ) : canInvite ? (
          <Link
            href={`${href}/inviter`}
            aria-label={`Inviter ${row.name}`}
            className={`${inviteClass} ${desktop}`}
          >
            Inviter
          </Link>
        ) : null}
        {/* « ··· » : 40 px cerclé sur téléphone, 32 px sans contour sur ordinateur. */}
        <button
          type="button"
          aria-label={`Actions pour ${row.name}`}
          disabled={pending}
          onClick={() => onMenu("actions")}
          className="relative z-10 grid size-10 shrink-0 place-items-center rounded-[11px] text-[14px] font-bold text-text inset-ring inset-ring-line-2 transition-colors duration-150 lg:size-8 lg:rounded-[9px] lg:text-text-2 lg:inset-ring-0 lg:hover:bg-chip"
        >
          ···
        </button>
      </span>

      {/* Téléphone : l'objectif en sous-carte, sous la photo et le nom. */}
      {row.objective ? (
        <span className="col-span-2 col-start-2 row-start-2 ml-2.5 flex items-center gap-2.5 rounded-xl bg-surface-2 py-[9px] pr-3 pl-[9px] lg:hidden">
          <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-violet-soft text-violet-text">
            <Target aria-hidden size={15} strokeWidth={1.8} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-px leading-[normal]">
            <span className="truncate text-[13.5px] font-medium">{row.objective.label}</span>
            <span className="text-[12.5px] whitespace-nowrap text-muted">
              {date ?? "Sans date"}
            </span>
          </span>
        </span>
      ) : (
        <span className="col-span-2 col-start-2 row-start-2 ml-2.5 text-[13px] leading-[normal] text-faint lg:hidden">
          Aucun objectif
        </span>
      )}
    </li>
  );
}

// Résultat de l'invitation groupée : un lien par sportif, à copier et envoyer soi-même (affiché une
// seule fois, comme sur la page « Inviter »). Les sportifs sans e-mail ou déjà inscrits sont signalés.
function InvitationLinks({
  results,
  onClose,
}: {
  results: BulkInvitation[] | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const links = results?.filter((result) => result.link) ?? [];
  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch {
      toast("Copie impossible : sélectionne le lien à la main.");
    }
  };
  return (
    <Sheet
      open={results !== null}
      onClose={onClose}
      title="Liens d'invitation"
      subtitle="Chaque lien n'est affiché qu'une fois : copie-le et envoie-le au sportif (message, e-mail)."
      footer={
        links.length > 1 ? (
          <button
            type="button"
            onClick={() =>
              copy(
                links.map((result) => `${result.name} : ${result.link}`).join("\n"),
                "Tous les liens sont copiés.",
              )
            }
            className={buttonClass({ variant: "primary", className: "w-full" })}
          >
            <Copy aria-hidden size={16} strokeWidth={1.8} />
            Copier tous les liens
          </button>
        ) : undefined
      }
    >
      <ul aria-label="Liens d'invitation" className="flex flex-col">
        {(results ?? []).map((result) => (
          <li
            key={result.athleteId}
            className="flex items-center gap-3 border-t border-line py-3 first:border-t-0"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[15px] font-semibold">{result.name}</span>
              <span className={`truncate text-[13px] ${result.link ? "text-muted" : "text-warn"}`}>
                {result.link ?? result.error}
              </span>
            </span>
            {result.link ? (
              <button
                type="button"
                onClick={() => copy(result.link ?? "", `Lien de ${result.name} copié.`)}
                aria-label={`Copier le lien de ${result.name}`}
                className={buttonClass({ variant: "outline", size: "sm", className: "shrink-0" })}
              >
                <Copy aria-hidden size={15} strokeWidth={1.8} />
                Copier
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
