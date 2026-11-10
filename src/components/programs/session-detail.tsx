import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import type { SessionBody } from "@/domain/training/session-v2";
import { sessionHeadline, sessionStats, sessionSteps } from "@/domain/training/session-view";

// Détail d'une séance (maquette 03 : panneau de droite EDT-01 sur ordinateur, page « Une séance »
// EDT-05 sur téléphone ; page d'un modèle de séance) : titre, deux chiffres clés, puis une ligne par
// étape (jamais de graphique : règle 2 du dossier de design). Le filet suit la discipline ;
// échauffement et retour au calme restent neutres.

type Place = { position?: number; week?: string };

export function SessionHeading({
  session,
  position,
  week,
  variant,
}: { session: SessionBody; variant: "panel" | "page" } & Place) {
  const discipline = session.content.discipline;
  const kicker = [
    disciplineLabels[discipline],
    position ? `Séance ${position}` : null,
    variant === "page" ? week : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const line =
    variant === "panel"
      ? [session.sessionType, week].filter(Boolean).join(" · ")
      : `${session.sessionType} · ${sessionHeadline(session)}`;
  return (
    <div className={`flex flex-col ${variant === "page" ? "gap-1.5 px-1" : "gap-1"}`}>
      <span className="flex items-center gap-[7px] text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase">
        <span
          aria-hidden
          className={`size-[7px] rounded-full ${disciplineStyles[discipline].dot}`}
        />
        {kicker}
      </span>
      <h2
        className={`font-bold tracking-[-0.02em] text-text ${
          variant === "page" ? "text-[24px] leading-[1.15]" : "text-[21px] leading-[1.2]"
        }`}
      >
        {session.title}
      </h2>
      <p className={`text-muted ${variant === "page" ? "text-[13.5px]" : "text-[13px]"}`}>{line}</p>
    </div>
  );
}

export function SessionBlocks({
  session,
  variant,
}: {
  session: SessionBody;
  variant: "panel" | "page";
}) {
  const discipline = session.content.discipline;
  const page = variant === "page";
  return (
    <>
      <dl className="grid grid-cols-2 gap-2">
        {sessionStats(session).map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-0.5 rounded-[12px] bg-surface-2 px-3 py-2.5"
          >
            <dt className="text-[12px] text-muted">{stat.label}</dt>
            <dd className="text-[15px] font-semibold text-text">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <ol className="flex flex-col gap-1.5">
        {sessionSteps(session).map((step, i) => {
          const neutral = /^(échauffement|retour au calme)/i.test(step.title);
          const detail = step.repeat ? step.repeat.lines.join(" + ") : step.lines.join(" · ");
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
                {detail ? (
                  <span
                    className={`leading-[1.45] text-muted ${page ? "text-[13px]" : "text-[12.5px]"}`}
                  >
                    {detail}
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
export function SessionDetail({
  session,
  variant = "panel",
  ...place
}: { session: SessionBody; variant?: "panel" | "page" } & Place) {
  if (variant === "page") {
    return (
      <div className="flex flex-col gap-3">
        <SessionHeading session={session} variant="page" {...place} />
        <section className="flex flex-col gap-3.5 rounded-[20px] bg-surface p-4">
          <SessionBlocks session={session} variant="page" />
        </section>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3.5">
      <SessionHeading session={session} variant="panel" {...place} />
      <SessionBlocks session={session} variant="panel" />
    </div>
  );
}
