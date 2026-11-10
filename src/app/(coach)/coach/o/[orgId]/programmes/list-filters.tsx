"use client";

import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChipGroup } from "@/components/ui/chip-group";
import { DialogFooter, Sheet } from "@/components/ui/overlay";
import { SelectField } from "@/components/ui/select-field";
import { dlgPrimaryButtonClass } from "@/components/ui/dialog-styles";

// Filtres de la page Programmes (maquette 01, PRG-01 à 06, D-157). Tout est dans l'adresse (lien
// partageable, retour arrière) : chaque choix remplace un paramètre. Ordinateur : menus de 40 px et
// recherche ; téléphone : « Statut : Tous ▾ » + « Filtres » (feuille du bas), recherche de 44 px ;
// onglet Modèles : pastilles de source.

export type FilterOption = { value: string; label: string };

function useQueryUpdate() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
}

// Recherche en direct : écrite dans l'adresse 250 ms après la dernière lettre (comme les Sportifs).
export function ListSearch({ initial, placeholder }: { initial: string; placeholder: string }) {
  const update = useQueryUpdate();
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        update({ q: value.trim() || null });
      }}
      className="flex h-11 min-w-0 items-center gap-2.5 rounded-[12px] bg-surface px-3.5 text-muted inset-ring inset-ring-field-ring focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet lg:h-10 lg:w-[220px] lg:shrink lg:gap-2 lg:rounded-[11px] lg:px-3"
    >
      <Search aria-hidden strokeWidth={2} className="size-[17px] shrink-0 lg:size-[15px]" />
      <label htmlFor="programmes-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="programmes-search"
        type="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const text = event.target.value;
          setValue(text);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => update({ q: text.trim() || null }), 250);
        }}
        className="h-full min-w-0 flex-1 truncate bg-transparent text-[16px] text-text outline-none placeholder:text-faint lg:text-[13.5px]"
      />
    </form>
  );
}

// Un menu qui change un paramètre de l'adresse.
export function QuerySelect({
  name,
  label,
  value,
  options,
  className = "",
}: {
  name: string;
  label: string;
  value: string;
  options: FilterOption[];
  className?: string;
}) {
  const update = useQueryUpdate();
  return (
    <SelectField
      aria-label={label}
      size="sm"
      value={value}
      onChange={(event) => update({ [name]: event.target.value || null })}
      className={className}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </SelectField>
  );
}

// Téléphone, onglet Programmes : « Statut : Tous ▾ » et le bouton « Filtres » (discipline, sportif).
export function PhoneProgramFilters({
  status,
  statusOptions,
  discipline,
  disciplineOptions,
  athlete,
  athleteOptions,
}: {
  status: string;
  statusOptions: FilterOption[];
  discipline: string;
  disciplineOptions: FilterOption[];
  athlete: string;
  athleteOptions: FilterOption[];
}) {
  const update = useQueryUpdate();
  const [open, setOpen] = useState(false);
  const active = (discipline ? 1 : 0) + (athlete ? 1 : 0);
  const current = statusOptions.find((option) => option.value === status) ?? statusOptions[0];
  return (
    <div className="flex gap-2 lg:hidden">
      <label className="relative flex h-11 min-w-0 flex-1 items-center rounded-[12px] bg-surface px-3.5 text-[14px] font-medium text-text inset-ring inset-ring-field-ring focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet">
        <span className="pointer-events-none truncate">
          Statut : <strong className="font-semibold">{current?.label}</strong>
        </span>
        <select
          aria-label="Statut"
          value={status}
          onChange={(event) => update({ statut: event.target.value || null })}
          className="absolute inset-0 cursor-pointer appearance-none rounded-[12px] text-[16px] opacity-0"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          size={14}
          strokeWidth={2}
          className="pointer-events-none ml-auto shrink-0 text-muted"
        />
      </label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[12px] bg-surface px-3.5 text-[14px] font-medium text-text inset-ring inset-ring-field-ring transition-[scale] duration-150 active:scale-[0.98]"
      >
        <SlidersHorizontal aria-hidden size={16} strokeWidth={2} />
        Filtres
        {active > 0 ? (
          <span className="grid size-5 place-items-center rounded-full bg-cta text-[11.5px] font-semibold text-on-cta">
            {active}
          </span>
        ) : null}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filtres"
        footer={
          <DialogFooter
            onCancel={() => setOpen(false)}
            primary={
              <button
                type="button"
                className={dlgPrimaryButtonClass}
                onClick={() => setOpen(false)}
              >
                Voir les programmes
              </button>
            }
          />
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-[13.5px] font-semibold text-text">
            Discipline
            <SelectField
              value={discipline}
              onChange={(event) => update({ discipline: event.target.value || null })}
            >
              {disciplineOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </label>
          <label className="flex flex-col gap-2 text-[13.5px] font-semibold text-text">
            Sportif
            <SelectField
              value={athlete}
              onChange={(event) => update({ sportif: event.target.value || null })}
            >
              {athleteOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </label>
        </div>
      </Sheet>
    </div>
  );
}

// Téléphone, onglet Modèles : pastilles de source (Tous, Coory, Mes modèles) avec leur nombre.
export function PhoneSourceChips({
  value,
  options,
}: {
  value: string;
  options: { value: string; label: string; count: number }[];
}) {
  const update = useQueryUpdate();
  return (
    <ChipGroup
      label="Source des modèles"
      on="page"
      value={value}
      onChange={(next) => update({ source: next === "tous" ? null : next })}
      options={options}
      className="lg:hidden"
    />
  );
}
