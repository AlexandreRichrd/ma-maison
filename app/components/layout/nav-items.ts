export type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  shapeClassName: string;
};

export const NAV_ITEMS: NavItem[] = [
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

export const AVATAR_COLORS = ["bg-avatar-1", "bg-avatar-2"];

/** Longest-prefix match against the current pathname, for the mobile header title. */
export function sectionTitleForPath(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
  return match?.label ?? "Hearth";
}
