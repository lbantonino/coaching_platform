import type { DetailItem, LinePart } from "@/domain/training/card-lines";
import { isExercise, lineParts } from "@/domain/training/card-lines";
import type { Discipline } from "@/domain/training/discipline";

// Une ligne de séance des cartes repliées de l'agenda (demandes d'Antonino du 10/11) : la durée ou le
// mouvement et son volume en gras, la plage de FC en italique ; une récup, un objectif ou une consigne
// en gris : ils complètent l'exercice au-dessus. Plus de puce de couleur (D-187, test sur iPhone du
// 15/11/2026 : « enlève toutes les petites pastilles »).

// « 130–147 bpm », « 10 min » : l'unité ne part jamais seule à la ligne (espace insécable) ; une plage
// (« 4:50–5:10 ») ne se coupe pas au tiret (gluon U+2060).
export const glue = (text: string) =>
  text
    .replace(/(\d) (bpm|min|km|m|s|kg)\b/g, "$1 $2")
    // « 2:10 /500 m » (ergomètre) et « 4 × 6 » ne se coupent pas en deux lignes.
    .replace(/(\d) (\/500)/g, "$1 $2")
    .replace(/(\d) × (\d)/g, "$1 × $2")
    // « Wall balls 20 », « Hip thrust barre 12 », « Back squat 4 × 6 » : un nombre de répétitions ne
    // part pas seul à la ligne. Une distance (« Farmers carry 200 m ») peut, elle, passer à la ligne.
    .replace(/([a-zà-ÿ]) (\d+)(?=$|[\s ]×)/gi, "$1 $2")
    // « @ 2:10 /500 m » : l'arobase part à la ligne avec l'allure, jamais seule en fin de ligne.
    .replace(/@ (\d)/g, "@ $1")
    .replace(/(\d)–(\d)/g, "$1⁠–⁠$2");

function Rich({ parts }: { parts: LinePart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.tone === "strong" ? (
          <strong key={i} className="font-bold text-text">
            {glue(part.text)}
          </strong>
        ) : part.tone === "soft" ? (
          <em key={i} className="text-text-2 italic">
            {glue(part.text)}
          </em>
        ) : (
          <span key={i}>{glue(part.text)}</span>
        ),
      )}
    </>
  );
}

export function SessionLine({
  text,
  discipline,
  item,
}: {
  text: string;
  discipline: Discipline;
  // Ligne déjà préparée par detailItems() : gras décidé par le domaine.
  item?: DetailItem;
}) {
  const exercise = item ? item.exercise : isExercise(text);
  const parts = item?.parts ?? lineParts(text, discipline);
  return (
    <span className={`block min-w-0 leading-[1.4] ${exercise ? "" : "text-text-2"}`}>
      <Rich parts={parts} />
    </span>
  );
}
