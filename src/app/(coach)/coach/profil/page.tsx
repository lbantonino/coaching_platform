import {
  ArrowLeft,
  ChevronRight,
  Download,
  Landmark,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { DeleteMoreMenu } from "@/components/blocks/more-menu";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardEmpty } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { LogoutButton } from "@/components/ui/logout-button";
import { ThemeChoice } from "@/components/ui/theme-choice";
import {
  formatEnterpriseNumber,
  formatIban,
  legalFormLabels,
  vatStatusLabels,
} from "@/domain/billing/legal";
import { requireCoach } from "@/features/auth/guards";
import { listLegalEntities, type LegalEntity } from "@/features/coach/legal-queries";
import { getCoachProfile } from "@/features/coach/profile";
import { deleteLegalEntity, signOutEverywhere } from "@/features/coach/settings-actions";
import { removeCoachPhoto, uploadCoachPhoto } from "@/features/photos/actions";

import { PhotoForm } from "../photo-form";
import { LegalEntityButton } from "./legal-entity-sheet";
import {
  EmailForm,
  NotificationToggles,
  OrganizationForm,
  PasswordForm,
  PreferencesForm,
  ProfileForm,
} from "./settings-forms";

export const metadata: Metadata = {
  title: "Paramètres",
};

// Paramètres du coach (D-57, demande d'Antonino : « complet, comme une vraie app »). Cinq sections,
// chacune à une adresse (?onglet=) : le bouton retour et le partage marchent.
// Téléphone : un sommaire façon Réglages de l'iPhone (une ligne par section), puis la section avec un
// retour. Ordinateur : le menu des sections reste à gauche, la section à droite (Profil d'abord).
const SECTIONS = [
  { key: "profil", label: "Profil", hint: "Photo, nom, entreprise, organisation", icon: UserRound },
  {
    key: "preferences",
    label: "Préférences",
    hint: "Thème, séances par défaut, agenda, notifications",
    icon: SlidersHorizontal,
  },
  {
    key: "facturation",
    label: "Facturation et légal",
    hint: "Tes structures : TVA, adresse, IBAN",
    icon: Landmark,
  },
  {
    key: "securite",
    label: "Sécurité",
    hint: "E-mail, mot de passe, appareils",
    icon: ShieldCheck,
  },
  { key: "donnees", label: "Données", hint: "Exporter toutes tes données", icon: Download },
] as const satisfies readonly { key: string; label: string; hint: string; icon: LucideIcon }[];

type SectionKey = (typeof SECTIONS)[number]["key"];
const sectionSchema = z.enum(
  SECTIONS.map((section) => section.key) as [SectionKey, ...SectionKey[]],
);

export default function CoachSettingsPage({ searchParams }: PageProps<"/coach/profil">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => {
          const parsed = sectionSchema.safeParse(query.onglet);
          return <Settings section={parsed.success ? parsed.data : null} />;
        })}
      </Suspense>
    </main>
  );
}

const priceText = (cents: number | null) =>
  cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");

