import { EntryShell } from "@/components/layout/entry-shell";

// Connexion et pages d'accès (mot de passe, e-mail, invitation, lien invalide, accès refusé) :
// colonne du formulaire + photo du coureur (maquette de la connexion, D-139).
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <EntryShell>{children}</EntryShell>;
}
