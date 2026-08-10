import type { UserWeekChores } from "~/db/queries/cleaning.server";

/**
 * Presentation-only reorder for "signed-in user's column first" — the
 * underlying data (and rotation.ts's assignment) stays keyed on the
 * stable households.member_order; only display order changes here.
 *
 * Pure and client-safe on purpose: it's used inside route *components*,
 * not just loaders, so it can't live in a .server.ts file — React Router
 * strips those from the client bundle wholesale, and a component that
 * still referenced one would break the build. See CLAUDE.md's data flow
 * rules on .server.ts files.
 */
export function withCurrentUserFirst(
  weekChores: UserWeekChores[],
  currentUserId: string,
): UserWeekChores[] {
  return [...weekChores].sort((a, b) => {
    if (a.user.id === currentUserId) return -1;
    if (b.user.id === currentUserId) return 1;
    return 0;
  });
}
