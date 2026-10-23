import {
  Bell,
  Calendar,
  CalendarCheck,
  Clock,
  Euro,
  FileText,
  House,
  Menu,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { buttonClass, iconButtonClass } from "@/components/ui/button";
import { MicroLabel } from "@/components/ui/card";
import { CooryLogo } from "@/components/ui/coory-logo";
import { chipActiveClass, chipClass, chipIdleClass } from "@/components/ui/chip";
import { KpiCard } from "@/components/ui/kpi-card";
import { navItemClass } from "@/components/ui/nav-item";

import { InteractiveDemos, StaticStates } from "./demos";

// Vitrine des composants (étape 1 du prompt Claude Design) : la même planche que
// docs/design/prototypes/Coory Composants.dc.html, construite avec les VRAIS composants de l'app,
// pour les comparer côte à côte. Page de développement : introuvable en production.
export const metadata: Metadata = { title: "Composants" };

const themes = [
  { key: "dark", label: "Thème sombre" },
  { key: "light", label: "Thème clair" },
] as const;

export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-full bg-[#05070c] px-4 py-8 font-sans md:p-12">
      <header className="mb-7 flex flex-col gap-2 text-[#f1f4f8]">
        <span className="font-mono text-[12px] font-medium tracking-[0.08em] text-[#ff6b79]">
          ÉTAPE 1 · BASES
        </span>
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.03em]">
          Composants Coory
        </h1>
        <p className="text-[14px] text-[#9ba6b5]">
          Sombre (défaut) et clair côte à côte · mêmes composants que dans les prototypes.
        </p>
      </header>
      <div className="flex flex-col items-start gap-7 xl:flex-row">
        {themes.map((theme) => (
          <div
            key={theme.key}
            data-theme={theme.key}
            className="flex w-full min-w-0 flex-1 flex-col gap-4 rounded-[24px] bg-page p-4 text-text md:p-7"
          >
            <div className="flex items-center justify-between">
              <CooryLogo size={22} />
              <MicroLabel>{theme.label}</MicroLabel>
            </div>
            <ThemeColumn />
          </div>
        ))}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5 rounded-card border border-line bg-bg p-4 md:p-[22px]">
      <MicroLabel>{title}</MicroLabel>
      {children}
    </section>
  );
}

function ThemeColumn() {
  return (
    <>
      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" className={buttonClass()}>
            Créer un programme →
          </button>
          <button type="button" className={buttonClass({ variant: "inverse" })}>
            Inviter
          </button>
          <button type="button" className={buttonClass({ variant: "outline" })}>
            Aperçu
          </button>
          <button type="button" className={buttonClass({ variant: "ghost" })}>
            Annuler
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" className={buttonClass({ size: "lg", className: "w-full" })}>
            Se connecter
          </button>
          <button type="button" disabled className={buttonClass()}>
            Désactivé
          </button>
          <button type="button" aria-label="Notifications" className={iconButtonClass()}>
            <Bell aria-hidden size={18} strokeWidth={1.8} />
            <span
              aria-hidden
              className="absolute top-2 right-2 size-[7px] rounded-full border-2 border-surface bg-accent box-content"
            />
          </button>
        </div>
      </Section>

      <InteractiveDemos />

      <Section title="Pastilles · badges">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`${chipClass} ${chipActiveClass}`}>Tous</span>
          <span className={`${chipClass} ${chipIdleClass}`}>Running</span>
          <span className={`${chipClass} ${chipIdleClass}`}>Musculation</span>
          <span className={`${chipClass} ${chipIdleClass}`}>Hyrox</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="run">Running</Badge>
          <Badge tone="strength">Musculation</Badge>
          <Badge tone="hyrox">Hyrox</Badge>
          <Badge tone="hybrid">Hybride</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {[
            "Actif",
            "En pause",
            "Archivé",
            "En retard",
            "Brouillon",
            "Publié",
            "En cours",
            "Reportée",
          ].map((label) => (
            <StatusBadge key={label} label={label} />
          ))}
        </div>
      </Section>

      <Section title="Avatars">
        <div className="flex flex-wrap items-center gap-2.5">
          <Avatar name="Inès Benali" size="lg" sex="female" />
          <Avatar name="Thomas Peeters" size="md" sex="male" />
          <Avatar name="Camille Martin" size="sm" />
          <span className="text-[13px] text-muted">initiales · ♀ / ♂ · photo à importer</span>
        </div>
      </Section>

      <Section title="Cartes chiffrées">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          <KpiCard
            value="7"
            label="coachings aujourd'hui"
            detail="3 terminés"
            color="accent"
            icon={CalendarCheck}
          />
          <KpiCard value="25 h" label="planifiées" detail="Semaine 43" color="run" icon={Clock} />
          <KpiCard
            value="3 240 €"
            label="encaissés"
            detail="+12 % vs sept."
            color="ok"
            icon={Euro}
          />
        </div>
      </Section>

      <Section title="Menu latéral · hamburger · feuille du bas">
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-0.5 rounded-[16px] border border-line bg-surface p-2.5">
            <span className={navItemClass(true)}>
              <House aria-hidden size={19} strokeWidth={1.7} />
              Tableau de bord
            </span>
            <span className={navItemClass(false)}>
              <Users aria-hidden size={19} strokeWidth={1.7} />
              Sportifs
            </span>
            <span className={navItemClass(false)}>
              <FileText aria-hidden size={19} strokeWidth={1.7} />
              Programmes
            </span>
            <span className={navItemClass(false)}>
              <Calendar aria-hidden size={19} strokeWidth={1.7} />
              Agenda
            </span>
          </div>
          <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-line px-3 py-2.5">
              <CooryLogo size={15} />
              <span className="font-display text-[13px] font-semibold">Sportifs</span>
              <span className={`${iconButtonClass({ size: "sm" })} justify-self-end`}>
                <Menu aria-hidden size={17} strokeWidth={1.8} />
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-2.5">
              <span className={navItemClass(false)}>
                <House aria-hidden size={19} strokeWidth={1.7} />
                Tableau de bord
              </span>
              <span className={navItemClass(true)}>
                <Users aria-hidden size={19} strokeWidth={1.7} />
                Sportifs
              </span>
            </div>
          </div>
          <div className="flex min-h-[190px] flex-col justify-end overflow-hidden rounded-[16px] border border-line bg-surface-2">
            <div className="flex flex-col gap-1 rounded-t-[18px] border-t border-line-2 bg-surface px-3.5 pt-2.5 pb-3.5">
              <span aria-hidden className="mb-1.5 h-1 w-9 self-center rounded-[4px] bg-line-2" />
              <span className="font-display text-[14px] font-semibold">Choisir la discipline</span>
              {["Running", "Musculation", "Hyrox"].map((label) => (
                <span
                  key={label}
                  className="flex min-h-10 items-center justify-between border-t border-line text-[14px]"
                >
                  {label}
                  {label === "Hyrox" ? <span className="text-accent-text">✓</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="États">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StaticStates />
        </div>
      </Section>
    </>
  );
}
