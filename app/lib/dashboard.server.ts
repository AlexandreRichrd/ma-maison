import { getWeekChores, type UserWeekChores } from "~/lib/cleaning-api.server";
import { getIndoorClimate, type IndoorClimate } from "~/lib/climate-api.server";
import { getDueTodayReminders, type Reminder } from "~/lib/reminders-api.server";
import { getCurrentIsoWeek } from "~/lib/week";
import { getShoppingLists, type ShoppingListPreview } from "~/lib/shopping-api.server";

export type DashboardData = {
  dueReminders: Reminder[];
  shoppingLists: ShoppingListPreview[];
  weekChores: UserWeekChores[];
  indoorClimate: IndoorClimate;
};

export async function getDashboardData(request: Request): Promise<DashboardData> {
  const [dueReminders, shoppingLists, weekChores, indoorClimate] = await Promise.all([
    getDueTodayReminders(request),
    getShoppingLists(request),
    getWeekChores(request, getCurrentIsoWeek()),
    getIndoorClimate(request),
  ]);

  return { dueReminders, shoppingLists, weekChores, indoorClimate };
}
