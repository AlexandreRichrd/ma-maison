import { useEffect, useRef } from "react";

import type { HouseholdMember } from "~/db/queries/household.server";

import { HouseholdFooter } from "./HouseholdFooter";
import { NavList } from "./NavList";

export function MobileNavDrawer({
  open,
  onClose,
  users,
}: {
  open: boolean;
  onClose: () => void;
  users: HouseholdMember[];
}) {
  const panelRef = useRef<HTMLElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      lastFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-49 bg-foreground/40 nav:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className="fixed inset-y-0 left-0 z-50 flex w-[min(78vw,280px)] flex-col gap-7 overflow-y-auto bg-card px-4 py-6 shadow-2xl nav:hidden"
      >
        <div className="px-2 font-serif text-xl font-bold">Hearth</div>
        <NavList variant="drawer" onNavigate={onClose} />
        <HouseholdFooter users={users} />
      </aside>
    </>
  );
}
