import { ApiRequestError, apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";
import type { Unit } from "./units";

// Mirrors the API's JSON response shape, not the Drizzle-inferred
// ~/db/schema types — dates cross the wire as ISO strings, not Date
// instances, and reusing those types would silently mistype them.
export type RecipePreview = {
  id: string;
  name: string;
  servings: number;
  ingredientCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RecipeDto = {
  id: string;
  name: string;
  servings: number;
  createdAt: string;
  updatedAt: string;
};

export type RecipeIngredientDto = {
  id: string;
  recipeId: string;
  name: string;
  quantity: string;
  unit: Unit;
  position: number;
};

export type RecipeStepDto = {
  id: string;
  recipeId: string;
  text: string;
  position: number;
};

export type RecipeDetail = {
  recipe: RecipeDto;
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
};

export type RecipeInput = {
  name: string;
  // Arrives as a string from form data — converted to a real JSON number
  // here, since the API's @IsInt() needs one.
  servings: string;
  ingredients: { name: string; quantity: string; unit: Unit }[];
  steps: { text: string }[];
};

function toRequestBody(input: RecipeInput) {
  return {
    name: input.name,
    servings: Number(input.servings),
    ingredients: input.ingredients,
    steps: input.steps,
  };
}

export async function getRecipes(request: Request): Promise<RecipePreview[]> {
  const accessToken = await getAccessToken(request);
  return apiFetch<RecipePreview[]>("/recipes", { accessToken });
}

export async function getRecipeDetail(
  request: Request,
  recipeId: string,
  servings?: number,
): Promise<RecipeDetail | null> {
  const accessToken = await getAccessToken(request);
  const query = servings ? `?servings=${servings}` : "";
  try {
    return await apiFetch<RecipeDetail>(`/recipes/${recipeId}${query}`, { accessToken });
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

export async function createRecipe(request: Request, input: RecipeInput): Promise<RecipeDetail> {
  const accessToken = await getAccessToken(request);
  return apiFetch<RecipeDetail>("/recipes", {
    method: "POST",
    accessToken,
    body: toRequestBody(input),
  });
}

export async function updateRecipe(
  request: Request,
  recipeId: string,
  input: RecipeInput,
): Promise<RecipeDetail> {
  const accessToken = await getAccessToken(request);
  return apiFetch<RecipeDetail>(`/recipes/${recipeId}`, {
    method: "PATCH",
    accessToken,
    body: toRequestBody(input),
  });
}

export async function deleteRecipe(request: Request, recipeId: string): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/recipes/${recipeId}`, {
    method: "DELETE",
    accessToken,
  });
}
