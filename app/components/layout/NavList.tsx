import { NavLink } from "react-router";

import { NAV_ITEMS } from "./nav-items";

type NavListProps = {
  variant?: "sidebar" | "drawer";
  onNavigate?: () => void;
};

export function NavList({ variant = "sidebar", onNavigate }: NavListProps) {
  const dense = variant === "drawer";

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center rounded-lg font-semibold ${dense ? "gap-3 px-3 py-3.5 text-base" : "gap-2.5 px-3 py-2.5 text-sm"} ${
              isActive ? "bg-nav-active text-accent" : "text-foreground/80 hover:bg-surface"
            }`
          }
        >
          <span className={`size-[18px] shrink-0 bg-current opacity-85 ${item.shapeClassName}`} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
