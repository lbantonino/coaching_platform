// Onglets de la page Tâches (prompt Claude Design §7 `/coach/taches`) : Toutes, Aujourd'hui (échéance
// aujourd'hui ou dépassée), À venir (plus tard ou sans échéance), Terminées. Dates AAAA-MM-JJ.
export type TaskTab = "toutes" | "aujourdhui" | "avenir" | "terminees";

export type TaskLike = { dueOn: string | null; done: boolean };

export function inTab(task: TaskLike, tab: TaskTab, today: string): boolean {
  switch (tab) {
    case "toutes":
      return true;
    case "terminees":
      return task.done;
    case "aujourdhui":
      return !task.done && task.dueOn !== null && task.dueOn <= today;
    case "avenir":
      return !task.done && (task.dueOn === null || task.dueOn > today);
  }
}
