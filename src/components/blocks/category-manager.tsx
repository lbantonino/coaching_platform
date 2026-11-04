"use client";

import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { categoryDotClass } from "@/components/blocks/category-color";
import {
  dlgErrorClass,
  dlgInputClass,
  dlgLabelClass,
  dlgPrimaryButtonClass,
} from "@/components/ui/dialog-styles";
import { ConfirmDialog, DialogBody, DialogFooter } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { Quoted } from "@/components/ui/quoted";
import {
  CATEGORY_COLORS,
  CATEGORY_NAME_MAX,
  categoryColorLabels,
  type CategoryColor,
  type DocumentCategory,
} from "@/domain/documents/documents";
import type { CategoryResult } from "@/features/documents/actions";

// « Gérer les catégories » des Documents (D-67) et des Dépenses (D-73) : le coach range ses documents à sa façon.
// Ajouter, renommer (le nom se modifie sur place, « Enregistrer » apparaît quand il change),
// supprimer (confirmation ; les documents restent, « sans catégorie »). Le rond de couleur ouvre la
// palette (D-68) : l'icône des documents de la catégorie prend cette couleur.
// Kit (boîtes 26 et 28) : liste encadrée (lignes de 54 px : rond de couleur, nom, crayon, corbeille
// rouge), « Nouvelle catégorie » + « Ajouter » violet pâle, « Terminé » dans le pied. La feuille qui
// l'accueille est « bare » : ce composant pose son corps et son pied.
export function CategoryManager({
  categories,
  actions,
  items,
  onDone,
}: {
  // « Terminé » : referme la fenêtre.
  onDone: () => void;
  categories: DocumentCategory[];
  // Ce que la catégorie range, pour le texte de suppression (kit, boîte 29 : « ses dépenses
  // restent » pour une catégorie de dépenses, « ses documents restent » pour les documents).
  items: "documents" | "dépenses";
  actions: {
    create: (name: string) => Promise<CategoryResult>;
    rename: (categoryId: string, name: string) => Promise<CategoryResult>;
    remove: (categoryId: string) => Promise<CategoryResult>;
    recolor: (categoryId: string, color: string) => Promise<CategoryResult>;
  };
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<DocumentCategory | null>(null);

  const run = (call: () => Promise<CategoryResult>, done: string, after?: () => void) =>
    startTransition(async () => {
      const result = await call();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      after?.();
      toast(done);
      router.refresh();
    });

  return (
    <>
      <DialogBody>
        <div className="flex flex-col gap-[18px]">
          <ul
            aria-label={`Catégories de ${items}`}
            className="flex flex-col overflow-hidden rounded-[16px] border border-dlg-field-line"
          >
            {categories.map((category) => (
              <CategoryRow
                key={`${category.id}-${category.name}`}
                category={category}
                pending={pending}
                onRename={(name) =>
                  run(() => actions.rename(category.id, name), "Catégorie renommée.")
                }
                onRecolor={(color) =>
                  run(() => actions.recolor(category.id, color), "Couleur enregistrée.")
                }
                onDelete={() => setDeleting(category)}
              />
            ))}
          </ul>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              run(
                () => actions.create(newName),
                "Catégorie ajoutée.",
                () => setNewName(""),
              );
            }}
            className="flex flex-col gap-2"
          >
            <label htmlFor="new-category" className={dlgLabelClass}>
              Nouvelle catégorie
            </label>
            <div className="flex gap-2.5">
              <input
                id="new-category"
                value={newName}
                maxLength={CATEGORY_NAME_MAX}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Ex. : Certificats médicaux"
                autoComplete="off"
                className={`${dlgInputClass} flex-1`}
              />
              <button
                type="submit"
                disabled={pending || !newName.trim()}
                className="inline-flex h-[50px] shrink-0 items-center gap-1.5 rounded-[12px] bg-dlg-drop-tile px-4 text-[14px] leading-[normal] font-semibold text-dlg-accent-ink transition-[opacity,scale] duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed md:h-[46px]"
              >
                <Plus aria-hidden size={15} strokeWidth={2.4} />
                Ajouter
              </button>
            </div>
          </form>

          {error ? (
            <p role="alert" className={dlgErrorClass}>
              {error}
            </p>
          ) : null}
        </div>
      </DialogBody>
      <DialogFooter
        start
        primary={
          <button type="button" onClick={onDone} className={dlgPrimaryButtonClass}>
            Terminé
          </button>
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          if (!target) return;
          run(
            () => actions.remove(target.id),
            "Catégorie supprimée.",
            () => setDeleting(null),
          );
        }}
        pending={pending}
        title="Supprimer cette catégorie ?"
        confirmLabel={pending ? "Suppression…" : "Supprimer"}
      >
        {deleting ? (
          <>
            <Quoted>{deleting.name}</Quoted> disparaît ; ses {items} restent, «&nbsp;sans
            catégorie&nbsp;».
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

function CategoryRow({
  category,
  pending,
  onRename,
  onRecolor,
  onDelete,
}: {
  category: DocumentCategory;
  pending: boolean;
  onRename: (name: string) => void;
  onRecolor: (color: CategoryColor) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [picking, setPicking] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const changed = name.trim() !== category.name && name.trim() !== "";
  return (
    <li className="group/row flex flex-col">
      {/* 54 px filet compris (kit) : le filet est dans la ligne, pas en plus. */}
      <div className="flex h-[54px] items-center gap-3 border-t border-dlg-divider pr-2 pl-4 group-first/row:border-t-0">
        {/* Rond de 14 px (kit), zone de toucher de 38 px : ouvre la palette. */}
        <button
          type="button"
          onClick={() => setPicking((open) => !open)}
          aria-expanded={picking}
          aria-label={`Couleur de la catégorie ${category.name} : ${categoryColorLabels[category.color]}`}
          className="relative size-[14px] shrink-0 rounded-full before:absolute before:-inset-3 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dlg-accent"
        >
          <span
            aria-hidden
            className={`block size-[14px] rounded-full ${categoryDotClass[category.color]}`}
          />
        </button>
        {/* Le nom se lit comme un texte et se modifie sur place (crayon ou toucher) ; « Enregistrer »
            apparaît quand il change. */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (changed) onRename(name);
          }}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <input
            ref={input}
            value={name}
            maxLength={CATEGORY_NAME_MAX}
            onChange={(event) => setName(event.target.value)}
            aria-label={`Nom de la catégorie ${category.name}`}
            autoComplete="off"
            className="h-[38px] min-w-0 flex-1 rounded-[8px] bg-transparent text-[16px] leading-[normal] font-medium text-text outline-none focus:bg-dlg-field md:text-[15px]"
          />
          {changed ? (
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-[34px] shrink-0 items-center rounded-[10px] bg-cta px-3 text-[13.5px] font-semibold text-on-cta transition-opacity duration-150 disabled:opacity-60"
            >
              Enregistrer
            </button>
          ) : null}
        </form>
        <button
          type="button"
          onClick={() => {
            input.current?.focus();
            input.current?.select();
          }}
          aria-label={`Renommer la catégorie ${category.name}`}
          className="grid size-[38px] shrink-0 place-items-center rounded-[10px] text-dlg-faint transition-colors duration-150 hover:bg-dlg-field hover:text-text"
        >
          <Pencil aria-hidden size={17} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Supprimer la catégorie ${category.name}`}
          className="grid size-[38px] shrink-0 place-items-center rounded-[10px] text-dlg-danger-ink transition-colors duration-150 hover:bg-dlg-danger-soft"
        >
          <Trash2 aria-hidden size={17} strokeWidth={1.8} />
        </button>
      </div>
      {picking ? (
        <div
          role="radiogroup"
          aria-label={`Couleur de la catégorie ${category.name}`}
          className="flex flex-wrap gap-1 px-2 pb-2"
        >
          {CATEGORY_COLORS.map((color) => {
            const current = color === category.color;
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={current}
                aria-label={categoryColorLabels[color]}
                disabled={pending}
                onClick={() => {
                  setPicking(false);
                  if (!current) onRecolor(color);
                }}
                className="inline-flex size-11 items-center justify-center rounded-[10px] transition-colors duration-150 hover:bg-dlg-field"
              >
                <span
                  aria-hidden
                  className={`inline-flex size-7 items-center justify-center rounded-full ${categoryDotClass[color]} ${current ? "ring-2 ring-text ring-offset-2 ring-offset-surface" : ""}`}
                >
                  {current ? <Check size={14} strokeWidth={2.4} className="text-page" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </li>
  );
}
