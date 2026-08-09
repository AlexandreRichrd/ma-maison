import { relations } from "drizzle-orm";
import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  integer,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberOrder: uuid("member_order").array().notNull().default([]),
  ...timestamps,
});

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatarKey: text("avatar_key").notNull(),
  ...timestamps,
});

export const shoppingLists = pgTable("shopping_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ...timestamps,
});

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  servings: integer("servings").notNull(),
  instructions: text("instructions").notNull(),
  ...timestamps,
});

export const shoppingItems = pgTable("shopping_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  listId: uuid("list_id")
    .notNull()
    .references(() => shoppingLists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: numeric("quantity", { mode: "string" }).notNull(),
  unit: text("unit").notNull(),
  checked: boolean("checked").notNull().default(false),
  sourceRecipeId: uuid("source_recipe_id").references(() => recipes.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: numeric("quantity", { mode: "string" }).notNull(),
  unit: text("unit").notNull(),
  position: integer("position").notNull(),
  ...timestamps,
});

export const rotationGroupEnum = pgEnum("rotation_group", [
  "A",
  "B",
  "C",
  "D",
]);

export const chores = pgTable("chores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  rotationGroup: rotationGroupEnum("rotation_group").notNull(),
  ...timestamps,
});

export const choreCompletions = pgTable(
  "chore_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    choreId: uuid("chore_id")
      .notNull()
      .references(() => chores.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    isoWeek: text("iso_week").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.choreId, table.isoWeek)],
);

export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  doneAt: timestamp("done_at", { withTimezone: true }),
  memberId: uuid("member_id").references(() => members.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export const householdsRelations = relations(households, ({ many }) => ({
  members: many(members),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  household: one(households, {
    fields: [members.householdId],
    references: [households.id],
  }),
  choreCompletions: many(choreCompletions),
  reminders: many(reminders),
}));

export const shoppingListsRelations = relations(shoppingLists, ({ many }) => ({
  items: many(shoppingItems),
}));

export const shoppingItemsRelations = relations(shoppingItems, ({ one }) => ({
  list: one(shoppingLists, {
    fields: [shoppingItems.listId],
    references: [shoppingLists.id],
  }),
  sourceRecipe: one(recipes, {
    fields: [shoppingItems.sourceRecipeId],
    references: [recipes.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const choresRelations = relations(chores, ({ many }) => ({
  completions: many(choreCompletions),
}));

export const choreCompletionsRelations = relations(
  choreCompletions,
  ({ one }) => ({
    chore: one(chores, {
      fields: [choreCompletions.choreId],
      references: [chores.id],
    }),
    member: one(members, {
      fields: [choreCompletions.memberId],
      references: [members.id],
    }),
  }),
);

export const remindersRelations = relations(reminders, ({ one }) => ({
  member: one(members, {
    fields: [reminders.memberId],
    references: [members.id],
  }),
}));

export type Household = typeof households.$inferSelect;
export type Member = typeof members.$inferSelect;
export type ShoppingList = typeof shoppingLists.$inferSelect;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type Chore = typeof chores.$inferSelect;
export type ChoreCompletion = typeof choreCompletions.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
