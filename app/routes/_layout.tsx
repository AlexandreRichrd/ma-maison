import { useState } from "react";
import { Outlet } from "react-router";

import { MobileHeader } from "~/components/layout/MobileHeader";
import { MobileNavDrawer } from "~/components/layout/MobileNavDrawer";
import { Sidebar } from "~/components/layout/Sidebar";
import { getOrderedUsers } from "~/db/queries/household.server";
import { requireUser } from "~/lib/auth.server";
import { avatarColorFor } from "~/lib/user-colors";

import type { Route } from "./+types/_layout";

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  const users = await getOrderedUsers();
  return { users, currentUserId: currentUser.id };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const [navOpen, setNavOpen] = useState(false);
  const { users, currentUserId } = loaderData;
  const currentUser = users.find((user) => user.id === currentUserId);

  return (
    <div className="flex min-h-screen flex-col">
      <MobileHeader
        currentUser={currentUser}
        avatarColorClassName={avatarColorFor(users, currentUserId)}
        onOpenNav={() => setNavOpen(true)}
      />
      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} users={users} />

      <div className="flex min-h-0 flex-1">
        <Sidebar users={users} />
        <main className="min-w-0 flex-1 px-4 py-5 nav:max-w-[1120px] nav:px-11 nav:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
