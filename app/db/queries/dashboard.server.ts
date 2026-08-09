import { getCurrentIsoWeek } from "~/lib/week";

import { getWeekChores, type MemberWeekChores } from "./cleaning.server";
import { getDueTodayReminders } from "./reminders.server";
import { getShoppingLists, type ShoppingListPreview } from "./shopping.server";
import type { Reminder } from "~/db/schema";

export type DashboardData = {
  dueReminders: Reminder[];
  shoppingLists: ShoppingListPreview[];
  weekChores: MemberWeekChores[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const [dueReminders, shoppingLists, weekChores] = await Promise.all([
    getDueTodayReminders(),
    getShoppingLists(),
    getWeekChores(getCurrentIsoWeek()),
  ]);

  return { dueReminders, shoppingLists, weekChores };
}
