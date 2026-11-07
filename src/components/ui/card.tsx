import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// Carte / bloc (prompt Claude Design §4 « Card / Block ») : fond surface, filet de 1 px, rayon 20,
// marge intérieure 18, écart 14. En-tête : titre 18/600 en Space Grotesk, sous-titre 13 gris, lien
// d'action 13 gris souligné à droite. Jamais d'ombre.
// `compact` (maquette v6, D-77) : marge intérieure 20, titre 13/500, lien 12 violet sans soulignement.
export function Card({
  id,
  title,
  subtitle,
  action,
  headingLevel = 2,
  compact = false,
  className = "",
  children,
}: {
  // Identifiant du titre : la carte devient une région nommée (lecteurs d'écran, tests).
  id?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: { href: string; label: string };
  headingLevel?: 2 | 3;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section
      aria-labelledby={id && title ? id : undefined}
      className={`flex min-w-0 flex-col rounded-card border border-line bg-surface ${
        compact ? "gap-2 p-5" : "gap-3.5 p-[18px]"
      } ${className}`}
    >
      {title || action ? (
        <header
          className={`flex justify-between gap-4 ${compact ? "items-center" : "items-start"}`}
        >
          <div className="flex min-w-0 flex-col gap-1">
            {title ? (
              <Heading
                id={id}
                className={
                  compact
                    ? "text-[17px] font-semibold tracking-tight lg:text-[13px] lg:font-medium lg:tracking-normal"
                    : "font-display text-block font-semibold"
                }
              >
                {title}
              </Heading>
            ) : null}
            {subtitle ? <p className="text-[13px] text-muted">{subtitle}</p> : null}
          </div>
          {action ? (
            <Link
              href={action.href}
              className={
                compact
                  ? "shrink-0 text-[14px] text-violet-text transition-opacity duration-150 hover:opacity-80 lg:text-[12px]"
                  : "shrink-0 border-b border-accent-line pb-px text-[13px] text-accent-text transition-colors duration-150 hover:text-text"
              }
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

// Bloc vide (module pas encore construit, ou rien à montrer) : icône et phrase grises, sous le filet.
export function CardEmpty({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-t border-line pt-3.5 text-[14px] leading-normal text-muted">
      <Icon aria-hidden size={18} strokeWidth={1.7} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
