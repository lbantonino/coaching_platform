import Link from "next/link";

// Onglets de page (prompt Claude Design §4 « Tabs »). Ordinateur : soulignés (écart 24, onglet actif
// souligné de 2 px rouge, ligne de base 1 px). Téléphone : pastilles qui défilent (actif inversé).
// Ce sont de vrais liens : l'onglet ouvert est dans l'adresse (?onglet=…), donc partageable,
// compatible avec le bouton retour, et sans JavaScript.
export function PageTabs({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; active: boolean }[];
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0"
    >
      <ul className="flex min-w-max gap-2 md:gap-6 md:border-b md:border-line">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "page" : undefined}
              className={`inline-flex h-10 items-center rounded-pill px-3.5 text-[15px] whitespace-nowrap transition-colors duration-150 md:-mb-px md:h-11 md:rounded-none md:border-b-2 md:px-0.5 ${
                item.active
                  ? "bg-selected font-medium text-text md:border-accent md:bg-transparent md:text-text"
                  : "text-muted hover:text-text md:border-transparent"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Étapes d'un assistant (variante « Stepper ») : numéro rond de 22 px, rouge pour l'étape en cours et
// les étapes faites (✓). Affichage seul : la navigation se fait par « Précédent » / « Suivant ».
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol
      aria-label="Étapes"
      className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:gap-6 md:border-b md:border-line md:px-0"
    >
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step}
            aria-current={active ? "step" : undefined}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-pill px-3.5 text-[15px] whitespace-nowrap md:-mb-px md:h-11 md:rounded-none md:border-b-2 md:px-0.5 ${
              active
                ? "bg-selected font-medium text-text md:border-accent md:bg-transparent md:text-text"
                : "text-muted md:border-transparent"
            }`}
          >
            <span
              aria-hidden
              className={`inline-flex size-[22px] items-center justify-center rounded-full font-mono text-[12px] font-semibold ${
                active || done ? "bg-accent text-on-accent" : "bg-chip text-text"
              }`}
            >
              {done ? "✓" : index + 1}
            </span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}
