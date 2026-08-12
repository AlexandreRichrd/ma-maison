import { ApiRequestError, apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

// Mirrors the API's JSON response shape, not the Drizzle-inferred
// ~/db/schema types — dates cross the wire as ISO strings, not Date
// instances, and reusing those types would silently mistype them.
export type ShoppingListDto = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingListPreview = ShoppingListDto & { openCount: number };

export type ShoppingItemDto = {
  id: string;
  listId: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
  sourceRecipeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getShoppingLists(request: Request): Promise<ShoppingListPreview[]> {
  const accessToken = await getAccessToken(request);
  return apiFetch<ShoppingListPreview[]>("/shopping-lists", { accessToken });
}

export async function getShoppingListDetail(
  request: Request,
  listId: string,
): Promise<{ list: ShoppingListDto; items: ShoppingItemDto[] } | null> {
  const accessToken = await getAccessToken(request);
  try {
    return await apiFetch<{ list: ShoppingListDto; items: ShoppingItemDto[] }>(
      `/shopping-lists/${listId}`,
      { accessToken },
    );
  } catch (error) {
    // A malformed listId (arbitrary URL, not just a stale/missing one)
    // fails the API's ParseUUIDPipe with 400 rather than a clean 404 —
    // both mean "not found" from here.
    if (error instanceof ApiRequestError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

export async function createShoppingList(request: Request, name: string): Promise<string> {
  const accessToken = await getAccessToken(request);
  const list = await apiFetch<ShoppingListDto>("/shopping-lists", {
    method: "POST",
    accessToken,
    body: { name },
  });
  return list.id;
}

export async function addShoppingItem(
  request: Request,
  params: { listId: string; name: string; quantity: string; unit: string },
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/shopping-lists/${params.listId}/items`, {
    method: "POST",
    accessToken,
    body: { name: params.name, quantity: params.quantity, unit: params.unit },
  });
}

export async function toggleShoppingItem(request: Request, itemId: string): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/shopping-items/${itemId}/toggle`, {
    method: "PATCH",
    accessToken,
  });
}
