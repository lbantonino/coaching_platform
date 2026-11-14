"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { DlgDate, DlgField, DlgHint } from "@/components/ui/dialog-fields";
import {
  dlgErrorClass,
  dlgFormGridClass,
  dlgInputClass,
  dlgPrimaryButtonClass,
  dlgSpanFull,
} from "@/components/ui/dialog-styles";
import { DialogBody, DialogFooter, Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { periodsOverlap, programEnd } from "@/domain/training/program-status";
import { createProgram } from "@/features/programs/actions";
import { freeStart, mondayOf, templateUseInput } from "@/features/programs/template-use";
import type { WizardAthlete, WizardTemplate } from "@/features/programs/wizard";

import { AthletePicker } from "../../nouveau/program-wizard";

// « Utiliser ce modèle » en direct (demande d'Antonino du 14/11/2026, D-178) : sur la page d'un
// modèle, par-dessus son contenu, on choisit le sportif ; le titre (nom du modèle) et le début (son
// premier lundi libre) sont déjà remplis, et « Créer le programme » ouvre le brouillon dans l'éditeur,
// avec tout ce que dit le modèle. « Plus d'options » garde l'assistant complet.
// Ouverture : les boutons « Utiliser » de l'éditeur envoient USE_TEMPLATE_EVENT ; depuis la liste des
// modèles, l'adresse ?utiliser=1 l'ouvre dès l'arrivée.
export const USE_TEMPLATE_EVENT = "coory:utiliser-modele";
export const openUseTemplate = () => window.dispatchEvent(new CustomEvent(USE_TEMPLATE_EVENT));

const dayFormat = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const formatDay = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`));
const dayBefore = (iso: string) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

const moreLinkClass =
  "mr-auto inline-flex h-[46px] shrink-0 items-center rounded-[12px] px-3.5 text-[14.5px] leading-[normal] font-semibold whitespace-nowrap text-text-2 transition-[background-color,scale] duration-150 hover:bg-dlg-tile active:scale-[0.98]";

export function UseTemplateSheet({
  organizationId,
  base,
  template,
  athletes,
  defaultStartDate,
  openOnLoad,
}: {
  organizationId: string;
  base: string;
  template: WizardTemplate;
  athletes: WizardAthlete[];
  defaultStartDate: string;
  openOnLoad: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(openOnLoad);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState(template.title);
  const [startDate, setStartDate] = useState(defaultStartDate);
  // La date a été choisie à la main : changer de sportif ne la remplace plus.
  const [dateTouched, setDateTouched] = useState(false);
  const [snapped, setSnapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(USE_TEMPLATE_EVENT, show);
    return () => window.removeEventListener(USE_TEMPLATE_EVENT, show);
  }, []);

  const athlete = athletes.find((item) => item.id === athleteId);
  const overlapping = (athlete?.programs ?? []).filter(
    (program) =>
      program.status === "published" &&
      periodsOverlap({ startDate, weeksCount: template.weeksCount }, program),
  );
  const ready = athlete !== undefined && title.trim().length > 0 && !pending;

  const close = () => {
    setOpen(false);
    setError(null);
    // Arrivé depuis la liste (?utiliser=1) : une fois fermée, la fenêtre ne se rouvre pas au rechargement.
    const url = new URL(window.location.href);
    if (url.searchParams.has("utiliser")) {
      url.searchParams.delete("utiliser");
      window.history.replaceState(window.history.state, "", url);
    }
  };

  const choose = (next: WizardAthlete) => {
    setAthleteId(next.id);
    setError(null);
    if (!dateTouched) {
      setStartDate(freeStart(next, defaultStartDate));
      setSnapped(false);
    }
  };

  const submit = () => {
    if (!athlete) return;
    setError(null);
    startTransition(async () => {
      const result = await createProgram(
        organizationId,
        templateUseInput({ template, athlete, title, startDate }),
      );
      if (!result.ok) return setError(result.issues?.[0] ?? result.message);
      toast("Brouillon créé.");
      setOpen(false);
      router.push(`${base}/${result.programId}`);
    });
  };

  const moreHref = `${base}/nouveau?modele=${template.id}${athleteId ? `&sportif=${athleteId}` : ""}`;

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Utiliser ce modèle"
      subtitle={`${template.title} · ${template.detail}`}
      bare
    >
      <DialogBody>
        <form
          id="use-template-form"
          className={dlgFormGridClass}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (ready) submit();
          }}
        >
          <div className={dlgSpanFull}>
            <AthletePicker
              athletes={athletes}
              selected={athleteId}
              query={query}
              onQuery={setQuery}
              onChoose={choose}
            />
          </div>
          <DlgField label="Titre du programme" htmlFor="use-template-title">
            <input
              id="use-template-title"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              className={dlgInputClass}
            />
          </DlgField>
          <DlgField label="Début" htmlFor="use-template-start">
            <DlgDate
              id="use-template-start"
              value={startDate}
              required
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                const monday = mondayOf(value);
                setStartDate(monday);
                setSnapped(monday !== value);
                setDateTouched(true);
              }}
            />
          </DlgField>
          <DlgHint live>
            Du {formatDay(startDate)} au{" "}
            {formatDay(dayBefore(programEnd(startDate, template.weeksCount)))}
            {snapped ? " · les semaines commencent le lundi" : ""}
          </DlgHint>
          {overlapping.length > 0 ? (
            <p
              role="status"
              className={`${dlgSpanFull} rounded-[12px] bg-warn-soft px-3 py-2.5 text-[12.5px] leading-[1.45] text-text-2`}
            >
              Ces dates chevauchent{" "}
              {overlapping.map((program) => `« ${program.title} »`).join(", ")}, déjà publié. Le
              brouillon se crée, mais il ne pourra être publié qu&apos;après un changement de dates.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className={dlgErrorClass}>
              {error}
            </p>
          ) : null}
        </form>
      </DialogBody>
      <DialogFooter
        onCancel={close}
        destructive={
          <Link href={moreHref} className={moreLinkClass}>
            Plus d&apos;options
          </Link>
        }
        primary={
          <button
            type="submit"
            form="use-template-form"
            disabled={!ready}
            className={dlgPrimaryButtonClass}
          >
            {pending ? "Création…" : "Créer le programme"}
          </button>
        }
      />
    </Sheet>
  );
}
