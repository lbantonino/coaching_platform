import {
  Download,
  Landmark,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type { SettingsSection } from "@/components/blocks/settings-context";

// Les cinq sections des Paramètres (D-57, D-58). Module partagé (ni client ni serveur) : la page
// serveur y lit la section demandée (?onglet=), la fenêtre et le panneau y lisent libellés et icônes.
export const SECTIONS = [
  { key: "profil", label: "Profil", hint: "Photo, nom, entreprise, organisation", icon: UserRound },
  {
    key: "preferences",
    label: "Préférences",
    hint: "Thème, valeurs par défaut, agenda, notifications",
    icon: SlidersHorizontal,
  },
  {
    key: "facturation",
    label: "Facturation et légal",
    hint: "Tes structures : TVA, adresse, IBAN",
    icon: Landmark,
  },
  {
    key: "securite",
    label: "Sécurité",
    hint: "E-mail, mot de passe, appareils",
    icon: ShieldCheck,
  },
  { key: "donnees", label: "Données", hint: "Exporter toutes tes données", icon: Download },
] as const satisfies readonly {
  key: SettingsSection;
  label: string;
  hint: string;
  icon: LucideIcon;
}[];
