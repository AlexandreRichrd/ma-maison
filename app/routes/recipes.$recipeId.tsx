import { data, redirect, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { Button, cardClassName } from "~/components/ui";
import { getRecipeDetail } from "~/db/queries/recipes.server";
import { getShoppingLists } from "~/db/queries/shopping.server";
import { addIngredientsToList } from "~/lib/ingredients.server";
import { addAsNewListSchema, addToExistingListSchema } from "~/lib/validation";

import type { Route } from "./+types/recipes.$recipeId";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData ? `${loaderData.recipe.name} · Hearth` : "Recettes · Hearth" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const detail = await getRecipeDetail(params.recipeId);
  if (!detail) {
    throw data("Introuvable", { status: 404 });
  }
  const shoppingLists = await getShoppingLists();
  return { ...detail, shoppingLists };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "addToExistingList") {
    const result = addToExistingListSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    const outcome = await addIngredientsToList(params.recipeId, {
      listId: result.data.listId,
    });
    const lists = await getShoppingLists();
    const listName = lists.find((l) => l.id === result.data.listId)?.name ?? "la liste";
    return { outcome, listName };
  }

  if (intent === "addAsNewList") {
    const result = addAsNewListSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    const detail = await getRecipeDetail(params.recipeId);
    if (!detail) throw data("Introuvable", { status: 404 });
    const outcome = await addIngredientsToList(params.recipeId, {
      newListName: detail.recipe.name,
    });
    return redirect(`/shopping/${outcome.listId}`);
  }

  throw data("Intention inconnue", { status: 400 });
}

export default function RecipeDetail({ loaderData }: Route.ComponentProps) {
  const { recipe, ingredients, shoppingLists } = loaderData;
  const existingFetcher = useFetcher<typeof action>();
  const newListFetcher = useFetcher<typeof action>();

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
        subtitle={`${recipe.servings} portions`}
      />

      <div className={`${cardClassName} mb-6 max-w-[520px] overflow-hidden p-0`}>
        {ingredients.map((ingredient) => (
          <div
            key={ingredient.id}
            className="flex items-center justify-between border-b border-border px-4.5 py-3 last:border-b-0"
          >
            <span className="text-[15px] font-medium">{ingredient.name}</span>
            <span className="text-sm font-medium text-muted">
              {ingredient.quantity}
              {ingredient.unit ? ` ${ingredient.unit}` : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="max-w-[520px]">
        <div className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
          Ajouter les ingrédients à
        </div>
        <div className="flex flex-wrap gap-2.5">
          <existingFetcher.Form method="post" className="contents">
            <input type="hidden" name="intent" value="addToExistingList" />
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
    </div>
  );
}
