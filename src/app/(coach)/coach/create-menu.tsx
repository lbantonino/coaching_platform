import {
  ChevronDown,
  ClipboardList,
  FileText,
  Plus,
  ReceiptText,
  Timer,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import { buttonClass } from "@/components/ui/button";

// Bouton « Créer » de la maquette (D-28). Menu natif <details> : il s'ouvre au clavier et sans JavaScript.
// Les entrées dont le module n'existe pas encore mènent à leur page « Bientôt ».
export function CreateMenu({ orgBase }: { orgBase: string }) {
  const items = [
    { href: "/coach/bientot/programmes", label: "Programme", icon: FileText, soon: true },
    { href: `${orgBase}/agenda/seances/nouvelle`, label: "Séance", icon: Timer, soon: false },
    { href: `${orgBase}/sportifs/nouveau`, label: "Sportif", icon: UserPlus, soon: false },
    { href: "/coach/bientot/facturation", label: "Facture", icon: ReceiptText, soon: true },
    { href: "/coach/bientot/taches", label: "Tâche", icon: ClipboardList, soon: true },
  ];
  return (
    <details className="group relative">
      <summary
        className={buttonClass({
          variant: "primary",
          size: "md",
          className: "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
        })}
      >
        <Plus aria-hidden size={16} strokeWidth={2} />
        Créer
        <ChevronDown
          aria-hidden
          size={15}
          strokeWidth={2}
          className="transition-transform group-open:rotate-180"
        />
      </summary>
      <ul
        aria-label="Créer"
        className="absolute right-0 z-20 mt-2 flex w-56 flex-col gap-0.5 rounded-[14px] border border-line-2 bg-surface p-1.5"
      >
        {items.map(({ href, label, icon: Icon, soon }) => (
          <li key={label}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-[9px] px-3 py-2 text-small hover:bg-surface-2"
            >
              <Icon aria-hidden size={16} strokeWidth={1.7} className="text-muted" />
              <span className="flex-1">{label}</span>
              {soon ? (
                <span className="rounded-pill bg-chip px-1.5 py-0.5 text-[10px] text-muted">
                  Bientôt
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
