import { EntryShell } from "@/components/layout/entry-shell";

// Connexion et inscription : coquille des pages d'entrée (prompt Claude Design §5.1).
export default function EntryLayout({ children }: LayoutProps<"/">) {
  return <EntryShell>{children}</EntryShell>;
}
