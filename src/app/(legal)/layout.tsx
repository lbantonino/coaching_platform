import { LegalShell } from "@/components/layout/legal-shell";

// Pages légales : en-tête, document, pied (maquette d'Antonino du 06/11/2026, écrans 04 à 06, D-139).
export default function LegalLayout({ children }: LayoutProps<"/">) {
  return <LegalShell>{children}</LegalShell>;
}
