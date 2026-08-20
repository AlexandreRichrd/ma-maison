import { relations } from "drizzle-orm";
import {
  boolean,
  date,
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

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  avatarKey: text("avatar_key").notNull(),
  // Null until the /activate link is clicked. Login is refused until then.
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  ...timestamps,
});

export const invites = pgTable("invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  invitedByUserId: uuid("invited_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ...timestamps,
});

export const emailVerifications = pgTable("email_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  ...timestamps,
});

// Separate table from emailVerifications, not the same table with a type
// discriminator — see my-home-backend/CLAUDE.md's Authentication section
// (Forgot / reset password) for why.
export const passwordResets = pgTable("password_resets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
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

export const assignmentModeEnum = pgEnum("assignment_mode", [
  "ROTATING",
  "PINNED",
]);

// DAY = occurs every frequencyValue days, WEEK = occurs every
// frequencyValue weeks (1 = weekly, 2 = biweekly, etc). Both frequency
// fields are always populated — see my-home-backend/CLAUDE.md's Chore
// rotation section for the periodDays formula this feeds.
export const frequencyUnitEnum = pgEnum("frequency_unit", ["DAY", "WEEK"]);

export const chores = pgTable("chores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  frequencyUnit: frequencyUnitEnum("frequency_unit").notNull(),
  frequencyValue: integer("frequency_value").notNull(),
  assignmentMode: assignmentModeEnum("assignment_mode").notNull(),
  // The calendar date this chore first occurred — every later occurrence
  // is derived from this by the backend's rotation.service.ts. Must be a
  // Monday when frequencyUnit is WEEK (enforced by the backend, not here).
  anchorDate: date("anchor_date", { mode: "string" }).notNull(),
  // Dual meaning by assignmentMode: for PINNED, the permanent assignee;
  // for ROTATING, who was assigned on anchorDate (occurrence 0).
  anchorUserId: uuid("anchor_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  ...timestamps,
});

// Subtasks inherit everything from their parent chore — no frequency, no
// assignee of their own. See my-home-backend/CLAUDE.md's Chore rotation
// section (Subtasks) for the completion/derived-done rules.
export const choreSubtasks = pgTable("chore_subtasks", {
  // $defaultFn, not .defaultRandom(): unlike every other table here (all
  // predate the Prisma cutover and inherited a gen_random_uuid() column
  // default from their original Drizzle creation — see
  // my-home-backend/CLAUDE.md's Migration history note), chore_subtasks
  // was created fresh by a hand-written Prisma migration with no DB-level
  // default, matching how Prisma generates ids client-side. .defaultRandom()
  // relies on the DB default existing and silently sent a bare SQL DEFAULT
  // for a NOT NULL column with none, failing every insert.
  id: uuid("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  choreId: uuid("chore_id")
    .notNull()
    .references(() => chores.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  position: integer("position").notNull(),
  ...timestamps,
});

export const choreCompletions = pgTable(
  "chore_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    choreId: uuid("chore_id")
      .notNull()
      .references(() => chores.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Null for a chore with no subtasks (a chore with subtasks has one
    // completion row per subtask, never a parent-level row of its own).
    subtaskId: uuid("subtask_id").references(() => choreSubtasks.id, {
      onDelete: "cascade",
    }),
    // The calendar date the occurrence starts, anchor-aligned — not the
    // date someone happened to tick the box.
    occurrenceDate: date("occurrence_date", { mode: "string" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Best-effort mirror only — the real uniqueness guarantee is two
  // hand-written *partial* unique indexes (one per subtaskId null/
  // not-null case, since Postgres treats every NULL as distinct in a
  // plain unique index), created directly in my-home-backend's
  // migrations. This file is never applied against the database (see
  // CLAUDE.md's Database section — it's a seed-only Drizzle setup), so
  // the exact index shape here is documentation, not enforcement.
  (table) => [unique().on(table.choreId, table.subtaskId, table.occurrenceDate)],
);

export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  doneAt: timestamp("done_at", { withTimezone: true }),
  // Can name either or both users — a household-of-two array, same
  // pattern as households.member_order. No FK: an array column can't
  // declare one, so a removed user just leaves a dangling id here
  // (harmless — chip lookups fall through to "no chip" for an id that
  // no longer resolves to a user).
  assigneeIds: uuid("assignee_ids").array().notNull().default([]),
  ...timestamps,
});

export const householdsRelations = relations(households, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  household: one(households, {
    fields: [users.householdId],
    references: [households.id],
  }),
  choreCompletions: many(choreCompletions),
  sentInvites: many(invites),
  emailVerifications: many(emailVerifications),
  passwordResets: many(passwordResets),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  household: one(households, {
    fields: [invites.householdId],
    references: [households.id],
  }),
  invitedBy: one(users, {
    fields: [invites.invitedByUserId],
    references: [users.id],
  }),
}));

export const emailVerificationsRelations = relations(
  emailVerifications,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerifications.userId],
      references: [users.id],
    }),
  }),
);

export const passwordResetsRelations = relations(
  passwordResets,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResets.userId],
      references: [users.id],
    }),
  }),
);

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

export const choresRelations = relations(chores, ({ one, many }) => ({
  anchorUser: one(users, {
    fields: [chores.anchorUserId],
    references: [users.id],
  }),
  completions: many(choreCompletions),
  subtasks: many(choreSubtasks),
}));

export const choreSubtasksRelations = relations(
  choreSubtasks,
  ({ one, many }) => ({
    chore: one(chores, {
      fields: [choreSubtasks.choreId],
      references: [chores.id],
    }),
    completions: many(choreCompletions),
  }),
);

export const choreCompletionsRelations = relations(
  choreCompletions,
  ({ one }) => ({
    chore: one(chores, {
      fields: [choreCompletions.choreId],
      references: [chores.id],
    }),
    user: one(users, {
      fields: [choreCompletions.userId],
      references: [users.id],
    }),
    subtask: one(choreSubtasks, {
      fields: [choreCompletions.subtaskId],
      references: [choreSubtasks.id],
    }),
  }),
);

export type Household = typeof households.$inferSelect;
export type User = typeof users.$inferSelect;
export type ShoppingList = typeof shoppingLists.$inferSelect;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type Chore = typeof chores.$inferSelect;
export type ChoreSubtask = typeof choreSubtasks.$inferSelect;
export type ChoreCompletion = typeof choreCompletions.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;
