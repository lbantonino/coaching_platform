import Image from "next/image";

// Cartes visuelles de l'ordinateur pour la connexion, l'inscription et la bienvenue : les images
// d'Antonino 7a à 7d du 06/11/2026 (coory-design/, copiées dans public/auth/), qui remplacent les
// 6a à 6c (D-141, puis D-143). Chaque image est une carte complète, textes compris, dessinée à
// 664 × 728 px (fournie en double résolution, coins droits : l'arrondi de 20 px, celui des cartes de
// l'app, est donné ici). Elle garde ses proportions et tient entière dans la moitié droite de l'écran
// (conteneur CSS : largeur = min(largeur, hauteur × 664 / 728)), centrée, sans rien couper.
// Les liens légaux ne sont plus dessinés dans les images : ils sont sous le formulaire (entry-ui).
export const authCards = {
  connexion: {
    src: "/auth/carte-connexion-7a.png",
    alt: "Coory. Moins d’administratif, plus de coaching. Programmes, agenda, suivi des sportifs et facturation, au même endroit. Aperçu du tableau de bord et de l’assistant IA.",
  },
  inscription: {
    src: "/auth/carte-inscription-7b.png",
    alt: "Gagne des heures chaque semaine. L’assistant prépare tes programmes et remplit ton agenda, tu valides. Aperçu de l’agenda de Coory sur iPhone.",
  },
  configuration: {
    src: "/auth/carte-configuration-7c.png",
    alt: "Ton activité, enfin claire. Séances, sportifs et paiements réunis dans un seul tableau de bord. Aperçu de la comptabilité de Coory.",
  },
  sportif: {
    src: "/auth/carte-sportif-7d.png",
    alt: "Espace sportif. Ton programme, toujours avec toi : tes séances dans l’ordre, semaine après semaine, à exporter en PDF. Aperçu du programme sur iPhone.",
  },
} as const;
export type AuthCard = keyof typeof authCards;

// `choices` : les cartes entre lesquelles la page bascule (inscription : Coach / Sportif). Elles sont
// toutes chargées et posées l'une sur l'autre ; seule `card` se voit, l'échange est un fondu
// (aucun blanc pendant le chargement de la nouvelle image).
export function AuthCardImage({
  card,
  choices = [card],
}: {
  card: AuthCard;
  choices?: AuthCard[];
}) {
  return (
    <div className="auth-stage flex min-h-[560px] flex-1 items-center justify-center">
      <div className="relative aspect-[664/728] w-[min(100cqw,calc(100cqh*664/728))] overflow-hidden rounded-[20px]">
        {choices.map((name) => (
          <Image
            key={name}
            src={authCards[name].src}
            alt={name === card ? authCards[name].alt : ""}
            aria-hidden={name === card ? undefined : true}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0px"
            className={`object-contain transition-opacity duration-300 ease-out motion-reduce:transition-none ${
              name === card ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
