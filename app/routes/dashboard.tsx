import { Form } from "react-router";

import { CleaningWidget } from "~/components/dashboard/CleaningWidget";
import { ReminderWidget } from "~/components/dashboard/ReminderWidget";
import { ShoppingWidget } from "~/components/dashboard/ShoppingWidget";
import { getDashboardData } from "~/db/queries/dashboard.server";
import { getOrderedMembers } from "~/db/queries/household.server";
import { getCurrentMemberId } from "~/lib/auth.server";

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
  const [dashboard, members, currentMemberId] = await Promise.all([
    getDashboardData(),
    getOrderedMembers(),
    getCurrentMemberId(request),
  ]);
  return { ...dashboard, members, currentMemberId };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { dueReminders, shoppingLists, weekChores, members, currentMemberId } = loaderData;
  const currentMember =
    members.find((member) => member.id === currentMemberId) ?? members[0];
  const otherMember = members.find((member) => member.id !== currentMember?.id);

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold">
        {getGreeting()}{currentMember ? `, ${currentMember.name}` : ""}
      </h1>
      <div className="mb-7 flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm text-muted">
          Voici ce qui se passe à la maison aujourd&rsquo;hui.
        </p>
        {otherMember && (
          <Form method="post" action="/switch-member">
            <input type="hidden" name="memberId" value={otherMember.id} />
            <button type="submit" className="text-sm font-semibold text-accent hover:opacity-80">
              Ce n&rsquo;est pas vous ? Passer à {otherMember.name}
            </button>
          </Form>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ReminderWidget reminders={dueReminders} />
        <ShoppingWidget lists={shoppingLists} />
        <CleaningWidget weekChores={weekChores} />
      </div>
    </div>
  );
}
