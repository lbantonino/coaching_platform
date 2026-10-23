import { redirect } from "next/navigation";

// Plus de page d'accueil publique : on arrive directement sur la connexion (lien vers l'inscription).
// Déjà connecté : le proxy renvoie /login vers son espace.
export default function Home() {
  redirect("/login");
}
