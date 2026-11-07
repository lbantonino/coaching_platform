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
  // « kit » : kit « Coory Pages », page 10 (D-126) : téléphone, trois segments égaux de 44 px sur
  // toute la largeur ; ordinateur, 40 px à la largeur du contenu ; option choisie blanche, ombre douce.
  look?: "app" | "track" | "kit";
}) {
  const track = look === "track";
  if (look === "kit") {
    return (
      <fieldset className="flex min-w-0 flex-col">
        <legend className="mb-2 text-[14px] leading-[normal] font-semibold text-text lg:text-[13.5px]">
          {legend}
        </legend>
        <div className="grid h-11 auto-cols-fr grid-flow-col gap-0.5 rounded-[12px] bg-dlg-segment p-[3px] lg:inline-flex lg:h-10 lg:self-start lg:rounded-[11px]">
          {options.map((option) => (
            <label
              key={option.value}
              className="tap-44 flex cursor-pointer rounded-[9px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent lg:rounded-[8px]"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                defaultChecked={option.value === defaultValue}
                className="peer sr-only"
              />
              <span className="flex flex-1 items-center justify-center rounded-[9px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-muted transition-[background-color,color,box-shadow] duration-150 hover:text-text peer-checked:bg-dlg-segment-active peer-checked:text-text peer-checked:shadow-[0_1px_2px_rgba(22,18,40,0.10)] lg:rounded-[8px] lg:px-4 lg:text-[13px]">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
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
