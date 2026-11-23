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
          // Lien voulu vers l'agence d'Antonino (décision du 23/11/2026) :
          // Coory reste un projet personnel, Synode n'en est pas l'éditeur.
          title: "Conception et développement",
          body: (
            <p>
              Coory est conçu et développé par {LEGAL.publisher}, cofondateur de Synode, agence
              technologique à Bruxelles (
              <a
                href="https://synode-agency.com/"
                target="_blank"
                rel="noopener"
                className="font-semibold text-text"
              >
                synode-agency.com
              </a>
              ).
            </p>
          ),
        },
        {
          title: "Hébergement",
          body: (
            <>
              <p>
                <strong>Application</strong> : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA
                91723, États-Unis (vercel.com). L’application tourne sur ses serveurs de Dublin
                (Irlande).
              </p>
              <p>
                <strong>Base de données et fichiers</strong> : Supabase Pte. Ltd., 65 Chulia Street
                #38-02/03, OCBC Centre, Singapour 049513 (supabase.com). Les données sont stockées à
                Dublin (Irlande, Union européenne).
              </p>
            </>
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
