import { detailItems } from "@/domain/training/card-lines";
import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";
import type { SessionBody } from "@/domain/training/session-v2";
import {
  sessionHeadline,
  sessionStats,
  sessionSteps,
  type ViewStep,
} from "@/domain/training/session-view";

import { SessionLine } from "./session-line";

// Détail d'une séance (maquette 03 : panneau de droite EDT-01 sur ordinateur, page « Une séance »
// EDT-05 sur téléphone ; page d'un modèle de séance ; onglet Programme de la fiche d'un sportif) :
// titre, deux chiffres clés, puis chaque étape (jamais de graphique : règle 2 du dossier de design).
// Le filet suit la discipline ; échauffement et retour au calme restent neutres. Dans une étape, une
// info par ligne avec les règles des cartes de l'agenda (demande d'Antonino du 10/11 : puces, gras),
// en entier : noms complets, et en musculation la charge, le RIR et le repos.

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
  steps: ViewStep[];
};

function Heading({ model, variant }: { model: SessionDetailModel; variant: "panel" | "page" }) {
  return (
    <div className={`flex flex-col ${variant === "page" ? "gap-1.5 px-1" : "gap-1"}`}>
      <span className="flex items-center gap-[7px] text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase">
        <span
          aria-hidden
          className={`size-[7px] rounded-full ${disciplineStyles[model.discipline].dot}`}
        />
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

function StepBlocks({ model, variant }: { model: SessionDetailModel; variant: "panel" | "page" }) {
  const { discipline } = model;
  const page = variant === "page";
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
      <ol className="flex flex-col gap-1.5">
        {model.steps.map((step, i) => {
          const neutral = /^(échauffement|retour au calme)/i.test(step.title);
          const items = detailItems(step, discipline);
          return (
            <li
              key={i}
              className={`flex min-w-0 gap-2.5 rounded-[12px] px-3 inset-ring inset-ring-line ${page ? "py-[11px]" : "py-2.5"}`}
            >
              <span
                aria-hidden
                className={`w-[3px] shrink-0 rounded-[2px] ${neutral ? "bg-dlg-disabled" : disciplineStyles[discipline].dot}`}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className={`flex justify-between gap-2 font-semibold text-text ${page ? "text-[14px]" : "text-[13.5px]"}`}
                >
                  <span className="min-w-0">{step.title}</span>
                  {step.badge ? <span className="whitespace-nowrap">{step.badge}</span> : null}
                </span>
                {items.length > 0 ? (
                  <span
                    className={`mt-0.5 flex flex-col gap-0.5 text-text ${page ? "text-[13px]" : "text-[12.5px]"}`}
                  >
                    {items.map((item, j) => (
                      <SessionLine
                        key={j}
                        text={item.text}
                        discipline={discipline}
                        dot={disciplineStyles[discipline].dot}
                        item={item}
                      />
                    ))}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

// Panneau (ordinateur) : tout dans la carte. Page (téléphone, modèle) : le titre au-dessus, la carte
// des chiffres et des étapes en dessous.
export function SessionDetailView({
  model,
  variant = "panel",
  heading = true,
}: {
  model: SessionDetailModel;
  variant?: "panel" | "page";
  // Sans titre : dans une feuille dont l'en-tête porte déjà le nom de la séance.
  heading?: boolean;
}) {
  if (variant === "page") {
    return (
      <div className="flex flex-col gap-3">
        <Heading model={model} variant="page" />
        <section className="flex flex-col gap-3.5 rounded-[20px] bg-surface p-4">
          <StepBlocks model={model} variant="page" />
        </section>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3.5">
      {heading ? <Heading model={model} variant="panel" /> : null}
      <StepBlocks model={model} variant="panel" />
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
    steps: sessionSteps(session),
  };
}

export function SessionBlocks({
  session,
  variant,
}: {
  session: SessionBody;
  variant: "panel" | "page";
}) {
  return <StepBlocks model={sessionDetailModel(session, variant, {})} variant={variant} />;
}

export function SessionDetail({
  session,
  variant = "panel",
  ...place
}: { session: SessionBody; variant?: "panel" | "page" } & Place) {
  return (
    <SessionDetailView model={sessionDetailModel(session, variant, place)} variant={variant} />
  );
}
