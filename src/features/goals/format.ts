import { daysBetween } from "@/lib/format";

// Compte à rebours d'un objectif daté : « J-45 », « Aujourd'hui », ou « Date passée » quand
// l'objectif est toujours en cours alors que sa date est dépassée (le coach doit le clore).
export function goalCountdown(
  today: string,
  targetDate: string,
): { label: string; overdue: boolean } {
  const days = daysBetween(today, targetDate);
  if (days === 0) return { label: "Aujourd'hui", overdue: false };
  if (days > 0) return { label: `J-${days}`, overdue: false };
  return { label: "Date passée", overdue: true };
}
