import type { HouseholdMember } from "~/lib/household-api.server";

import { HouseholdFooter } from "./HouseholdFooter";
import { NavList } from "./NavList";

export function Sidebar({ users }: { users: HouseholdMember[] }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden h-screen w-[232px] shrink-0 flex-col gap-7 border-r border-border bg-sidebar px-4 py-6 nav:flex">
      <div className="px-2 font-serif text-xl font-bold">Hearth</div>
      <NavList variant="sidebar" />
      <HouseholdFooter users={users} />
    </aside>
  );
}
