import { CooryLogo, CooryMark } from "./CooryLogo";

// Le logo Coory dans l'app, qui a un thème clair et un thème sombre : le composant officiel du kit
// (CooryLogo.tsx, jamais redessiné) est rendu dans ses deux tons, « light » (fond clair) et « dark »
// (fond sombre), et la CSS n'affiche que celui du thème actif (classes brand-light / brand-dark de
// globals.css). L'enveloppe porte la classe : le composant du kit pose son propre « display ».

export function ThemedCooryLogo({ height }: { height: number }) {
  return (
    <span className="inline-flex shrink-0">
      <span className="brand-dark inline-flex">
        <CooryLogo height={height} tone="dark" />
      </span>
      <span className="brand-light inline-flex">
        <CooryLogo height={height} tone="light" />
      </span>
    </span>
  );
}

// Icône seule (décorative : le lien ou le bouton qui l'entoure porte le nom).
export function ThemedCooryMark({ height }: { height: number }) {
  return (
    <span aria-hidden className="inline-flex shrink-0">
      <span className="brand-dark inline-flex">
        <CooryMark height={height} tone="dark" />
      </span>
      <span className="brand-light inline-flex">
        <CooryMark height={height} tone="light" />
      </span>
    </span>
  );
}
