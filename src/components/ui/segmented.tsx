// Sélecteur segmenté (design system §6 : « Semaine · Mois · Trimestre »).
// Accessible : c'est un groupe de boutons radio natifs, utilisable au clavier et dans un formulaire.
// Classes partagées avec le sélecteur contrôlé du calculateur de test.
export const segmentedGroupClass =
  "inline-flex w-full gap-1 rounded-[11px] border border-line bg-bg p-1 sm:w-fit";
export const segmentedItemClass =
  "flex h-9 items-center justify-center rounded-sm px-3 text-caption text-muted transition-colors peer-checked:bg-chip peer-checked:text-text sm:h-[30px]";

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
      <legend className="mb-1.5 text-small font-medium">{legend}</legend>
      <div className={segmentedGroupClass}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none"
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
