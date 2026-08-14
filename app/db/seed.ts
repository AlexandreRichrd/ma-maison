try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on real environment variables
}

import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";

import {
  choreCompletions,
  chores,
  households,
  recipeIngredients,
  recipes,
  reminders,
  shoppingItems,
  shoppingLists,
  users,
} from "./schema";

// Dynamic import, not static: index.server.ts reads process.env.DATABASE_URL
// at module-evaluation time, and static imports are hoisted above the
// loadEnvFile() call above — this keeps load order correct.
const { db } = await import("./index.server");

const DEV_PASSWORD = "devpassword";

async function main() {
  // Re-runnable: clear everything first (household-scale dev data only).
  // NEVER run this against a database with real accounts in it — it wipes
  // the users table along with everything else.
  await db.delete(choreCompletions);
  await db.delete(chores);
  await db.delete(shoppingItems);
  await db.delete(shoppingLists);
  await db.delete(recipeIngredients);
  await db.delete(recipes);
  await db.delete(reminders);
  await db.delete(users);
  await db.delete(households);

  const [household] = await db.insert(households).values({}).returning();

  const passwordHash = await hash(DEV_PASSWORD);

  const [mia, sam] = await db
    .insert(users)
    .values([
      {
        householdId: household.id,
        name: "Mia",
        avatarKey: "mia",
        email: "mia@example.com",
        passwordHash,
        emailVerifiedAt: new Date(),
      },
      {
        householdId: household.id,
        name: "Sam",
        avatarKey: "sam",
        email: "sam@example.com",
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    ])
    .returning();

  await db
    .update(households)
    .set({ memberOrder: [mia.id, sam.id] })
    .where(eq(households.id, household.id));

  // Same weekly/every-2-weeks × first/second-member split the backend's
  // own per-chore-configuration migration backfilled the old A/B/C/D
  // groups into — see my-home-backend/CLAUDE.md's Chore rotation section.
  const ROTATION_ANCHOR = "2024-W01";
  await db.insert(chores).values([
    { name: "Cuisine", frequencyWeeks: 1, assignmentMode: "ROTATING", anchorIsoWeek: ROTATION_ANCHOR, anchorUserId: mia.id },
    { name: "Poubelles", frequencyWeeks: 1, assignmentMode: "ROTATING", anchorIsoWeek: ROTATION_ANCHOR, anchorUserId: mia.id },
    { name: "Salle de bain", frequencyWeeks: 1, assignmentMode: "ROTATING", anchorIsoWeek: ROTATION_ANCHOR, anchorUserId: sam.id },
    { name: "Surfaces", frequencyWeeks: 1, assignmentMode: "ROTATING", anchorIsoWeek: ROTATION_ANCHOR, anchorUserId: sam.id },
    { name: "Sols", frequencyWeeks: 1, assignmentMode: "ROTATING", anchorIsoWeek: ROTATION_ANCHOR, anchorUserId: sam.id },
    { name: "Draps", frequencyWeeks: 2, assignmentMode: "ROTATING", anchorIsoWeek: ROTATION_ANCHOR, anchorUserId: mia.id },
    { name: "Couloir", frequencyWeeks: 2, assignmentMode: "ROTATING", anchorIsoWeek: ROTATION_ANCHOR, anchorUserId: sam.id },
  ]);

  const [groceries, costco] = await db
    .insert(shoppingLists)
    .values([{ name: "Courses de la semaine" }, { name: "Courses chez Costco" }])
    .returning();

  await db.insert(shoppingItems).values([
    { listId: groceries.id, name: "Lait", quantity: "2", unit: "", checked: false },
    { listId: groceries.id, name: "Œufs", quantity: "1", unit: "douzaine", checked: false },
    { listId: groceries.id, name: "Pain", quantity: "1", unit: "miche", checked: true },
    { listId: groceries.id, name: "Épinards", quantity: "1", unit: "sachet", checked: false },
    { listId: costco.id, name: "Essuie-tout", quantity: "1", unit: "paquet", checked: false },
    { listId: costco.id, name: "Blancs de poulet", quantity: "1", unit: "kg", checked: false },
  ]);

  const [bolognese, stirFry] = await db
    .insert(recipes)
    .values([
      {
        name: "Spaghetti à la bolognaise",
        servings: 4,
        instructions: "Faire revenir le bœuf, ajouter la sauce, laisser mijoter, servir avec des pâtes.",
      },
      {
        name: "Poêlée de légumes",
        servings: 2,
        instructions: "Faire sauter les légumes, ajouter la sauce, servir avec du riz.",
      },
    ])
    .returning();

  await db.insert(recipeIngredients).values([
    { recipeId: bolognese.id, name: "Bœuf haché", quantity: "500", unit: "g", position: 0 },
    { recipeId: bolognese.id, name: "Spaghettis", quantity: "1", unit: "paquet", position: 1 },
    { recipeId: bolognese.id, name: "Sauce tomate", quantity: "1", unit: "pot", position: 2 },
    { recipeId: bolognese.id, name: "Oignon", quantity: "1", unit: "", position: 3 },
    { recipeId: bolognese.id, name: "Ail", quantity: "2", unit: "gousses", position: 4 },
    { recipeId: stirFry.id, name: "Brocoli", quantity: "1", unit: "tête", position: 0 },
    { recipeId: stirFry.id, name: "Poivron", quantity: "2", unit: "", position: 1 },
    { recipeId: stirFry.id, name: "Sauce soja", quantity: "1", unit: "bouteille", position: 2 },
    { recipeId: stirFry.id, name: "Riz", quantity: "300", unit: "g", position: 3 },
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
    {
      title: "Sortir les poubelles demain",
      dueAt: tomorrow7am,
      doneAt: null,
      assigneeIds: [sam.id],
    },
    {
      title: "Racheter de l'essuie-tout",
      dueAt: today2pm,
      doneAt: null,
      assigneeIds: [mia.id, sam.id],
    },
    {
      title: "Arroser les plantes",
      dueAt: today6pm,
      doneAt: new Date(),
      assigneeIds: [mia.id],
    },
  ]);

  console.log("Seeded:", {
    household: household.id,
    users: [mia.email, sam.email],
    password: DEV_PASSWORD,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
