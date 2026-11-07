// Inscription et bienvenue : chaque page pose sa propre coquille (SplitShell), car son panneau visuel
// dépend de ce qui est choisi dans le formulaire (Coach / Sportif, pays et TVA). D-139.
export default function EntryLayout({ children }: LayoutProps<"/">) {
  return children;
}
