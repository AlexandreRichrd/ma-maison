import { Link } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { RecipeCard } from "~/components/recipes/RecipeCard";
import { getRecipes } from "~/lib/recipes-api.server";

import type { Route } from "./+types/recipes";

export function meta() {
  return [{ title: "Recettes · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const recipes = await getRecipes(request);
  return { recipes };
}

export default function Recipes({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <PageHeader
        title="Recettes"
        action={
          <Link
            to="/recipes/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
          >
            + Nouvelle recette
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loaderData.recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
