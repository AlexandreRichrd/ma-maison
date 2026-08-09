import { z } from "zod";

import { isValidIsoWeek } from "./week";

export const loginSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const newListSchema = z.object({
  intent: z.literal("newList"),
  name: z.string().trim().min(1, "Le nom de la liste est requis"),
});

export const addItemSchema = z.object({
  intent: z.literal("addItem"),
  name: z.string().trim().min(1, "Le nom de l'article est requis"),
  quantity: z
    .string()
    .trim()
    .min(1, "La quantité est requise")
    .regex(/^\d+(\.\d+)?$/, "La quantité doit être un nombre"),
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
  isoWeek: z.string().refine(isValidIsoWeek, "Semaine ISO invalide"),
});

export const toggleReminderSchema = z.object({
  intent: z.literal("toggleReminder"),
  reminderId: z.uuid(),
});

export const switchMemberSchema = z.object({
  memberId: z.uuid(),
});

export const addReminderSchema = z.object({
  intent: z.literal("addReminder"),
  title: z.string().trim().min(1, "Le titre est requis"),
  dueAt: z
    .string()
    .min(1, "La date est requise")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Date invalide"),
});
