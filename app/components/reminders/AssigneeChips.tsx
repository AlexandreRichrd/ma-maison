import type { HouseholdMember } from "~/lib/household-api.server";
import { avatarColorFor } from "~/lib/user-colors";

export function AssigneeChips({
  assigneeIds,
  users,
}: {
  assigneeIds: string[];
  users: HouseholdMember[];
}) {
  return (
    <>
      {assigneeIds.map((userId) => {
        const assignee = users.find((user) => user.id === userId);
        if (!assignee) return null;
        return (
          <span
            key={userId}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-accent-foreground ${avatarColorFor(users, userId)}`}
          >
            {assignee.name}
          </span>
        );
      })}
    </>
  );
}
