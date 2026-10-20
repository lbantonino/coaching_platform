import { SimpleShell } from "@/components/ui/simple-shell";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return <SimpleShell label="Administration">{children}</SimpleShell>;
}
