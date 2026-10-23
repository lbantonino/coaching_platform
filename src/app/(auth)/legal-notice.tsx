// Bandeau des pages légales provisoires (D-30) : rien n'y est présenté comme validé.
export function ProvisionalNotice() {
  return (
    <p
      role="note"
      className="rounded-[12px] border border-warn/50 bg-warn-soft p-4 text-small text-text"
    >
      <strong>Version provisoire</strong> (23 octobre 2026), à faire relire et valider par un
      juriste avant toute mise en ligne publique. Les passages entre crochets sont à compléter.
    </p>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-title font-medium">{title}</h2>
      <div className="flex flex-col gap-2 text-small text-muted [&_strong]:text-text">
        {children}
      </div>
    </section>
  );
}
