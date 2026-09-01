import { z } from "zod";

import { isValidIsoDate } from "./day";
import { UNITS } from "./units";

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

export const forgotPasswordSchema = z.object({
  email: z.email("Adresse email invalide").trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Lien de réinitialisation invalide"),
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
  unit: z.enum(UNITS).optional().default("UNITE"),
});

export const toggleItemSchema = z.object({
  intent: z.literal("toggleItem"),
  itemId: z.uuid(),
});

export const deleteShoppingListSchema = z.object({
  intent: z.literal("deleteList"),
  listId: z.uuid(),
});

export const addToExistingListSchema = z.object({
  intent: z.literal("addToExistingList"),
  listId: z.uuid(),
  servings: z.coerce.number().int().min(1),
});

export const addAsNewListSchema = z.object({
  intent: z.literal("addAsNewList"),
  servings: z.coerce.number().int().min(1),
});

const recipeIngredientSchema = z.object({
  name: z.string().trim().min(1, "Le nom de l'ingrédient est requis"),
  quantity: z
    .string()
    .trim()
    .min(1, "La quantité est requise")
    .regex(/^\d+(\.\d+)?$/, "La quantité doit être un nombre"),
  unit: z.enum(UNITS),
});

const recipeStepSchema = z.object({
  text: z.string().trim().min(1, "L'étape ne peut pas être vide"),
});

/** Ingredients/steps arrive as one hidden JSON-string input each (RecipeForm) — parse then validate. */
function jsonArray<T extends z.ZodType>(itemSchema: T, emptyMessage: string) {
  return z
    .string()
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Format invalide" });
        return z.NEVER;
      }
    })
    .pipe(z.array(itemSchema).min(1, emptyMessage));
}

const recipeFieldsSchema = {
  name: z.string().trim().min(1, "Le nom de la recette est requis"),
  servings: z
    .string()
    .trim()
    .regex(/^\d+$/, "Doit être un nombre entier")
    .refine((value) => Number(value) >= 1, "Doit être au moins 1"),
  ingredients: jsonArray(recipeIngredientSchema, "Ajoutez au moins un ingrédient"),
  steps: jsonArray(recipeStepSchema, "Ajoutez au moins une étape"),
};

export const addRecipeSchema = z.object({
  intent: z.literal("addRecipe"),
  ...recipeFieldsSchema,
});

export const editRecipeSchema = z.object({
  intent: z.literal("editRecipe"),
  recipeId: z.uuid(),
  ...recipeFieldsSchema,
});

export const deleteRecipeSchema = z.object({
  intent: z.literal("deleteRecipe"),
  recipeId: z.uuid(),
});

export const toggleChoreSchema = z.object({
  intent: z.literal("toggleChore"),
  choreId: z.uuid(),
  occurrenceDate: z.string().refine(isValidIsoDate, "Date invalide"),
});

export const toggleChoreSubtaskSchema = z.object({
  intent: z.literal("toggleChoreSubtask"),
  choreId: z.uuid(),
  subtaskId: z.uuid(),
  occurrenceDate: z.string().refine(isValidIsoDate, "Date invalide"),
});

const choreFieldsSchema = {
  name: z.string().trim().min(1, "Le nom de la corvée est requis"),
  frequencyUnit: z.enum(["DAY", "WEEK"]),
  frequencyValue: z
    .string()
    .trim()
    .regex(/^\d+$/, "Doit être un nombre entier")
    .refine((value) => Number(value) >= 1, "Doit être au moins 1"),
  assignmentMode: z.enum(["ROTATING", "PINNED"]),
  anchorDate: z.string().refine(isValidIsoDate, "Date invalide"),
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

export const addChoreSubtaskSchema = z.object({
  intent: z.literal("addChoreSubtask"),
  choreId: z.uuid(),
  label: z.string().trim().min(1, "Le libellé est requis"),
});

export const editChoreSubtaskSchema = z.object({
  intent: z.literal("editChoreSubtask"),
  choreId: z.uuid(),
  subtaskId: z.uuid(),
  label: z.string().trim().min(1, "Le libellé est requis"),
});

export const deleteChoreSubtaskSchema = z.object({
  intent: z.literal("deleteChoreSubtask"),
  choreId: z.uuid(),
  subtaskId: z.uuid(),
});

export const reorderChoreSubtasksSchema = z.object({
  intent: z.literal("reorderChoreSubtasks"),
  choreId: z.uuid(),
  subtaskIds: z.array(z.uuid()).min(1),
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

// climateAlertEnabled arrives as a hidden "true"/"false" field, not a bare
// checkbox — an unchecked native checkbox omits itself from FormData
// entirely, which would be indistinguishable from "not provided" (see
// components/settings/HouseholdSettingsCard.tsx). The numeric fields stay
// strings here, same as choreFieldsSchema's frequencyValue — converted to
// real numbers in settings-api.server.ts's updateSettings(). The label
// fields allow an empty string on purpose — that's how a household clears
// an override back to the default (see SettingsService.update() on the API
// side).
export const updateSettingsSchema = z.object({
  intent: z.literal("updateSettings"),
  climateAlertEnabled: z.enum(["true", "false"]).transform((value) => value === "true"),
  climateAlertMarginC: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, "Doit être un nombre")
    .refine((value) => Number(value) > 0, "Doit être supérieur à 0"),
  climateAlertIndoorThresholdC: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, "Doit être un nombre")
    .refine((value) => Number(value) > 0, "Doit être supérieur à 0"),
  climateAlertCooldownMinutes: z
    .string()
    .trim()
    .regex(/^\d+$/, "Doit être un nombre entier")
    .refine((value) => Number(value) > 0, "Doit être supérieur à 0"),
  climateSummaryRetentionDays: z
    .string()
    .trim()
    .regex(/^\d+$/, "Doit être un nombre entier")
    .refine((value) => Number(value) > 0, "Doit être supérieur à 0"),
  indoorSensorLabel: z.string().trim().max(50, "50 caractères maximum"),
  outdoorSensorLabel: z.string().trim().max(50, "50 caractères maximum"),
});

export const updateMemberOrderSchema = z.object({
  intent: z.literal("updateMemberOrder"),
  memberOrder: z.array(z.uuid()).min(1),
});

// No userId field — the action always updates the signed-in user's own
// row (requireUser(request).id), never a client-submitted target. See
// routes/settings.tsx.
export const updateNotificationPreferenceSchema = z.object({
  intent: z.literal("updateNotificationPreference"),
  receiveClimateAlerts: z.enum(["true", "false"]).transform((value) => value === "true"),
});
