import { and, asc, count, eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { shoppingItems, shoppingLists, type ShoppingList } from "~/db/schema";

export type ShoppingListPreview = ShoppingList & { openCount: number };

export async function getShoppingLists(): Promise<ShoppingListPreview[]> {
  const rows = await db
    .select({
      id: shoppingLists.id,
      name: shoppingLists.name,
      createdAt: shoppingLists.createdAt,
      updatedAt: shoppingLists.updatedAt,
      openCount: count(shoppingItems.id),
    })
    .from(shoppingLists)
    .leftJoin(
      shoppingItems,
      and(eq(shoppingItems.listId, shoppingLists.id), eq(shoppingItems.checked, false)),
    )
    .groupBy(shoppingLists.id)
    .orderBy(asc(shoppingLists.createdAt));

  return rows;
}

export async function getShoppingListDetail(listId: string) {
  const [list] = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.id, listId))
    .limit(1);
  if (!list) return null;

  const items = await db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.listId, listId))
    .orderBy(asc(shoppingItems.createdAt));

  return { list, items };
}

export async function createShoppingList(name: string): Promise<string> {
  const [list] = await db.insert(shoppingLists).values({ name }).returning();
  return list.id;
}

export async function addShoppingItem(params: {
  listId: string;
  name: string;
  quantity: string;
  unit: string;
}): Promise<void> {
  await db.insert(shoppingItems).values({
    listId: params.listId,
    name: params.name,
    quantity: params.quantity,
    unit: params.unit,
    checked: false,
  });
}

export async function toggleShoppingItem(itemId: string): Promise<void> {
  const [item] = await db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.id, itemId))
    .limit(1);
  if (!item) throw new Error("Item not found");

  await db
    .update(shoppingItems)
    .set({ checked: !item.checked, updatedAt: new Date() })
    .where(eq(shoppingItems.id, itemId));
}
