import { ApiRequestError, apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

// Mirrors the API's JSON response shape, not the Drizzle-inferred
// ~/db/schema types — dates cross the wire as ISO strings, not Date
// instances, and reusing those types would silently mistype them.
export type RecipePreview = {
  id: string;
  name: string;
  servings: number;
  instructions: string;
  ingredientCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RecipeDto = {
  id: string;
  name: string;
  servings: number;
  instructions: string;
  createdAt: string;
  updatedAt: string;
};

export type RecipeIngredientDto = {
  id: string;
  recipeId: string;
  name: string;
  quantity: string;
  unit: string;
  position: number;
};

export async function getRecipes(request: Request): Promise<RecipePreview[]> {
  const accessToken = await getAccessToken(request);
  return apiFetch<RecipePreview[]>("/recipes", { accessToken });
}

export async function getRecipeDetail(
  request: Request,
  recipeId: string,
): Promise<{ recipe: RecipeDto; ingredients: RecipeIngredientDto[] } | null> {
  const accessToken = await getAccessToken(request);
  try {
    return await apiFetch<{ recipe: RecipeDto; ingredients: RecipeIngredientDto[] }>(
      `/recipes/${recipeId}`,
      { accessToken },
    );
  } catch (error) {
    // A malformed recipeId (arbitrary URL, not just a stale/missing one)
    // fails the API's ParseUUIDPipe with 400 rather than a clean 404 —
    // both mean "not found" from here.
    if (error instanceof ApiRequestError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}
