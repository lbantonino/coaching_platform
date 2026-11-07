// Consignes en frise verticale (maquette « Bibliothèque » du 06/11/2026, D-142) : une bulle numérotée
// de 28 px par étape, reliée à la suivante par une ligne de 2 px qui s'allonge avec le texte. La
// première bulle est violette, les suivantes lavande. Toujours empilée, sur téléphone comme sur
// ordinateur ; l'espacement vient du bas du texte (20 px, 18 sur téléphone), pas d'un écart entre les
// rangées.
export function InstructionTimeline({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={index} className="flex items-stretch gap-3.5">
            <span aria-hidden className="flex w-7 flex-none flex-col items-center">
              <span
                className={`grid size-7 flex-none place-items-center rounded-full text-[12px] leading-none font-bold tabular ${
                  index === 0 ? "bg-violet text-on-accent" : "bg-lib-lavender text-violet-text"
                }`}
              >
                {index + 1}
              </span>
              {last ? null : (
                <span className="my-1.5 min-h-3.5 w-0.5 flex-1 rounded-[2px] bg-lib-timeline" />
              )}
            </span>
            <span
              className={`min-w-0 flex-1 pt-1 text-[14px] leading-[1.55] text-pretty text-lib-body lg:text-[14.5px] lg:leading-[1.6] ${
                last ? "pb-0" : "pb-[18px] lg:pb-5"
              }`}
            >
              <span className="sr-only">Étape {index + 1} : </span>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
