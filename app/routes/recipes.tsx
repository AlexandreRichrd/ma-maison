import { PageHeader } from "~/components/layout/PageHeader";
import { RecipeCard } from "~/components/recipes/RecipeCard";
import { getRecipes } from "~/db/queries/recipes.server";

import type { Route } from "./+types/recipes";

export function meta() {
  return [{ title: "Recipes · Hearth" }];
}

export async function loader() {
  const recipes = await getRecipes();
  return { recipes };
}

export default function Recipes({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <PageHeader title="Recipes" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loaderData.recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
