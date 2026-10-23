import Link from "next/link";
import type { ReactNode } from "react";

import { chipActiveClass, chipClass, chipIdleClass } from "@/components/ui/chip";

import { LegalBackLink } from "./legal-back-link";

// Pages légales PROVISOIRES (D-30), présentées comme le prototype Claude Design (§7.1) : retour,
// pastilles entre les trois documents, sommaire numéroté, sections 01 à 0N. Rien n'y est présenté
// comme validé : le bandeau le rappelle, les passages entre crochets sont à compléter.
const documents = [
  { href: "/conditions", label: "Conditions" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
] as const;

export type LegalSectionData = { title: string; body: ReactNode };

export function LegalDocument({
  href,
  title,
  intro,
  sections,
}: {
  href: (typeof documents)[number]["href"];
  title: string;
  intro: string;
  sections: LegalSectionData[];
}) {
  const number = (index: number) => String(index + 1).padStart(2, "0");
  return (
    <div className="flex flex-col gap-[22px]">
      <LegalBackLink />
      <nav
        aria-label="Documents légaux"
        className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 [scrollbar-width:none]"
      >
        {documents.map((document) => (
          <Link
            key={document.href}
            href={document.href}
            aria-current={document.href === href ? "page" : undefined}
            className={`${chipClass} ${document.href === href ? chipActiveClass : chipIdleClass}`}
          >
            {document.label}
          </Link>
        ))}
      </nav>
      <article className="flex flex-col gap-7">
        <header className="flex flex-col gap-3">
          <p className="font-mono text-[12px] font-medium tracking-[0.06em] text-muted uppercase">
            Texte provisoire · mis à jour le 23 octobre 2026
          </p>
          <h1 className="font-display text-entry leading-[1.05] font-semibold lg:text-entry-lg">
            {title}
          </h1>
          <p className="text-[17px] leading-[1.65] text-muted">{intro}</p>
        </header>
        <ProvisionalNotice />
        <nav
          aria-label="Sommaire"
          className="flex flex-col gap-0.5 rounded-[16px] border border-line px-[18px] py-4"
        >
          <p className="pb-1.5 font-mono text-[12px] font-medium tracking-[0.06em] text-muted uppercase">
            Sommaire
          </p>
          <ol className="flex flex-col">
            {sections.map((section, index) => (
              <li key={section.title}>
                <a
                  href={`#section-${index + 1}`}
                  className="flex min-h-9 items-center gap-2.5 text-[15px] hover:text-accent-text"
                >
                  <span className="font-mono text-[12px] text-muted">{number(index)}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        {sections.map((section, index) => (
          <section
            key={section.title}
            id={`section-${index + 1}`}
            className="flex scroll-mt-6 flex-col gap-2.5"
          >
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em]">
              <span className="mr-2.5 font-mono text-[14px] font-medium text-accent-text">
                {number(index)}
              </span>
              {section.title}
            </h2>
            <div className="flex flex-col gap-2.5 text-[17px] leading-[1.7] text-pretty">
              {section.body}
            </div>
          </section>
        ))}
        <p className="rounded-[16px] bg-surface px-[18px] py-4 text-[15px] leading-[1.6] text-muted">
          Une question ? Écris à <span className="font-medium text-text">[adresse de contact]</span>
          .
        </p>
      </article>
    </div>
  );
}

// Bandeau : rien n'est présenté comme validé tant qu'un juriste n'a pas relu.
function ProvisionalNotice() {
  return (
    <p
      role="note"
      className="rounded-wide border border-warn/50 bg-warn-soft p-4 text-[14px] leading-normal text-text"
    >
      <strong>Version provisoire</strong> (23 octobre 2026), à faire relire et valider par un
      juriste avant toute mise en ligne publique. Les passages entre crochets sont à compléter.
    </p>
  );
}
