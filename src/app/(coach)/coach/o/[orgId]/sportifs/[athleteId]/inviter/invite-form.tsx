"use client";

import { Check, Clock, Link2Off, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState, type ReactNode } from "react";

import { Avatar } from "@/components/ui/avatar";
import { MobileActionBar, mobileActionPrimaryClass } from "@/components/ui/mobile-action-bar";
import { ConfirmDialog } from "@/components/ui/overlay";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { useToast } from "@/components/ui/toast";
import { createInvitation, type CreateInvitationState } from "@/features/invitations/actions";

// Carte « Inviter » (kit « Coory Pages », page 09, D-119). La génération, la révocation et le lien
// unique sont ceux d'avant (actions serveur inchangées) ; s'ajoutent le partage par WhatsApp, e-mail
// ou SMS (simples liens qui ouvrent l'app du coach avec un message prérempli : Coory n'envoie rien),
// une confirmation avant de révoquer ou de remplacer un lien, et « Voir la fiche » / « Envoyer un
// message » une fois le compte activé. Ordinateur : l'action dans la carte ; téléphone : l'action
// principale dans la barre fixe du bas.

const initialState: CreateInvitationState = { error: null, link: null, expiresAt: null };

// Une action de la carte : un bouton (act) ou un lien (href).
type Act = "copy" | "generate" | "revoke";
type Item = { label: string; act?: Act; href?: string; disabled?: boolean; danger?: boolean };

type Athlete = {
  id: string;
  firstName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  sex: "female" | "male" | null;
  photoPath: string | null;
};

type Props = {
  organizationId: string;
  athlete: Athlete;
  hasAccount: boolean;
  pendingInvite: { expiresAt: string; expired: boolean } | null;
  fichePath: string;
  revoke: () => Promise<void>;
  // Durée de validité d'un lien (7 jours, côté serveur).
  validityDays: number;
};

