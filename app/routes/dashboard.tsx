import { CleaningWidget } from "~/components/dashboard/CleaningWidget";
import { HomeClimateWidget } from "~/components/dashboard/HomeClimateWidget";
import { ReminderWidget } from "~/components/dashboard/ReminderWidget";
import { ShoppingWidget } from "~/components/dashboard/ShoppingWidget";
import { requireUser } from "~/lib/auth.server";
import { withCurrentUserFirst } from "~/lib/cleaning-order";
import { getDashboardData } from "~/lib/dashboard.server";
import { getOrderedUsers } from "~/lib/household-api.server";
import { getSettings, resolveSensorLabel } from "~/lib/settings-api.server";

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
  const [dashboard, users, settings] = await Promise.all([
    getDashboardData(request),
    getOrderedUsers(request),
    getSettings(request),
  ]);
  return {
    ...dashboard,
    users,
    currentUserId: currentUser.id,
    indoorLabel: resolveSensorLabel("capteur-salon", settings),
    outdoorLabel: resolveSensorLabel("capteur-exterieur", settings),
  };
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
    indoorLabel,
    outdoorLabel,
  } = loaderData;
  const currentUser = users.find((user) => user.id === currentUserId);
  const orderedDayChores = withCurrentUserFirst(dayChores, currentUserId);
  const orderedWeekChores = withCurrentUserFirst(weekChores, currentUserId);
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
        <HomeClimateWidget
          indoor={indoorClimate}
          outdoor={outdoorClimate}
          indoorLabel={indoorLabel}
          outdoorLabel={outdoorLabel}
        />
        <ReminderWidget reminders={myDueReminders} users={users} />
        <ShoppingWidget lists={shoppingLists} />
        <CleaningWidget
          dayChores={orderedDayChores}
          weekChores={orderedWeekChores}
          stableOrderUserIds={users.map((user) => user.id)}
        />
      </div>
    </div>
  );
}