async function Settings({ section }: { section: SectionKey | null }) {
  const { user, memberships } = await requireCoach();
  const membership = memberships[0];
  const [profile, entities] = await Promise.all([
    getCoachProfile(user),
    listLegalEntities(membership.organizationId),
  ]);
  const shown: SectionKey = section ?? "profil";
  const current = SECTIONS.find((item) => item.key === shown)!;

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Ton compte, tes préférences et tes structures." />
      <PageBody>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          {/* Sommaire (téléphone, sans section choisie) et menu (ordinateur, toujours). */}
          <nav
            aria-label="Sections des paramètres"
            className={`flex flex-col gap-4 lg:sticky lg:top-6 ${section ? "max-lg:hidden" : ""}`}
          >
            <Link
              href="/coach/profil?onglet=profil"
              className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2 active:duration-0 lg:hidden"
            >
              <Avatar name={profile.displayName} photoPath={profile.photoPath} size="lg" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-display text-[18px] font-semibold">
                  {profile.displayName}
                </span>
                <span className="truncate text-[13px] text-muted">{user.email}</span>
              </span>
              <ChevronRight
                aria-hidden
                size={18}
                strokeWidth={1.8}
                className="shrink-0 text-muted"
              />
            </Link>
            <ul className="flex flex-col overflow-hidden rounded-card border border-line bg-surface lg:gap-1 lg:border-0 lg:bg-transparent">
              {SECTIONS.map((item) => {
                const active = item.key === shown;
                return (
                  <li key={item.key} className="border-t border-line first:border-t-0 lg:border-0">
                    <Link
                      href={`/coach/profil?onglet=${item.key}`}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2 active:duration-0 lg:min-h-11 lg:rounded-[12px] lg:px-3 lg:py-2 ${
                        active ? "lg:bg-surface-2 lg:font-semibold" : ""
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
                        <span className="truncate text-[12px] text-muted lg:hidden">
                          {item.hint}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden
                        size={16}
                        strokeWidth={1.8}
                        className="shrink-0 text-muted lg:hidden"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="lg:hidden">
              <LogoutButton />
            </div>
          </nav>

          <div className={`flex min-w-0 flex-col gap-4 ${section ? "" : "max-lg:hidden"}`}>
            <Link
              href="/coach/profil"
              className="inline-flex min-h-11 w-fit items-center gap-1.5 text-[14px] font-medium text-muted hover:text-text lg:hidden"
            >
              <ArrowLeft aria-hidden size={16} strokeWidth={1.8} />
              Paramètres
            </Link>
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em]">
              {current.label}
            </h2>

            {shown === "profil" ? (
              <>
                <Card id="settings-photo" title="Photo">
                  <PhotoForm
                    name={profile.displayName}
                    photoPath={profile.photoPath}
                    upload={uploadCoachPhoto}
                    remove={removeCoachPhoto}
                  />
                </Card>
                <Card id="settings-identity" title="Identité">
                  <ProfileForm
                    values={{
                      firstName: profile.firstName ?? "",
                      lastName: profile.lastName ?? "",
                      companyName: profile.companyName ?? "",
                      phone: profile.phone ?? "",
                    }}
                  />
                </Card>
                <Card id="settings-organization" title="Organisation">
                  <OrganizationForm
                    organizationId={membership.organizationId}
                    name={membership.organizationName}
                    isOwner={membership.role === "owner"}
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
                    <h3 id="settings-theme-title" className="text-block font-semibold">
                      Thème
                    </h3>
                    <p className="text-caption text-muted">
                      « Système » suit le réglage de ton téléphone ou de ton ordinateur. Retenu sur
                      cet appareil.
                    </p>
                  </div>
                  <div className="max-w-md">
                    <ThemeChoice />
                  </div>
                </section>
                <Card id="settings-defaults" title="Séances et agenda">
                  <PreferencesForm
                    values={{
                      defaultSessionMinutes: String(profile.preferences.defaultSessionMinutes),
                      defaultLocation: profile.preferences.defaultLocation ?? "",
                      defaultPrice: priceText(profile.preferences.defaultPriceCents),
                      defaultPaymentMethod: profile.preferences.defaultPaymentMethod,
                      agendaFirstHour: String(profile.preferences.agendaFirstHour),
                      agendaLastHour: String(profile.preferences.agendaLastHour),
                    }}
                  />
                </Card>
                <Card
                  id="settings-notifications"
                  title="Notifications"
                  subtitle="Ce qui compte dans la cloche et s'affiche dans Notifications. Rien n'est envoyé par e-mail ou WhatsApp pour l'instant."
                >
                  <NotificationToggles values={profile.preferences.notify} />
                </Card>
              </>
            ) : null}

            {shown === "facturation" ? (
              <>
                <p className="text-small text-muted">
                  Une structure par activité : par exemple ton activité d&apos;indépendant et ton
                  ASBL. Tes factures prendront les infos de la structure choisie. Règles à faire
                  valider par ton comptable (TVA, mentions).
                </p>
                {entities.length === 0 ? (
                  <Card>
                    <CardEmpty icon={Landmark}>
                      Aucune structure pour l&apos;instant. Ajoute la première : elle sera la
                      structure par défaut.
                    </CardEmpty>
                  </Card>
                ) : (
                  <ul aria-label="Structures légales" className="flex flex-col gap-4">
                    {entities.map((entity) => (
                      <li key={entity.id}>
                        <LegalEntityCard
                          organizationId={membership.organizationId}
                          entity={entity}
                        />
                      </li>
                    ))}
                  </ul>
                )}
                <div>
                  <LegalEntityButton organizationId={membership.organizationId} />
                </div>
              </>
            ) : null}

            {shown === "securite" ? (
              <>
                <Card id="settings-email" title="Adresse e-mail">
                  <EmailForm current={user.email ?? ""} />
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
                  <a
                    href="/coach/profil/export"
                    download
                    className={buttonClass({ variant: "inverse" })}
                  >
                    <Download aria-hidden size={16} strokeWidth={1.8} />
                    Télécharger mes données
                  </a>
                </div>
                <p className="text-caption text-muted">
                  Il contient des données de santé (blessures notées avec l&apos;accord des
                  sportifs) : garde-le en lieu sûr.
                </p>
              </Card>
            ) : null}
          </div>
        </div>
      </PageBody>
    </>
  );
}

function LegalEntityCard({
  organizationId,
  entity,
}: {
  organizationId: string;
  entity: LegalEntity;
}) {
  const rows: [string, string | null][] = [
    ["Forme", legalFormLabels[entity.legalForm]],
    [
      "N° d'entreprise",
      entity.enterpriseNumber ? formatEnterpriseNumber(entity.enterpriseNumber) : null,
    ],
    [
      "TVA",
      entity.vatNumber
        ? `${vatStatusLabels[entity.vatStatus]} · BE${formatEnterpriseNumber(entity.vatNumber.slice(2))}`
        : vatStatusLabels[entity.vatStatus],
    ],
    [
      "Adresse",
      [
        entity.addressLine,
        [entity.postalCode, entity.city].filter(Boolean).join(" "),
        entity.country,
      ]
        .filter(Boolean)
        .join(", ") || null,
    ],
    [
      "IBAN",
      entity.iban ? `${formatIban(entity.iban)}${entity.bic ? ` · ${entity.bic}` : ""}` : null,
    ],
    ["Facturation", entity.billingEmail],
    ["Factures", `${entity.invoicePrefix}-${new Date().getFullYear()}-001, -002…`],
  ];
  return (
    <section
      aria-label={entity.name}
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-[18px]"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="truncate text-block font-semibold">{entity.name}</h3>
          {entity.isDefault ? (
            <span className="w-fit">
              <Badge tone="ok">Par défaut</Badge>
            </span>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <LegalEntityButton
            organizationId={organizationId}
            entityId={entity.id}
            label={entity.name}
            values={{
              name: entity.name,
              legalForm: entity.legalForm,
              enterpriseNumber: entity.enterpriseNumber
                ? formatEnterpriseNumber(entity.enterpriseNumber)
                : "",
              vatStatus: entity.vatStatus,
              addressLine: entity.addressLine ?? "",
              postalCode: entity.postalCode ?? "",
              city: entity.city ?? "",
              country: entity.country,
              iban: entity.iban ? formatIban(entity.iban) : "",
              bic: entity.bic ?? "",
              billingEmail: entity.billingEmail ?? "",
              invoicePrefix: entity.invoicePrefix,
              legalMentions: entity.legalMentions ?? "",
              isDefault: entity.isDefault,
            }}
          />
          <DeleteMoreMenu
            menuTitle={entity.name}
            action={deleteLegalEntity.bind(null, organizationId, entity.id)}
            confirmTitle="Supprimer cette structure ?"
            confirmText="Ses infos disparaissent des paramètres. Les factures déjà faites ne changent pas."
          />
        </span>
      </header>
      <dl className="flex flex-col text-small">
        {rows
          .filter((row): row is [string, string] => row[1] !== null)
          .map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 border-t border-line py-2 sm:flex-row sm:gap-3"
            >
              <dt className="shrink-0 text-muted sm:w-36">{label}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
      </dl>
      {entity.legalMentions ? (
        <p className="text-caption text-muted">{entity.legalMentions}</p>
      ) : null}
    </section>
  );
}
