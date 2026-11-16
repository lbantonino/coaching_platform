import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";
import { sessionCards, type SessionCard } from "@/domain/training/session-cards";
import type { SessionBody } from "@/domain/training/session-v2";
import { sessionHeadline, sessionStats } from "@/domain/training/session-view";

import { SessionCardsView, type CardActions } from "./session-cards";

// Détail d'une séance (maquette 03 : panneau de droite EDT-01 sur ordinateur, page « Une séance »
// EDT-05 sur téléphone ; page d'un modèle de séance ; récap de l'éditeur de séance) : titre, deux
// chiffres clés, puis la séance en CARTES (D-187, test sur iPhone du 15/11/2026 : une carte par étape,
// une grande carte pour ce qui se répète ; plus de pastilles ni de RIR ; jamais de graphique).

type Place = { position?: number; week?: string };

// Ce qu'affiche le détail, quelle que soit la séance (structurée v2, ou publiée en v1 en texte).
export type SessionDetailModel = {
  discipline: Discipline;
  title: string;
  // « Hyrox · Séance 2 ».
  kicker: string;
  // « Circuit · Semaine 1 ».
  line: string;
  stats: { label: string; value: string }[];
  cards: SessionCard[];
};

function Heading({ model, variant }: { model: SessionDetailModel; variant: "panel" | "page" }) {
  return (
    <div className={`flex flex-col ${variant === "page" ? "gap-1.5 px-1" : "gap-1"}`}>
      <span
        className={`text-[11.5px] font-semibold tracking-[0.05em] uppercase ${disciplineStyles[model.discipline].text}`}
      >
        {model.kicker}
      </span>
      <h2
        className={`font-bold tracking-[-0.02em] text-text ${
          variant === "page" ? "text-[24px] leading-[1.15]" : "text-[21px] leading-[1.2]"
        }`}
      >
        {model.title}
      </h2>
      <p className={`text-muted ${variant === "page" ? "text-[13.5px]" : "text-[13px]"}`}>
        {model.line}
      </p>
    </div>
  );
}

function StepBlocks({
  model,
  actions,
}: {
  model: SessionDetailModel;
  actions?: CardActions | undefined;
}) {
  return (
    <>
      {model.stats.length > 0 ? (
        <dl className="grid grid-cols-2 gap-2">
          {model.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-0.5 rounded-[12px] bg-surface-2 px-3 py-2.5"
            >
              <dt className="text-[12px] text-muted">{stat.label}</dt>
              <dd className="text-[15px] font-semibold text-text">{stat.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <SessionCardsView
        cards={model.cards}
        discipline={model.discipline}
        {...(actions ? { actions } : {})}
      />
    </>
  );
}

// Panneau (ordinateur) : tout dans la carte. Page (téléphone, modèle) : le titre au-dessus, la carte
// des chiffres et des étapes en dessous.
export function SessionDetailView({
  model,
  variant = "panel",
  heading = true,
  actions,
}: {
  model: SessionDetailModel;
  variant?: "panel" | "page";
  // Sans titre : dans une feuille dont l'en-tête porte déjà le nom de la séance.
  heading?: boolean;
  // « ⋯ » des cartes : Dupliquer et Supprimer (page du programme, brouillon modifiable).
  actions?: CardActions | undefined;
}) {
  if (variant === "page") {
    return (
      <div className="flex flex-col gap-3">
        <Heading model={model} variant="page" />
        <section className="flex flex-col gap-3.5 rounded-[20px] bg-surface p-3 lg:p-4">
          <StepBlocks model={model} actions={actions} />
        </section>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3.5">
      {heading ? <Heading model={model} variant="panel" /> : null}
      <StepBlocks model={model} actions={actions} />
    </div>
  );
}

// Le modèle d'une séance structurée (brouillon, modèle de séance).
export function sessionDetailModel(
  session: SessionBody,
  variant: "panel" | "page",
  { position, week }: Place,
): SessionDetailModel {
  const discipline = session.content.discipline;
  return {
    discipline,
    title: session.title,
    kicker: [
      disciplineLabels[discipline],
      position ? `Séance ${position}` : null,
      variant === "page" ? week : null,
    ]
      .filter(Boolean)
      .join(" · "),
    line:
      variant === "panel"
        ? [session.sessionType, week].filter(Boolean).join(" · ")
        : `${session.sessionType} · ${sessionHeadline(session)}`,
    stats: sessionStats(session),
    cards: sessionCards(session.content),
  };
}

export function SessionBlocks({
  session,
  variant,
}: {
  session: SessionBody;
  variant: "panel" | "page";
}) {
  return <StepBlocks model={sessionDetailModel(session, variant, {})} />;
}

export function SessionDetail({
  session,
  variant = "panel",
  actions,
  ...place
}: {
  session: SessionBody;
  variant?: "panel" | "page";
  actions?: CardActions | undefined;
} & Place) {
  return (
    <SessionDetailView
      model={sessionDetailModel(session, variant, place)}
      variant={variant}
      actions={actions}
    />
  );
}
