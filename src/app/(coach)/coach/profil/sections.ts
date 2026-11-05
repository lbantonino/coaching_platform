import {
  Download,
  Landmark,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type { SettingsSection } from "@/components/blocks/settings-context";

// Les cinq sections des Paramètres (D-57, D-58 ; kit « Coory Pages », page 13, D-127). Module partagé
// (ni client ni serveur) : la page serveur y lit la section demandée (?onglet=), la fenêtre y lit
// libellés et icônes. `hint` : la phrase sous le titre de la rubrique ; `short` : sa ligne courte
// dans le menu (celle de « Pays, devise et TVA » est calculée : « Belgique · EUR · 21 % »).
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
    label: "Pays, devise et TVA",
    hint: "Ta devise et ton taux de TVA",
    short: "Pays, devise, TVA",
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
] as const satisfies readonly {
  key: SettingsSection;
  label: string;
  hint: string;
  short: string;
  icon: LucideIcon;
}[];
