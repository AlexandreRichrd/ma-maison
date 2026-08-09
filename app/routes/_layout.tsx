import { Outlet } from "react-router";

import { Sidebar } from "~/components/layout/Sidebar";
import { getOrderedMembers } from "~/db/queries/household.server";
import { requireSession } from "~/lib/auth.server";

import type { Route } from "./+types/_layout";

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);
  const members = await getOrderedMembers();
  return { members };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar members={loaderData.members} />
      <main className="max-w-[1120px] flex-1 px-11 py-9">
        <Outlet />
      </main>
    </div>
  );
}
