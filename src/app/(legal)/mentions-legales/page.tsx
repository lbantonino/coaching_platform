import type { Metadata } from "next";

import { LegalDocument } from "../legal-notice";

export const metadata: Metadata = {
  title: "Mentions légales",
};

// Mentions légales PROVISOIRES (D-32) : à compléter et faire valider avant toute mise en ligne.
export default function LegalNoticePage() {
  return (
    <LegalDocument
      href="/mentions-legales"
      title="Mentions légales"
      intro="Qui édite Coory, qui l'héberge et comment nous contacter."
      sections={[
        {
          title: "Éditeur",
          body: (
            <p>
              [Nom ou raison sociale de l&apos;éditeur, forme juridique, adresse du siège, numéro
              d&apos;entreprise (BCE), numéro de TVA, adresse e-mail de contact].
            </p>
          ),
        },
        {
          title: "Responsable de la publication",
          body: <p>[Nom de la personne responsable de la publication].</p>,
        },
        {
          title: "Hébergement",
          body: (
            <p>
              [Nom, adresse et contact de l&apos;hébergeur de l&apos;application et de la base de
              données].
            </p>
          ),
        },
        {
          title: "Propriété intellectuelle",
          body: (
            <p>
              Le nom Coory, son logo et l&apos;interface de l&apos;application sont protégés. Les
              contenus créés par les coachs (programmes, notes) restent leur propriété.
            </p>
          ),
        },
        {
          title: "Contact",
          body: <p>[Adresse e-mail de contact].</p>,
        },
      ]}
    />
  );
}
