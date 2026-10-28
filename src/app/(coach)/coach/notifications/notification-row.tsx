"use client";

import { CheckCheck, EyeOff, MailOpen, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { buttonClass } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

// Une notification (4e, D-61) : la ligne mène là où on s'en occupe (et la marque lue), « ••• »
// propose Marquer comme lue / non lue et Masquer (« Annuler » dans le message). Non lue : point
// rouge et titre en gras ; lue : titre en gris.
type Actions = {
  setRead: (keys: string[], read: boolean) => Promise<{ ok: boolean }>;
  dismiss: (key: string) => Promise<{ ok: boolean }>;
  restore: (key: string) => Promise<{ ok: boolean }>;
};

export function NotificationRow({
  notificationKey,
  read,
  href,
  leading,
  title,
  sub,
  trailing,
  actions,
}: {
  notificationKey: string;
  read: boolean;
  href: string;
  leading?: ReactNode;
  title: string;
  sub?: string;
  trailing?: ReactNode;
  actions: Actions;
}) {
  const [menu, setMenu] = useState(false);
  // Affichés tout de suite ; la page se recalcule ensuite.
  const [isRead, setIsRead] = useState(read);
  const [hidden, setHidden] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  if (hidden) return null;

  const markRead = (next: boolean) =>
    startTransition(async () => {
      setIsRead(next);
      const { ok } = await actions.setRead([notificationKey], next);
      if (!ok) {
        setIsRead(!next);
        toast("Le changement n'a pas pu être enregistré. Réessaie.");
        return;
      }
      router.refresh();
    });

  const dismiss = () =>
    startTransition(async () => {
      setHidden(true);
      const { ok } = await actions.dismiss(notificationKey);
      if (!ok) {
        setHidden(false);
        toast("La notification n'a pas pu être masquée. Réessaie.");
        return;
      }
      router.refresh();
      toast("Notification masquée.", {
        action: {
          label: "Annuler",
          onClick: () =>
            startTransition(async () => {
              const restored = await actions.restore(notificationKey);
              if (restored.ok) setHidden(false);
              router.refresh();
            }),
        },
      });
    });

  return (
    <div className="flex items-center gap-1 border-t border-line">
      <ListRow
        divider={false}
        href={href}
        // Ouvrir une notification, c'est l'avoir lue (sans attendre la réponse du serveur).
        onClick={() => {
          if (!isRead) void actions.setRead([notificationKey], true);
        }}
        leading={leading}
        title={
          <span className="inline-flex max-w-full items-center gap-2">
            {isRead ? null : (
              <>
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent" />
                <span className="sr-only">Non lue : </span>
              </>
            )}
            <span className={`truncate ${isRead ? "font-medium text-muted" : ""}`}>{title}</span>
          </span>
        }
        sub={sub}
        trailing={trailing}
      />
      <button
        type="button"
        aria-label={`Plus d'actions : ${title}`}
        onClick={() => setMenu(true)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text active:bg-surface-2 active:duration-0"
      >
        <MoreHorizontal aria-hidden size={18} strokeWidth={1.8} />
      </button>
      <ActionMenu
        open={menu}
        onClose={() => setMenu(false)}
        title={title}
        items={[
          isRead
            ? { label: "Marquer comme non lue", icon: MailOpen, onSelect: () => markRead(false) }
            : { label: "Marquer comme lue", icon: CheckCheck, onSelect: () => markRead(true) },
          { label: "Masquer", icon: EyeOff, onSelect: dismiss },
        ]}
      />
    </div>
  );
}

// Bouton rouge « Tout marquer comme lu » (prompt §7) : toutes les notifications affichées et non lues.
export function MarkAllRead({
  keys,
  setRead,
}: {
  keys: string[];
  setRead: (keys: string[], read: boolean) => Promise<{ ok: boolean }>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <button
      type="button"
      disabled={pending || keys.length === 0}
      onClick={() =>
        startTransition(async () => {
          const { ok } = await setRead(keys, true);
          if (!ok) {
            toast("Le changement n'a pas pu être enregistré. Réessaie.");
            return;
          }
          toast("Tout est marqué comme lu.");
          router.refresh();
        })
      }
      className={buttonClass()}
    >
      <CheckCheck aria-hidden size={16} strokeWidth={2} />
      {pending ? "Enregistrement…" : "Tout marquer comme lu"}
    </button>
  );
}
