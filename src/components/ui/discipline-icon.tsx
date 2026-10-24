import { Blend, Dumbbell, Footprints, Zap, type LucideIcon } from "lucide-react";

import type { Discipline } from "@/domain/training/discipline";

// Pictogramme de chaque discipline (maquette d'Antonino du 24/10) : il accompagne toujours le nom,
// dans les pastilles « type de programme » et les filtres de la liste des sportifs.
export const disciplineIcons: Record<Discipline, LucideIcon> = {
  running: Footprints,
  strength: Dumbbell,
  hyrox: Zap,
  hybrid: Blend,
};
