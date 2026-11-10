"use client";

import { Archive, Copy, Pencil, Plus, Save } from "lucide-react";
import { useState, type ReactNode } from "react";

import { phoneFabClass } from "@/components/layout/mobile-bar";
import { EditorSessionCard } from "@/components/programs/editor-session-card";
import { ChipGroup } from "@/components/ui/chip-group";
import { MoreMenu } from "@/components/ui/more-menu";
import { Sheet } from "@/components/ui/overlay";
import { OptionCard, RadioList } from "@/components/ui/radio-choice";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { Switch } from "@/components/ui/switch";

// Démonstration TEMPORAIRE (phase 3a, D-156) : les composants communs avec les données des maquettes,
// sur téléphone (390) et ordinateur (1280), en clair et en sombre. Supprimée à la fin de la phase 3b.

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-semibold text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-4 rounded-[20px] bg-surface p-[18px] ${className}`}>
      {children}
    </div>
  );
}

export function ProgrammesComponentsDemo() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState<"programmes" | "modeles">("programmes");
  const [status, setStatus] = useState("all");
  const [aim, setAim] = useState<"pace" | "hr">("pace");
  const [measure, setMeasure] = useState<"time" | "distance" | "open">("time");
  const [mode, setMode] = useState<"ordered" | "fixed">("fixed");
  const [scope, setScope] = useState<"week" | "phase" | "program">("phase");
  const [source, setSource] = useState<"all" | "coory" | "mine">("all");
  const [zone, setZone] = useState("4");
  const [perWeek, setPerWeek] = useState("4");
  const [move, setMove] = useState(true);
  const [goal, setGoal] = useState(false);
  const [day, setDay] = useState<"none" | "week" | "phase">("phase");
  const [organisation, setOrganisation] = useState<"ordered" | "fixed">("ordered");
  const [selected, setSelected] = useState(2);
  const [sheet, setSheet] = useState(false);

  const changeTheme = (value: "light" | "dark") => {
    setTheme(value);
    document.documentElement.dataset.theme = value;
  };

  const menuItems = [
    { label: "Enregistrer comme modèle", icon: Save, onSelect: () => {}, highlighted: true },
    { label: "Dupliquer le programme", icon: Copy, onSelect: () => {} },
    { label: "Renommer", icon: Pencil, onSelect: () => {} },
    { label: "Archiver", icon: Archive, onSelect: () => {}, destructive: true },
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-3.5 pt-5 pb-32 lg:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] font-bold tracking-[-0.02em]">Composants Programmes</h1>
        <SegmentedControl
          label="Thème"
          size="page"
          value={theme}
          onChange={changeTheme}
          options={[
            { value: "light", label: "Clair" },
            { value: "dark", label: "Sombre" },
          ]}
        />
      </header>

      <Block title="1. Segmenté">
        <Card>
          <div className="flex h-16 items-center gap-2.5 rounded-[20px] bg-surface pr-4 pl-5 inset-ring inset-ring-line">
            <span className="text-[15px] font-semibold">Programmes</span>
            <SegmentedControl
              label="Onglet"
              size="header"
              value={tab}
              onChange={setTab}
              options={[
                { value: "programmes", label: "Programmes" },
                { value: "modeles", label: "Modèles" },
              ]}
            />
          </div>
          <SegmentedControl
            label="Cible de l'étape"
            value={aim}
            onChange={setAim}
            options={[
              { value: "pace", label: "Allure" },
              { value: "hr", label: "Zone de FC" },
            ]}
          />
          <SegmentedControl
            label="Mesure"
            value={measure}
            onChange={setMeasure}
            options={[
              { value: "time", label: "Durée" },
              { value: "distance", label: "Distance" },
              { value: "open", label: "Libre" },
            ]}
          />
          <SegmentedControl
            label="Organisation de la semaine"
            size="card"
            value={mode}
            onChange={setMode}
            options={[
              { value: "ordered", label: "Dans l'ordre" },
              { value: "fixed", label: "Jours fixes" },
            ]}
          />
        </Card>
        <div className="flex flex-col gap-3">
          <SegmentedControl
            label="Statut"
            size="page"
            value={status}
            onChange={setStatus}
            className="hidden lg:block"
            options={[
              { value: "all", label: "Tous", count: 12 },
              { value: "current", label: "En cours", count: 5 },
              { value: "draft", label: "Brouillons", count: 2 },
              { value: "upcoming", label: "À venir", count: 1 },
              { value: "finished", label: "Terminés", count: 4 },
            ]}
          />
          <SegmentedControl
            label="Onglet"
            size="full"
            value={tab}
            onChange={setTab}
            className="lg:max-w-[390px]"
            options={[
              { value: "programmes", label: "Programmes" },
              { value: "modeles", label: "Modèles" },
            ]}
          />
          <SegmentedControl
            label="Organisation de la semaine"
            size="tall"
            value={mode}
            onChange={setMode}
            className="lg:max-w-[390px]"
            options={[
              { value: "ordered", label: "Dans l'ordre" },
              { value: "fixed", label: "Jours fixes" },
            ]}
          />
        </div>
      </Block>

      <Block title="2. Menu bouton + chevron">
        <Card>
          <div className="flex items-center gap-3">
            <label
              htmlFor="type-seance"
              className="shrink-0 text-[12.5px] font-semibold text-text-2"
            >
              Type de séance
            </label>
            <SelectField
              id="type-seance"
              defaultValue="Fractionné"
              className="w-[240px] max-w-full"
            >
              <option>Endurance</option>
              <option>Fractionné</option>
              <option>Sortie longue</option>
              <option>Tempo</option>
              <option>Récupération</option>
            </SelectField>
          </div>
          <SelectField aria-label="Type d'étape" defaultValue="Course">
            <option>Échauffement</option>
            <option>Course</option>
            <option>Récupération</option>
            <option>Repos</option>
            <option>Retour au calme</option>
          </SelectField>
          <SelectField aria-label="Allure" size="lg" defaultValue="min/km">
            <option value="min/km">Allure en min/km</option>
            <option value="vma">% de VMA</option>
          </SelectField>
        </Card>
        <SelectField aria-label="Discipline" size="sm" className="w-[200px]" defaultValue="Toutes">
          <option>Toutes les disciplines</option>
          <option>Running</option>
          <option>Musculation</option>
          <option>Hyrox</option>
        </SelectField>
      </Block>

      <Block title="3. Pastilles">
        <Card>
          <ChipGroup
            label="Appliquer à"
            value={scope}
            onChange={setScope}
            options={[
              { value: "week", label: "Cette semaine" },
              { value: "phase", label: "Phase Base · S1–4" },
              { value: "program", label: "Tout le programme" },
            ]}
          />
          <ChipGroup
            label="Zone de FC"
            size="zone"
            value={zone}
            onChange={setZone}
            options={["1", "2", "3", "4", "5"].map((value) => ({ value, label: `Z${value}` }))}
          />
        </Card>
        <ChipGroup
          label="Source"
          on="page"
          value={source}
          onChange={setSource}
          options={[
            { value: "all", label: "Tous", count: 9 },
            { value: "coory", label: "Coory", count: 5 },
            { value: "mine", label: "Mes modèles", count: 4 },
          ]}
        />
        <ChipGroup
          label="Séances par semaine"
          size="count"
          value={perWeek}
          onChange={setPerWeek}
          className="lg:max-w-[460px]"
          options={["1", "2", "3", "4", "5", "6", "7"].map((value) => ({ value, label: value }))}
        />
      </Block>

      <Block title="4. Interrupteur">
        <Card className="lg:max-w-[460px]">
          <Switch
            checked={move}
            onChange={setMove}
            label="Inès peut déplacer la séance"
            description="Dans la même semaine. Tu reçois une notification."
          />
          <Switch checked={goal} onChange={setGoal} label="Objectif de course" />
        </Card>
      </Block>

      <Block title="5. Choix">
        <Card className="lg:max-w-[460px]">
          <RadioList
            label="Appliquer ce jour à"
            value={day}
            onChange={setDay}
            options={[
              { value: "none", title: "Sans jour", subtitle: "Dans l'ordre, au choix d'Inès" },
              { value: "week", title: "Cette semaine" },
              { value: "phase", title: "Toute la phase Base" },
            ]}
          />
        </Card>
        <div className="grid gap-2.5 lg:max-w-[700px] lg:grid-cols-2">
          <OptionCard
            name="organisation"
            value="ordered"
            checked={organisation === "ordered"}
            onChange={() => setOrganisation("ordered")}
            title="Dans l'ordre, sans jour"
            description="Inès fait ses séances dans l'ordre, au jour de son choix."
          />
          <OptionCard
            name="organisation"
            value="fixed"
            checked={organisation === "fixed"}
            onChange={() => setOrganisation("fixed")}
            title="Un jour fixe par séance"
            description="Tu choisis le jour de chaque séance."
          />
        </div>
      </Block>

      <Block title="6. Menu ···">
        <Card>
          <div className="flex justify-end">
            <MoreMenu label="Plus d'actions sur le programme" title="Programme" items={menuItems} />
          </div>
        </Card>
      </Block>

      <Block title="7. Cartes de séance (éditeur)">
        <div className="flex flex-col gap-2 lg:max-w-[560px]">
          {[
            {
              title: "Renfo Hyrox",
              discipline: "strength" as const,
              sessionType: "Force",
              summary: ["6 exercices · 16 séries", "≈ 60 min"],
              coach: "Avec le coach · Mar 3 · 07:00",
            },
            {
              title: "Endurance rapide",
              discipline: "running" as const,
              sessionType: "Fractionné",
              summary: ["15 min + 5 × (2 min + 2 min) + 10 min", "≈ 45 min"],
            },
            {
              title: "Circuit Hyrox",
              discipline: "hyrox" as const,
              sessionType: "Circuit",
              summary: ["Échauffement · 5 tours · AMRAP 25 min", "≈ 58 min"],
              coach: "Avec le coach · Sam 7 · 10:00",
            },
            {
              title: "Sortie longue",
              discipline: "running" as const,
              sessionType: "Endurance",
              summary: ["1 h 05 · Z2", "≈ 11 km"],
            },
          ].map((session, i, all) => (
            <EditorSessionCard
              key={session.title}
              index={i + 1}
              {...session}
              selected={selected === i + 1}
              onSelect={() => setSelected(i + 1)}
              onMoveUp={i > 0 ? () => {} : undefined}
              onMoveDown={i < all.length - 1 ? () => {} : undefined}
            />
          ))}
          <EditorSessionCard
            index={1}
            title="Sortie longue"
            discipline="running"
            sessionType="Endurance"
            summary={["1 h 15 · Z2"]}
            readOnly
          />
        </div>
      </Block>

      <Block title="8. Feuille du bas et bouton +">
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="h-11 self-start rounded-[12px] bg-cta px-4 text-[14.5px] font-semibold text-on-cta"
        >
          Ouvrir la feuille
        </button>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Choisir le jour">
          <RadioList
            label="Appliquer ce jour à"
            value={day}
            onChange={setDay}
            options={[
              { value: "week", title: "Cette semaine" },
              { value: "phase", title: "Toute la phase Base" },
              { value: "none", title: "Sans jour" },
            ]}
          />
        </Sheet>
      </Block>

      <button type="button" aria-label="Ajouter une séance" className={phoneFabClass}>
        <Plus aria-hidden size={24} strokeWidth={2.2} />
      </button>
    </main>
  );
}
