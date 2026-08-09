import { and, eq, sql } from "drizzle-orm";

import { db } from "~/db/index.server";
import { recipeIngredients, shoppingItems, shoppingLists } from "~/db/schema";

import { normaliseIngredientName } from "./ingredients";

export type AddIngredientsTarget =
  | { listId: string }
  | { newListName: string };

export type AddIngredientsResult = {
  listId: string;
  added: number;
  merged: number;
};

/**
 * Pushes every ingredient of a recipe into a shopping list, in one
 * transaction (either the whole thing lands or none of it does). Merges into
 * an existing *unchecked* row with the same normalised name + unit by
 * summing quantities server-side (exact decimal addition, no JS float math);
 * a checked row is left alone and a new row is created instead. Every
 * inserted row is tagged with `source_recipe_id`.
 */
export async function addIngredientsToList(
  recipeId: string,
  target: AddIngredientsTarget,
): Promise<AddIngredientsResult> {
  return db.transaction(async (tx) => {
    const listId =
      "listId" in target
        ? target.listId
        : (
            await tx
              .insert(shoppingLists)
              .values({ name: target.newListName })
              .returning({ id: shoppingLists.id })
          )[0].id;

    const ingredients = await tx.query.recipeIngredients.findMany({
      where: eq(recipeIngredients.recipeId, recipeId),
      orderBy: recipeIngredients.position,
    });

    const unchecked = await tx
      .select()
      .from(shoppingItems)
      .where(
        and(eq(shoppingItems.listId, listId), eq(shoppingItems.checked, false)),
      );

    let added = 0;
    let merged = 0;

    for (const ingredient of ingredients) {
      const normalisedName = normaliseIngredientName(ingredient.name);
      const match = unchecked.find(
        (item) =>
          normaliseIngredientName(item.name) === normalisedName &&
          item.unit === ingredient.unit,
      );

      if (match) {
        await tx
          .update(shoppingItems)
          .set({
            quantity: sql`${shoppingItems.quantity} + ${ingredient.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(shoppingItems.id, match.id));
        merged += 1;
      } else {
        const [inserted] = await tx
          .insert(shoppingItems)
          .values({
            listId,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            sourceRecipeId: recipeId,
          })
          .returning();
        unchecked.push(inserted);
        added += 1;
      }
    }

    return { listId, added, merged };
  });
}
