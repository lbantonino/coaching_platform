import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProgrammesComponentsDemo } from "./demo";

// Page de démonstration TEMPORAIRE des composants communs des écrans Programmes (phase 3a, D-156) :
// pour les comparer aux maquettes avant d'écrire les écrans. Introuvable en production. À SUPPRIMER à
// la fin de la phase 3b, quand les vrais écrans les montrent (pas de vitrine durable : D-150).
export const metadata: Metadata = {
  title: "Composants Programmes (développement)",
  robots: { index: false, follow: false },
};

export default function ProgrammesComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ProgrammesComponentsDemo />;
}
