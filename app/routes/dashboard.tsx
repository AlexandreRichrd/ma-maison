import { CleaningWidget } from "~/components/dashboard/CleaningWidget";
import { HomeClimateWidget } from "~/components/dashboard/HomeClimateWidget";
import { ReminderWidget } from "~/components/dashboard/ReminderWidget";
import { ShoppingWidget } from "~/components/dashboard/ShoppingWidget";
import { getDashboardData } from "~/db/queries/dashboard.server";
import { requireUser } from "~/lib/auth.server";
import { withCurrentUserFirst } from "~/lib/cleaning-order";
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
  const { dueReminders, shoppingLists, weekChores, users, currentUserId } = loaderData;
  const currentUser = users.find((user) => user.id === currentUserId);
  const orderedWeekChores = withCurrentUserFirst(weekChores, currentUserId);

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold">
        {getGreeting()}{currentUser ? `, ${currentUser.name}` : ""}
      </h1>
      <p className="mb-7 text-sm text-muted">
        Voici ce qui se passe à la maison aujourd&rsquo;hui.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <HomeClimateWidget />
        <ReminderWidget reminders={dueReminders} users={users} />
        <ShoppingWidget lists={shoppingLists} />
        <CleaningWidget
          weekChores={orderedWeekChores}
          stableOrderUserIds={users.map((user) => user.id)}
        />
      </div>
    </div>
  );
}
