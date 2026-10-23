import Link from "next/link";
import type { ReactNode } from "react";

// Carte / bloc (prompt Claude Design §4 « Card / Block ») : fond surface, filet de 1 px, rayon 20,
// marge intérieure 18, écart 14. En-tête : titre 18/600 en Space Grotesk, sous-titre 13 gris, lien
// d'action 13 gris souligné à droite. Jamais d'ombre.
export function Card({
  title,
  subtitle,
  action,
  headingLevel = 2,
  className = "",
  children,
}: {
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
      className={`flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface p-[18px] ${className}`}
    >
      {title || action ? (
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? (
              <Heading className="font-display text-block font-semibold">{title}</Heading>
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
