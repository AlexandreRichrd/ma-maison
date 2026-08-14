import { z } from "zod";

import { isValidIsoWeek } from "./week";

export const loginSchema = z.object({
  email: z.email("Adresse email invalide").trim(),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const inviteSchema = z.object({
  intent: z.literal("invite"),
  email: z.email("Adresse email invalide").trim(),
});

export const registerSchema = z
  .object({
    token: z.string().min(1, "Lien d'invitation invalide"),
    name: z.string().trim().min(1, "Le nom est requis"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "La confirmation est requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
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

const choreFieldsSchema = {
  name: z.string().trim().min(1, "Le nom de la corvée est requis"),
  frequencyWeeks: z
    .string()
    .trim()
    .regex(/^\d+$/, "Doit être un nombre entier")
    .refine((value) => Number(value) >= 1, "Doit être au moins 1"),
  assignmentMode: z.enum(["ROTATING", "PINNED"]),
  anchorIsoWeek: z.string().refine(isValidIsoWeek, "Semaine ISO invalide"),
  anchorUserId: z.uuid(),
};

export const addChoreSchema = z.object({
  intent: z.literal("addChore"),
  ...choreFieldsSchema,
});

export const editChoreSchema = z.object({
  intent: z.literal("editChore"),
  choreId: z.uuid(),
  ...choreFieldsSchema,
});

export const deleteChoreSchema = z.object({
  intent: z.literal("deleteChore"),
  choreId: z.uuid(),
});

export const toggleReminderSchema = z.object({
  intent: z.literal("toggleReminder"),
  reminderId: z.uuid(),
});

export const addReminderSchema = z.object({
  intent: z.literal("addReminder"),
  title: z.string().trim().min(1, "Le titre est requis"),
  dueAt: z
    .string()
    .min(1, "La date est requise")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Date invalide"),
  assigneeIds: z.array(z.uuid()).min(1, "Choisissez au moins une personne"),
});
