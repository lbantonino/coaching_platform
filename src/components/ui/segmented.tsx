// Sélecteur segmenté (design system : « Semaine · Mois · Trimestre »).
// Accessible : c'est un groupe de boutons radio natifs, utilisable au clavier et dans un formulaire.
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
      <div className="inline-flex w-full rounded-[12px] border border-line bg-bg p-1 sm:w-fit">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex-1 cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              className="peer sr-only"
            />
            <span className="flex h-9 items-center justify-center rounded-[9px] px-4 text-small text-muted transition-colors peer-checked:bg-chip peer-checked:text-text">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
