import { CleaningWidget } from "~/components/dashboard/CleaningWidget";
import { ReminderWidget } from "~/components/dashboard/ReminderWidget";
import { ShoppingWidget } from "~/components/dashboard/ShoppingWidget";
import { getDashboardData } from "~/db/queries/dashboard.server";
import { getOrderedMembers } from "~/db/queries/household.server";

import type { Route } from "./+types/dashboard";

export function meta() {
  return [{ title: "Dashboard · Hearth" }];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export async function loader() {
  const [dashboard, members] = await Promise.all([
    getDashboardData(),
    getOrderedMembers(),
  ]);
  return { ...dashboard, members };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { dueReminders, shoppingLists, weekChores, members } = loaderData;
  const firstName = members[0]?.name ?? "there";

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold">
        {getGreeting()}, {firstName}
      </h1>
      <p className="mb-7 text-sm text-muted">
        Here&rsquo;s what&rsquo;s going on at home today.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ReminderWidget reminders={dueReminders} />
        <ShoppingWidget lists={shoppingLists} />
        <CleaningWidget weekChores={weekChores} />
      </div>
    </div>
  );
}
