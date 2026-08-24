import { data, redirect } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { RecipeForm } from "~/components/recipes/RecipeForm";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { createRecipe } from "~/lib/recipes-api.server";
import { addRecipeSchema } from "~/lib/validation";

import type { Route } from "./+types/recipes.new";

export function meta() {
  return [{ title: "Nouvelle recette · Hearth" }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = addRecipeSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const { recipe } = await createRecipe(request, result.data);
    return redirect(`/recipes/${recipe.id}`);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }
}

export default function NewRecipe({ actionData }: Route.ComponentProps) {
  const fieldErrors = actionData && "errors" in actionData ? actionData.errors : undefined;

  return (
    <div>
      <PageHeader back={{ to: "/recipes", label: "← Toutes les recettes" }} title="Nouvelle recette" />
      <RecipeForm recipe={null} fieldErrors={fieldErrors} />
    </div>
  );
}
