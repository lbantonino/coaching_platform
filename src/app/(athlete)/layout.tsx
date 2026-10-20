import { SimpleShell } from "@/components/ui/simple-shell";

export default function AthleteLayout({ children }: LayoutProps<"/">) {
  return <SimpleShell label="Espace sportif">{children}</SimpleShell>;
}
