import type { Metadata } from "next";

import { LegalSection, ProvisionalNotice } from "../legal-notice";

export const metadata: Metadata = {
  title: "Mentions légales",
};

// Mentions légales PROVISOIRES (D-32, prompt Claude Design §7.1) : à compléter et faire valider
// avant toute mise en ligne, comme les conditions et la politique de confidentialité.
export default function LegalNoticePage() {
  return (
    <article className="flex flex-col gap-6">
      <h1 className="font-display text-heading font-semibold lg:text-heading-lg">
        Mentions légales
      </h1>
      <ProvisionalNotice />
      <LegalSection title="1. Éditeur">
        <p>
          [Nom ou raison sociale de l&apos;éditeur, forme juridique, adresse du siège, numéro
          d&apos;entreprise (BCE), numéro de TVA, adresse e-mail de contact].
        </p>
      </LegalSection>
      <LegalSection title="2. Responsable de la publication">
        <p>[Nom de la personne responsable de la publication].</p>
      </LegalSection>
      <LegalSection title="3. Hébergement">
        <p>
          [Nom, adresse et contact de l&apos;hébergeur de l&apos;application et de la base de
          données].
        </p>
      </LegalSection>
      <LegalSection title="4. Propriété intellectuelle">
        <p>
          Le nom Coory, son logo et l&apos;interface de l&apos;application sont protégés. Les
          contenus créés par les coachs (programmes, notes) restent leur propriété.
        </p>
      </LegalSection>
      <LegalSection title="5. Contact">
        <p>[Adresse e-mail de contact].</p>
      </LegalSection>
    </article>
  );
}
