import { logout } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="h-11 rounded-lg border border-zinc-300 px-4 font-medium dark:border-zinc-700"
      >
        Se déconnecter
      </button>
    </form>
  );
}
