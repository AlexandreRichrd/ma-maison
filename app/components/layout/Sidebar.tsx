import { Form, NavLink } from "react-router";

import type { Member } from "~/db/schema";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  shapeClassName: string;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", end: true, shapeClassName: "rounded-[5px]" },
  { to: "/shopping", label: "Shopping", shapeClassName: "rounded-[50%_50%_0_50%]" },
  { to: "/recipes", label: "Recipes", shapeClassName: "rounded-[5px_5px_5px_0]" },
  {
    to: "/cleaning",
    label: "Cleaning",
    shapeClassName: "rounded-[5px] border-[3px] border-current bg-transparent!",
  },
  {
    to: "/reminders",
    label: "Reminders",
    shapeClassName: "rounded-full border-[3px] border-current bg-transparent!",
  },
  { to: "/household", label: "Household", shapeClassName: "rounded-[9px]" },
];

const AVATAR_COLORS = ["bg-avatar-1", "bg-avatar-2"];

export function Sidebar({ members }: { members: Member[] }) {
  return (
    <aside className="flex w-[232px] shrink-0 flex-col gap-7 border-r border-border bg-sidebar px-4 py-6">
      <div className="px-2 font-serif text-xl font-bold">Hearth</div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                isActive ? "bg-nav-active text-accent" : "text-foreground/80 hover:bg-surface"
              }`
            }
          >
            <span className={`size-[18px] shrink-0 bg-current opacity-85 ${item.shapeClassName}`} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5">
        <div className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Household
        </div>
        {members.map((member, index) => (
          <div key={member.id} className="flex items-center gap-2.5 px-2 py-1.5">
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-accent-foreground ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
            >
              {member.name.charAt(0)}
            </div>
            <div className="text-sm font-medium">{member.name}</div>
          </div>
        ))}
        <Form method="post" action="/logout" className="px-2 pt-1">
          <button type="submit" className="text-xs font-semibold text-muted hover:text-foreground">
            Sign out
          </button>
        </Form>
      </div>
    </aside>
  );
}
