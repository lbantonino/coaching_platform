import Link from "next/link";
import type { ReactNode } from "react";

// Ligne d'un bloc « liste » (prompt Claude Design §7) : élément de tête (avatar, case…), titre 15/600,
// précision 13 grise, éléments de fin (pastilles, montant). Filet au-dessus de chaque ligne.
export function ListRow({
  href,
  leading,
  title,
  sub,
  trailing,
  divider = true,
  onClick,
}: {
  href?: string;
  leading?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  trailing?: ReactNode;
  // false : la ligne est dans un conteneur qui porte lui-même le filet (ex. avec un bouton « ••• »).
  divider?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold">{title}</span>
        {sub ? <span className="truncate text-[13px] text-muted">{sub}</span> : null}
      </span>
      {trailing ? <span className="flex shrink-0 items-center gap-2">{trailing}</span> : null}
    </>
  );
  const className = `flex min-h-16 items-center gap-3 py-2.5 ${
    divider ? "border-t border-line" : "min-w-0 flex-1"
  }`;
  return href ? (
    <Link
      href={href}
      onClick={onClick}
      // Appui : le fond s'assombrit tout de suite (sans transition), avant l'ouverture de la page.
      className={`${className} -mx-2 rounded-[12px] px-2 transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2 active:duration-0`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
