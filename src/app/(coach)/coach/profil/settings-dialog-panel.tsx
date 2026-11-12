"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useId, useState } from "react";

import type { SettingsSection } from "@/components/blocks/settings-context";
import type { SettingsData } from "@/features/coach/settings-data";
import { removeCoachPhoto, uploadCoachPhoto, type PhotoState } from "@/features/photos/actions";

import { PhotoForm } from "../photo-form";
import { SECTIONS } from "./sections";
import { ProfileDialogSection } from "./settings-forms";
import {
  DataSection,
  LegalSection,
  MoneySection,
  moneySummary,
  PreferencesSection,
  SecuritySection,
} from "./settings-sections";

// Fenêtre des Paramètres, kit « Coory Pages », page 13 (D-127), sans adresse à elle (décision 5
// d'Antonino : /coach/profil?onglet=… l'ouvre par-dessus le tableau de bord).
// - Ordinateur (fenêtre de 1 000 × 690) : la colonne des rubriques à gauche (260 px, fond gris pâle :
//   pastille d'icône de 32 px, nom et ligne courte ; rubrique choisie sur fond blanc), la rubrique à
//   droite : en-tête fixe (titre, phrase, Fermer), cartes qui défilent, pied « Enregistrer » fixe.
// - Téléphone (plein écran, décision 6) : « × Paramètres », puis un menu déroulant des rubriques à
//   la place du sommaire, la phrase de la rubrique et ses cartes ; barre fixe « Enregistrer ».
// La rubrique Profil (ProfileDialogSection) n'est pas modifiée : seule son entrée dans le menu prend
// le style des autres.
const intros: Partial<Record<SettingsSection, string>> = {
  profil: "Ce que tes sportifs voient de toi.",
};

// Ligne courte de chaque rubrique dans le menu (kit).
function menuHint(section: SettingsSection, data: SettingsData) {
  if (section === "argent") return moneySummary(data);
  return SECTIONS.find((item) => item.key === section)!.short;
}

