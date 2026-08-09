import { useState } from "react";
import { Outlet } from "react-router";

import { MobileHeader } from "~/components/layout/MobileHeader";
import { MobileNavDrawer } from "~/components/layout/MobileNavDrawer";
import { Sidebar } from "~/components/layout/Sidebar";
import { getOrderedMembers } from "~/db/queries/household.server";
import { getCurrentMemberId, requireSession } from "~/lib/auth.server";
import { avatarColorFor } from "~/lib/member-colors";

import type { Route } from "./+types/_layout";

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);
  const [members, currentMemberId] = await Promise.all([
    getOrderedMembers(),
    getCurrentMemberId(request),
  ]);
  return { members, currentMemberId };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const [navOpen, setNavOpen] = useState(false);
  const { members, currentMemberId } = loaderData;
  const currentMember =
    members.find((member) => member.id === currentMemberId) ?? members[0];

  return (
    <div className="flex min-h-screen flex-col">
      <MobileHeader
        currentMember={currentMember}
        avatarColorClassName={avatarColorFor(members, currentMember?.id)}
        onOpenNav={() => setNavOpen(true)}
      />
      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} members={members} />

      <div className="flex min-h-0 flex-1">
        <Sidebar members={members} />
        <main className="min-w-0 flex-1 px-4 py-5 nav:max-w-[1120px] nav:px-11 nav:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
