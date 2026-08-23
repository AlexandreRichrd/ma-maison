import { CleaningWidget } from "~/components/dashboard/CleaningWidget";
import { HomeClimateWidget } from "~/components/dashboard/HomeClimateWidget";
import { ReminderWidget } from "~/components/dashboard/ReminderWidget";
import { ShoppingWidget } from "~/components/dashboard/ShoppingWidget";
import { requireUser } from "~/lib/auth.server";
import { getDashboardData } from "~/lib/dashboard.server";
import { getOrderedUsers } from "~/lib/household-api.server";

import type { Route } from "./+types/dashboard";

export function meta() {
  return [{ title: "Tableau de bord · Hearth" }];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 18) return "Bonjour";
  return "Bonsoir";
}

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  const [dashboard, users] = await Promise.all([
    getDashboardData(request),
    getOrderedUsers(request),
  ]);
  return { ...dashboard, users, currentUserId: currentUser.id };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const {
    dueReminders,
    shoppingLists,
    dayChores,
    weekChores,
    indoorClimate,
    outdoorClimate,
    users,
    currentUserId,
  } = loaderData;
  const currentUser = users.find((user) => user.id === currentUserId);
  const myDayChores = dayChores.find((entry) => entry.user.id === currentUserId)?.chores ?? [];
  const myWeekChores = weekChores.find((entry) => entry.user.id === currentUserId)?.chores ?? [];
  const myDueReminders = dueReminders.filter((reminder) =>
    reminder.assigneeIds.includes(currentUserId),
  );

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold">
        {getGreeting()}{currentUser ? `, ${currentUser.name}` : ""}
      </h1>
      <p className="mb-7 text-sm text-muted">
        Voici ce qui se passe à la maison aujourd&rsquo;hui.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <HomeClimateWidget indoor={indoorClimate} outdoor={outdoorClimate} />
        <ReminderWidget reminders={myDueReminders} users={users} />
        <ShoppingWidget lists={shoppingLists} />
        <CleaningWidget dayChores={myDayChores} weekChores={myWeekChores} />
      </div>
    </div>
  );
}
