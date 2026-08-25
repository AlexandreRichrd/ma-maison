try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on real environment variables
}

import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";

import {
  choreCompletions,
  choreSubtasks,
  chores,
  households,
  recipeIngredients,
  recipeSteps,
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
  await db.delete(choreSubtasks);
  await db.delete(chores);
  await db.delete(shoppingItems);
  await db.delete(shoppingLists);
  await db.delete(recipeIngredients);
  await db.delete(recipeSteps);
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
  // WEEKLY_ANCHOR is the Monday of what used to be "2024-W01" — WEEK-unit
  // chores require a Monday anchor.
  const WEEKLY_ANCHOR = "2024-01-01";
  const DAILY_ANCHOR = "2024-01-01";
  const [cuisine, , , , , , , dishes] = await db
    .insert(chores)
    .values([
      // A weekly chore with subtasks, so the persistent weekly block's
      // expand affordance has something real to render out of the box.
      { name: "Cuisine", frequencyUnit: "WEEK", frequencyValue: 1, assignmentMode: "ROTATING", anchorDate: WEEKLY_ANCHOR, anchorUserId: mia.id },
      { name: "Poubelles", frequencyUnit: "WEEK", frequencyValue: 1, assignmentMode: "ROTATING", anchorDate: WEEKLY_ANCHOR, anchorUserId: mia.id },
      { name: "Salle de bain", frequencyUnit: "WEEK", frequencyValue: 1, assignmentMode: "ROTATING", anchorDate: WEEKLY_ANCHOR, anchorUserId: sam.id },
      { name: "Surfaces", frequencyUnit: "WEEK", frequencyValue: 1, assignmentMode: "ROTATING", anchorDate: WEEKLY_ANCHOR, anchorUserId: sam.id },
      { name: "Sols", frequencyUnit: "WEEK", frequencyValue: 1, assignmentMode: "ROTATING", anchorDate: WEEKLY_ANCHOR, anchorUserId: sam.id },
      { name: "Draps", frequencyUnit: "WEEK", frequencyValue: 2, assignmentMode: "ROTATING", anchorDate: WEEKLY_ANCHOR, anchorUserId: mia.id },
      { name: "Couloir", frequencyUnit: "WEEK", frequencyValue: 2, assignmentMode: "ROTATING", anchorDate: WEEKLY_ANCHOR, anchorUserId: sam.id },
      // A daily chore with subtasks, so the day navigator and subtask
      // checklist both have something real to render out of the box.
      { name: "Vaisselle", frequencyUnit: "DAY", frequencyValue: 1, assignmentMode: "ROTATING", anchorDate: DAILY_ANCHOR, anchorUserId: mia.id },
    ])
    .returning();

  await db.insert(choreSubtasks).values([
    { choreId: cuisine.id, label: "Plan de travail", position: 0 },
    { choreId: cuisine.id, label: "Évier", position: 1 },
    { choreId: dishes.id, label: "Laver", position: 0 },
    { choreId: dishes.id, label: "Ranger", position: 1 },
  ]);

  const [groceries, costco] = await db
    .insert(shoppingLists)
    .values([{ name: "Courses de la semaine" }, { name: "Courses chez Costco" }])
    .returning();

  await db.insert(shoppingItems).values([
    { listId: groceries.id, name: "Lait", quantity: "2", unit: "UNITE", checked: false },
    { listId: groceries.id, name: "Œufs", quantity: "1", unit: "DOUZAINE", checked: false },
    { listId: groceries.id, name: "Pain", quantity: "1", unit: "MICHE", checked: true },
    { listId: groceries.id, name: "Épinards", quantity: "1", unit: "SACHET", checked: false },
    { listId: costco.id, name: "Essuie-tout", quantity: "1", unit: "PAQUET", checked: false },
    { listId: costco.id, name: "Blancs de poulet", quantity: "1", unit: "KG", checked: false },
  ]);

  const [bolognese, stirFry] = await db
    .insert(recipes)
    .values([
      { name: "Spaghetti à la bolognaise", servings: 4 },
      { name: "Poêlée de légumes", servings: 2 },
    ])
    .returning();

  await db.insert(recipeIngredients).values([
    { recipeId: bolognese.id, name: "Bœuf haché", quantity: "500", unit: "G", position: 0 },
    { recipeId: bolognese.id, name: "Spaghettis", quantity: "1", unit: "PAQUET", position: 1 },
    { recipeId: bolognese.id, name: "Sauce tomate", quantity: "1", unit: "POT", position: 2 },
    { recipeId: bolognese.id, name: "Oignon", quantity: "1", unit: "UNITE", position: 3 },
    { recipeId: bolognese.id, name: "Ail", quantity: "2", unit: "GOUSSE", position: 4 },
    { recipeId: stirFry.id, name: "Brocoli", quantity: "1", unit: "TETE", position: 0 },
    { recipeId: stirFry.id, name: "Poivron", quantity: "2", unit: "UNITE", position: 1 },
    { recipeId: stirFry.id, name: "Sauce soja", quantity: "1", unit: "BOUTEILLE", position: 2 },
    { recipeId: stirFry.id, name: "Riz", quantity: "300", unit: "G", position: 3 },
  ]);

  await db.insert(recipeSteps).values([
    { recipeId: bolognese.id, text: "Faire revenir le bœuf", position: 0 },
    { recipeId: bolognese.id, text: "Ajouter la sauce", position: 1 },
    { recipeId: bolognese.id, text: "Laisser mijoter", position: 2 },
    { recipeId: bolognese.id, text: "Servir avec des pâtes", position: 3 },
    { recipeId: stirFry.id, text: "Faire sauter les légumes", position: 0 },
    { recipeId: stirFry.id, text: "Ajouter la sauce", position: 1 },
    { recipeId: stirFry.id, text: "Servir avec du riz", position: 2 },
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
