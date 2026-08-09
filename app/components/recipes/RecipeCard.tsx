import { Link } from "react-router";

import { cardClassName } from "~/components/ui";
import type { RecipePreview } from "~/db/queries/recipes.server";

export function RecipeCard({ recipe }: { recipe: RecipePreview }) {
  return (
    <Link to={`/recipes/${recipe.id}`} className={cardClassName}>
      <div className="mb-1 font-serif text-base font-semibold">{recipe.name}</div>
      <div className="text-sm font-medium text-muted">
        {recipe.servings} portions · {recipe.ingredientCount} ingrédients
      </div>
    </Link>
  );
}
