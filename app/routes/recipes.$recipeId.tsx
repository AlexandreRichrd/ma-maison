import { useState } from "react";
import { data, Link, redirect, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { Button, cardClassName, Modal } from "~/components/ui";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { deleteRecipe, getRecipeDetail } from "~/lib/recipes-api.server";
import { addIngredientsToList, getShoppingLists } from "~/lib/shopping-api.server";
import { unitLabel } from "~/lib/units";
import { addAsNewListSchema, addToExistingListSchema, deleteRecipeSchema } from "~/lib/validation";

import type { Route } from "./+types/recipes.$recipeId";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData ? `${loaderData.recipe.name} · Hearth` : "Recettes · Hearth" },
  ];
}

function parseServingsParam(raw: string | null): number | undefined {
  if (raw === null) return undefined;
  return /^\d+$/.test(raw) && Number(raw) >= 1 ? Number(raw) : NaN;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const servings = parseServingsParam(url.searchParams.get("servings"));
  if (Number.isNaN(servings)) {
    throw redirect(`/recipes/${params.recipeId}`);
  }

  const detail = await getRecipeDetail(request, params.recipeId, servings);
  if (!detail) {
    throw data("Introuvable", { status: 404 });
  }
  const shoppingLists = await getShoppingLists(request);
  const effectiveServings = servings ?? detail.recipe.servings;
  return { ...detail, shoppingLists, effectiveServings };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "addToExistingList") {
      const result = addToExistingListSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      const outcome = await addIngredientsToList(request, {
        recipeId: params.recipeId,
        listId: result.data.listId,
        servings: result.data.servings,
      });
      const lists = await getShoppingLists(request);
      const listName = lists.find((l) => l.id === result.data.listId)?.name ?? "la liste";
      return { outcome, listName };
    }

    if (intent === "addAsNewList") {
      const result = addAsNewListSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      const detail = await getRecipeDetail(request, params.recipeId);
      if (!detail) throw data("Introuvable", { status: 404 });
      const outcome = await addIngredientsToList(request, {
        recipeId: params.recipeId,
        newListName: detail.recipe.name,
        servings: result.data.servings,
      });
      return redirect(`/shopping/${outcome.listId}`);
    }

    if (intent === "deleteRecipe") {
      const result = deleteRecipeSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await deleteRecipe(request, result.data.recipeId);
      return redirect("/recipes");
    }
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }

  throw data("Intention inconnue", { status: 400 });
}

export default function RecipeDetail({ loaderData }: Route.ComponentProps) {
  const { recipe, ingredients, steps, shoppingLists, effectiveServings } = loaderData;
  const existingFetcher = useFetcher<typeof action>();
  const newListFetcher = useFetcher<typeof action>();
  const deleteFetcher = useFetcher();
  const [deleting, setDeleting] = useState(false);

  const confirmation = (() => {
    const result = existingFetcher.data;
    if (!result || !("outcome" in result)) return null;
    const parts = [];
    if (result.outcome.added > 0) {
      parts.push(`${result.outcome.added} ajouté${result.outcome.added > 1 ? "s" : ""}`);
    }
    if (result.outcome.merged > 0) {
      parts.push(`${result.outcome.merged} fusionné${result.outcome.merged > 1 ? "s" : ""}`);
    }
    return `${parts.join(", ") || "Rien à ajouter"} dans « ${result.listName} ».`;
  })();

  return (
    <div>
      <PageHeader
        back={{ to: "/recipes", label: "← Toutes les recettes" }}
        title={recipe.name}
        action={
          <div className="flex gap-2.5">
            <Link
              to={`/recipes/${recipe.id}/edit`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              Modifier
            </Link>
            <Button variant="secondary" onClick={() => setDeleting(true)}>
              Supprimer
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-semibold text-muted">Portions</span>
        <div className="flex items-center gap-1.5">
          {effectiveServings > 1 ? (
            <Link
              to={`?servings=${effectiveServings - 1}`}
              aria-label="Réduire le nombre de portions"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-lg font-semibold transition-colors hover:bg-surface"
            >
              −
            </Link>
          ) : (
            <span
              aria-hidden
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-lg font-semibold opacity-40"
            >
              −
            </span>
          )}
          <span className="w-8 text-center text-base font-semibold">{effectiveServings}</span>
          <Link
            to={`?servings=${effectiveServings + 1}`}
            aria-label="Augmenter le nombre de portions"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-lg font-semibold transition-colors hover:bg-surface"
          >
            +
          </Link>
        </div>
      </div>

      <div className={`${cardClassName} mb-6 max-w-[520px] overflow-hidden p-0`}>
        {ingredients.map((ingredient) => (
          <div
            key={ingredient.id}
            className="flex items-center justify-between border-b border-border px-4.5 py-3 last:border-b-0"
          >
            <span className="text-[15px] font-medium">{ingredient.name}</span>
            <span className="text-sm font-medium text-muted">
              {ingredient.quantity}
              {unitLabel(ingredient.unit, ingredient.quantity)
                ? ` ${unitLabel(ingredient.unit, ingredient.quantity)}`
                : ""}
            </span>
          </div>
        ))}
      </div>

      {steps.length > 0 && (
        <div className={`${cardClassName} mb-6 max-w-[520px]`}>
          <div className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
            Préparation
          </div>
          <ol className="flex flex-col gap-2.5">
            {steps.map((step, index) => (
              <li key={step.id} className="flex gap-2.5 text-[15px]">
                <span className="shrink-0 font-semibold text-muted">{index + 1}.</span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="max-w-[520px]">
        <div className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
          Ajouter les ingrédients à
        </div>
        <div className="flex flex-wrap gap-2.5">
          <existingFetcher.Form method="post" className="contents">
            <input type="hidden" name="intent" value="addToExistingList" />
            <input type="hidden" name="servings" value={effectiveServings} />
            {shoppingLists.map((list) => (
              <Button
                key={list.id}
                type="submit"
                name="listId"
                value={list.id}
                variant="secondary"
                disabled={existingFetcher.state !== "idle"}
              >
                {list.name}
              </Button>
            ))}
          </existingFetcher.Form>
          <newListFetcher.Form method="post" className="contents">
            <input type="hidden" name="intent" value="addAsNewList" />
            <input type="hidden" name="servings" value={effectiveServings} />
            <Button type="submit" disabled={newListFetcher.state !== "idle"}>
              + Nouvelle liste
            </Button>
          </newListFetcher.Form>
        </div>
        {confirmation && (
          <p className="mt-3 text-sm font-medium text-accent" role="status">
            {confirmation}
          </p>
        )}
      </div>

      <Modal
        open={deleting}
        title={`Supprimer « ${recipe.name} » ?`}
        onClose={() => setDeleting(false)}
        fetcher={deleteFetcher}
        submitLabel="Supprimer"
      >
        <input type="hidden" name="intent" value="deleteRecipe" />
        <input type="hidden" name="recipeId" value={recipe.id} />
        <p className="text-sm font-medium text-muted">
          Les articles déjà ajoutés à une liste de courses depuis cette recette resteront sur
          leur liste. Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
