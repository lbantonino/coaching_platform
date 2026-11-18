"use client";

import { useRef, useState, type ReactNode } from "react";

import { LEGAL } from "@/config/legal";

// « Télécharger mes données » (Paramètres › Données, et « Supprimer mon compte ») : le fichier est
// demandé par l'app, puis enregistré. Un simple lien « download » échouait en silence (Chrome), ou
// enregistrait la phrase d'erreur à la place du fichier (relecture du 18/11/2026) : ici, un échec
// s'affiche sous le bouton, avec l'adresse du support.

export function ExportButton({
  className,
  wrapperClassName = "flex flex-col gap-2.5",
  children,
}: {
  className: string;
  wrapperClassName?: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<"idle" | "pending" | "error">("idle");
  // Le lien temporaire est posé ICI, dans la fenêtre : hors d'une fenêtre modale, la page est inerte.
  const wrapper = useRef<HTMLDivElement>(null);

  const download = async () => {
    setState("pending");
    try {
      const response = await fetch("/coach/profil/export", { cache: "no-store" });
      if (!response.ok) throw new Error(`Export : ${response.status}`);
      const blob = await response.blob();
      const name =
        /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ??
        "coory-export.json";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.hidden = true;
      (wrapper.current ?? document.body).append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  return (
    <div ref={wrapper} className={wrapperClassName}>
      <button
        type="button"
        onClick={download}
        disabled={state === "pending"}
        aria-busy={state === "pending" || undefined}
        className={className}
      >
        {children}
      </button>
      {state === "error" ? (
        <p role="alert" className="text-[13px] leading-[1.45] font-medium text-alert">
          L&apos;export n&apos;a pas abouti. Réessaie dans un instant ; si ça recommence, écris à{" "}
          <span className="break-all select-all">{LEGAL.contactEmail}</span>.
        </p>
      ) : null}
    </div>
  );
}
