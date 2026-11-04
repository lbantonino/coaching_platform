import type { AthleteDetail } from "@/features/athletes/queries";

import { AvailabilityForm } from "./availability-form";

// Section « Disponibilités » de la fiche (P2-02 partie 3), d'après la maquette « Sportifs » du
// 03/11/2026 (page 2h) : séances par semaine, durée maximale, jours, contraintes d'organisation. Les blessures et points d'attention (donnée de santé, avec
// l'accord du sportif) sont dans l'onglet Notes (D-56, health-notes-block.tsx).
export function AvailabilitySection({
  organizationId,
  athlete,
}: {
  organizationId: string;
  athlete: AthleteDetail;
}) {
  return (
    <section
      aria-labelledby="availability-title"
      className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft lg:flex-1"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="availability-title"
          className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
        >
          Disponibilités
        </h2>
        <p className="text-[13.5px] leading-[1.5] text-pretty text-muted">
          Le temps dont le sportif dispose. Ce sont des repères pour construire son programme, pas
          une prescription.
        </p>
      </div>

      <AvailabilityForm
        organizationId={organizationId}
        athleteId={athlete.id}
        values={{
          sessionsPerWeek: athlete.sessionsPerWeek?.toString() ?? "",
          maxSessionMinutes: athlete.maxSessionMinutes?.toString() ?? "",
          availableDays: athlete.availableDays,
          scheduleConstraints: athlete.scheduleConstraints ?? "",
          // Non affiché ici (onglet Notes) ; gardé pour le type commun du formulaire.
          healthConstraints: "",
        }}
      />
    </section>
  );
}
