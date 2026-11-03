// Clés des notifications (4e, D-61). Une notification est calculée à partir des vraies données ; sa
// clé ne garde que ce qui la définit, pour que le coach puisse la marquer lue ou la masquer. Si la
// situation change (nouvelle échéance, nouveau message), la clé change : la notification revient,
// non lue. Même règle que la base : préfixe connu, chiffres, lettres minuscules, « : » et « - ».
export const NOTIFICATION_KEY = /^(competition|message|task|unpaid|profile):[0-9a-z:-]{1,120}$/;

export const competitionKey = (goalId: string, date: string) => `competition:${goalId}:${date}`;
// Message : le sportif et son dernier message non lu.
export const messageKey = (athleteId: string, lastUnreadId: string) =>
  `message:${athleteId}:${lastUnreadId}`;
export const taskKey = (taskId: string, dueOn: string | null) =>
  `task:${taskId}:${dueOn ?? "sans-date"}`;
// Séance à encaisser (D-90) : la séance et la date de la série (une fois payée, elle disparaît).
export const unpaidKey = (sessionId: string, date: string) => `unpaid:${sessionId}:${date}`;
export const profileKey = (athleteId: string) => `profile:${athleteId}`;

export function isNotificationKey(key: unknown): key is string {
  return typeof key === "string" && NOTIFICATION_KEY.test(key);
}

export type NotificationState = { read: boolean; dismissed: boolean };

// À partir des lignes lues en base : l'état de chaque clé (absente = non lue, visible).
export function stateMap(
  rows: { key: string; read_at: string | null; dismissed_at: string | null }[],
): Map<string, NotificationState> {
  return new Map(
    rows.map((row) => [
      row.key,
      { read: row.read_at !== null, dismissed: row.dismissed_at !== null },
    ]),
  );
}

// Compte ce qui attend vraiment : ni lu, ni masqué.
export function countUnread(keys: string[], states: Map<string, NotificationState>): number {
  return keys.filter((key) => {
    const state = states.get(key);
    return !state?.read && !state?.dismissed;
  }).length;
}

// Le dernier message non lu de chaque sportif (lignes triées du plus récent au plus ancien).
export function latestUnreadByAthlete(
  rows: { id: string; athlete_id: string }[],
): Map<string, string> {
  const latest = new Map<string, string>();
  for (const row of rows) if (!latest.has(row.athlete_id)) latest.set(row.athlete_id, row.id);
  return latest;
}
