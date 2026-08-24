import { data, redirect } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { RecipeForm } from "~/components/recipes/RecipeForm";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { getRecipeDetail, updateRecipe } from "~/lib/recipes-api.server";
import { editRecipeSchema } from "~/lib/validation";

import type { Route } from "./+types/recipes.$recipeId.edit";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: loaderData
        ? `Modifier ${loaderData.recipe.recipe.name} · Hearth`
        : "Recettes · Hearth",
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const recipe = await getRecipeDetail(request, params.recipeId);
  if (!recipe) {
    throw data("Introuvable", { status: 404 });
  }
  return { recipe };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = editRecipeSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    await updateRecipe(request, params.recipeId, result.data);
    return redirect(`/recipes/${params.recipeId}`);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }
}

export default function EditRecipe({ loaderData, actionData }: Route.ComponentProps) {
  const fieldErrors = actionData && "errors" in actionData ? actionData.errors : undefined;

  return (
    <div>
      <PageHeader
        back={{ to: `/recipes/${loaderData.recipe.recipe.id}`, label: "← Retour à la recette" }}
        title={`Modifier « ${loaderData.recipe.recipe.name} »`}
      />
      <RecipeForm recipe={loaderData.recipe} fieldErrors={fieldErrors} />
    </div>
  );
}
