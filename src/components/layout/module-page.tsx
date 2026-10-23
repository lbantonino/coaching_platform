import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";

import type { ModuleInfo } from "./modules";
import { PageBody, PageHeader } from "./page-header";

// Page d'un module pas encore construit (D-32) : son vrai titre et un état vide honnête, sans
// badge « Bientôt » ni faux chiffres. `extra` : ce qui marche déjà (ex. déconnexion du sportif).
export function ModulePage({ info, extra }: { info: ModuleInfo; extra?: ReactNode }) {
  return (
    <>
      <PageHeader title={info.h1} subtitle={info.sub} />
      <PageBody>
        <EmptyState icon={info.icon} title={info.emptyTitle}>
          {info.emptyText}
        </EmptyState>
        {extra}
      </PageBody>
    </>
  );
}
