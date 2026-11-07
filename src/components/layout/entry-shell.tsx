import Image from "next/image";
import type { ReactNode } from "react";

import { AuthLegalLinks } from "./entry-ui";
import { AuthCardImage } from "./entry-visuals";

// Coquilles des pages d'entrée, d'après les maquettes d'Antonino du 06/11/2026
// (coory-design/COORY_AUTH_DESIGN_HANDOFF, D-139). Rupture à 1 024 px :
// - ordinateur : colonne du formulaire à gauche (largeur fixe), panneau visuel à droite, inset 16 px ;
// - téléphone : une colonne ; pour la connexion, le visuel 1c (logo et slogan) en en-tête et le
//   formulaire dans une feuille blanche qui le chevauche de 26 px.
// Fond de page : celui des fenêtres (--dlg, blanc en clair), comme la maquette.

// Carte de l'ordinateur : l'image 7a (connexion), aussi pour les pages d'accès sans maquette.
function PhotoPanel() {
  return (
    <div className="hidden flex-1 py-4 pr-4 lg:flex">
      <AuthCardImage card="connexion" />
    </div>
  );
}

// En-tête du téléphone : le visuel 1c d'Antonino (logo et slogan, D-145), sans la fausse barre
// d'état dessinée en haut du fichier (coupée : 40 pt). Il commence tout en haut de l'écran : sa partie
// sombre passe sous la vraie barre d'état de l'iPhone, le logo reste dessous (93 pt). Il garde ses
// proportions (1 170 × 930) ; la feuille du formulaire en recouvre le bas de 26 px, logo et slogan
// restent centrés dans la partie visible.
function PhotoHeader() {
  return (
    <header className="relative aspect-[1170/930] w-full shrink-0 overflow-hidden bg-auth-photo lg:hidden">
      <Image
        src="/auth/entete-telephone-1c.png"
        alt="Coory. Moins d’administratif, plus de coaching."
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </header>
  );
}

// Connexion et pages d'accès (mot de passe, e-mail, invitation, lien invalide, accès refusé) :
// sur ordinateur, deux moitiés égales (demande d'Antonino du 06/11 : le panneau de la maquette était
// trop grand) : le formulaire, centré sur 392 px comme la maquette, et le panneau photo ; en-tête
// photo + feuille sur téléphone.
// La page centre elle-même son contenu (le shell lui donne toute la hauteur).
export function EntryShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 bg-dlg max-lg:flex-col">
      <PhotoHeader />
      <div className="relative -mt-[26px] flex flex-1 flex-col rounded-t-[26px] bg-dlg px-[26px] pt-[26px] pb-[calc(30px+env(safe-area-inset-bottom))] lg:mt-0 lg:w-1/2 lg:flex-none lg:rounded-none lg:px-16 lg:pt-11 lg:pb-10">
        <main className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[392px] lg:justify-center">
          {children}
        </main>
        {/* Liens légaux sous le formulaire, sur ordinateur aussi depuis D-143 (l'image 7a ne les
            dessine plus). */}
        <AuthLegalLinks className="pt-[22px] lg:pt-6" />
      </div>
      <PhotoPanel />
    </div>
  );
}

// Inscription et bienvenue : sur ordinateur, deux moitiés égales (demande d'Antonino du 06/11) : le
// formulaire, centré sur la largeur de la maquette (`contentClassName`), et le panneau visuel propre à
// la page (lavande). Téléphone : le panneau disparaît, le formulaire prend toute la largeur.
export function SplitShell({
  visual,
  columnClassName,
  contentClassName,
  children,
}: {
  visual: ReactNode;
  columnClassName: string;
  contentClassName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1 bg-dlg">
      <div
        className={`flex min-w-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)] lg:w-1/2 lg:flex-none ${columnClassName}`}
      >
        <div className={`flex w-full flex-1 flex-col lg:mx-auto ${contentClassName}`}>
          {children}
        </div>
      </div>
      <div className="hidden flex-1 py-4 pr-4 lg:flex">{visual}</div>
    </div>
  );
}
