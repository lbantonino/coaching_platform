import { FilePlus, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProgramCard } from "@/components/programs/program-cards";
import { sortAthletePrograms } from "@/domain/training/program-status";
import type { ProgramListItem } from "@/features/programs/queries";

// Onglet « Programme » de la fiche d'un sportif (test d'Antonino sur iPhone, 15/11/2026 : une seule
// vue d'un programme) : les cartes de SES programmes, les mêmes que la page Programmes (en cours, à
// venir, brouillons, terminés, archivés). Un appui ouvre le programme, le seul endroit où l'on construit,
// modifie et publie ; son retour ramène ici. Le programme tel que le sportif le reçoit, semaine par
// semaine, c'est l'onglet Agenda. Sans programme : « Créer un programme » ouvre l'assistant avec ce
// sportif déjà choisi.

const ctaClass =
  "inline-flex h-[50px] items-center justify-center gap-2 rounded-[11px] bg-cta px-[18px] text-[14px] font-semibold whitespace-nowrap text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] sm:h-11";
const secondaryClass =
  "inline-flex h-[50px] items-center justify-center rounded-[11px] px-4 text-[14px] font-semibold whitespace-nowrap text-text inset-ring inset-ring-field-ring transition-colors duration-150 hover:bg-surface-2 sm:h-11";

export function ProgramTab({
  name,
  programs,
  tabHref,
  editorBase,
  newHref,
  copyHref,
  archived,
}: {
  name: string;
  // Tous ses programmes, archivés compris (son historique).
  programs: ProgramListItem[];
  // Cet onglet : le retour de la page du programme y ramène (?retour=).
  tabHref: string;
  // « …/programmes » : un programme s'ouvre en `${editorBase}/${id}`.
  editorBase: string;
  newHref: string;
  // « Copier un programme précédent » : seulement s'il en a déjà publié un.
  copyHref: string | null;
  // Fiche archivée (B11) : l'assistant ne s'ouvre pas pour elle.
  archived: boolean;
}) {
  if (programs.length === 0) {
    return <EmptyProgram name={name} newHref={newHref} archived={archived} />;
  }
  // Plus rien en cours ni à venir : le bloc suivant se crée ou se copie d'ici, au-dessus des cartes.
  const needsNext =
    !archived &&
    !programs.some((program) => program.status === "current" || program.status === "upcoming");
  return (
    <div className="flex w-full flex-col gap-3">
      {needsNext ? <NextProgram name={name} newHref={newHref} copyHref={copyHref} /> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sortAthletePrograms(programs).map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            href={`${editorBase}/${program.id}?retour=${encodeURIComponent(tabHref)}`}
          />
        ))}
      </div>
    </div>
  );
}

function NextProgram({
  name,
  newHref,
  copyHref,
}: {
  name: string;
  newHref: string;
  copyHref: string | null;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-4 sm:flex-row sm:items-center sm:justify-between lg:p-5">
      <p className="text-[14px] leading-[1.5] text-pretty text-text-2">
        <span className="font-semibold text-text">Aucun programme en cours pour {name}.</span>{" "}
        {copyHref
          ? "Crée le suivant, ou repars d'un programme précédent."
          : "Crée-lui un programme."}
      </p>
      <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
        <Link href={newHref} className={ctaClass}>
          <Plus aria-hidden size={16} strokeWidth={2.2} />
          Créer un programme
        </Link>
        {copyHref ? (
          <Link href={copyHref} className={secondaryClass}>
            Copier un programme précédent
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function EmptyProgram({
  name,
  newHref,
  archived,
}: {
  name: string;
  newHref: string;
  archived: boolean;
}) {
  // Fiche archivée (B11) : pas d'assistant (il ne propose que les sportifs actifs).
  if (archived) {
    return (
      <EmptyCard title={`Aucun programme pour ${name}`}>
        La fiche est archivée : réactive-la (onglet Profil, statut) pour lui créer un programme.
      </EmptyCard>
    );
  }
  return (
    <EmptyCard
      title={`Aucun programme pour ${name}`}
      footer={
        <p className="mt-[18px] text-[12.5px] text-faint">
          L&apos;assistant s&apos;ouvre avec {name} déjà choisi.
        </p>
      }
    >
      Crée-lui un programme semaine par semaine. Tu pars d&apos;un modèle, d&apos;un ancien
      programme ou de zéro, et tu le publies quand il est prêt.
      <div className="mt-6 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Link href={newHref} className={ctaClass}>
          <Plus aria-hidden size={16} strokeWidth={2.2} />
          Créer un programme
        </Link>
      </div>
    </EmptyCard>
  );
}

// La carte de l'état vide, son icône, son titre et son texte.
function EmptyCard({
  title,
  children,
  footer = null,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="flex w-full flex-col items-center rounded-[20px] bg-surface px-6 py-12 text-center lg:px-10 lg:py-14">
      <span className="grid size-16 place-items-center rounded-[20px] bg-lib-lavender text-violet-text">
        <FilePlus aria-hidden size={24} strokeWidth={1.7} />
      </span>
      <h2 className="mt-5 text-[22px] leading-[1.2] font-bold tracking-[-0.02em] text-text">
        {title}
      </h2>
      <div className="mt-2 flex max-w-[440px] flex-col items-center text-[14.5px] leading-[1.6] text-pretty text-muted">
        {children}
      </div>
      {footer}
    </section>
  );
}
