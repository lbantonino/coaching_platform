import {
  Download,
  FileText,
  Landmark,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type { SettingsSection } from "@/components/blocks/settings-context";

// Les six sections des Paramètres (D-57, D-58 ; kit « Coory Pages », page 13, D-127). Module partagé
// (ni client ni serveur) : la page serveur y lit la section demandée (?onglet=), la fenêtre y lit
// libellés et icônes. `hint` : la phrase sous le titre de la rubrique ; `short` : sa ligne courte
// dans le menu (celle de « Pays et devise » est calculée : « Belgique · EUR »). La TVA n'est plus un
// réglage : elle se choisit à chaque paiement, dépense ou séance (D-163).
export const SECTIONS = [
  {
    key: "profil",
    label: "Profil",
    hint: "Photo, nom, entreprise, organisation",
    short: "Nom, photo",
    icon: UserRound,
  },
  {
    key: "preferences",
    label: "Préférences",
    hint: "Thème, valeurs par défaut, agenda, notifications",
    short: "Thème, agenda, alertes",
    icon: SlidersHorizontal,
  },
  {
    key: "argent",
    label: "Pays et devise",
    hint: "Ton pays et ta devise",
    short: "Pays, devise",
    icon: Landmark,
  },
  {
    key: "securite",
    label: "Sécurité",
    hint: "E-mail, mot de passe, appareils",
    short: "E-mail, mot de passe",
    icon: ShieldCheck,
  },
  {
    key: "donnees",
    label: "Données",
    hint: "Exporter toutes tes données",
    short: "Exporter",
    icon: Download,
  },
  // Onglet « Légal » (maquette d'Antonino du 06/11/2026, écran 07, D-139), marqué « Nouveau ».
  {
    key: "legal",
    label: "Légal",
    hint: "Les documents qui encadrent l’utilisation de Coory.",
    short: "Conditions, confidentialité",
    icon: FileText,
    isNew: true,
  },
] as const satisfies readonly {
  key: SettingsSection;
  label: string;
  hint: string;
  short: string;
  icon: LucideIcon;
  isNew?: boolean;
}[];
