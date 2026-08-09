import { asc, count, eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { recipeIngredients, recipes, type Recipe } from "~/db/schema";

export type RecipePreview = Recipe & { ingredientCount: number };

export async function getRecipes(): Promise<RecipePreview[]> {
  const rows = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      servings: recipes.servings,
      instructions: recipes.instructions,
      createdAt: recipes.createdAt,
      updatedAt: recipes.updatedAt,
      ingredientCount: count(recipeIngredients.id),
    })
    .from(recipes)
    .leftJoin(recipeIngredients, eq(recipeIngredients.recipeId, recipes.id))
    .groupBy(recipes.id)
    .orderBy(asc(recipes.createdAt));

  return rows;
}

export async function getRecipeDetail(recipeId: string) {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);
  if (!recipe) return null;

  const ingredients = await db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, recipeId))
    .orderBy(asc(recipeIngredients.position));

  return { recipe, ingredients };
}
