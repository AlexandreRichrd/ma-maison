try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on real environment variables
}

import { eq } from "drizzle-orm";

import {
  choreCompletions,
  chores,
  households,
  members,
  recipeIngredients,
  recipes,
  reminders,
  shoppingItems,
  shoppingLists,
} from "./schema";

// Dynamic import, not static: index.server.ts reads process.env.DATABASE_URL
// at module-evaluation time, and static imports are hoisted above the
// loadEnvFile() call above — this keeps load order correct.
const { db } = await import("./index.server");

async function main() {
  // Re-runnable: clear everything first (household-scale dev data only).
  await db.delete(choreCompletions);
  await db.delete(chores);
  await db.delete(shoppingItems);
  await db.delete(shoppingLists);
  await db.delete(recipeIngredients);
  await db.delete(recipes);
  await db.delete(reminders);
  await db.delete(members);
  await db.delete(households);

  const [household] = await db.insert(households).values({}).returning();

  const [mia, sam] = await db
    .insert(members)
    .values([
      { householdId: household.id, name: "Mia", role: "Parent", avatarKey: "mia" },
      { householdId: household.id, name: "Sam", role: "Partner", avatarKey: "sam" },
    ])
    .returning();

  await db
    .update(households)
    .set({ memberOrder: [mia.id, sam.id] })
    .where(eq(households.id, household.id));

  await db.insert(chores).values([
    { name: "Kitchen", rotationGroup: "A" },
    { name: "Trash", rotationGroup: "A" },
    { name: "Bathroom", rotationGroup: "B" },
    { name: "Surfaces", rotationGroup: "B" },
    { name: "Floors", rotationGroup: "B" },
    { name: "Bedsheets", rotationGroup: "C" },
    { name: "Corridor", rotationGroup: "D" },
  ]);

  const [groceries, costco] = await db
    .insert(shoppingLists)
    .values([{ name: "Weekly Groceries" }, { name: "Costco Run" }])
    .returning();

  await db.insert(shoppingItems).values([
    { listId: groceries.id, name: "Milk", quantity: "2", unit: "", checked: false },
    { listId: groceries.id, name: "Eggs", quantity: "1", unit: "dozen", checked: false },
    { listId: groceries.id, name: "Bread", quantity: "1", unit: "loaf", checked: true },
    { listId: groceries.id, name: "Spinach", quantity: "1", unit: "bag", checked: false },
    { listId: costco.id, name: "Paper towels", quantity: "1", unit: "pack", checked: false },
    { listId: costco.id, name: "Chicken breast", quantity: "2", unit: "lb", checked: false },
  ]);

  const [bolognese, stirFry] = await db
    .insert(recipes)
    .values([
      { name: "Spaghetti Bolognese", servings: 4, instructions: "Brown the beef, add sauce, simmer, serve over pasta." },
      { name: "Veggie Stir Fry", servings: 2, instructions: "Stir fry the vegetables, add sauce, serve over rice." },
    ])
    .returning();

  await db.insert(recipeIngredients).values([
    { recipeId: bolognese.id, name: "Ground beef", quantity: "1", unit: "lb", position: 0 },
    { recipeId: bolognese.id, name: "Spaghetti", quantity: "1", unit: "box", position: 1 },
    { recipeId: bolognese.id, name: "Tomato sauce", quantity: "1", unit: "jar", position: 2 },
    { recipeId: bolognese.id, name: "Onion", quantity: "1", unit: "", position: 3 },
    { recipeId: bolognese.id, name: "Garlic", quantity: "2", unit: "cloves", position: 4 },
    { recipeId: stirFry.id, name: "Broccoli", quantity: "1", unit: "head", position: 0 },
    { recipeId: stirFry.id, name: "Bell pepper", quantity: "2", unit: "", position: 1 },
    { recipeId: stirFry.id, name: "Soy sauce", quantity: "1", unit: "bottle", position: 2 },
    { recipeId: stirFry.id, name: "Rice", quantity: "2", unit: "cups", position: 3 },
  ]);

  const now = new Date();
  const tomorrow7am = new Date(now);
  tomorrow7am.setDate(tomorrow7am.getDate() + 1);
  tomorrow7am.setHours(7, 0, 0, 0);
  const today2pm = new Date(now);
  today2pm.setHours(14, 0, 0, 0);
  const today6pm = new Date(now);
  today6pm.setHours(18, 0, 0, 0);

  await db.insert(reminders).values([
    { title: "Trash day tomorrow", dueAt: tomorrow7am, doneAt: null },
    { title: "Restock paper towels", dueAt: today2pm, doneAt: null },
    { title: "Water the plants", dueAt: today6pm, doneAt: new Date() },
  ]);

  console.log("Seeded:", { household: household.id, members: [mia.name, sam.name] });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
