import Link from "next/link";

// Sélecteur segmenté (« Jour · Semaine · Mois »).
// Accessible : c'est un groupe de boutons radio natifs, utilisable au clavier et dans un formulaire.
// Classes partagées avec le sélecteur contrôlé du calculateur de test.
// Prompt Claude Design §4 : groupe sur fond surface, filet fin, rayon 12, marge 4 ; options de 36 px,
// rayon 9, 14/500. Option choisie = jaune doré à faible opacité, sans contour (D-71), comme les
// pastilles et le menu.
export const segmentedGroupClass =
  "inline-flex w-full gap-1.5 rounded-control border border-line bg-surface p-1 sm:w-fit";
export const segmentedItemClass =
  "flex h-9 items-center justify-center rounded-[9px] px-3.5 text-[14px] font-medium whitespace-nowrap text-muted transition-colors duration-150 hover:text-text peer-checked:bg-selected peer-checked:text-text";

export function Segmented<T extends string>({
  name,
  legend,
  options,
  defaultValue,
  look = "app",
}: {
  name: string;
  legend: string;
  options: { value: T; label: string }[];
  defaultValue: T;
  // « track » : l'habillage de la fiche sportif (piste grise, option choisie en verre, largeur du
  // contenu même sur téléphone).
  look?: "app" | "track";
}) {
  const track = look === "track";
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend
        className={`mb-2 font-medium ${track ? "text-[13.5px] leading-[17px]" : "text-[14px]"}`}
      >
        {legend}
      </legend>
      <div
        className={
          track
            ? "inline-flex flex-wrap self-start rounded-[12px] bg-track p-1"
            : segmentedGroupClass
        }
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-[9px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
              track ? "" : "flex-1 sm:flex-none"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              className="peer sr-only"
            />
            <span
              className={
                track
                  ? // Option choisie « verre » (maquette « Sportifs » du 03/11/2026) : sur la piste grise,
                    // un aplat plus clair avec une ombre douce.
                    "flex h-9 items-center rounded-[9px] px-3.5 text-[13.5px] font-medium whitespace-nowrap text-muted transition-colors duration-150 hover:text-text peer-checked:bg-track-active peer-checked:text-text peer-checked:shadow-[0_1px_3px_rgba(22,18,40,0.10)]"
                  : segmentedItemClass
              }
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// Variante en liens (la vue choisie est dans l'adresse) : même habillage, option active en noir.
export function SegmentedNav({
  label,
  items,
  size = "md",
}: {
  label: string;
  items: { href: string; label: string; active: boolean }[];
  // « sm » (barre de l'agenda, D-77) : 32 px, texte 12 px.
  size?: "md" | "sm";
}) {
  return (
    <nav
      aria-label={label}
      className={
        size === "sm"
          ? "inline-flex h-8 gap-0.5 rounded-lg border border-line-soft bg-surface-2 p-0.5"
          : `${segmentedGroupClass} w-auto`
      }
    >
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          scroll={false}
          aria-current={item.active ? "page" : undefined}
          className={`flex items-center justify-center whitespace-nowrap transition-colors duration-150 ${
            size === "sm" ? "rounded-md px-2.5 text-[12px]" : "h-9 rounded-[9px] px-3 text-[14px]"
          } ${
            item.active
              ? "bg-selected font-medium text-violet-text"
              : "font-medium text-muted hover:text-text"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
