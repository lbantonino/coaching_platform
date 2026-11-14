// Ordre de l'onglet Modèles (D-177, 14/11/2026). Les modèles Coory sont posés en une fois par
// supabase/content/modeles_coory.sql : ils ont tous la même date, qui ne peut donc pas les ranger.
// Leur ordre est fixé ici, celui de la liste validée par Antonino : course (5 km, 10 km, semi,
// marathon, seuil, vitesse), musculation (force, hypertrophie), Hyrox, hybride (2 puis 3 sorties).
// Un modèle Coory absent de la liste vient après, du plus récent au plus ancien.
// Numéros : …001 à …004 écrits à la main (Hyrox, 10 km, semi, marathon), …105 à …111 générés.
const COORY_PROGRAM_ORDER = [105, 2, 3, 4, 106, 107, 108, 109, 1, 110, 111].map(
  (n) => `7a000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
);

type OrderedCard = {
  id: string;
  source: "coory" | "mine";
  kind: "program" | "session";
  updatedAt: string;
};

const rank = (card: OrderedCard) => {
  if (card.source !== "coory" || card.kind !== "program") return Infinity;
  const index = COORY_PROGRAM_ORDER.indexOf(card.id);
  return index === -1 ? Infinity : index;
};

// Coory d'abord (comme la maquette), les programmes avant les séances, puis l'ordre fixé des
// modèles Coory, puis les plus récents.
export function compareTemplateCards(a: OrderedCard, b: OrderedCard): number {
  return (
    Number(a.source === "mine") - Number(b.source === "mine") ||
    Number(a.kind === "session") - Number(b.kind === "session") ||
    (rank(a) === rank(b) ? 0 : rank(a) < rank(b) ? -1 : 1) ||
    b.updatedAt.localeCompare(a.updatedAt)
  );
}
