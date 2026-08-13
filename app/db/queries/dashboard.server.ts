import { getWeekChores, type UserWeekChores } from "~/lib/cleaning-api.server";
import { getDueTodayReminders, type Reminder } from "~/lib/reminders-api.server";
import { getCurrentIsoWeek } from "~/lib/week";
import { getShoppingLists, type ShoppingListPreview } from "~/lib/shopping-api.server";

export type DashboardData = {
  dueReminders: Reminder[];
  shoppingLists: ShoppingListPreview[];
  weekChores: UserWeekChores[];
};

export async function getDashboardData(request: Request): Promise<DashboardData> {
  const [dueReminders, shoppingLists, weekChores] = await Promise.all([
    getDueTodayReminders(request),
    getShoppingLists(request),
    getWeekChores(request, getCurrentIsoWeek()),
  ]);

  return { dueReminders, shoppingLists, weekChores };
}
