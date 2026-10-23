import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// État vide (prompt Claude Design §4 « EmptyState ») : composant serveur, utilisable partout.
// Vide : icône 24 grise, titre 16/600, texte 14 gris, action facultative (bouton contour).
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-card border border-dashed border-line-2 p-4">
      <Icon aria-hidden size={24} strokeWidth={1.7} className="text-muted" />
      <p className="text-[16px] font-semibold">{title}</p>
      {children ? <p className="text-[14px] leading-[1.45] text-muted">{children}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