const zone = { timeZone: "Europe/Brussels" } as const;
const dayShort = new Intl.DateTimeFormat("fr-BE", { ...zone, day: "numeric", month: "short" });
const dayLong = new Intl.DateTimeFormat("fr-BE", {
  ...zone,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const time = new Intl.DateTimeFormat("fr-BE", { ...zone, hour: "2-digit", minute: "2-digit" });
const longDateTime = (iso: string) =>
  `${dayLong.format(new Date(iso))} à ${time.format(new Date(iso))}`;

// Message prérempli (texte validé par Antonino le 04/11).
const shareText = (firstName: string, link: string, days: number) =>
  `Salut ${firstName}, voici ton accès personnel à Coory pour suivre tes séances : ${link} (valable ${days} jours, à usage unique).`;

// Numéro au format international (« +32 470 12 34 56 ») : chiffres seuls pour WhatsApp et les SMS.
// Un numéro sans indicatif ne peut pas être deviné : le coach choisit alors le contact lui-même.
const internationalNumber = (phone: string | null) =>
  phone && phone.trim().startsWith("+") ? phone.replace(/[^\d]/g, "") : null;

export function InvitePanel({
  organizationId,
  athlete,
  hasAccount,
  pendingInvite,
  fichePath,
  revoke,
  validityDays,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createInvitation.bind(null, organizationId, athlete.id),
    initialState,
  );
  const [confirming, setConfirming] = useState<"renew" | "revoke" | null>(null);
  const [revoking, setRevoking] = useState(false);
  const generateForm = useRef<HTMLFormElement>(null);
  const revokeForm = useRef<HTMLFormElement>(null);
  const linkField = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const first = athlete.firstName;
  const hasEmail = athlete.email !== null;
  const waiting = pendingInvite !== null && !pendingInvite.expired;

  async function copyLink() {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      toast("Lien copié.");
    } catch {
      // Presse-papiers refusé (navigateur, permissions) : le lien est sélectionné, à copier à la main.
      linkField.current?.focus();
      linkField.current?.select();
      toast("Copie impossible : le lien est sélectionné, copie-le à la main.");
    }
  }

  // Une action de la carte, au clic : copier ; générer (directement s'il n'y a pas de lien en
  // attente, sinon après confirmation : l'ancien lien ne marchera plus) ; révoquer (confirmation).
  function run(act: Act) {
    if (act === "copy") void copyLink();
    else if (act === "revoke") setConfirming("revoke");
    else if (waiting) setConfirming("renew");
    else generateForm.current?.requestSubmit();
  }

  // État affiché : pastille, texte et actions.
  let tone: StatusTone;
  let pill: string;
  let text: ReactNode;
  let primary: Item;
  let second: Item | null = null;
  let rules = true;

  if (state.link) {
    tone = "accent";
    pill = "Lien prêt";
    text = "Copie le lien maintenant : pour ta sécurité, il ne sera plus affiché ensuite.";
    primary = { label: "Copier le lien", act: "copy" };
  } else if (hasAccount) {
    tone = "ok";
    pill = "Compte activé";
    const pronoun = athlete.sex === "female" ? "Elle" : athlete.sex === "male" ? "Il" : null;
    text = pronoun
      ? `${first} a déjà activé son compte. ${pronoun} se connecte avec son adresse e-mail : aucune invitation à envoyer.`
      : `${first} a déjà activé son compte et se connecte avec son adresse e-mail : aucune invitation à envoyer.`;
    primary = { label: "Voir la fiche", href: fichePath };
    second = { label: "Envoyer un message", href: `/coach/messages?sportif=${athlete.id}` };
    rules = false;
  } else if (waiting) {
    tone = "warn";
    pill = `En attente · jusqu'au ${dayShort.format(new Date(pendingInvite.expiresAt))}`;
    text = `Un lien est valable jusqu'au ${longDateTime(pendingInvite.expiresAt)}. Il ne peut pas être réaffiché : génère un nouveau lien si ${first} l'a perdu.`;
    primary = {
      label: pending ? "Création du lien…" : "Générer un nouveau lien",
      act: "generate",
    };
    second = { label: "Révoquer ce lien", act: "revoke", danger: true };
  } else if (pendingInvite?.expired) {
    tone = "neutral";
    pill = "Lien expiré";
    text = `Le dernier lien a expiré le ${longDateTime(pendingInvite.expiresAt)}. Génère un nouveau lien si ${first} doit encore créer son accès.`;
    primary = {
      label: pending ? "Création du lien…" : "Générer un nouveau lien",
      act: "generate",
      disabled: !hasEmail,
    };
  } else {
    tone = "neutral";
    pill = athlete.sex === "female" ? "Pas encore invitée" : "Pas encore invité";
    text = `Génère un lien personnel et envoie-le toi-même. ${first} l'ouvrira pour créer son accès avec son adresse e-mail.`;
    primary = {
      label: pending ? "Création du lien…" : "Générer le lien d'invitation",
      act: "generate",
      disabled: !hasEmail,
    };
  }
  const primaryDisabled = Boolean(primary.disabled) || pending;

  const message = state.link ? shareText(first, state.link, validityDays) : "";
  const number = internationalNumber(athlete.phone);
  const shares = state.link
    ? [
        {
          label: "WhatsApp",
          href: `https://wa.me/${number ?? ""}?text=${encodeURIComponent(message)}`,
          external: true,
        },
        {
          label: "E-mail",
          href: `mailto:${athlete.email ?? ""}?subject=${encodeURIComponent("Ton accès à Coory")}&body=${encodeURIComponent(message)}`,
          external: false,
        },
        {
          label: "SMS",
          href: `sms:${number ? `+${number}` : ""}?&body=${encodeURIComponent(message)}`,
          external: false,
        },
      ]
    : [];

  const statusPill = <StatusPill tone={tone}>{pill}</StatusPill>;
  const ruleList = (
    <ul className="flex flex-col gap-2">
      {[
        { icon: Clock, label: `Valable ${validityDays} jours` },
        { icon: Check, label: "Utilisable une seule fois" },
        { icon: X, label: "Rien n'est envoyé automatiquement" },
      ].map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-2.5 text-[13px] leading-[normal] text-muted"
        >
          <Icon aria-hidden size={14} strokeWidth={2} className="shrink-0 text-violet-text" />
          {label}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex w-full flex-col gap-3 lg:items-center lg:pt-7">
      <section
        aria-label={`Invitation de ${athlete.displayName}`}
        className="flex w-full flex-col gap-4 rounded-[22px] bg-surface px-4 py-[18px] inset-ring inset-ring-line-soft lg:w-[560px] lg:gap-5 lg:rounded-[20px] lg:p-[26px]"
      >
        <div className="flex items-center gap-3 lg:gap-3.5">
          <Avatar name={athlete.displayName} photoPath={athlete.photoPath} size="invite" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:gap-[3px]">
            <span className="truncate text-[16px] leading-[normal] font-semibold lg:text-[17px]">
              {athlete.displayName}
            </span>
            <span className="truncate text-[13px] leading-[normal] text-muted">
              {athlete.email ?? "Aucune adresse e-mail"}
            </span>
          </div>
          <span className="max-lg:hidden">{statusPill}</span>
        </div>
        <span className="self-start lg:hidden">{statusPill}</span>

        <p
          role="status"
          className="text-[14.5px] leading-[1.55] text-dlg-ink-2 lg:text-[14px] lg:leading-[1.55]"
        >
          {text}
        </p>

        {!hasEmail && !hasAccount && !state.link ? (
          <p className="text-[13.5px] leading-[1.5] text-status-danger">
            Cette fiche n&apos;a pas d&apos;adresse e-mail : il faut en ajouter une avant de pouvoir
            inviter le sportif.
          </p>
        ) : null}
        {state.error ? (
          <p role="alert" className="text-[13.5px] leading-[1.5] text-status-danger">
            {state.error}
          </p>
        ) : null}

        {state.link ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex h-12 items-center gap-2.5 rounded-[12px] bg-surface-2 pr-3.5 pl-3.5 inset-ring inset-ring-line-2 lg:h-[46px] lg:pr-1.5">
              <label htmlFor="invite-link" className="sr-only">
                Lien d&apos;invitation (affiché une seule fois)
              </label>
              <input
                ref={linkField}
                id="invite-link"
                readOnly
                value={state.link}
                onFocus={(event) => event.currentTarget.select()}
                className="h-full min-w-0 flex-1 truncate bg-transparent text-[14px] leading-[normal] text-text outline-none lg:text-[13.5px]"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-[34px] shrink-0 items-center rounded-[9px] bg-cta px-3 text-[13px] leading-[normal] font-semibold text-on-cta transition-[scale] duration-150 active:scale-[0.97] max-lg:hidden"
              >
                Copier le lien
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {shares.map((share) => (
                <a
                  key={share.label}
                  href={share.href}
                  {...(share.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex h-11 items-center justify-center rounded-[12px] text-[13.5px] leading-[normal] font-medium text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2 lg:h-10 lg:rounded-[11px] lg:text-[13px]"
                >
                  {share.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* Ordinateur : l'action principale dans la carte (téléphone : barre du bas). Le lien prêt n'a
            pas de bouton ici : « Copier le lien » est dans le champ. */}
        {primary && !state.link ? (
          <CardAction
            item={{ ...primary, disabled: primaryDisabled }}
            onAct={run}
            className="inline-flex h-[46px] items-center justify-center rounded-[12px] bg-cta px-5 text-[14.5px] leading-[normal] font-semibold text-on-cta transition-[scale,opacity] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 max-lg:hidden"
          />
        ) : null}
        {second ? (
          <CardAction
            item={{ ...second, disabled: pending }}
            onAct={run}
            className={`inline-flex h-11 items-center justify-center rounded-[12px] text-[14.5px] leading-[normal] font-medium transition-colors duration-150 lg:text-[14px] lg:inset-ring lg:inset-ring-line-2 lg:hover:bg-surface-2 ${
              second.danger ? "text-status-danger" : "text-text"
            }`}
          />
        ) : null}

        {rules ? (
          <div className="border-t border-line-soft pt-4 max-lg:hidden">{ruleList}</div>
        ) : null}
      </section>
      {rules ? <div className="px-2 py-1 lg:hidden">{ruleList}</div> : null}

      {/* Formulaires des actions serveur existantes : générer (ou remplacer) le lien, le révoquer. */}
      <form ref={generateForm} action={formAction} className="hidden" />
      <form
        ref={revokeForm}
        action={async () => {
          setRevoking(true);
          await revoke();
        }}
        className="hidden"
      />

      {primary ? (
        <MobileActionBar>
          <CardAction
            item={{ ...primary, disabled: primaryDisabled }}
            onAct={run}
            className={mobileActionPrimaryClass}
          />
        </MobileActionBar>
      ) : null}

      <ConfirmDialog
        open={confirming === "renew"}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          generateForm.current?.requestSubmit();
        }}
        title="Générer un nouveau lien ?"
        confirmLabel="Générer un nouveau lien"
        icon={RefreshCw}
      >
        Le lien en attente ne marchera plus : tu enverras le nouveau à {first}.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirming === "revoke"}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          revokeForm.current?.requestSubmit();
        }}
        pending={revoking}
        title="Révoquer ce lien ?"
        confirmLabel={revoking ? "Révocation…" : "Révoquer"}
        icon={Link2Off}
      >
        {first} ne pourra plus l&apos;utiliser. Tu pourras générer un nouveau lien plus tard.
      </ConfirmDialog>
    </div>
  );
}

// Bouton ou lien d'une action de la carte, au style donné.
function CardAction({
  item,
  className,
  onAct,
}: {
  item: Item;
  className: string;
  onAct: (act: Act) => void;
}) {
  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {item.label}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        if (item.act) onAct(item.act);
      }}
      disabled={item.disabled}
      className={className}
    >
      {item.label}
    </button>
  );
}
