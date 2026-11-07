import type { Metadata } from "next";

import { StandaloneError } from "@/components/blocks/error-state";

export const metadata: Metadata = {
  title: "Page introuvable",
};

// 404 hors de la coquille (maquette « Coory Erreurs », D-147, version seule validée le 06/11) : adresse
// inconnue hors de l'espace coach, ou visiteur non connecté. Dans l'espace coach, c'est
// app/(coach)/coach/not-found.tsx, avec le menu et l'en-tête.
export default function NotFound() {
  return <StandaloneError variant="not-found" />;
}
