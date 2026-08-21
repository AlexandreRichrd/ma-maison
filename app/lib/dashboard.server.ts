import { getDayChores, getWeekChores, type UserChores } from "~/lib/cleaning-api.server";
import { getHomeClimate, type IndoorClimate, type OutdoorClimate } from "~/lib/climate-api.server";
import { getCurrentIsoDate, isoWeekOfDate } from "~/lib/day";
import { getDueTodayReminders, type Reminder } from "~/lib/reminders-api.server";
import { getShoppingLists, type ShoppingListPreview } from "~/lib/shopping-api.server";

export type DashboardData = {
  dueReminders: Reminder[];
  shoppingLists: ShoppingListPreview[];
  dayChores: UserChores[];
  weekChores: UserChores[];
  indoorClimate: IndoorClimate;
  outdoorClimate: OutdoorClimate;
};

export async function getDashboardData(request: Request): Promise<DashboardData> {
  const today = getCurrentIsoDate();
  const [dueReminders, shoppingLists, dayChores, weekChores, homeClimate] = await Promise.all([
    getDueTodayReminders(request),
    getShoppingLists(request),
    // Daily chores are the ones most likely to be forgotten — shown
    // alongside the week's chores, not instead of them.
    getDayChores(request, today),
    getWeekChores(request, isoWeekOfDate(today)),
    getHomeClimate(request),
  ]);

  return {
    dueReminders,
    shoppingLists,
    dayChores,
    weekChores,
    indoorClimate: homeClimate.indoor,
    outdoorClimate: homeClimate.outdoor,
  };
}
