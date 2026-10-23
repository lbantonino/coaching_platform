"use client";

import { Copy, Pencil, Send, Trash2, Users } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { buttonClass } from "@/components/ui/button";
import { MicroLabel } from "@/components/ui/card";
import { Checkbox, Toggle } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { inputClass, textareaClass } from "@/components/ui/form-styles";
import { ActionMenu, ConfirmDialog, Sheet } from "@/components/ui/overlay";
import { PasswordGauge, PasswordInput } from "@/components/ui/password-input";
import { Stepper } from "@/components/ui/page-tabs";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { SkeletonLines } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

// Parties interactives de la vitrine : champs, contrôles, onglets et fenêtres (feuille du bas,
// menu « ••• », confirmation, toast). Chaque colonne de thème a son propre état.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5 rounded-card border border-line bg-bg p-4 md:p-[22px]">
      <MicroLabel>{title}</MicroLabel>
      {children}
    </section>
  );
}

export function InteractiveDemos() {
  const [password, setPassword] = useState("Behybrid2026");
  const [shown, setShown] = useState(false);
  const [tab, setTab] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const viewName = useId();
  const tabs = ["Vue d'ensemble", "Profil", "Objectifs", "Repères"];

  return (
    <>
      <Section title="Champs">
        <div className="grid gap-3.5 md:grid-cols-2">
          <Field id="demo-email" label="Adresse e-mail">
            <input
              id="demo-email"
              type="email"
              defaultValue="gianluca@behybrid.be"
              className={inputClass}
            />
          </Field>
          <Field id="demo-phone" label="Téléphone" optional>
            <input
              id="demo-phone"
              type="tel"
              placeholder="+32 470 00 00 00"
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field id="demo-password" label="Mot de passe">
            <PasswordInput
              id="demo-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              shown={shown}
              onToggle={() => setShown(!shown)}
            />
            <PasswordGauge password={password} />
          </Field>
          <Field id="demo-first-name" label="Prénom" error="Indique ton prénom.">
            <input
              id="demo-first-name"
              aria-invalid
              aria-describedby="demo-first-name-error"
              className={inputClass}
            />
          </Field>
          <Field id="demo-note" label="Note" optional>
            <textarea
              id="demo-note"
              placeholder="Ex. : prévoir chronos et plots"
              className={textareaClass}
            />
          </Field>
          <div className="flex flex-col justify-end gap-1">
            <Checkbox label="J'accepte les conditions d'utilisation" defaultChecked />
            <Toggle label="Chaque semaine" defaultChecked />
          </div>
        </div>
      </Section>

      <Section title="Onglets">
        <div className="flex gap-6 overflow-x-auto border-b border-line text-[15px]">
          {tabs.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setTab(index)}
              aria-pressed={tab === index}
              className={`-mb-px h-11 shrink-0 border-b-2 px-0.5 whitespace-nowrap ${
                tab === index
                  ? "border-accent font-medium text-text"
                  : "border-transparent text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={segmentedGroupClass}>
          {["Jour", "Semaine", "Mois"].map((label) => (
            <label key={label} className="flex-1 cursor-pointer sm:flex-none">
              <input
                type="radio"
                name={viewName}
                defaultChecked={label === "Semaine"}
                className="peer sr-only"
              />
              <span className={segmentedItemClass}>{label}</span>
            </label>
          ))}
        </div>
        <Stepper steps={["Sportif", "Objectifs", "Calendrier", "Départ", "Aperçu"]} current={2} />
      </Section>

      <Section title="Fenêtres · toast · chargement">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className={buttonClass({ variant: "outline" })}
          >
            Feuille du bas
          </button>
          <button
            type="button"
            onClick={() => setMenu(true)}
            className={buttonClass({ variant: "outline" })}
          >
            Menu •••
          </button>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className={buttonClass({ variant: "outline" })}
          >
            Confirmation
          </button>
          <button
            type="button"
            onClick={() => toast("Tâche terminée.")}
            className={buttonClass({ variant: "outline" })}
          >
            Toast
          </button>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1600);
            }}
            disabled={loading}
            className={buttonClass()}
          >
            {loading ? (
              <>
                <Spinner />
                Connexion…
              </>
            ) : (
              "Bouton qui charge"
            )}
          </button>
        </div>
      </Section>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Nouvelle séance"
        subtitle="Collective ou individuelle"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSheet(false)}
              className={buttonClass({ variant: "outline" })}
            >
              Annuler
            </button>
            <button type="button" onClick={() => setSheet(false)} className={buttonClass()}>
              Créer la séance
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="sheet-title" label="Titre">
            <input id="sheet-title" defaultValue="Behybrid on Tracks" className={inputClass} />
          </Field>
          <Field id="sheet-place" label="Lieu" optional>
            <input
              id="sheet-place"
              placeholder="Ex. : Piste d'athlétisme, salle, parc"
              className={inputClass}
            />
          </Field>
        </div>
      </Sheet>
      <ActionMenu
        open={menu}
        onClose={() => setMenu(false)}
        title="Inès Benali"
        items={[
          { label: "Inviter", icon: Send, onSelect: () => toast("Invitation prête.") },
          { label: "Modifier", icon: Pencil, onSelect: () => {} },
          { label: "Dupliquer", icon: Copy, onSelect: () => {} },
          { label: "Supprimer", icon: Trash2, onSelect: () => setConfirm(true), destructive: true },
        ]}
      />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          toast("Supprimé.");
        }}
        title="Supprimer ce sportif ?"
        confirmLabel="Supprimer"
      >
        Sa fiche, ses objectifs et ses repères seront effacés. Cette action est définitive.
      </ConfirmDialog>
    </>
  );
}

export function StaticStates() {
  return (
    <>
      <EmptyState
        icon={Users}
        title="Ajoute ton premier sportif"
        action={
          <span className={buttonClass({ variant: "outline", size: "sm", className: "h-10" })}>
            + Nouveau sportif
          </span>
        }
      >
        Il apparaîtra ici avec ses objectifs.
      </EmptyState>
      <SkeletonLines />
      <ErrorState />
    </>
  );
}
