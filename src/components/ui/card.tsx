import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// Carte / bloc (prompt Claude Design §4 « Card / Block ») : fond surface, filet de 1 px, rayon 20,
// marge intérieure 18, écart 14. En-tête : titre 18/600 en Space Grotesk, sous-titre 13 gris, lien
// d'action 13 gris souligné à droite. Jamais d'ombre.
export function Card({
  id,
  title,
  subtitle,
  action,
  headingLevel = 2,
  className = "",
  children,
}: {
  // Identifiant du titre : la carte devient une région nommée (lecteurs d'écran, tests).
  id?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: { href: string; label: string };
  headingLevel?: 2 | 3;
  className?: string;
  children?: ReactNode;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section
      aria-labelledby={id && title ? id : undefined}
      className={`flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface p-[18px] ${className}`}
    >
      {title || action ? (
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? (
              <Heading id={id} className="font-display text-block font-semibold">
                {title}
              </Heading>
            ) : null}
            {subtitle ? <p className="text-[13px] text-muted">{subtitle}</p> : null}
          </div>
          {action ? (
            <Link
              href={action.href}
              className="shrink-0 border-b border-line-2 pb-px text-[13px] text-muted transition-colors duration-150 hover:text-text"
            >
              {action.label}
            </Link>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

// Micro-libellé en capitales (Geist Mono 11–12, interlettrage .08em) : « PRINCIPAL », « CHAMPS »…
export function MicroLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
      {children}
    </span>
  );
}

// Bloc vide (module pas encore construit, ou rien à montrer) : icône et phrase grises, sous le filet.
export function CardEmpty({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-t border-line pt-3.5 text-[14px] leading-normal text-muted">
      <Icon aria-hidden size={18} strokeWidth={1.7} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
