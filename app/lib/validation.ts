import { z } from "zod";

import { isValidIsoWeek } from "./week";

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const newListSchema = z.object({
  intent: z.literal("newList"),
  name: z.string().trim().min(1, "List name is required"),
});

export const addItemSchema = z.object({
  intent: z.literal("addItem"),
  name: z.string().trim().min(1, "Item name is required"),
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required")
    .regex(/^\d+(\.\d+)?$/, "Quantity must be a number"),
  unit: z.string().trim().max(40).optional().default(""),
});

export const toggleItemSchema = z.object({
  intent: z.literal("toggleItem"),
  itemId: z.uuid(),
});

export const addToExistingListSchema = z.object({
  intent: z.literal("addToExistingList"),
  listId: z.uuid(),
});

export const addAsNewListSchema = z.object({
  intent: z.literal("addAsNewList"),
});

export const toggleChoreSchema = z.object({
  intent: z.literal("toggleChore"),
  choreId: z.uuid(),
  isoWeek: z.string().refine(isValidIsoWeek, "Invalid ISO week"),
});

export const toggleReminderSchema = z.object({
  intent: z.literal("toggleReminder"),
  reminderId: z.uuid(),
});
