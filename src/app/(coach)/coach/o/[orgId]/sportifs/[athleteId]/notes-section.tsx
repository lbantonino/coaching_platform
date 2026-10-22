import { getAthleteNotes } from "@/features/notes/queries";
import { formatDateTime } from "@/lib/format";

import { NoteForm } from "./note-form";

// Onglet « Notes » (P2-03 fin) : la note privée du coach et le message visible par le sportif.
export async function NotesSection({
  organizationId,
  athleteId,
  hasAccount,
}: {
  organizationId: string;
  athleteId: string;
  hasAccount: boolean;
}) {
  const notes = await getAthleteNotes(organizationId, athleteId);

  return (
    <section
      aria-labelledby="notes-title"
      className="flex flex-col gap-6 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="notes-title" className="text-title font-medium">
          Notes du coach
        </h2>
        <p className="text-small text-muted">
          Deux notes séparées : l&apos;une reste entre coachs, l&apos;autre s&apos;affiche dans
          l&apos;espace du sportif. Vider une note puis l&apos;enregistrer la supprime.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <NoteForm
          organizationId={organizationId}
          athleteId={athleteId}
          visibility="coach"
          label="Note privée"
          hint="Visible seulement par les coachs de ton organisation. Pas de blessures ni de données de santé ici : utilise « Contraintes physiques », avec l'accord du sportif."
          placeholder="Ex. : très investie, progresse bien sur les séances longues ; vise la catégorie Pro"
          body={notes.coach?.body ?? ""}
        />
        {notes.coach ? (
          <p className="text-caption text-faint">
            Mise à jour le {formatDateTime(notes.coach.updatedAt)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-6">
        <NoteForm
          organizationId={organizationId}
          athleteId={athleteId}
          visibility="athlete"
          label="Message au sportif"
          hint={
            hasAccount
              ? "Le sportif le lit dans son espace, sous « Message de ton coach »."
              : "Le sportif le lira dans son espace une fois son compte activé."
          }
          placeholder="Ex. : semaine de reprise, garde l'endurance vraiment facile"
          body={notes.athlete?.body ?? ""}
        />
        {notes.athlete ? (
          <p className="text-caption text-faint">
            Mis à jour le {formatDateTime(notes.athlete.updatedAt)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
