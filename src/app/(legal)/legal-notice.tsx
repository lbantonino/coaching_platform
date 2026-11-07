import Link from "next/link";
import type { ReactNode } from "react";

import { TitleDot } from "@/components/layout/entry-ui";
import { LegalTocAccordion, LegalTocAside } from "@/components/layout/legal-toc";
import { ProvisionalNotice } from "@/components/layout/provisional-notice";
import { LEGAL } from "@/config/legal";

// Gabarit commun des pages légales PROVISOIRES (maquette d'Antonino du 06/11/2026, écrans 04 à 06,
// D-139) : sommaire à gauche (ordinateur) ou en accordéon (téléphone), onglets entre les trois
// documents, titre au point violet, bandeau « Version provisoire », sections numérotées, encadré de
// contact. Rien n'y est présenté comme validé : les passages entre crochets restent à compléter.
const documents = [
  { href: "/conditions", label: "Conditions" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
] as const;

export type LegalSectionData = { title: string; body: ReactNode };

function DocumentTabs({
  current,
  className,
}: {
  current: (typeof documents)[number]["href"];
  className: string;
}) {
  return (
    <nav aria-label="Documents légaux" className={className}>
      {documents.map((document) => {
        const on = document.href === current;
        return (
          <Link
            key={document.href}
            href={document.href}
            aria-current={on ? "page" : undefined}
            className={`flex h-9 items-center justify-center rounded-[10px] px-1.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors duration-150 lg:px-4 lg:text-[13.5px] ${
              on
                ? "bg-dlg-segment-active text-text shadow-[0_1px_2px_rgb(var(--auth-shadow-rgb)/0.08),0_0_0_1px_var(--line-soft)]"
                : "text-dlg-ink-2 hover:text-text"
            }`}
          >
            {document.label}
          </Link>
        );
      })}
    </nav>
  );
}

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
  const titles = sections.map((section) => section.title);
  return (
    <div className="mx-auto grid w-full max-w-[1200px] items-start lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-6 lg:px-10 lg:pt-1 lg:pb-9">
      <div className="max-lg:hidden">
        <LegalTocAside titles={titles} />
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="px-3.5 lg:hidden">
          <DocumentTabs
            current={href}
            className="grid grid-cols-3 gap-1 rounded-[13px] bg-dlg-segment p-1"
          />
        </div>
        <main className="mx-3 mt-3 flex flex-col gap-[22px] rounded-[24px] bg-surface px-[22px] py-[26px] ring-1 ring-line-soft lg:mx-0 lg:mt-0 lg:gap-[26px] lg:rounded-[22px] lg:px-[52px] lg:pt-10 lg:pb-11">
          <DocumentTabs
            current={href}
            className="inline-flex gap-1 self-start rounded-[13px] bg-dlg-segment p-1 max-lg:hidden"
          />
          <header className="flex flex-col gap-2.5 lg:gap-3">
            <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted uppercase lg:text-[11.5px]">
              <span className="max-lg:hidden">Texte provisoire · </span>Mis à jour le{" "}
              {LEGAL.updatedOn}
            </p>
            <h1 className="text-[29px] leading-[1.08] font-extrabold tracking-[-0.04em] text-balance text-text lg:text-[42px] lg:leading-[1.05] lg:tracking-[-0.045em]">
              {title}
              <TitleDot />
            </h1>
            <p className="max-w-[620px] text-[15px] leading-[1.55] text-pretty text-muted lg:text-[16.5px]">
              {intro}
            </p>
          </header>
          <ProvisionalNotice className="lg:[&_p]:text-[14px]" />
          <div className="lg:hidden">
            <LegalTocAccordion titles={titles} />
          </div>
          <hr className="border-line max-lg:hidden" />
          {sections.map((section, index) => (
            <section
              key={section.title}
              id={`section-${index + 1}`}
              className="flex scroll-mt-6 flex-col gap-2"
            >
              <h2 className="flex items-baseline gap-3 text-[17px] leading-[1.25] font-bold tracking-[-0.02em] text-text lg:text-[20px]">
                <span className="text-[13px] font-semibold tracking-normal text-violet tabular-nums">
                  {number(index)}
                </span>
                {section.title}
              </h2>
              <div className="flex flex-col gap-2.5 text-[15px] leading-[1.7] text-pretty text-text-2 lg:text-[15.5px] [&_strong]:font-bold [&_strong]:text-text">
                {section.body}
              </div>
            </section>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-dlg-field px-[18px] py-4">
            <p className="text-[13.5px] font-medium text-muted lg:text-[14px]">
              Une question ? Écris à{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="font-bold text-text">
                {LEGAL.contactEmail}
              </a>
              .
            </p>
            <a
              href={`mailto:${LEGAL.contactEmail}`}
              className="flex h-9 items-center rounded-[10px] bg-cta px-3.5 text-[13px] font-bold text-on-cta transition-colors duration-150 hover:bg-cta-hover"
            >
              Nous écrire
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
