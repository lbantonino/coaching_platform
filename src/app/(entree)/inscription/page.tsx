import type { Metadata } from "next";

import { SocialButtons } from "@/components/layout/social-buttons";

import { SignupView } from "./signup-form";

export const metadata: Metadata = {
  title: "Créer un compte",
};

// Inscription (maquette d'Antonino du 06/11/2026, écran 02, D-139) : coach ou sportif, code d'accès
// de la bêta privée (D-140). Les boutons Google / Facebook / Apple (composant serveur, seulement
// s'ils sont configurés) sont passés à la vue, qui pose sa coquille : son panneau dépend du type de
// compte choisi.
export default function SignupPage() {
  return <SignupView social={<SocialButtons />} />;
}
