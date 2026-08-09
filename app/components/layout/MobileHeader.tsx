import { useLocation } from "react-router";

import type { Member } from "~/db/schema";

import { sectionTitleForPath } from "./nav-items";

export function MobileHeader({
  currentMember,
  avatarColorClassName,
  onOpenNav,
}: {
  currentMember: Member | undefined;
  avatarColorClassName: string | undefined;
  onOpenNav: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card px-4 py-2.5 nav:hidden">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Ouvrir le menu"
        className="flex size-11 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-card"
      >
        <span className="h-0.5 w-4.5 bg-foreground/80" />
        <span className="h-0.5 w-4.5 bg-foreground/80" />
        <span className="h-0.5 w-4.5 bg-foreground/80" />
      </button>
      <div className="flex-1 font-serif text-lg font-bold">{sectionTitleForPath(pathname)}</div>
      {currentMember && (
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-accent-foreground ${avatarColorClassName}`}
        >
          {currentMember.name.charAt(0)}
        </div>
      )}
    </div>
  );
}
