import Link from "next/link";

// Sélecteur segmenté (« Jour · Semaine · Mois »).
// Accessible : c'est un groupe de boutons radio natifs, utilisable au clavier et dans un formulaire.
// Classes partagées avec le sélecteur contrôlé du calculateur de test.
// Prompt Claude Design §4 : groupe sur fond surface, filet fin, rayon 12, marge 4 ; options de 36 px,
// rayon 9, 14/500. Option choisie = aplat rouge (comme les prototypes).
export const segmentedGroupClass =
  "inline-flex w-full gap-1.5 rounded-control border border-line bg-surface p-1 sm:w-fit";
export const segmentedItemClass =
  "flex h-9 items-center justify-center rounded-[9px] px-3.5 text-[14px] font-medium whitespace-nowrap text-muted transition-colors duration-150 hover:text-text peer-checked:bg-accent peer-checked:text-on-accent";

export function Segmented<T extends string>({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  legend: string;
  options: { value: T; label: string }[];
  defaultValue: T;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-2 text-[14px] font-medium">{legend}</legend>
      <div className={segmentedGroupClass}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex-1 cursor-pointer rounded-[9px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              className="peer sr-only"
            />
            <span className={segmentedItemClass}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// Variante en liens (la vue choisie est dans l'adresse) : même habillage, option active en rouge.
export function SegmentedNav({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className={`${segmentedGroupClass} w-auto`}>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          scroll={false}
          aria-current={item.active ? "page" : undefined}
          className={`flex h-9 items-center justify-center rounded-[9px] px-3 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 ${
            item.active ? "bg-accent text-on-accent" : "text-muted hover:text-text"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
