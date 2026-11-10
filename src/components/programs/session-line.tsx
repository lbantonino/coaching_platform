import type { DetailItem, LinePart } from "@/domain/training/card-lines";
import { isExercise, lineParts } from "@/domain/training/card-lines";
import type { Discipline } from "@/domain/training/discipline";

// Une ligne de séance, la même partout (cartes de l'agenda, panneau de l'éditeur, page d'un modèle ;
// demandes d'Antonino du 10/11) : une puce à la couleur de la discipline devant chaque exercice,
// centrée sur la première ligne (0,7 em = la moitié de l'interligne 1,4) ; la durée ou le mouvement
// et son volume en gras, la plage de FC en italique. Une récup, un objectif ou une consigne n'ont pas
// de puce mais restent alignés sur le texte, en gris : ils complètent l'exercice au-dessus.

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
  dot,
  item,
}: {
  text: string;
  discipline: Discipline;
  // Classe de couleur de la puce (bg-run-fill…).
  dot: string;
  // Ligne déjà préparée par detailItems() (panneau) : puce et gras décidés par le domaine.
  item?: DetailItem;
}) {
  const exercise = item ? item.exercise : isExercise(text);
  const parts = item?.parts ?? lineParts(text, discipline);
  return (
    <span className={`flex items-start gap-1.5 leading-[1.4] ${exercise ? "" : "text-text-2"}`}>
      <span
        aria-hidden
        className={`mt-[calc(0.7em_-_2.5px)] size-[5px] shrink-0 rounded-full ${exercise ? dot : "invisible"}`}
      />
      <span className="min-w-0">
        <Rich parts={parts} />
      </span>
    </span>
  );
}
