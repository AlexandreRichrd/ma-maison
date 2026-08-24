import { useState } from "react";
import { Form } from "react-router";

import { Button, Input } from "~/components/ui";
import type { RecipeDetail } from "~/lib/recipes-api.server";
import { UNIT_OPTIONS, type Unit } from "~/lib/units";

type IngredientRow = { key: string; name: string; quantity: string; unit: Unit };
type StepRow = { key: string; text: string };

function newKey(): string {
  return crypto.randomUUID();
}

function errorFor(fieldErrors: Record<string, string[]> | undefined, field: string) {
  return fieldErrors && field in fieldErrors ? (
    <p className="text-sm font-medium text-accent" role="alert">
      {fieldErrors[field][0]}
    </p>
  ) : null;
}

function IngredientRowFields({
  row,
  onChange,
  onRemove,
  onMove,
  isFirst,
  isLast,
}: {
  row: IngredientRow;
  onChange: (row: IngredientRow) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-surface px-2.5 py-2">
      <input
        type="text"
        value={row.name}
        onChange={(event) => onChange({ ...row, name: event.target.value })}
        placeholder="Ingrédient"
        aria-label="Nom de l'ingrédient"
        required
        className="min-w-0 flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
      />
      <input
        type="text"
        inputMode="decimal"
        value={row.quantity}
        onChange={(event) => onChange({ ...row, quantity: event.target.value })}
        placeholder="Qté"
        aria-label="Quantité"
        required
        className="w-16 min-w-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
      />
      <select
        value={row.unit}
        onChange={(event) => onChange({ ...row, unit: event.target.value as Unit })}
        aria-label="Unité"
        className="min-w-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
      >
        {UNIT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isFirst}
        onClick={() => onMove(-1)}
        aria-label="Monter l'ingrédient"
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-sm disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={isLast}
        onClick={() => onMove(1)}
        aria-label="Descendre l'ingrédient"
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-sm disabled:opacity-30"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Supprimer l'ingrédient"
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-sm text-accent"
      >
        ×
      </button>
    </div>
  );
}

function StepRowFields({
  row,
  index,
  onChange,
  onRemove,
  onMove,
  isFirst,
  isLast,
}: {
  row: StepRow;
  index: number;
  onChange: (row: StepRow) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-5 shrink-0 text-right text-sm font-semibold text-muted">
        {index + 1}.
      </span>
      <input
        type="text"
        value={row.text}
        onChange={(event) => onChange({ ...row, text: event.target.value })}
        placeholder="Étape"
        aria-label={`Étape ${index + 1}`}
        required
        className="min-w-0 flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
      />
      <button
        type="button"
        disabled={isFirst}
        onClick={() => onMove(-1)}
        aria-label="Monter l'étape"
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-sm disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={isLast}
        onClick={() => onMove(1)}
        aria-label="Descendre l'étape"
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-sm disabled:opacity-30"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Supprimer l'étape"
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-sm text-accent"
      >
        ×
      </button>
    </div>
  );
}

/** Reorders/adds/removes an array of rows via plain array splicing — no
 * per-row server round-trip. The whole form (ingredients and steps
 * included) is submitted together on save, unlike ChoresSection's
 * subtask editor which persists each row immediately. */
function useRows<T extends { key: string }>(initial: T[]) {
  const [rows, setRows] = useState<T[]>(initial);

  function update(index: number, row: T) {
    setRows((current) => current.map((r, i) => (i === index ? row : r)));
  }

  function remove(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    setRows((current) => {
      const next = [...current];
      const target = index + direction;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function append(row: T) {
    setRows((current) => [...current, row]);
  }

  return { rows, update, remove, move, append };
}

export function RecipeForm({
  recipe,
  fieldErrors,
}: {
  recipe: RecipeDetail | null;
  fieldErrors: Record<string, string[]> | undefined;
}) {
  const ingredients = useRows<IngredientRow>(
    recipe
      ? recipe.ingredients.map((i) => ({
          key: i.id,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        }))
      : [{ key: newKey(), name: "", quantity: "", unit: "UNITE" }],
  );
  const steps = useRows<StepRow>(
    recipe
      ? recipe.steps.map((s) => ({ key: s.id, text: s.text }))
      : [{ key: newKey(), text: "" }],
  );

  return (
    <Form method="post" className="flex max-w-[520px] flex-col gap-5">
      <input type="hidden" name="intent" value={recipe ? "editRecipe" : "addRecipe"} />
      {recipe && <input type="hidden" name="recipeId" value={recipe.recipe.id} />}
      {fieldErrors && "general" in fieldErrors && (
        <p className="text-sm font-medium text-accent" role="alert">
          {fieldErrors.general[0]}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Input label="Nom" name="name" defaultValue={recipe?.recipe.name} required autoFocus />
        {errorFor(fieldErrors, "name")}
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label="Portions"
          name="servings"
          type="number"
          min={1}
          step={1}
          defaultValue={recipe?.recipe.servings ?? 4}
          required
        />
        {errorFor(fieldErrors, "servings")}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-semibold tracking-wide text-muted uppercase">Ingrédients</div>
        {ingredients.rows.map((row, index) => (
          <IngredientRowFields
            key={row.key}
            row={row}
            onChange={(next) => ingredients.update(index, next)}
            onRemove={() => ingredients.remove(index)}
            onMove={(direction) => ingredients.move(index, direction)}
            isFirst={index === 0}
            isLast={index === ingredients.rows.length - 1}
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => ingredients.append({ key: newKey(), name: "", quantity: "", unit: "UNITE" })}
        >
          + Ajouter un ingrédient
        </Button>
        {errorFor(fieldErrors, "ingredients")}
        <input
          type="hidden"
          name="ingredients"
          value={JSON.stringify(
            ingredients.rows.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-semibold tracking-wide text-muted uppercase">Étapes</div>
        {steps.rows.map((row, index) => (
          <StepRowFields
            key={row.key}
            row={row}
            index={index}
            onChange={(next) => steps.update(index, next)}
            onRemove={() => steps.remove(index)}
            onMove={(direction) => steps.move(index, direction)}
            isFirst={index === 0}
            isLast={index === steps.rows.length - 1}
          />
        ))}
        <Button type="button" variant="secondary" onClick={() => steps.append({ key: newKey(), text: "" })}>
          + Ajouter une étape
        </Button>
        {errorFor(fieldErrors, "steps")}
        <input
          type="hidden"
          name="steps"
          value={JSON.stringify(steps.rows.map(({ text }) => ({ text })))}
        />
      </div>

      <Button type="submit">{recipe ? "Enregistrer" : "Créer la recette"}</Button>
    </Form>
  );
}
