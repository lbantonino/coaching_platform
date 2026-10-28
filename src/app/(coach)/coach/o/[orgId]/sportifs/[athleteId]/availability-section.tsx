import type { AthleteDetail } from "@/features/athletes/queries";

import { AvailabilityForm } from "./availability-form";

// Section « Disponibilités » de la fiche (P2-02 partie 3) : séances par semaine, durée maximale,
// jours, contraintes d'organisation. Les blessures et points d'attention (donnée de santé, avec
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
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="availability-title" className="text-title font-medium">
          Disponibilités
        </h2>
        <p className="text-small text-muted">
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
