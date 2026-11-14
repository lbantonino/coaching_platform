import type { AssistantProposal } from "./proposals";

// Cartes de l'Assistant IA (lot 1 des actions, spec §5.2) : règles PURES de l'état d'une carte dans
// la conversation. Une carte ne s'exécute qu'une fois ; une carte liée (sportif créé par une autre
// carte) attend cette carte, et devient impossible si elle est annulée ou échoue.

export type CardStatus = "pending" | "running" | "done" | "cancelled" | "error" | "blocked";
export type CardState = AssistantProposal & { status: CardStatus; result?: string; href?: string };

export const toCards = (proposals: AssistantProposal[]): CardState[] =>
  proposals.map((proposal) => ({ ...proposal, status: "pending" }));

export function canValidate(cards: CardState[], id: string): boolean {
  const card = cards.find((item) => item.id === id);
  if (!card || card.status !== "pending") return false;
  if (!card.dependsOn) return true;
  return cards.find((item) => item.id === card.dependsOn)?.status === "done";
}

// « Valider » : la carte passe en cours, seulement si elle peut l'être (sinon rien ne change : pas de
// double exécution).
export function startCard(cards: CardState[], id: string): CardState[] {
  if (!canValidate(cards, id)) return cards;
  return cards.map((card) => (card.id === id ? { ...card, status: "running" } : card));
}

// Carte faite : son lien, et ses cartes liées reçoivent l'identifiant du sportif créé.
export function resolveCard(
  cards: CardState[],
  id: string,
  href: string,
  createdAthleteId?: string,
): CardState[] {
  return cards.map((card) => {
    if (card.id === id) return { ...card, status: "done", href };
    if (card.dependsOn === id && createdAthleteId) {
      return { ...card, params: { ...card.params, athlete: { athleteId: createdAthleteId } } };
    }
    return card;
  });
}

// Carte annulée ou en échec : ses cartes liées encore en attente deviennent impossibles.
export function blockDependents(cards: CardState[], id: string, reason: string): CardState[] {
  return cards.map((card) =>
    card.dependsOn === id && card.status === "pending"
      ? { ...card, status: "blocked", result: reason }
      : card,
  );
}

// Ce que l'assistant apprend à la demande suivante.
// « Compléter la fiche » et « Modifier ton profil » (lot 6) : seulement les noms des champs (décision
// d'Antonino du 14/11) ; les valeurs (e-mail, téléphone, adresse…) restent sur la carte et ne partent
// jamais chez Claude.
export function noteFor(card: AssistantProposal, outcome: "done" | "cancelled"): string {
  const label = (line: string) => line.split(" : ")[0] ?? line;
  const lines =
    card.kind === "completer_fiche"
      ? card.summary.map((line, index) => (index === 0 ? line : label(line)))
      : card.kind === "modifier_profil"
        ? card.summary.map(label)
        : card.summary;
  return `[${outcome === "done" ? "Fait" : "Annulé"} : ${[card.title, ...lines].join(" · ")}]`;
}
