"use client";

import { ArrowLeft, ChevronRight, LogOut, X } from "lucide-react";

import type { SettingsSection } from "@/components/blocks/settings-context";
import { Avatar } from "@/components/ui/avatar";
import { DialogIconButton } from "@/components/ui/overlay";
import type { SettingsData } from "@/features/coach/settings-data";
import { logout } from "@/features/auth/actions";
import { removeCoachPhoto, uploadCoachPhoto, type PhotoState } from "@/features/photos/actions";

import { PhotoForm } from "../photo-form";
import { SECTIONS } from "./sections";
import { ProfileDialogSection } from "./settings-forms";
import { SettingsSectionContent } from "./settings-panel";

// Fenêtre des Paramètres (kit des boîtes, 33). Ordinateur : 1000 × 700, colonne des sections à gauche
// (250 px, fond gris clair, filet à droite), section à droite avec son titre, son corps qui défile et,
// pour le Profil, un pied « Annuler / Enregistrer ». Téléphone : un sommaire (carte du profil en
// violet pâle, liste encadrée des sections avec leur description, « Se déconnecter »), puis chaque
// section avec un retour. La page /coach/profil garde sa propre mise en page (SettingsPanel).
const intros: Partial<Record<SettingsSection, string>> = {
  profil: "Ce que tes sportifs voient de toi.",
};

export function SettingsDialogPanel({
  data,
  section,
  onSection,
  onChanged,
  onClose,
}: {
  data: SettingsData;
  // null : le sommaire sur téléphone, la section Profil sur ordinateur.
  section: SettingsSection | null;
  onSection: (section: SettingsSection | null) => void;
  onChanged: () => void;
  onClose: () => void;
}) {
  const shown: SettingsSection = section ?? "profil";
  const current = SECTIONS.find((item) => item.key === shown)!;
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
  const close = (
    <DialogIconButton label="Fermer" onClick={onClose}>
      <X aria-hidden size={17} strokeWidth={2} />
    </DialogIconButton>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[250px_minmax(0,1fr)]">
      {/* Colonne des sections (ordinateur) ; sommaire (téléphone, sans section choisie). */}
      <div
        className={`min-h-0 flex-1 flex-col md:flex md:border-r md:border-dlg-divider md:bg-dlg-nav md:px-3.5 md:py-6 ${
          section ? "max-md:hidden" : "flex"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 pb-1 md:mb-1 md:block md:p-0">
          <h2 className="text-[22px] leading-[normal] font-bold tracking-[-0.02em] md:px-2.5 md:pb-4 md:text-[20px]">
            Paramètres
          </h2>
          <span className="md:hidden">{close}</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain px-4 pt-3.5 pb-6 md:gap-1 md:overflow-visible md:p-0">
          <button
            type="button"
            onClick={() => onSection("profil")}
            className="flex items-center gap-3.5 rounded-[20px] bg-dlg-accent-soft p-4 text-left transition-[background-color] duration-150 md:hidden"
          >
            <span className="inline-flex shrink-0 rounded-full ring-2 ring-violet">
              <Avatar name={data.displayName} photoPath={data.photoPath} size="card" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-[17px] leading-[normal] font-bold">
                {data.displayName}
              </span>
              <span className="truncate text-[13.5px] leading-[normal] text-muted">
                {data.email}
              </span>
            </span>
            <ChevronRight
              aria-hidden
              size={18}
              strokeWidth={2}
              className="shrink-0 text-dlg-faint"
            />
          </button>
          <nav aria-label="Sections des paramètres">
            <ul className="flex flex-col overflow-hidden rounded-[20px] border border-dlg-field-line md:gap-1 md:overflow-visible md:rounded-none md:border-0">
              {SECTIONS.map((item) => {
                const active = item.key === shown;
                return (
                  <li key={item.key} className="group/section">
                    <button
                      type="button"
                      onClick={() => onSection(item.key)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[68px] w-full items-center gap-3.5 border-t border-dlg-divider px-3.5 py-2.5 text-left group-first/section:border-t-0 md:border-0 transition-[background-color,color] duration-150 md:h-[46px] md:min-h-0 md:gap-3 md:rounded-[12px] md:px-2.5 md:py-0 ${
                        active
                          ? "md:bg-dlg md:text-dlg-accent-ink"
                          : "md:text-dlg-ink-2 md:hover:bg-dlg-tile"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-dlg-tile md:size-auto md:bg-transparent"
                      >
                        <item.icon size={19} strokeWidth={1.8} className="md:size-[18px]" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[15.5px] leading-[normal] font-semibold md:text-[14.5px]">
                          {item.label}
                        </span>
                        <span className="truncate text-[13px] leading-[normal] text-muted md:hidden">
                          {item.hint}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden
                        size={18}
                        strokeWidth={2}
                        className="shrink-0 text-dlg-chev md:hidden"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <form action={logout} className="md:hidden">
            <button
              type="submit"
              className="flex h-[52px] w-full items-center justify-center gap-[9px] rounded-[14px] border border-dlg-danger-line text-[15px] leading-[normal] font-semibold text-dlg-danger-ink transition-[background-color] duration-150 hover:bg-dlg-danger-soft"
            >
              <LogOut aria-hidden size={17} strokeWidth={1.9} />
              Se déconnecter
            </button>
          </form>
        </div>
      </div>

      {/* La section : sur téléphone, seulement quand elle est choisie. */}
      <div className={`min-h-0 flex-1 flex-col md:flex ${section ? "flex" : "max-md:hidden"}`}>
        <div className="flex shrink-0 items-start gap-3 pt-2.5 pr-[18px] pb-1.5 pl-5 md:items-center md:justify-between md:px-6 md:pt-[22px]">
          <span className="md:hidden">
            <DialogIconButton label="Paramètres" onClick={() => onSection(null)}>
              <ArrowLeft aria-hidden size={18} strokeWidth={2} />
            </DialogIconButton>
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1 max-md:pt-1.5">
            <h3 className="text-[21px] leading-[1.2] font-bold tracking-[-0.02em] md:text-[19px] md:leading-[normal] md:tracking-normal">
              {current.label}
            </h3>
            <p className="text-[14px] leading-[normal] text-muted">
              {intros[shown] ?? current.hint}
            </p>
          </div>
          {close}
        </div>
        {shown === "profil" ? (
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
        ) : (
          <div
            data-dialog-body
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pt-3.5 pb-6 md:px-6 md:py-4"
          >
            <SettingsSectionContent
              shown={shown}
              data={data}
              onChanged={onChanged}
              upload={upload}
              remove={remove}
            />
          </div>
        )}
      </div>
    </div>
  );
}
