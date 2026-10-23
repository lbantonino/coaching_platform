import { EntryShell } from "@/components/layout/entry-shell";

// Pages d'accès (bienvenue, mot de passe, invitation, refus) : même coquille que la connexion
// (prompt Claude Design §5.1).
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <EntryShell>{children}</EntryShell>;
}
