"use client";

import { ArrowLeft, ChevronRight, Download, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { SettingsSection } from "@/components/blocks/settings-context";
import { barBackClass } from "@/components/layout/back-link";
import { MobileBarTitle } from "@/components/layout/mobile-bar";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { LogoutButton } from "@/components/ui/logout-button";
import { ThemeChoice } from "@/components/ui/theme-choice";
import type { SettingsData } from "@/features/coach/settings-data";
import { signOutEverywhere } from "@/features/coach/settings-actions";
import { removeCoachPhoto, uploadCoachPhoto, type PhotoState } from "@/features/photos/actions";

import { PhotoForm } from "../photo-form";
import { SECTIONS } from "./sections";
import {
  EmailForm,
  CountryCurrencyForm,
  NotificationToggles,
  OrganizationForm,
  PasswordForm,
  PreferencesForm,
  ProfileForm,
  VatRateForm,
} from "./settings-forms";

// Page complète des Paramètres, /coach/profil (D-57 ; lien partagé, rechargement). Cinq sections.
// Téléphone : un sommaire façon Réglages de l'iPhone, puis la section avec un retour. Ordinateur :
// le menu des sections à gauche, la section à droite ; chaque section a son adresse (?onglet=).
// La fenêtre ouverte depuis le menu du compte a sa propre mise en page (kit des boîtes, 33 :
// settings-dialog-panel.tsx) et partage le contenu des sections (SettingsSectionContent).
const pageHref = (section: SettingsSection | null) =>
  section ? `/coach/profil?onglet=${section}` : "/coach/profil";

// Lien de section (chaque section a son adresse).
function Go({
  to,
  className,
  current,
  children,
}: {
  to: SettingsSection | null;
  className: string;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={pageHref(to)}
      scroll={false}
      aria-current={current ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

export function SettingsPanel({
  data,
  section,
}: {
  data: SettingsData;
  section: SettingsSection | null;
}) {
  const shown: SettingsSection = section ?? "profil";
  const current = SECTIONS.find((item) => item.key === shown)!;

  // Photo : la page se recharge d'elle-même après un envoi ou un retrait.
  const upload = (previous: PhotoState, formData: FormData) => uploadCoachPhoto(previous, formData);
  const remove = async () => {
    await removeCoachPhoto();
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
      {/* Sommaire (téléphone, sans section choisie) et menu (ordinateur, toujours). */}
      <nav
        aria-label="Sections des paramètres"
        className={`flex flex-col gap-4 lg:sticky lg:top-0 ${section ? "max-lg:hidden" : ""}`}
      >
        <Go
          to="profil"
          className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2 active:duration-0 lg:hidden"
        >
          <Avatar name={data.displayName} photoPath={data.photoPath} size="lg" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-display text-[18px] font-semibold">
              {data.displayName}
            </span>
            <span className="truncate text-[13px] text-muted">{data.email}</span>
          </span>
          <ChevronRight aria-hidden size={18} strokeWidth={1.8} className="shrink-0 text-muted" />
        </Go>
        <ul className="flex flex-col overflow-hidden rounded-card border border-line bg-surface lg:gap-1 lg:border-0 lg:bg-transparent">
          {SECTIONS.map((item) => {
            const active = item.key === shown;
            return (
              <li key={item.key} className="border-t border-line first:border-t-0 lg:border-0">
                <Go
                  to={item.key}
                  current={active}
                  className={`flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-selected-hover active:bg-selected-hover active:duration-0 lg:min-h-11 lg:rounded-[12px] lg:px-3 lg:py-2 ${
                    active ? "lg:bg-selected lg:font-semibold" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-chip text-text"
                  >
                    <item.icon size={16} strokeWidth={1.8} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-medium">{item.label}</span>
                    <span className="truncate text-[12px] text-muted lg:hidden">{item.hint}</span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    size={16}
                    strokeWidth={1.8}
                    className="shrink-0 text-muted lg:hidden"
                  />
                </Go>
              </li>
            );
          })}
        </ul>
        <div className="lg:hidden">
          <LogoutButton />
        </div>
      </nav>

      <div className={`flex min-w-0 flex-col gap-4 ${section ? "" : "max-lg:hidden"}`}>
        {/* Téléphone, une section ouverte : « ← Paramètres » dans la barre du haut (D-117). */}
        {section ? (
          <MobileBarTitle>
            <Go to={null} className={barBackClass}>
              <ArrowLeft aria-hidden size={16} strokeWidth={1.8} className="shrink-0" />
              <span className="truncate">Paramètres</span>
            </Go>
          </MobileBarTitle>
        ) : null}
        <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em]">
          {current.label}
        </h2>

        <SettingsSectionContent shown={shown} data={data} upload={upload} remove={remove} />
      </div>
    </div>
  );
}

// Contenu de chaque section, partagé par la page /coach/profil et la fenêtre des Paramètres (qui
// remplace la section Profil par celle du kit, ProfileDialogSection).
export function SettingsSectionContent({
  shown,
  data,
  onChanged,
  upload,
  remove,
}: {
  shown: SettingsSection;
  data: SettingsData;
  onChanged?: () => void;
  upload: (previous: PhotoState, formData: FormData) => Promise<PhotoState>;
  remove: () => Promise<void>;
}) {
  return (
    <>
      {shown === "profil" ? (
        <>
          <Card id="settings-photo" title="Photo">
            <PhotoForm
              name={data.displayName}
              photoPath={data.photoPath}
              upload={upload}
              remove={remove}
            />
          </Card>
          <Card id="settings-identity" title="Identité">
            <ProfileForm values={data.profile} onSaved={onChanged} />
          </Card>
          <Card id="settings-organization" title="Organisation">
            <OrganizationForm
              organizationId={data.organization.id}
              name={data.organization.name}
              isOwner={data.organization.isOwner}
            />
          </Card>
        </>
      ) : null}

      {shown === "preferences" ? (
        <>
          <section
            id="theme"
            aria-labelledby="settings-theme-title"
            className="flex scroll-mt-6 flex-col gap-3.5 rounded-card border border-line bg-surface p-[18px]"
          >
            <div className="flex flex-col gap-1">
              <h4 id="settings-theme-title" className="text-block font-semibold">
                Thème
              </h4>
              <p className="text-caption text-muted">
                « Système » suit le réglage de ton téléphone ou de ton ordinateur. Retenu sur cet
                appareil.
              </p>
            </div>
            <div className="max-w-md">
              <ThemeChoice />
            </div>
          </section>
          <Card
            id="settings-defaults"
            title="Valeurs par défaut"
            subtitle="Pour ne pas retaper les mêmes infos à chaque séance : la fenêtre « Nouvelle séance » se remplit avec ces valeurs (tu peux toujours les changer). Et les heures affichées dans ton agenda."
          >
            <PreferencesForm values={data.preferences} />
          </Card>
          <Card
            id="settings-notifications"
            title="Notifications"
            subtitle="Ce qui compte dans la cloche et s'affiche dans Notifications. Rien n'est envoyé par e-mail ou WhatsApp pour l'instant."
          >
            <NotificationToggles values={data.notify} />
          </Card>
        </>
      ) : null}

      {shown === "argent" ? (
        <>
          <Card id="settings-country" title="Pays et devise">
            <CountryCurrencyForm
              organizationId={data.organization.id}
              country={data.organization.country}
              currency={data.organization.currency}
              isOwner={data.organization.isOwner}
              changes={data.currencyChanges}
              onChanged={onChanged}
            />
          </Card>
          {/* TVA (D-90) : un seul taux, sans règle d'aucun pays. Coory ne fait pas de factures. */}
          <Card
            id="settings-vat"
            title="TVA"
            subtitle="Pour le prix de tes séances et ton résultat hors TVA dans la Comptabilité. Tes factures se font dans ton logiciel de facturation ou chez ton comptable."
          >
            <VatRateForm
              organizationId={data.organization.id}
              vatRate={data.organization.vatRate}
              isOwner={data.organization.isOwner}
              onChanged={onChanged}
            />
          </Card>
        </>
      ) : null}

      {shown === "securite" ? (
        <>
          <Card id="settings-email" title="Adresse e-mail">
            <EmailForm current={data.email} />
          </Card>
          <Card id="settings-password" title="Mot de passe">
            <PasswordForm />
          </Card>
          <Card
            id="settings-devices"
            title="Appareils connectés"
            subtitle="Un téléphone perdu, un ordinateur partagé : déconnecte tous tes appareils d'un coup, celui-ci compris."
          >
            <div className="flex flex-wrap items-center gap-3">
              <form action={signOutEverywhere}>
                <ConfirmSubmitButton
                  title="Déconnecter tous les appareils ?"
                  message="Tu devras te reconnecter partout, y compris ici."
                  confirmLabel="Déconnecter partout"
                  icon="logout"
                  className={buttonClass({ variant: "outline" })}
                >
                  <LogOut aria-hidden size={16} strokeWidth={1.8} />
                  Déconnecter partout
                </ConfirmSubmitButton>
              </form>
              <LogoutButton />
            </div>
          </Card>
        </>
      ) : null}

      {shown === "donnees" ? (
        <Card
          id="settings-export"
          title="Exporter mes données"
          subtitle="Un fichier JSON avec tout ce que contient ton organisation : sportifs, objectifs, séances, programmes, paiements, factures, tâches, messages, notes et structures. Utile pour une sauvegarde ou pour changer d'outil."
        >
          <div>
            <a href="/coach/profil/export" download className={buttonClass({ variant: "inverse" })}>
              <Download aria-hidden size={16} strokeWidth={1.8} />
              Télécharger mes données
            </a>
          </div>
          <p className="text-caption text-muted">
            Il contient des données de santé (blessures notées avec l&apos;accord des sportifs) :
            garde-le en lieu sûr.
          </p>
        </Card>
      ) : null}
    </>
  );
}
