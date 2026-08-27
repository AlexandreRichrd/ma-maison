import { Form, Link } from "react-router";

import type { HouseholdMember } from "~/lib/household-api.server";
import { AVATAR_COLORS } from "~/lib/user-colors";

export function HouseholdFooter({
  users,
  currentUserId,
  onNavigate,
}: {
  users: HouseholdMember[];
  currentUserId: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-auto flex flex-col gap-2.5">
      <div className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
        Foyer
      </div>
      {users.map((user, index) => {
        const avatar = (
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-accent-foreground ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
          >
            {user.name.charAt(0)}
          </div>
        );
        // Only your own row links anywhere — preferences are self-service
        // (see /account), not something one member edits for another.
        if (user.id === currentUserId) {
          return (
            <Link
              key={user.id}
              to="/account"
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface"
            >
              {avatar}
              <div className="text-sm font-medium">{user.name}</div>
            </Link>
          );
        }
        return (
          <div key={user.id} className="flex items-center gap-2.5 px-2 py-1.5">
            {avatar}
            <div className="text-sm font-medium">{user.name}</div>
          </div>
        );
      })}
      <Form method="post" action="/logout" className="px-2 pt-1">
        <button type="submit" className="text-xs font-semibold text-muted hover:text-foreground">
          Déconnexion
        </button>
      </Form>
    </div>
  );
}
