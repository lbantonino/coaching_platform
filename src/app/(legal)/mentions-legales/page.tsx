import type { Metadata } from "next";

import { LEGAL } from "@/config/legal";

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
      intro="Qui édite Coory, qui l’héberge et comment nous contacter."
      sections={[
        {
          title: "Éditeur",
          body: (
            <p>
              {LEGAL.publisher}, personne physique. Coory est un projet personnel en phase de test,
              sans société pour l’instant. Contact :{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-text">
                {LEGAL.contactEmail}
              </a>
              .
            </p>
          ),
        },
        {
          title: "Responsable de la publication",
          body: <p>{LEGAL.publisher}.</p>,
        },
        {
          title: "Hébergement",
          body: (
            <p>
              Application : Vercel Inc. (vercel.com). Base de données et fichiers : Supabase
              (supabase.com), serveurs dans l’Union européenne. [Adresses des hébergeurs et région à
              confirmer à la mise en ligne.]
            </p>
          ),
        },
        {
          title: "Propriété intellectuelle",
          body: (
            <p>
              Le nom Coory, son logo et l’interface de l’application sont protégés. Les contenus
              créés par les coachs (programmes, notes) restent leur propriété.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-text">
                {LEGAL.contactEmail}
              </a>
            </p>
          ),
        },
      ]}
    />
  );
}
