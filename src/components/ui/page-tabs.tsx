import Link from "next/link";

// Onglets de page (design system §6 « Tabs »). Ce sont de vrais liens : l'onglet ouvert est dans
// l'adresse (?onglet=…), donc partageable, compatible avec le bouton retour, et sans JavaScript.
// Actif = texte clair + soulignement rouge de 2 px ; les autres en gris. Défilement horizontal sur téléphone.
export function PageTabs({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-7 border-b border-line">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "page" : undefined}
              className={`-mb-px inline-flex h-11 items-center border-b-2 text-body transition-colors ${
                item.active
                  ? "border-accent font-medium text-text"
                  : "border-transparent text-muted hover:text-text"
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
