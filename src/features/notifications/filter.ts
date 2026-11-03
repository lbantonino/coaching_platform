// Préférences de la cloche (Paramètres, D-57) : règle PURE. Une catégorie décochée ne compte plus
// dans la cloche et n'apparaît plus dans la page Notifications (ses éléments restent dans leur page).
export type NotifyPreferences = {
  competitions: boolean;
  messages: boolean;
  tasks: boolean;
  unpaid: boolean;
  profiles: boolean;
};

type Counts = Record<keyof NotifyPreferences, number>;

export function enabledTotal(counts: Counts, notify: NotifyPreferences): number {
  return (Object.keys(notify) as (keyof NotifyPreferences)[]).reduce(
    (sum, kind) => sum + (notify[kind] ? counts[kind] : 0),
    0,
  );
}