export function SettingsDialogPanel({
  data,
  section,
  onSection,
  onChanged,
  onClose,
}: {
  data: SettingsData;
  // null : la rubrique Profil.
  section: SettingsSection | null;
  onSection: (section: SettingsSection) => void;
  onChanged: () => void;
  onClose: () => void;
}) {
  const shown: SettingsSection = section ?? "profil";
  const current = SECTIONS.find((item) => item.key === shown)!;
  const intro = intros[shown] ?? current.hint;
  // Photo : après un envoi ou un retrait, la fenêtre relit ses données.
  const upload = async (previous: PhotoState, formData: FormData) => {
    const result = await uploadCoachPhoto(previous, formData);
    if (result.saved) onChanged();
    return result;
  };
  const remove = async () => {
    await removeCoachPhoto();
    onChanged();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)]">
      {/* Ordinateur : la colonne des rubriques. */}
      <div className="hidden min-h-0 flex-col border-r border-dlg-divider bg-dlg-nav px-3.5 py-6 md:flex">
        <h2 className="px-2.5 pb-4 text-[20px] leading-[normal] font-bold tracking-[-0.01em]">
          Paramètres
        </h2>
        <nav aria-label="Sections des paramètres">
          <ul className="flex flex-col gap-1">
            {SECTIONS.map((item) => {
              const active = item.key === shown;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => onSection(item.key)}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-[background-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      active ? "bg-dlg shadow-[0_1px_3px_rgba(22,18,40,0.08)]" : "hover:bg-dlg-tile"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid size-8 shrink-0 place-items-center rounded-[9px] ${
                        active ? "bg-status-accent-soft text-violet-text" : "bg-dlg text-muted"
                      }`}
                    >
                      <item.icon size={16} strokeWidth={1.8} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-px">
                      <span className="truncate text-[13.5px] leading-[normal] font-semibold text-text">
                        {item.label}
                      </span>
                      <span className="truncate text-[11.5px] leading-[normal] text-faint">
                        {menuHint(item.key, data)}
                      </span>
                    </span>
                    {"isNew" in item && item.isNew ? <NewBadge /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* La rubrique. `relative` : la barre « Enregistrer » du téléphone s'y pose en bas. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Téléphone : « × Paramètres », puis le menu des rubriques. */}
        <div className="flex shrink-0 items-center gap-2.5 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2.5 md:hidden">
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-surface text-text transition-[scale,background-color] duration-150 active:scale-95 active:bg-surface-2"
          >
            <X aria-hidden size={18} strokeWidth={2} />
          </button>
          <h2 className="text-[20px] leading-[normal] font-bold tracking-[-0.01em]">Paramètres</h2>
        </div>
        <SectionPicker shown={shown} data={data} onSection={onSection} />

        {/* Ordinateur : en-tête fixe de la rubrique. */}
        <div className="hidden shrink-0 items-start gap-3 border-b border-dlg-divider pt-[22px] pr-6 pb-4 pl-7 md:flex">
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <h3 className="text-[20px] leading-[normal] font-bold tracking-[-0.01em]">
              {current.label}
            </h3>
            <p className="text-[13px] leading-[normal] text-muted">{intro}</p>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-dlg-tile text-text transition-[scale,background-color] duration-150 hover:bg-dlg-tile-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
          >
            <X aria-hidden size={16} strokeWidth={2} />
          </button>
        </div>
        {/* Téléphone : le nom de la rubrique pour les lecteurs d'écran (il est écrit dans le menu). */}
        <h3 className="sr-only md:hidden">{current.label}</h3>

        {shown === "profil" ? (
          <>
            <p className="shrink-0 px-[22px] pb-3 text-[13.5px] leading-[1.45] text-muted md:hidden">
              {intro}
            </p>
            <ProfileDialogSection
              key={data.organization.id}
              values={data.profile}
              organization={data.organization}
              onSaved={onChanged}
              onCancel={onClose}
              photo={
                <PhotoForm
                  name={data.displayName}
                  photoPath={data.photoPath}
                  upload={upload}
                  remove={remove}
                  look="dialog"
                />
              }
            />
          </>
        ) : shown === "preferences" ? (
          <PreferencesSection
            values={data.preferences}
            notify={data.notify}
            intro={intro}
            onChanged={onChanged}
            onClose={onClose}
          />
        ) : shown === "argent" ? (
          <MoneySection
            key={data.organization.country}
            data={data}
            intro={intro}
            onChanged={onChanged}
            onClose={onClose}
          />
        ) : shown === "securite" ? (
          <SecuritySection email={data.email} intro={intro} />
        ) : shown === "legal" ? (
          <LegalSection intro={intro} />
        ) : (
          <DataSection intro={intro} />
        )}
      </div>
    </div>
  );
}

// Pastille « Nouveau » d'une rubrique ajoutée (onglet Légal, maquette du 06/11/2026).
function NewBadge() {
  return (
    <span className="shrink-0 rounded-[6px] bg-accent px-[7px] py-[3px] text-[10.5px] leading-[normal] font-bold text-on-accent">
      Nouveau
    </span>
  );
}

// Téléphone : le menu déroulant des rubriques (kit, validé le 04/11) : un bouton de 56 px (pastille
// violette, rubrique, ligne courte, chevron qui pivote), le menu juste dessous, ✓ sur la rubrique
// choisie. Échap ou un toucher à côté le referme sans fermer la fenêtre.
function SectionPicker({
  shown,
  data,
  onSection,
}: {
  shown: SettingsSection;
  data: SettingsData;
  onSection: (section: SettingsSection) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const current = SECTIONS.find((item) => item.key === shown)!;
  return (
    <div
      className="relative z-20 shrink-0 px-4 pb-3 md:hidden"
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          // Échap : le menu d'abord, la fenêtre ensuite.
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-full items-center gap-3 rounded-[15px] bg-surface px-3.5 text-left transition-[background-color] duration-150 active:bg-surface-2"
      >
        <span
          aria-hidden
          className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-status-accent-soft text-violet-text"
        >
          <current.icon size={16} strokeWidth={1.8} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-[15px] leading-[normal] font-semibold text-text">
            {current.label}
          </span>
          <span className="truncate text-[12.5px] leading-[normal] text-faint">
            {menuHint(shown, data)}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          size={16}
          strokeWidth={2}
          className={`shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <>
          {/* Toucher à côté du menu : il se referme. */}
          <span aria-hidden onClick={() => setOpen(false)} className="fixed inset-0" />
          <nav
            id={menuId}
            aria-label="Sections des paramètres"
            className="absolute inset-x-4 top-[62px] rounded-[16px] bg-surface p-1.5 shadow-[0_18px_40px_-12px_rgba(22,18,40,0.35),0_0_0_1px_rgba(22,18,40,0.06)]"
          >
            <ul className="flex flex-col">
              {SECTIONS.map((item) => {
                const active = item.key === shown;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        onSection(item.key);
                        setOpen(false);
                      }}
                      className="flex min-h-12 w-full items-center gap-3 rounded-[11px] px-3 text-left transition-[background-color] duration-150 active:bg-surface-2"
                    >
                      <item.icon
                        aria-hidden
                        size={16}
                        strokeWidth={1.8}
                        className={`shrink-0 ${active ? "text-violet-text" : "text-muted"}`}
                      />
                      <span className="min-w-0 flex-1 truncate text-[14.5px] leading-[normal] font-medium text-text">
                        {item.label}
                      </span>
                      {active ? (
                        <Check
                          aria-hidden
                          size={15}
                          strokeWidth={2.6}
                          className="shrink-0 text-violet-text"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      ) : null}
    </div>
  );
}
