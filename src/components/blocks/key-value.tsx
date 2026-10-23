import type { ReactNode } from "react";

// Bloc « clé / valeur » (prompt Claude Design §7) : libellé gris et valeur, une ligne par
// information, filet au-dessus. Ordinateur : deux colonnes (170 px + valeur) ; téléphone : empilés.
export function KeyValueList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-col">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-0.5 border-t border-line py-2.5 text-[15px] lg:grid-cols-[170px_minmax(0,1fr)] lg:gap-4"
        >
          <dt className="text-[13px] text-muted lg:text-[15px]">{item.label}</dt>
          <dd className="min-w-0 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
