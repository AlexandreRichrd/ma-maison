import { getCurrentIsoWeek } from "~/lib/week";
import { getShoppingLists, type ShoppingListPreview } from "~/lib/shopping-api.server";

import { getWeekChores, type UserWeekChores } from "./cleaning.server";
import { getDueTodayReminders } from "./reminders.server";
import type { Reminder } from "~/db/schema";

export type DashboardData = {
  dueReminders: Reminder[];
  shoppingLists: ShoppingListPreview[];
  weekChores: UserWeekChores[];
};

export async function getDashboardData(request: Request): Promise<DashboardData> {
  const [dueReminders, shoppingLists, weekChores] = await Promise.all([
    getDueTodayReminders(),
    getShoppingLists(request),
    getWeekChores(getCurrentIsoWeek()),
  ]);

  return { dueReminders, shoppingLists, weekChores };
}
