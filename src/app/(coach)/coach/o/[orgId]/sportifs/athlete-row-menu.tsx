"use client";

import { Ellipsis, Pencil, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { iconButtonClass } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/overlay";

// Menu « ••• » d'une ligne de la liste des sportifs (prompt Claude Design §7) : Modifier, et Inviter
// dans son espace tant que le sportif n'a pas de compte. Pas de suppression : une fiche s'archive.
export function AthleteRowMenu({
  name,
  editHref,
  inviteHref,
}: {
  name: string;
  editHref: string;
  inviteHref: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        aria-label={`Actions pour ${name}`}
        onClick={() => setOpen(true)}
        className={iconButtonClass()}
      >
        <Ellipsis aria-hidden size={18} strokeWidth={1.8} />
      </button>
      <ActionMenu
        open={open}
        onClose={() => setOpen(false)}
        title={name}
        items={[
          { label: "Modifier", icon: Pencil, onSelect: () => router.push(editHref) },
          ...(inviteHref
            ? [
                {
                  label: "Inviter dans son espace",
                  icon: Send,
                  onSelect: () => router.push(inviteHref),
                },
              ]
            : []),
        ]}
      />
    </>
  );
}
