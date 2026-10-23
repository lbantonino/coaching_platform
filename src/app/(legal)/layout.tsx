import { LegalShell } from "@/components/layout/entry-shell";

// Pages légales : lecture longue de 720 px, sans panneau de marque (prompt Claude Design §5.1).
export default function LegalLayout({ children }: LayoutProps<"/">) {
  return <LegalShell>{children}</LegalShell>;
}
