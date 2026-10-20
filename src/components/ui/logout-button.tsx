import { LogOut } from "lucide-react";

import { logout } from "@/features/auth/actions";

import { buttonClass } from "./button";

export function LogoutButton({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <form action={logout} className={className}>
      <button type="submit" className={buttonClass({ variant: "outline", size })}>
        <LogOut aria-hidden size={16} strokeWidth={1.7} />
        Se déconnecter
      </button>
    </form>
  );
}
