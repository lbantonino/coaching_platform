"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, inputClass } from "@/components/ui/form-styles";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { CATEGORY_NAME_MAX, type DocumentCategory } from "@/domain/documents/documents";
import type { CategoryResult } from "@/features/documents/actions";

// « Gérer les catégories » de la page Documents (D-67) : le coach range ses documents à sa façon.
// Ajouter, renommer (le nom se modifie sur place, « Enregistrer » apparaît quand il change),
// supprimer (confirmation ; les documents restent, « sans catégorie »).
export function CategoryManager({
  categories,
  actions,
}: {
  categories: DocumentCategory[];
  actions: {
    create: (name: string) => Promise<CategoryResult>;
    rename: (categoryId: string, name: string) => Promise<CategoryResult>;
    remove: (categoryId: string) => Promise<CategoryResult>;
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
    <div className="flex flex-col gap-5">
      <ul aria-label="Catégories de documents" className="flex flex-col">
        {categories.map((category) => (
          <CategoryRow
            key={`${category.id}-${category.name}`}
            category={category}
            pending={pending}
            onRename={(name) => run(() => actions.rename(category.id, name), "Catégorie renommée.")}
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
        <label htmlFor="new-category" className="text-[14px] font-medium">
          Nouvelle catégorie
        </label>
        <div className="flex gap-2">
          <input
            id="new-category"
            value={newName}
            maxLength={CATEGORY_NAME_MAX}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Ex. : Certificats médicaux"
            autoComplete="off"
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button
            type="submit"
            disabled={pending || !newName.trim()}
            className={buttonClass({ variant: "outline", className: "h-[50px] shrink-0" })}
          >
            <Plus aria-hidden size={16} strokeWidth={2} />
            Ajouter
          </button>
        </div>
      </form>

      {error ? (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      ) : null}

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
        {deleting
          ? `« ${deleting.name} » disparaît ; ses documents restent, « sans catégorie ».`
          : null}
      </ConfirmDialog>
    </div>
  );
}

function CategoryRow({
  category,
  pending,
  onRename,
  onDelete,
}: {
  category: DocumentCategory;
  pending: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);
  const changed = name.trim() !== category.name && name.trim() !== "";
  return (
    <li className="flex items-center gap-2 border-t border-line py-2 first:border-t-0">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (changed) onRename(name);
        }}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <input
          value={name}
          maxLength={CATEGORY_NAME_MAX}
          onChange={(event) => setName(event.target.value)}
          aria-label={`Nom de la catégorie ${category.name}`}
          autoComplete="off"
          className={`${inputClass} min-w-0 flex-1`}
        />
        {changed ? (
          <button
            type="submit"
            disabled={pending}
            className={buttonClass({ variant: "primary", className: "h-[50px] shrink-0" })}
          >
            Enregistrer
          </button>
        ) : null}
      </form>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Supprimer la catégorie ${category.name}`}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-alert"
      >
        <Trash2 aria-hidden size={17} strokeWidth={1.8} />
      </button>
    </li>
  );
}
